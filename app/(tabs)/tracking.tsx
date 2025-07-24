import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Image, Alert } from 'react-native';
import { MapPin, Navigation, Clock, CircleAlert as AlertCircle } from 'lucide-react-native';
import CustomHeader from '../../components/CustomHeader';
import Card from '../../components/Card';
import { Colors } from '../../constants/Colors';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { fetchActiveBuses, fetchRoutes } from '../../services/busService';
import { io, Socket } from 'socket.io-client';
import { Audio } from 'expo-av';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
// import * as Notifications from 'expo-notifications';

const { width, height } = Dimensions.get('window');

export default function TrackingScreen() {
  const [selectedBus, setSelectedBus] = useState<string | null>(null);
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [buses, setBuses] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [busStopIndices, setBusStopIndices] = useState<{ [busId: string]: number }>({});
  const [iconSize, setIconSize] = useState(40);
  const [lastStopIndices, setLastStopIndices] = useState<{ [busId: string]: number }>({});
  const [isFullScreen, setIsFullScreen] = useState(false);

  const user = useAuthStore(state => state.user);

  useFocusEffect(
    React.useCallback(() => {
      fetchActiveBuses().then(data => {
        setBuses(data);
      }).catch(console.error);
      fetchRoutes().then(data => {
        setRoutes(data);
      }).catch(console.error);
    }, [])
  );

  useEffect(() => {
    if (isLiveTracking) {
      const s = io('http://192.168.1.6:5000');
      setSocket(s);
      s.on('busLocationUpdate', (updatedBus: any) => {
        console.log('Received busLocationUpdate:', updatedBus);
        setBuses(prevBuses => {
          const updated = prevBuses.map(bus => {
            console.log('Comparing:', {
              'bus.busId': bus.busId,
              'bus.id': bus.id,
              'bus._id': bus._id,
              'updatedBus.busId': updatedBus.busId
            });
            if (
              bus.busId === updatedBus.busId ||
              bus.id === updatedBus.busId ||
              bus._id === updatedBus.busId
            ) {
              console.log('Updating bus location for:', bus.busId || bus.id || bus._id);
              return { ...bus, currentLocation: updatedBus.currentLocation };
            }
            return bus;
          });
          console.log('Updated buses state:', updated);
          return updated;
        });
      });
      return () => {
        s.disconnect();
        setSocket(null);
      };
    }
  }, [isLiveTracking]);

  // useEffect(() => {
  //   // طلب صلاحية الإشعارات عند بدء التطبيق
  //   Notifications.requestPermissionsAsync();
  // }, []);

  // محاكاة حركة الباصات على نقاط المسار (stops)
  useEffect(() => {
    if (!isLiveTracking || !buses.length || !routes.length) return;
    const interval = setInterval(() => {
      setBusStopIndices(prevIndices => {
        const newIndices = { ...prevIndices };
        buses.forEach(bus => {
          const route = routes.find(r => r._id === bus.routeId || r.id === bus.routeId);
          if (!route || !Array.isArray(route.stops) || route.stops.length === 0) return;
          const stops = route.stops;
          const currentIdx = prevIndices[bus.busId || bus.id] ?? 0;
          const nextIdx = (currentIdx + 1) % stops.length;
          newIndices[bus.busId || bus.id] = nextIdx;
        });
        return newIndices;
      });
      setBuses(prevBuses => prevBuses.map(bus => {
        const route = routes.find(r => r._id === bus.routeId || r.id === bus.routeId);
        if (!route || !Array.isArray(route.stops) || route.stops.length === 0) return bus;
        const stops = route.stops;
        const idx = busStopIndices[bus.busId || bus.id] ?? 0;
        const stop = stops[idx];
        if (!stop) return bus;
        // إشعار عند الوصول لنقطة جديدة
        const busKey = bus.busId || bus.id;
        if (lastStopIndices[busKey] !== idx) {
          playNotificationSound();
          setLastStopIndices(prev => ({ ...prev, [busKey]: idx }));
        }
        return {
          ...bus,
          currentLocation: {
            ...bus.currentLocation,
            lat: stop.lat,
            lng: stop.long ?? stop.lng,
            latitude: stop.lat,
            longitude: stop.long ?? stop.lng
          }
        };
      }));
    }, 2500); // كل 1 ثانية
    return () => clearInterval(interval);
  }, [isLiveTracking, buses, routes, busStopIndices, lastStopIndices]);

  const handleRefresh = () => {
    fetchActiveBuses().then(data => {
      setBuses(data);
    }).catch(console.error);
    fetchRoutes().then(data => {
      setRoutes(data);
    }).catch(console.error);
  };

  const playNotificationSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/notification.mp3'),
        {
          shouldPlay: true,
          isLooping: false,
        }
      );
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if ('didJustFinish' in status && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (e) {
      console.log('Error playing sound:', e);
    }
  };

  // استخراج بيانات الباص المحدد
  const selectedBusData = buses.find(bus => bus.id === selectedBus);

  // دالة لتغيير حجم الأيقونة حسب الزوم
  const handleRegionChangeComplete = (region: any) => {
    const zoom = Math.round(Math.log(360 / region.longitudeDelta) / Math.LN2);
    const size = Math.max(24, Math.min(80, 40 + (zoom - 10) * 6));
    setIconSize(size);
  };

  return (
    <>
      <CustomHeader title="Live Tracking" />
      <View style={[styles.container, isFullScreen && { padding: 0 }]}>
        <StatusBar style="light" />
        {/* الخريطة في منتصف الصفحة */}
        <View style={[styles.mapContainer, { height: height * 0.5, margin: 0, borderRadius: 0 }]}>
          {/* زر تكبير الخريطة فوق الخريطة */}
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              zIndex: 100,
              backgroundColor: '#fff',
              borderRadius: 24,
              padding: 10,
              shadowColor: '#000',
              shadowOpacity: 0.15,
              shadowRadius: 4,
              elevation: 4,
            }}
            onPress={() => setIsFullScreen(!isFullScreen)}
          >
            <MaterialCommunityIcons name={isFullScreen ? 'fullscreen-exit' : 'fullscreen'} size={28} color="#3B82F6" />
          </TouchableOpacity>
          <MapView
            style={{ flex: 1, borderRadius: 0 }}
            initialRegion={{
              latitude: 24.0889,
              longitude: 32.8998,
              latitudeDelta: 0.08,
              longitudeDelta: 0.08,
            }}
            onRegionChangeComplete={handleRegionChangeComplete}
          >
            {isLiveTracking && routes.map(route => (
              route.stops && route.stops.length > 1 && (
                <Polyline
                  key={route._id}
                  coordinates={route.stops.map((stop: any) => ({
                    latitude: stop.lat,
                    longitude: stop.long,
                  }))}
                  strokeColor={Colors.primary}
                  strokeWidth={4}
                />
              )
            ))}
            {isLiveTracking && buses.map(bus => (
              bus.currentLocation && (
                <Marker
                  key={bus.busId || bus.id}
                  coordinate={{
                    latitude: bus.currentLocation.lat,
                    longitude: bus.currentLocation.lng,
                  }}
                  title={`Bus ${bus.name || bus.busNumber}`}
                  description={bus.status}
                />
              )
            ))}
          </MapView>
          {/* زر Start/Stop Live Tracking فوق الخريطة (واحد فقط) */}
          <TouchableOpacity
            style={{
              position: 'absolute',
              bottom: 24,
              left: '50%',
              transform: [{ translateX: -70 }],
              backgroundColor: isLiveTracking ? '#10B981' : Colors.primary,
              borderRadius: 20,
              paddingVertical: 8,
              paddingHorizontal: 24,
              flexDirection: 'row',
              alignItems: 'center',
              zIndex: 10,
            }}
            onPress={async () => {
              if (!isLiveTracking) {
                await playNotificationSound();
              }
              setIsLiveTracking(!isLiveTracking);
            }}
          >
            <Navigation size={16} color={Colors.white} />
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 8 }}>
              {isLiveTracking ? 'Stop live' : 'Start live'}
            </Text>
          </TouchableOpacity>
        </View>
        {/* باقي الصفحة تظهر فقط إذا لم يكن fullscreen */}
        {!isFullScreen && (
          <ScrollView style={[styles.content]} showsVerticalScrollIndicator={false}>
            {/* باصات للاختيار */}
            {isLiveTracking && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.busSelector}>
                {buses.map((bus, index) => (
                  <TouchableOpacity
                    key={bus.id || bus.busId}
                    style={[
                      styles.busCard,
                      selectedBus === (bus.id || bus.busId) && styles.selectedBusCard,
                      { backgroundColor: selectedBus === (bus.id || bus.busId) ? Colors.primary : '#fff' }
                    ]}
                    onPress={() => setSelectedBus(bus.id || bus.busId)}
                  >
                    <View style={styles.busCardContent}>
                      <Text style={[
                        styles.busName,
                        { color: selectedBus === (bus.id || bus.busId) ? '#fff' : Colors.primary }
                      ]}>
                        {bus.name || bus.busNumber}
                      </Text>
                      <Text style={styles.busRoute}>{bus.route || ''}</Text>
                      <View style={styles.busStatusBox}>
                        <Text style={styles.busStatusText}>{bus.status}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            {/* تفاصيل الباص المحدد */}
            {isLiveTracking && selectedBusData && (
              <View style={styles.detailsCard}>
                <View style={styles.detailsHeader}>
                  <View>
                    <Text style={styles.detailsTitle}>{selectedBusData.name || selectedBusData.busNumber}</Text>
                    <Text style={styles.detailsSubtitle}>{selectedBusData.route || ''}</Text>
                  </View>
                  {isLiveTracking && (
                    <View style={styles.liveIndicator}>
                      <Text style={styles.liveText}>LIVE</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: 0, // أزل أي padding من الأعلى
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e2e8f0',
    marginTop: 4,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  mapContainer: {
    margin: 0,
    height: '100%',
    borderRadius: 0,
    paddingTop: 0, // أزل أي padding من الأعلى
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  busSelector: {
    paddingLeft: 24,
    marginBottom: 16,
    marginTop: 8,
  },
  busCard: {
    width: 140,
    padding: 16,
    borderRadius: 16,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    backgroundColor: '#fff',
  },
  selectedBusCard: {
    shadowColor: Colors.primary,
    shadowOpacity: 0.2,
    backgroundColor: Colors.primary,
  },
  busCardContent: {
    alignItems: 'center',
  },
  busName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  busRoute: {
    fontSize: 12,
    marginBottom: 8,
    color: '#64748b',
  },
  busStatusBox: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  busStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.primary,
  },
  detailsCard: {
    backgroundColor: '#fff',
    margin: 24,
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  detailsSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  liveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  detailItem: {
    width: (width - 96) / 2,
    alignItems: 'center',
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  trackingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 32,
    margin: 24,
    alignSelf: 'center',
  },
  activeButton: {
    backgroundColor: '#10B981',
  },
  trackingButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});

