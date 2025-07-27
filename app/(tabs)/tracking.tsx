import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { MapPin, Navigation, Clock, Users, Calendar, Bus, Activity, Shield, Zap, TrendingUp, AlertCircle, Play, Pause, Maximize2, Minimize2 } from 'lucide-react-native';
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
import Animated, { 
  useSharedValue, 
  withSpring, 
  useAnimatedStyle,
  FadeInDown,
  FadeInUp,
  FadeInRight,
  SlideInRight,
  withRepeat,
  withTiming
} from 'react-native-reanimated';

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
  const [lastStopIndices, setLastStopIndices] = useState<{ [busId: string]: number }>({});
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [childTrips, setChildTrips] = useState<any[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [mapRegion, setMapRegion] = useState({
    latitude: 24.0889,
    longitude: 32.8998,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  });
  const ITEMS_PER_PAGE = 5;
  const [currentPage, setCurrentPage] = useState(1);

  // Enhanced animations
  const pulseValue = useSharedValue(1);
  const fadeValue = useSharedValue(0);
  const slideValue = useSharedValue(0);
  const busPulseValue = useSharedValue(1);

  useEffect(() => {
    fadeValue.value = withSpring(1, { damping: 15, stiffness: 100 });
    pulseValue.value = withRepeat(
      withTiming(1.05, { duration: 2000 }),
      -1,
      true
    );
    busPulseValue.value = withRepeat(
      withTiming(1.2, { duration: 1500 }),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
  }));

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideValue.value }],
  }));

  const busPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: busPulseValue.value }],
  }));

  const user = useAuthStore(state => state.user);
  const isStudent = user?.role === 'student';
  const isParent = user?.role === 'parent';
  const isDriver = user?.role === 'driver';

  // Define these variables early to avoid scope issues
  const selectedBusData = buses.find(bus => bus.id === selectedBus || bus.busId === selectedBus);
  const selectedTripData = childTrips.find(trip => trip._id === selectedTrip);

  // Load data function
  const loadData = async () => {
    try {
      const [busesData, routesData] = await Promise.all([
        fetchActiveBuses(),
        fetchRoutes()
      ]);
      setBuses(busesData);
      setRoutes(routesData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    if (isParent) {
      setLoadingChildren(true);
      fetchChildren()
        .then(data => setChildren(data))
        .catch(error => {
          console.error('Error fetching children:', error);
          Alert.alert('Error fetching children', 'An error occurred while fetching the children list.', [{ text: 'OK' }]);
        })
        .finally(() => setLoadingChildren(false));
    } else if (isStudent) {
      setLoadingTrips(true);
      fetchStudentBookings(user.id)
        .then(data => {
          setChildTrips(data);
          if (!data || data.length === 0) {
            console.warn('No trips found for this student!');
            Alert.alert('No trips', 'This student has no booked trips.');
          }
        })
        .catch(error => {
          console.error('Error fetching trips:', error);
          Alert.alert('Error fetching trips', 'An error occurred while fetching student trips.', [{ text: 'OK' }]);
        })
        .finally(() => setLoadingTrips(false));
    }
  }, []);

  // Driver state: fetch today's trips
  useEffect(() => {
    if (isDriver) {
      setLoadingTrips(true);
      fetchDriverTodayTrips(user.id)
        .then(data => setChildTrips(data))
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
        Alert.alert('Error fetching trips', 'An error occurred while fetching child trips.', [{ text: 'OK' }]);
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
  }, [selectedTrip, childTrips, buses, routes, busStopIndices]);

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
    if (!isLiveTracking || !selectedBus || !selectedBusData || !routes.length) return;
    
    const interval = setInterval(() => {
      // Find the route for the selected trip
      const routeFromTrip = routes.find(r =>
        r._id === selectedTripData?.routeId?._id ||
        r._id === selectedTripData?.routeId ||
        r.id === selectedTripData?.routeId
      );
      const routeFromBus = selectedBusData && routes.find(r =>
        r._id === selectedBusData.routeId ||
        r.id === selectedBusData.routeId
      );
      const route = routeFromTrip || routeFromBus;
      
      if (!route || !Array.isArray(route.stops) || route.stops.length === 0) return;
      
      const stops = route.stops;
      const currentIdx = busStopIndices[selectedBus] ?? 0;
      const nextIdx = (currentIdx + 1) % stops.length;
      const currentStop = stops[currentIdx];
      const nextStop = stops[nextIdx];
      
      if (!currentStop || !nextStop) return;
      
      // Calculate intermediate position between stops for smooth movement
      const progress = (Date.now() % 2000) / 2000; // 2 second cycle
      const lat = currentStop.lat + (nextStop.lat - currentStop.lat) * progress;
      const lng = currentStop.long + (nextStop.long - currentStop.long) * progress;
      
      // Update bus location
      setBuses(prevBuses => prevBuses.map(bus => {
        if (bus.busId === selectedBus || bus.id === selectedBus) {
          return {
            ...bus,
            currentLocation: {
              lat: lat,
              lng: lng,
              latitude: lat,
              longitude: lng
            }
          };
        }
        return bus;
      }));
      
      // Update map region to follow the bus
      setMapRegion({
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      
      // Move to next stop when cycle completes
      if (progress > 0.95) {
        setBusStopIndices(prev => ({
          ...prev,
          [selectedBus]: nextIdx
        }));
        
        // Play notification when reaching a new stop
        if (lastStopIndices[selectedBus] !== nextIdx) {
          playNotificationSound();
          setLastStopIndices(prev => ({ ...prev, [selectedBus]: nextIdx }));
        }
      }
    }, 100); // Update every 100ms for smooth movement
    
    return () => clearInterval(interval);
  }, [isLiveTracking, selectedBus, selectedBusData, routes, busStopIndices, lastStopIndices, selectedTripData]);

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

  // Helper function to find route name from trip data and routes list
  const getRouteName = (trip: any) => {
    if (!trip) return 'Not specified';
    if (trip.routeName) return trip.routeName;
    if (trip.route) return trip.route;
    // Search in routes list
    const routeObj = routes.find(r =>
      r._id === trip.routeId?._id ||
      r._id === trip.routeId ||
      r.id === trip.routeId
    );
    return routeObj?.name || 'Not specified';
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10B981';
      case 'maintenance':
        return '#F59E0B';
      case 'inactive':
        return '#EF4444';
      default:
        return Colors.primary;
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(childTrips.length / ITEMS_PER_PAGE);
  const paginatedTrips = childTrips.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // UI
  return (
    <>
      <CustomHeader title="Bus Tracking" subtitle="Monitor buses in real-time" showNotifications={false} />
      <StatusBar style="light" />
      
      <ScrollView 
        style={{ flex: 1, backgroundColor: '#f8fafc' }} 
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Stats Section */}
        <Animated.View entering={FadeInUp.delay(100)} style={styles.statsSection}>
          <View style={styles.statsContainer}>
            <LinearGradient
              colors={[Colors.primary, '#3A6D8C']}
              style={styles.statCard}
            >
              <Bus size={24} color="#fff" />
              <Text style={styles.statNumber}>{buses.length}</Text>
              <Text style={styles.statLabel}>Active Buses</Text>
            </LinearGradient>
            
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.statCard}
            >
              <Activity size={24} color="#fff" />
              <Text style={styles.statNumber}>
                {buses.filter(b => b.status === 'active').length}
              </Text>
              <Text style={styles.statLabel}>On Route</Text>
            </LinearGradient>
            
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              style={styles.statCard}
            >
              <Shield size={24} color="#fff" />
              <Text style={styles.statNumber}>
                {buses.filter(b => b.status === 'maintenance').length}
              </Text>
              <Text style={styles.statLabel}>In Maintenance</Text>
            </LinearGradient>
          </View>
        </Animated.View>

        <View style={[styles.container, isFullScreen && { padding: 0 }]}>
          {/* Selection Card */}
          <Animated.View entering={FadeInUp.delay(200)} style={styles.selectionCard}>
            <LinearGradient
              colors={['#ffffff', '#f8fafc']}
              style={styles.selectionGradient}
            >
            {isParent && (
              <>
                <View style={styles.selectionHeader}>
                  <Users size={20} color={Colors.primary} />
                    <Text style={styles.selectionTitle}>Select Child</Text>
                </View>
                {loadingChildren ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                    <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedChild}
                    onValueChange={setSelectedChild}
                    style={styles.picker}
                  >
                        <Picker.Item label="Select Child" value={null} />
                    {children.map(child => (
                      <Picker.Item
                        key={child._id}
                        label={`${child.firstName} ${child.lastName}`}
                        value={child._id}
                      />
                    ))}
                  </Picker>
                    </View>
                )}
              </>
            )}
              {isDriver && (
                <View style={{marginTop: 24, paddingHorizontal: 16}}>
                  <View style={styles.enhancedDropdownContainer}>
                    <View style={styles.enhancedDropdownHeader}>
                      <LinearGradient
                        colors={[Colors.primary + '10', Colors.primary + '05']}
                        style={styles.dropdownHeaderGradient}
                      >
                        <View style={styles.dropdownHeaderContent}>
                          <View style={styles.dropdownIconContainer}>
                            <Calendar size={20} color={Colors.primary} />
                          </View>
                          <View style={styles.dropdownTitleContainer}>
                            <Text style={styles.enhancedDropdownTitle}>Select Trip</Text>
                            <Text style={styles.dropdownSubtitle}>Choose your trip to start tracking</Text>
                          </View>
                        </View>
                      </LinearGradient>
                    </View>
                    
                    <View style={styles.enhancedPickerContainer}>
                      <Picker
                        selectedValue={selectedTrip}
                        onValueChange={setSelectedTrip}
                        style={styles.enhancedPicker}
                        itemStyle={styles.enhancedPickerItem}
                      >
                        <Picker.Item label="Select a trip from the list" value={null} />
                        {paginatedTrips.map(trip => (
                          <Picker.Item
                            key={trip._id}
                            label={`${(typeof trip.routeId === 'object' && trip.routeId?.name) ? trip.routeId.name : (typeof trip.routeId === 'string' ? trip.routeId : 'Route not specified')} | ${new Date(trip.date).toLocaleDateString('en-US')}`}
                            value={trip._id}
                          />
                        ))}
                      </Picker>
                      <View style={styles.dropdownArrowContainer}>
                        <MaterialCommunityIcons 
                          name="chevron-down" 
                          size={20} 
                          color={Colors.primary} 
                        />
                      </View>
                    </View>
                  </View>
                  
                  {/* Enhanced Pagination Controls */}
                  {totalPages > 1 && (
                    <View style={styles.enhancedPaginationContainer}>
                      <TouchableOpacity 
                        disabled={currentPage === 1} 
                        onPress={() => setCurrentPage(currentPage - 1)} 
                        style={[styles.enhancedPaginationButton, currentPage === 1 && styles.enhancedPaginationButtonDisabled]}
                      >
                        <MaterialCommunityIcons 
                          name="chevron-left" 
                          size={16} 
                          color={currentPage === 1 ? '#CBD5E1' : Colors.primary} 
                        />
                        <Text style={[styles.enhancedPaginationButtonText, currentPage === 1 && styles.enhancedPaginationButtonTextDisabled]}>Previous</Text>
                      </TouchableOpacity>
                      
                      <View style={styles.enhancedPaginationInfo}>
                        <Text style={styles.enhancedPaginationText}>{currentPage} of {totalPages}</Text>
                        <Text style={styles.enhancedPaginationSubtext}>{paginatedTrips.length} trips</Text>
                      </View>
                      
                      <TouchableOpacity 
                        disabled={currentPage === totalPages} 
                        onPress={() => setCurrentPage(currentPage + 1)} 
                        style={[styles.enhancedPaginationButton, currentPage === totalPages && styles.enhancedPaginationButtonDisabled]}
                      >
                        <Text style={[styles.enhancedPaginationButtonText, currentPage === totalPages && styles.enhancedPaginationButtonTextDisabled]}>Next</Text>
                        <MaterialCommunityIcons 
                          name="chevron-right" 
                          size={16} 
                          color={currentPage === totalPages ? '#CBD5E1' : Colors.primary} 
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  {/* Enhanced Start Tracking Button */}
                  {selectedTrip && (
                    <TouchableOpacity 
                      style={styles.enhancedStartTrackingButton}
                      onPress={() => setIsLiveTracking(true)}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={[Colors.primary, '#3A6D8C']}
                        style={styles.startTrackingGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <View style={styles.startTrackingIconContainer}>
                          <Navigation size={20} color="#fff" />
                        </View>
                        <View style={styles.startTrackingTextContainer}>
                          <Text style={styles.enhancedStartTrackingButtonText}>Start Live Tracking</Text>
                          <Text style={styles.startTrackingSubtext}>Begin monitoring your selected trip</Text>
                        </View>
                        <MaterialCommunityIcons 
                          name="arrow-right" 
                          size={20} 
                          color="#fff" 
                          style={styles.startTrackingArrow}
                        />
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </LinearGradient>
          </Animated.View>

          {/* Map Container */}
          <Animated.View entering={FadeInUp.delay(300)} style={[styles.mapContainer, { height: isFullScreen ? height - 200 : 280 }]}>
            <LinearGradient
              colors={['#ffffff', '#f8fafc']}
              style={styles.mapGradient}
            >
              {/* Fullscreen Button */}
            <TouchableOpacity
              style={styles.fullscreenButton}
              onPress={() => setIsFullScreen(!isFullScreen)}
            >
                <LinearGradient
                  colors={['#ffffff', '#f1f5f9']}
                  style={styles.fullscreenButtonGradient}
                >
                  {isFullScreen ? (
                    <Minimize2 size={20} color={Colors.primary} />
                  ) : (
                    <Maximize2 size={20} color={Colors.primary} />
                  )}
                </LinearGradient>
            </TouchableOpacity>

              {/* Live Tracking Indicator */}
              {isLiveTracking && (
                <Animated.View style={[styles.liveIndicator, pulseStyle]}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </Animated.View>
              )}

            <MapView
                style={styles.map}
              initialRegion={mapRegion}
              region={mapRegion}
            >
              {/* Route Polyline */}
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
                      <Polyline
                        coordinates={route.stops.map((stop: { lat: number; long: number }) => ({
                          latitude: stop.lat,
                          longitude: stop.long,
                        }))}
                        strokeColor={Colors.primary}
                        strokeWidth={8}
                        zIndex={2}
                      />
                  );
                }
                return null;
              })()}

              {/* Bus Marker */}
              {selectedBus && selectedBusData && isLiveTracking && (() => {
                const routeFromTrip = routes.find(r =>
                  r._id === selectedTripData?.routeId?._id ||
                  r._id === selectedTripData?.routeId ||
                  r.id === selectedTripData?.routeId
                );
                const routeFromBus = selectedBusData && routes.find(r =>
                  r._id === selectedBusData.routeId ||
                  r.id === selectedBusData.routeId
                );
                const route = routeFromTrip || routeFromBus;
                
                // Get bus coordinates
                let busLat = selectedBusData.currentLocation?.lat || selectedBusData.currentLocation?.latitude;
                let busLng = selectedBusData.currentLocation?.lng || selectedBusData.currentLocation?.longitude;
                
                // If no coordinates, use first stop of route or default
                if (!busLat || !busLng) {
                  if (route && route.stops && route.stops.length > 0) {
                    busLat = route.stops[0].lat;
                    busLng = route.stops[0].long;
                  } else {
                    busLat = mapRegion.latitude;
                    busLng = mapRegion.longitude;
                  }
                }
                
                return (
                  <Marker
                    coordinate={{
                      latitude: busLat,
                      longitude: busLng,
                    }}
                    title={`Bus ${selectedBusData.name || selectedBusData.busNumber}`}
                    description={isLiveTracking ? `Stop ${(busStopIndices[selectedBusData.busId || selectedBusData.id] ?? 0) + 1}` : 'Bus Location'}
                  >
                    <View style={styles.busMarkerContainer}>
                      <LinearGradient
                        colors={[Colors.primary, '#3A6D8C']}
                        style={styles.busMarkerGradient}
                      >
                        <MaterialCommunityIcons 
                          name="bus" 
                          size={20} 
                          color="#fff" 
                        />
                      </LinearGradient>
                      <Animated.View style={[styles.busMarkerPulse, busPulseStyle]} />
                    </View>
                  </Marker>
                );
              })()}

              {/* Route Stops Markers */}
              {selectedTripData && isLiveTracking && (() => {
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
                
                if (route && route.stops && route.stops.length > 0) {
                  return route.stops.map((stop: any, index: number) => (
                    <Marker
                      key={`stop-${index}`}
                      coordinate={{
                        latitude: stop.lat,
                        longitude: stop.long,
                      }}
                      title={`Stop ${index + 1}`}
                      description={stop.name || `Bus Stop ${index + 1}`}
                    >
                      <View style={styles.stopMarkerContainer}>
                        <View style={styles.stopMarker}>
                          <Text style={styles.stopMarkerText}>{index + 1}</Text>
                        </View>
                      </View>
                    </Marker>
                  ));
                }
                return null;
              })()}
            </MapView>

              {/* Empty State */}
                {(!isLiveTracking || buses.length === 0) && (
                  <View style={styles.emptyStateContainer}>
                    <MaterialCommunityIcons name="bus-clock" size={80} color="#CBD5E1" />
                    <Text style={styles.emptyStateTitle}>
                    {!isLiveTracking ? 'Start live bus tracking' : 'No active buses currently'}
                    </Text>
                    <Text style={styles.emptyStateSubtitle}>
                      {!isLiveTracking
                      ? 'Press the "Start Live Tracking" button to see bus movement on the map.'
                      : 'Wait for new buses to be activated or refresh the page.'}
                    </Text>
                    {!isLiveTracking && (
                      <TouchableOpacity
                        style={styles.emptyStateButton}
                        onPress={async () => {
                          await playNotificationSound();
                          setIsLiveTracking(true);
                        }}
                    >
                      <LinearGradient
                        colors={[Colors.primary, '#3A6D8C']}
                        style={styles.emptyStateButtonGradient}
                      >
                        <Navigation size={18} color={Colors.white} />
                        <Text style={styles.emptyStateButtonText}>Start Live Tracking</Text>
                      </LinearGradient>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

              {/* Tracking Control Button */}
                {buses.length > 0 && (
                  <TouchableOpacity
                  style={styles.trackingButton}
                    onPress={async () => {
                      if (!isLiveTracking) {
                        await playNotificationSound();
                      }
                      setIsLiveTracking(!isLiveTracking);
                    }}
                  >
                  <LinearGradient
                    colors={isLiveTracking ? ['#EF4444', '#DC2626'] : [Colors.primary, '#3A6D8C']}
                    style={styles.trackingButtonGradient}
                  >
                    {isLiveTracking ? (
                      <Pause size={16} color={Colors.white} />
                    ) : (
                      <Play size={16} color={Colors.white} />
                    )}
                    <Text style={styles.trackingButtonText}>
                      {isLiveTracking ? 'Stop Tracking' : 'Start Tracking'}
                    </Text>
                  </LinearGradient>
                  </TouchableOpacity>
                )}
            </LinearGradient>
          </Animated.View>

          {/* Live Tracking Details */}
              {isLiveTracking && selectedBusData && selectedTripData && (
            <Animated.View entering={FadeInUp.delay(400)} style={styles.detailsCard}>
              <LinearGradient
                colors={['#ffffff', '#f8fafc']}
                style={styles.detailsGradient}
              >
                  <View style={styles.detailsHeader}>
                  <View style={styles.busInfo}>
                    <LinearGradient
                      colors={[Colors.primary, '#3A6D8C']}
                      style={styles.busIcon}
                    >
                      <Bus size={24} color="#fff" />
                    </LinearGradient>
                    <View>
                      <Text style={styles.detailsTitle}>
                        Bus {selectedBusData.name || selectedBusData.busNumber}
                      </Text>
                      <Text style={styles.detailsSubtitle}>
                        {getRouteName(selectedTripData)}
                      </Text>
                    </View>
                    </View>
                  <View style={styles.liveStatus}>
                    <Animated.View style={[styles.liveDot, pulseStyle]} />
                    <Text style={styles.liveStatusText}>LIVE</Text>
                  </View>
                </View>

                  <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                    <LinearGradient
                      colors={['#E0F2FE', '#B3E5FC']}
                      style={styles.infoIconContainer}
                    >
                      <Clock size={20} color={Colors.primary} />
                    </LinearGradient>
                    <Text style={styles.infoLabel}>Estimated Arrival</Text>
                    <Text style={styles.infoValue}>15 min</Text>
                    </View>
                    <View style={styles.infoItem}>
                    <LinearGradient
                      colors={['#F0FDF4', '#DCFCE7']}
                      style={styles.infoIconContainer}
                    >
                      <MapPin size={20} color={Colors.primary} />
                    </LinearGradient>
                    <Text style={styles.infoLabel}>Remaining Distance</Text>
                    <Text style={styles.infoValue}>2.5 km</Text>
                    </View>
                  <View style={styles.infoItem}>
                    <LinearGradient
                      colors={['#FEF3C7', '#FDE68A']}
                      style={styles.infoIconContainer}
                    >
                      <TrendingUp size={20} color={Colors.primary} />
                    </LinearGradient>
                    <Text style={styles.infoLabel}>Current Speed</Text>
                    <Text style={styles.infoValue}>45 km/h</Text>
                  </View>
                </View>

                  {selectedBusData.currentLocation && (
                    <View style={styles.locationInfo}>
                    <View style={styles.locationHeader}>
                      <MapPin size={16} color={Colors.primary} />
                      <Text style={styles.locationTitle}>Current Location:</Text>
                    </View>
                    <View style={styles.coordinatesContainer}>
                      <View style={styles.coordinateItem}>
                        <Text style={styles.coordinateLabel}>Latitude:</Text>
                        <Text style={styles.coordinateValue}>
                          {selectedBusData.currentLocation.lat?.toFixed(6) || 'Not specified'}
                      </Text>
                      </View>
                      <View style={styles.coordinateItem}>
                        <Text style={styles.coordinateLabel}>Longitude:</Text>
                        <Text style={styles.coordinateValue}>
                          {selectedBusData.currentLocation.lng?.toFixed(6) || 'Not specified'}
                      </Text>
                    </View>
                    </View>
                </View>
              )}
              </LinearGradient>
            </Animated.View>
          )}

          {/* Active Buses List */}
              {isLiveTracking && buses.length > 0 && (
            <Animated.View entering={FadeInUp.delay(500)} style={styles.busListContainer}>
              <LinearGradient
                colors={['#ffffff', '#f8fafc']}
                style={styles.busListGradient}
              >
                <View style={styles.busListHeader}>
                  <Bus size={20} color={Colors.primary} />
                  <Text style={styles.busListTitle}>All Active Buses</Text>
                  <TouchableOpacity
                    style={styles.toggleStatsButton}
                    onPress={() => setShowStats(!showStats)}
                  >
                    <Text style={styles.toggleStatsText}>
                      {showStats ? 'Hide' : 'Show'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {showStats && (
                  <View style={styles.busListContent}>
                  {buses.map((bus, idx) => (
                      <Animated.View 
                        key={bus.id || bus.busId} 
                        style={styles.busListItem}
                        entering={FadeInRight.delay(idx * 100)}
                      >
                      <View style={styles.busListHeader}>
                          <LinearGradient
                            colors={[getStatusColor(bus.status), getStatusColor(bus.status) + '80']}
                            style={styles.busStatusIcon}
                          >
                            <Bus size={16} color="#fff" />
                          </LinearGradient>
                          <View style={styles.busListInfo}>
                        <Text style={styles.busListName}>{bus.name || bus.busNumber}</Text>
                        <Text style={styles.busListStatus}>({bus.status})</Text>
                      </View>
                          <View style={styles.busListActions}>
                            <TouchableOpacity
                              style={styles.busActionButton}
                              onPress={() => {
                                setSelectedBus(bus.id || bus.busId);
                                if (bus.currentLocation) {
                                  setMapRegion({
                                    latitude: bus.currentLocation.lat,
                                    longitude: bus.currentLocation.lng,
                                    latitudeDelta: 0.01,
                                    longitudeDelta: 0.01,
                                  });
                                }
                              }}
                            >
                              <MapPin size={14} color={Colors.primary} />
                            </TouchableOpacity>
                          </View>
                        </View>
                        <Text style={styles.busListRoute}>Route: {bus.route || '-'}</Text>
                      {bus.currentLocation && (
                          <View style={styles.busListCoords}>
                            <Text style={styles.coordsLabel}>Coordinates:</Text>
                            <View style={styles.coordsValues}>
                              <Text style={styles.coordValue}>
                            {bus.currentLocation.lat?.toFixed(5) ?? '--'}
                          </Text>
                              <Text style={styles.coordValue}>
                            {bus.currentLocation.lng?.toFixed(5) ?? '--'}
                          </Text>
                    </View>
                          </View>
                        )}
                      </Animated.View>
                  ))}
                </View>
                )}
              </LinearGradient>
            </Animated.View>
              )}
            </View>
          </ScrollView>
        </>
      );
    }

    const styles = StyleSheet.create({
  // Stats Section
  statsSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
    textAlign: 'center',
  },

  // Container
  container: { 
    flex: 1, 
    backgroundColor: '#f8fafc', 
    paddingTop: 0 
  },

  // Selection Card
  selectionCard: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    margin: 16, 
    marginBottom: 16, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 12, 
    elevation: 6,
    overflow: 'hidden',
  },
  selectionGradient: {
    padding: 20,
  },
  selectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12, 
    marginTop: 8 
  },
  selectionTitle: { 
    fontWeight: 'bold', 
    fontSize: 16, 
    marginLeft: 8, 
    color: '#1e293b' 
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
    marginBottom: 16,
  },
  picker: { 
    backgroundColor: 'transparent',
  },

  // Map Container
  mapContainer: { 
    margin: 16, 
    borderRadius: 20, 
    overflow: 'hidden', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 12, 
    elevation: 8,
  },
  mapGradient: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
    borderRadius: 20,
  },
  fullscreenButton: { 
    position: 'absolute', 
    top: 16, 
    right: 16, 
    zIndex: 100,
  },
  fullscreenButtonGradient: {
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  liveIndicator: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 6,
  },
  liveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Tracking Button
  trackingButton: { 
    position: 'absolute', 
    bottom: 24, 
    left: '50%', 
    transform: [{ translateX: -70 }], 
    zIndex: 10,
  },
  trackingButtonGradient: {
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  trackingButtonText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 16,
  },

  // Empty State
  emptyStateContainer: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: 'rgba(255,255,255,0.95)', 
    zIndex: 20, 
    paddingHorizontal: 24,
  },
  emptyStateTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#64748b', 
    marginBottom: 8, 
    textAlign: 'center', 
    marginTop: 16,
  },
  emptyStateSubtitle: { 
    fontSize: 14, 
    color: '#94a3b8', 
    marginBottom: 20, 
    textAlign: 'center',
  },
  emptyStateButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  emptyStateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 28,
    gap: 8,
    shadowColor: '#3A6D8C',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyStateButtonText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 16,
  },

  // Details Card
  detailsCard: { 
    backgroundColor: '#fff', 
    margin: 16, 
    borderRadius: 20, 
    overflow: 'hidden', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 12, 
    elevation: 6,
  },
  detailsGradient: {
    padding: 20,
  },
  detailsHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 20,
  },
  busInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  busIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
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
  liveStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveStatusText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Info Grid
  infoGrid: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 20,
    gap: 12,
  },
  infoItem: { 
    alignItems: 'center', 
    flex: 1,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: { 
    fontSize: 12, 
    color: '#64748b', 
    marginBottom: 4, 
    textAlign: 'center',
  },
  infoValue: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#1e293b',
  },

  // Location Info
  locationInfo: { 
    backgroundColor: '#f8fafc', 
    borderRadius: 12, 
    padding: 16,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  locationTitle: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#475569',
  },
  coordinatesContainer: {
    gap: 8,
  },
  coordinateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coordinateLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  coordinateValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1e293b',
  },

  // Bus List Container
  busListContainer: { 
    marginHorizontal: 16, 
    marginTop: 8, 
    marginBottom: 30, 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 8, 
    elevation: 2,
    overflow: 'hidden',
  },
  busListGradient: {
    padding: 20,
  },
  busListHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 16,
    gap: 8,
  },
  busListTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: Colors.primary,
    flex: 1,
  },
  toggleStatsButton: {
    backgroundColor: Colors.gray[100],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  toggleStatsText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  busListContent: {
    gap: 12,
  },
  busListItem: { 
    borderBottomWidth: 1, 
    borderBottomColor: '#f1f5f9', 
    paddingVertical: 12,
  },
  busStatusIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  busListInfo: {
    flex: 1,
    marginLeft: 12,
  },
  busListName: { 
    fontSize: 15, 
    fontWeight: 'bold', 
    color: '#1e293b',
  },
  busListStatus: { 
    fontSize: 13, 
    color: '#64748b',
  },
  busListActions: {
    flexDirection: 'row',
    gap: 8,
  },
  busActionButton: {
    backgroundColor: Colors.gray[100],
    padding: 8,
    borderRadius: 8,
  },
  busListRoute: { 
    fontSize: 13, 
    color: '#475569', 
    marginTop: 8,
  },
  busListCoords: { 
    marginTop: 8,
  },
  coordsLabel: {
    fontSize: 13,
    color: '#334155',
    marginBottom: 4,
  },
  coordsValues: {
    flexDirection: 'row',
    gap: 16,
  },
  coordValue: { 
    fontWeight: 'bold', 
    color: Colors.primary,
    fontSize: 12,
  },

  // Enhanced Dropdown Styles
  enhancedDropdownContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 20,
    overflow: 'hidden',
  },
  enhancedDropdownHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownHeaderGradient: {
    padding: 16,
  },
  dropdownHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dropdownTitleContainer: {
    flex: 1,
  },
  enhancedDropdownTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 2,
  },
  dropdownSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  enhancedPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#f8fafc',
  },
  enhancedPicker: {
    flex: 1,
    backgroundColor: 'transparent',
    color: '#334155',
    fontSize: 15,
    fontWeight: '500',
  },
  enhancedPickerItem: {
    fontSize: 15,
    color: '#334155',
    fontWeight: '500',
  },
  dropdownArrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },

  // Legacy dropdown styles (keeping for compatibility)
  dropdownContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginLeft: 8,
  },
  pickerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pickerItem: {
    fontSize: 14,
    color: '#334155',
  },
  dropdownIcon: {
    marginLeft: 10,
  },

  // Enhanced Pagination Styles
  enhancedPaginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  enhancedPaginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    gap: 6,
  },
  enhancedPaginationButtonDisabled: {
    opacity: 0.4,
  },
  enhancedPaginationButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  enhancedPaginationButtonTextDisabled: {
    color: '#CBD5E1',
  },
  enhancedPaginationInfo: {
    alignItems: 'center',
  },
  enhancedPaginationText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  enhancedPaginationSubtext: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },

  // Legacy pagination styles (keeping for compatibility)
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  paginationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    marginHorizontal: 8,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  paginationButtonTextDisabled: {
    color: '#94a3b8',
  },
  paginationInfo: {
    paddingHorizontal: 12,
  },
  paginationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },

  // Enhanced Start Tracking Button
  enhancedStartTrackingButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#3A6D8C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  startTrackingGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  startTrackingIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  startTrackingTextContainer: {
    flex: 1,
  },
  enhancedStartTrackingButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  startTrackingSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  startTrackingArrow: {
    marginLeft: 'auto',
  },

  // Legacy start tracking button styles (keeping for compatibility)
  startTrackingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 8,
    shadowColor: '#3A6D8C',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startTrackingButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Map Marker Styles
  busMarkerContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  busMarkerGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  busMarkerPulse: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '30',
    opacity: 0.6,
    zIndex: -1,
  },
  stopMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  stopMarkerText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.primary,
  },
    });