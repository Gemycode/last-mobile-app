import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Alert, ActivityIndicator, FlatList } from 'react-native';
import { MapPin, Navigation, Clock, Users, Calendar, Bus, Play, Pause } from 'lucide-react-native';
import CustomHeader from '../../components/CustomHeader';
import { Colors } from '../../constants/Colors';
import { useAuthStore } from '../../store/authStore';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { fetchActiveBuses, fetchRoutes, fetchChildren, fetchStudentBookings, fetchDriverTodayTrips, startTripTracking, endTripTracking } from '../../services/busService';
import { io, Socket } from 'socket.io-client';
import { Audio } from 'expo-av';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const getStatusColor = (status: string) => {
  switch (status) {
    case 'started': return '#10B981';
    case 'scheduled': return '#3B82F6';
    case 'ended': return '#6B7280';
    case 'cancelled': return '#EF4444';
    default: return '#94a3b8';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'started': return 'نشطة';
    case 'scheduled': return 'مجدولة';
    case 'ended': return 'منتهية';
    case 'cancelled': return 'ملغية';
    default: return status;
  }
};

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
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [childTrips, setChildTrips] = useState<any[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 24.0889,
    longitude: 32.8998,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  const user = useAuthStore(state => state.user);
  const isStudent = user?.role === 'student';
  const isParent = user?.role === 'parent';
  const isDriver = user?.role === 'driver';

  const fadeValue = useSharedValue(0);
  useEffect(() => {
    fadeValue.value = withSpring(1, { damping: 15, stiffness: 100 });
  }, []);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeValue.value,
    transform: [{ translateY: (1 - fadeValue.value) * 30 }],
  }));

  useFocusEffect(
    React.useCallback(() => {
      fetchActiveBuses().then(data => setBuses(data)).catch(console.error);
      fetchRoutes().then(data => setRoutes(data)).catch(console.error);
    }, [])
  );

  useEffect(() => {
    if (isParent) {
      setLoadingChildren(true);
      fetchChildren()
        .then(data => setChildren(data))
        .catch(error => {
          console.error('Error fetching children:', error);
          Alert.alert('خطأ في جلب الأطفال', 'حدث خطأ أثناء جلب قائمة الأطفال.', [{ text: 'حسناً' }]);
        })
        .finally(() => setLoadingChildren(false));
    } else if (isStudent) {
      setLoadingTrips(true);
      console.log('Student user.id:', user.id);
      fetchStudentBookings(user.id)
        .then(data => {
          console.log('fetchStudentBookings result:', data);
          setChildTrips(data);
          if (!data || data.length === 0) {
            console.warn('No trips found for this student!');
            Alert.alert('لا توجد رحلات', 'هذا الطالب ليس لديه أي رحلات محجوزة.');
          }
        })
        .catch(error => {
          console.error('Error fetching trips:', error);
          Alert.alert('خطأ في جلب الرحلات', 'حدث خطأ أثناء جلب رحلات الطالب.', [{ text: 'حسناً' }]);
        })
        .finally(() => setLoadingTrips(false));
    } else if (isDriver) {
      setLoadingTrips(true);
      fetchDriverTodayTrips(user.id)
        .then(data => {
          console.log('Driver trips:', data);
          setChildTrips(data);
          if (!data || data.length === 0) {
            console.warn('No trips found for this driver!');
            Alert.alert('لا توجد رحلات', 'لا توجد رحلات مخصصة لك اليوم.');
          }
        })
        .catch(error => {
          console.error('Error fetching driver trips:', error);
          Alert.alert('خطأ في جلب رحلات السائق', 'حدث خطأ أثناء جلب رحلات اليوم.', [{ text: 'حسناً' }]);
        })
        .finally(() => setLoadingTrips(false));
    }
  }, [user?.id, user?.role]);

  useEffect(() => {
    if (!isParent || !selectedChild || selectedChild === 'null') {
      setChildTrips([]);
      setSelectedTrip(null);
      setSelectedBus(null);
      return;
    }
    setLoadingTrips(true);
    fetchStudentBookings(selectedChild)
      .then(data => setChildTrips(data))
      .catch(error => {
        console.error('Error fetching trips:', error);
        Alert.alert('خطأ في جلب الرحلات', 'حدث خطأ أثناء جلب رحلات الطفل.', [{ text: 'حسناً' }]);
      })
      .finally(() => setLoadingTrips(false));
  }, [selectedChild]);

  useEffect(() => {
    if (selectedTrip) {
      const trip = childTrips.find((t: any) => t._id === selectedTrip);
      setSelectedBus(trip?.busId || null);
      if (trip?.busId) {
        const bus = buses.find(b => b.id === trip.busId || b.busId === trip.busId);
        if (bus?.currentLocation) {
          setMapRegion({
            latitude: bus.currentLocation.lat,
            longitude: bus.currentLocation.lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
      }
    } else {
      setSelectedBus(null);
    }
  }, [selectedTrip, childTrips, buses, routes]);

  useEffect(() => {
    if (isLiveTracking) {
      const s = io('http://192.168.1.84:5000');
      setSocket(s);
      s.on('busLocationUpdate', (updatedBus) => {
        setBuses(prevBuses => prevBuses.map(bus =>
          (bus.busId === updatedBus.busId || bus.id === updatedBus.busId || bus._id === updatedBus.busId)
            ? { ...bus, currentLocation: updatedBus.currentLocation }
            : bus
        ));
      });
      return () => {
        s.disconnect();
        setSocket(null);
      };
    }
  }, [isLiveTracking]);

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
    }, 2500);
    return () => clearInterval(interval);
  }, [isLiveTracking, buses, routes, busStopIndices, lastStopIndices]);

  const playNotificationSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/notification.mp3'),
        { shouldPlay: true, isLooping: false }
      );
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if ('didJustFinish' in status && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (e) {
      // ignore
    }
  };

  const selectedBusData = buses.find(bus => bus.id === selectedBus || bus.busId === selectedBus);
  const selectedTripData = childTrips.find(trip => trip._id === selectedTrip);

  // دالة مساعدة لإيجاد اسم المسار من بيانات الرحلة وقائمة المسارات
  const getRouteName = (trip: any) => {
    if (!trip) return 'غير محدد';
    if (trip.routeName) return trip.routeName;
    if (trip.route) return trip.route;
    // ابحث في قائمة المسارات
    const routeObj = routes.find(r =>
      r._id === trip.routeId?._id ||
      r._id === trip.routeId ||
      r.id === trip.routeId
    );
    return routeObj?.name || 'غير محدد';
  };

  // Pagination logic
  const totalPages = Math.ceil(childTrips.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTrips = childTrips.slice(startIndex, endIndex);

  const renderDriverTripCard = ({ item: trip }: { item: any }) => (
    <Animated.View style={[styles.tripCard, animatedStyle]}>
      <LinearGradient 
        colors={[getStatusColor(trip.status) + '10', getStatusColor(trip.status) + '05']} 
        style={styles.tripCardGradient}
      >
        <View style={styles.tripCardHeader}>
          <View style={styles.tripCardTitleSection}>
            <MaterialCommunityIcons 
              name="bus" 
              size={24} 
              color={getStatusColor(trip.status)} 
            />
            <View style={styles.tripCardTitleContainer}>
              <Text style={[styles.tripCardTitle, { color: getStatusColor(trip.status) }]}>
                {(typeof trip.routeId === 'object' && trip.routeId?.name)
                  ? trip.routeId.name
                  : (typeof trip.routeId === 'string' ? trip.routeId : 'مسار غير محدد')}
              </Text>
              <Text style={styles.tripCardSubtitle}>
                الباص: {trip.busId?.BusNumber || trip.busNumber || 'غير محدد'}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(trip.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(trip.status) }]}>
              {getStatusText(trip.status)}
            </Text>
          </View>
        </View>

        <View style={styles.tripCardDetails}>
          <View style={styles.tripDetailItem}>
            <Calendar size={16} color="#64748b" />
            <Text style={styles.tripDetailText}>
              {new Date(trip.date).toLocaleDateString('ar-SA')} - {trip.startTime || 'وقت غير محدد'}
            </Text>
          </View>
          
          <View style={styles.tripDetailItem}>
            <MapPin size={16} color="#64748b" />
            <Text style={styles.tripDetailText}>
              {(typeof trip.routeId?.start_point === 'object'
                ? trip.routeId?.start_point?.name
                : trip.routeId?.start_point) || 'نقطة البداية'}
              {' → '}
              {(typeof trip.routeId?.end_point === 'object'
                ? trip.routeId?.end_point?.name
                : trip.routeId?.end_point) || 'نقطة النهاية'}
            </Text>
          </View>

          {trip.routeId?.estimated_time && (
            <View style={styles.tripDetailItem}>
              <Clock size={16} color="#64748b" />
              <Text style={styles.tripDetailText}>
                المدة المتوقعة: {trip.routeId.estimated_time} دقيقة
              </Text>
            </View>
          )}
        </View>

        <View style={styles.tripCardActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: selectedTrip === trip._id ? '#10B981' : Colors.primary }]}
            onPress={() => setSelectedTrip(trip._id)}
          >
            <MapPin size={16} color="#fff" />
            <Text style={styles.actionButtonText}>
              {selectedTrip === trip._id ? 'محددة' : 'اختيار للتتبع'}
            </Text>
          </TouchableOpacity>

          {selectedTrip === trip._id && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: isLiveTracking ? '#EF4444' : '#10B981' }]}
              onPress={async () => {
                try {
                  if (!isLiveTracking) {
                    await startTripTracking(trip._id);
                    Alert.alert('تم بدء التتبع', 'تم بدء تتبع الرحلة بنجاح');
                  } else {
                    await endTripTracking(trip._id);
                    Alert.alert('تم إيقاف التتبع', 'تم إيقاف تتبع الرحلة بنجاح');
                  }
                  setIsLiveTracking(!isLiveTracking);
                } catch (error) {
                  console.error('Error updating trip status:', error);
                  Alert.alert('خطأ', 'حدث خطأ أثناء تحديث حالة الرحلة');
                }
              }}
            >
              {isLiveTracking ? <Pause size={16} color="#fff" /> : <Play size={16} color="#fff" />}
              <Text style={styles.actionButtonText}>
                {isLiveTracking ? 'إيقاف التتبع' : 'بدء التتبع'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );

  // UI
  return (
    <>
      <CustomHeader title="تتبع الباص" />
      <StatusBar style="light" />
      <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={[styles.container, isFullScreen && { padding: 0 }]}>
          
          {/* Driver Trips Selection */}
          {isDriver && (
            <Animated.View style={[styles.selectionCard, animatedStyle]}>
              <View style={styles.selectionHeader}>
                <Bus size={20} color={Colors.primary} />
                <Text style={styles.selectionTitle}>رحلات اليوم</Text>
              </View>
              
              {loadingTrips ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : childTrips.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons name="bus-clock" size={60} color="#CBD5E1" />
                  <Text style={styles.emptyStateTitle}>لا توجد رحلات اليوم</Text>
                  <Text style={styles.emptyStateSubtitle}>
                    لا توجد رحلات مخصصة لك اليوم. تحقق من الجدول الأسبوعي.
                  </Text>
                </View>
              ) : (
                <>
                  <FlatList
                    data={currentTrips}
                    renderItem={renderDriverTripCard}
                    keyExtractor={(item) => item._id || item.id}
                    scrollEnabled={false}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.tripsList}
                  />
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <View style={styles.paginationContainer}>
                      <TouchableOpacity
                        style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                        onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>
                          السابق
                        </Text>
                      </TouchableOpacity>
                      
                      <Text style={styles.paginationText}>
                        {currentPage} من {totalPages}
                      </Text>
                      
                      <TouchableOpacity
                        style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
                        onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <Text style={[styles.paginationButtonText, currentPage === totalPages && styles.paginationButtonTextDisabled]}>
                          التالي
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </Animated.View>
          )}

          {/* Parent/Student Selection */}
          {!isDriver && (
            <View style={styles.selectionCard}>
              {isParent && (
                <>
                  <View style={styles.selectionHeader}>
                    <Users size={20} color={Colors.primary} />
                    <Text style={styles.selectionTitle}>اختر الطفل</Text>
                  </View>
                  {loadingChildren ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <Picker
                      selectedValue={selectedChild}
                      onValueChange={setSelectedChild}
                      style={styles.picker}
                    >
                      <Picker.Item label="اختر الطفل" value={null} />
                      {children.map(child => (
                        <Picker.Item
                          key={child._id}
                          label={`${child.firstName} ${child.lastName}`}
                          value={child._id}
                        />
                      ))}
                    </Picker>
                  )}
                </>
              )}
              <View style={styles.selectionHeader}>
                <Calendar size={20} color={Colors.primary} />
                <Text style={styles.selectionTitle}>اختر الرحلة</Text>
              </View>
              {loadingTrips ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Picker
                  selectedValue={selectedTrip}
                  onValueChange={setSelectedTrip}
                  enabled={isStudent || (!!selectedChild && isParent)}
                  style={styles.picker}
                >
                  <Picker.Item label="اختر الرحلة" value={null} />
                  {childTrips.map(trip => (
                    <Picker.Item
                      key={trip._id}
                      label={`${getRouteName(trip)} | ${trip.date || 'تاريخ غير محدد'}`}
                      value={trip._id}
                    />
                  ))}
                </Picker>
              )}
            </View>
          )}

          <View style={[styles.mapContainer, { height: 220 }]}>
            <TouchableOpacity
              style={styles.fullscreenButton}
              onPress={() => setIsFullScreen(!isFullScreen)}
            >
              <MaterialCommunityIcons
                name={isFullScreen ? 'fullscreen-exit' : 'fullscreen'}
                size={28}
                color="#3A6D8C"
              />
            </TouchableOpacity>
            <MapView
              style={{ flex: 1, borderRadius: 16 }}
              initialRegion={mapRegion}
              region={mapRegion}
            >
              {selectedTripData && (() => {
                const routeFromTrip = routes.find(r =>
                  r._id === selectedTripData.routeId?._id ||
                  r._id === selectedTripData.routeId ||
                  r.id === selectedTripData.routeId
                );
                const routeFromBus = selectedBusData && routes.find(r =>
                  r._id === selectedBusData.routeId ||
                  r.id === selectedBusData.routeId
                );
                const route = routeFromTrip || routeFromBus;
                if (route && route.stops && route.stops.length > 1) {
                  return (
                    <>
                      <Polyline
                        coordinates={route.stops.map((stop: { lat: number; long: number }) => ({
                          latitude: stop.lat,
                          longitude: stop.long,
                        }))}
                        strokeColor={Colors.primary}
                        strokeWidth={6}
                        zIndex={2}
                      />
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {/* @ts-ignore */}
                      {route.stops.map((stop: any, index: number) => (
                        <Marker
                          key={`stop-${index}`}
                          coordinate={{ latitude: stop.lat, longitude: stop.long }}
                          title={`محطة ${index + 1}`}
                          description={stop.name || `محطة ${index + 1}`}
                        >
                          <View style={styles.stopMarker}>
                            <Text style={styles.stopMarkerText}>{index + 1}</Text>
                          </View>
                        </Marker>
                      ))}
                    </>
                  );
                }
                return null;
              })()}
              {isLiveTracking && selectedBus && selectedBusData && selectedBusData.currentLocation && (
                <Marker
                  coordinate={{
                    latitude: selectedBusData.currentLocation.lat,
                    longitude: selectedBusData.currentLocation.lng,
                  }}
                  title={`الباص ${selectedBusData.name || selectedBusData.busNumber}`}
                  description={selectedBusData.status}
                >
                  <View style={[styles.busMarker, { width: iconSize, height: iconSize }]}>
                    <MaterialCommunityIcons name="bus" size={iconSize * 0.6} color="#fff" />
                  </View>
                </Marker>
              )}
            </MapView>
            {(!isLiveTracking || buses.length === 0) && (
              <View style={styles.emptyStateContainer}>
                <MaterialCommunityIcons name="bus-clock" size={80} color="#CBD5E1" />
                <Text style={styles.emptyStateTitle}>
                  {!isLiveTracking ? 'ابدأ التتبع المباشر للباصات' : 'لا يوجد باصات نشطة حالياً'}
                </Text>
                <Text style={styles.emptyStateSubtitle}>
                  {!isLiveTracking
                    ? 'اضغط على زر \"بدء التتبع المباشر\" لمشاهدة حركة الباصات على الخريطة.'
                    : 'انتظر حتى يتم تفعيل باصات جديدة أو قم بتحديث الصفحة.'}
                </Text>
                {!isLiveTracking && (
                  <TouchableOpacity
                    style={styles.emptyStateButton}
                    onPress={async () => {
                      await playNotificationSound();
                      setIsLiveTracking(true);
                    }}
                  >
                    <Navigation size={18} color={Colors.white} />
                    <Text style={styles.emptyStateButtonText}>بدء التتبع المباشر</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            {buses.length > 0 && (
              <TouchableOpacity
                style={[
                  styles.trackingButton,
                  { backgroundColor: isLiveTracking ? '#10B981' : Colors.primary }
                ]}
                onPress={async () => {
                  if (!isLiveTracking) {
                    await playNotificationSound();
                  }
                  setIsLiveTracking(!isLiveTracking);
                }}
              >
                <Navigation size={16} color={Colors.white} />
                <Text style={styles.trackingButtonText}>
                  {isLiveTracking ? 'إيقاف التتبع' : 'بدء التتبع'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {isLiveTracking && selectedBusData && selectedTripData && (
            <View style={styles.detailsCard}>
              <View style={styles.detailsHeader}>
                <View>
                  <Text style={styles.detailsTitle}>
                    الباص {selectedBusData.name || selectedBusData.busNumber}
                  </Text>
                  <Text style={styles.detailsSubtitle}>
                    {getRouteName(selectedTripData)}
                  </Text>
                </View>
                <View style={styles.liveIndicator}>
                  <Text style={styles.liveText}>مباشر</Text>
                </View>
              </View>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Clock size={20} color={Colors.primary} />
                  <Text style={styles.infoLabel}>وقت الوصول المتوقع</Text>
                  <Text style={styles.infoValue}>15 دقيقة</Text>
                </View>
                <View style={styles.infoItem}>
                  <MapPin size={20} color={Colors.primary} />
                  <Text style={styles.infoLabel}>المسافة المتبقية</Text>
                  <Text style={styles.infoValue}>2.5 كم</Text>
                </View>
              </View>
              {selectedBusData.currentLocation && (
                <View style={styles.locationInfo}>
                  <Text style={styles.locationTitle}>الموقع الحالي:</Text>
                  <Text style={styles.locationText}>
                    خط العرض: {selectedBusData.currentLocation.lat?.toFixed(6) || 'غير محدد'}
                  </Text>
                  <Text style={styles.locationText}>
                    خط الطول: {selectedBusData.currentLocation.lng?.toFixed(6) || 'غير محدد'}
                  </Text>
                </View>
              )}
            </View>
          )}
          {isLiveTracking && buses.length > 0 && (
            <View style={styles.busListContainer}>
              <Text style={styles.busListTitle}>جميع الباصات النشطة:</Text>
              {buses.map((bus, idx) => (
                <View key={bus.id || bus.busId} style={styles.busListItem}>
                  <View style={styles.busListHeader}>
                    <MaterialCommunityIcons name="bus" size={22} color={Colors.primary} />
                    <Text style={styles.busListName}>{bus.name || bus.busNumber}</Text>
                    <Text style={styles.busListStatus}>({bus.status})</Text>
                  </View>
                  <Text style={styles.busListRoute}>خط السير: {bus.route || '-'}</Text>
                  {bus.currentLocation && (
                    <Text style={styles.busListCoords}>
                      الإحداثيات:
                      <Text style={styles.busListCoordValue}>
                        {bus.currentLocation.lat?.toFixed(5) ?? '--'}
                      </Text>
                      <Text style={styles.busListCoordValue}>
                        {bus.currentLocation.lng?.toFixed(5) ?? '--'}
                      </Text>
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingTop: 0 },
  headerGradient: { paddingTop: 20, paddingBottom: 16, paddingHorizontal: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#EAD8B1', textAlign: 'center' },
  selectionCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, margin: 16, marginBottom: 0, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  selectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginTop: 16 },
  selectionTitle: { fontWeight: 'bold', fontSize: 16, marginLeft: 8, color: '#1e293b' },
  picker: { backgroundColor: '#f8fafc', borderRadius: 12, marginBottom: 12 },
  mapContainer: { margin: 16, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  fullscreenButton: { position: 'absolute', top: 16, right: 16, zIndex: 100, backgroundColor: '#fff', borderRadius: 20, padding: 8, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, elevation: 4 },
  busMarker: { backgroundColor: Colors.primary, borderRadius: 20, padding: 8, borderWidth: 2, borderColor: '#fff' },
  stopMarker: { backgroundColor: '#fff', borderRadius: 12, padding: 4, borderWidth: 2, borderColor: Colors.primary, minWidth: 24, alignItems: 'center' },
  stopMarkerText: { fontSize: 10, fontWeight: 'bold', color: Colors.primary },
  trackingButton: { position: 'absolute', bottom: 24, left: '50%', transform: [{ translateX: -70 }], borderRadius: 20, paddingVertical: 10, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', zIndex: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  trackingButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
  emptyStateContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.95)', zIndex: 20, paddingHorizontal: 24 },
  emptyStateTitle: { fontSize: 20, fontWeight: 'bold', color: '#64748b', marginBottom: 8, textAlign: 'center', marginTop: 16 },
  emptyStateSubtitle: { fontSize: 14, color: '#94a3b8', marginBottom: 20, textAlign: 'center' },
  emptyStateButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, borderRadius: 20, paddingVertical: 12, paddingHorizontal: 28, marginTop: 8, shadowColor: '#3A6D8C', shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  emptyStateButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
  content: { flex: 1 },
  detailsCard: { backgroundColor: '#fff', margin: 16, borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6 },
  detailsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailsTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  detailsSubtitle: { fontSize: 14, color: '#64748b', marginTop: 2 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: Colors.primary },
  liveText: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  infoGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  infoItem: { alignItems: 'center', flex: 1 },
  infoLabel: { fontSize: 12, color: '#64748b', marginTop: 8, marginBottom: 4, textAlign: 'center' },
  infoValue: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  locationInfo: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 16, margin: 20 },
  locationTitle: { fontSize: 14, fontWeight: 'bold', color: '#475569', marginBottom: 8 },
  locationText: { fontSize: 13, color: '#64748b', marginBottom: 2 },
  busListContainer: { marginHorizontal: 16, marginTop: 8, marginBottom: 30, backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  busListTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.primary, marginLeft: 8 },
  busListItem: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 12 },
  busListHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  busListName: { fontSize: 15, fontWeight: 'bold', color: '#1e293b', marginLeft: 8 },
  busListStatus: { fontSize: 13, color: '#64748b', marginLeft: 6 },
  busListRoute: { fontSize: 13, color: '#475569', marginBottom: 4, marginRight: 30, textAlign: 'right' },
  busListCoords: { fontSize: 13, color: '#334155', marginRight: 30, textAlign: 'right' },
  busListCoordValue: { fontWeight: 'bold', color: Colors.primary },
  // Driver trip card styles
  tripsList: { paddingBottom: 16 },
  tripCard: { marginBottom: 16, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  tripCardGradient: { padding: 20 },
  tripCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  tripCardTitleSection: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  tripCardTitleContainer: { marginLeft: 12, flex: 1 },
  tripCardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  tripCardSubtitle: { fontSize: 14, color: '#64748b' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  tripCardDetails: { marginBottom: 16 },
  tripDetailItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  tripDetailText: { fontSize: 14, color: '#64748b', marginLeft: 8, flex: 1 },
  tripCardActions: { flexDirection: 'row', justifyContent: 'space-between' },
  actionButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, flex: 1, marginHorizontal: 4 },
  actionButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14, marginLeft: 6 },
  emptyState: { alignItems: 'center', paddingVertical: 40, backgroundColor: '#f8fafc', borderRadius: 12, marginTop: 16 },
  // Pagination styles
  paginationContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderRadius: 12, marginTop: 16 },
  paginationButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.primary },
  paginationButtonDisabled: { backgroundColor: '#E5E7EB' },
  paginationButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  paginationButtonTextDisabled: { color: '#9CA3AF' },
  paginationText: { fontSize: 14, color: '#64748b', fontWeight: '600' },
});