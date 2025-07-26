import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, FlatList, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MapPin, Bell, Clock, Users, Activity, ArrowRight, TrendingUp, Search, Calendar, Navigation, Bus } from 'lucide-react-native';
import CustomHeader from '../../components/CustomHeader';
import { Colors } from '../../constants/Colors';
import { useAuthStore } from '../../store/authStore';
import { fetchActiveBuses, fetchTrips, fetchChildren, bookSeat, fetchDriverTodayTrips, startTripTracking, endTripTracking } from '../../services/busService';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  withSpring, 
  useAnimatedStyle,
  FadeInDown,
  FadeInRight,
  FadeInUp
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const getTodayStats = (children: any[], trips: any[], buses: any[]) => [
  { icon: MapPin, label: 'Active Buses', value: buses.length, color: Colors.primary },
  { icon: Users, label: 'Children Tracked', value: children.length, color: '#06B6D4' },
  { icon: Clock, label: 'Active Trips', value: trips.length, color: '#10B981' },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return Colors.primary;
    case 'completed': return '#10B981';
    case 'warning': return '#F59E0B';
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

const recentActivity = [
  { id: '1', type: 'pickup', title: 'Emma picked up', time: '8:15 AM', location: 'Maple Street Stop', status: 'completed' },
  { id: '2', type: 'enroute', title: 'Bus #12 en route', time: '8:20 AM', location: 'Lincoln Elementary', status: 'active' },
  { id: '3', type: 'arrived', title: 'Safe arrival at school', time: '8:45 AM', location: 'Lincoln Elementary', status: 'completed' },
];

const getDriverStats = (trips: any[]) => {
  const today = new Date();
  const thisMonth = today.getMonth();
  const thisYear = today.getFullYear();
  
  const todayTrips = trips.filter(trip => {
    const tripDate = new Date(trip.date);
    return tripDate.toDateString() === today.toDateString();
  });
  
  const monthTrips = trips.filter(trip => {
    const tripDate = new Date(trip.date);
    return tripDate.getMonth() === thisMonth && tripDate.getFullYear() === thisYear;
  });
  
  const activeTrips = trips.filter(trip => trip.status === 'started');
  const scheduledTrips = trips.filter(trip => trip.status === 'scheduled');
  const endedTrips = trips.filter(trip => trip.status === 'ended');
  
  return [
    { icon: Calendar, label: 'Today\'s Trips', value: todayTrips.length, color: Colors.primary },
    { icon: Clock, label: 'Month Trips', value: monthTrips.length, color: '#06B6D4' },
    { icon: Navigation, label: 'Active Trips', value: activeTrips.length, color: '#10B981' },
    { icon: Bus, label: 'Completed', value: endedTrips.length, color: '#F59E0B' },
  ];
};

export default function HomeScreen() {
  const user = useAuthStore(state => state.user);
  const router = useRouter();
  const [buses, setBuses] = useState([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [children, setChildren] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fadeValue = useSharedValue(0);
  useEffect(() => {
    fadeValue.value = withSpring(1, { damping: 15, stiffness: 100 });
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeValue.value,
    transform: [{ translateY: (1 - fadeValue.value) * 30 }],
  }));

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (user?.role === 'parent') {
        await Promise.all([
          fetchChildren().then(setChildren),
          fetchActiveBuses().then(setBuses),
          fetchTrips().then(setTrips)
        ]);
      } else {
        await Promise.all([
          fetchActiveBuses().then(setBuses),
          fetchTrips().then(setTrips)
        ]);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (user?.role === 'driver') {
          const [busesData, tripsData] = await Promise.all([
            fetchActiveBuses(),
            fetchDriverTodayTrips(user.id)
          ]);
          setBuses(busesData);
          setTrips(tripsData);
        } else if (user?.role === 'parent') {
          const [childrenData, busesData, tripsData] = await Promise.all([
            fetchChildren(),
            fetchActiveBuses(),
            fetchTrips()
          ]);
          setChildren(childrenData);
          setBuses(busesData);
          setTrips(tripsData);
    } else {
          const [busesData, tripsData] = await Promise.all([
            fetchActiveBuses(),
            fetchTrips()
          ]);
          setBuses(busesData);
          setTrips(tripsData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user?.role, user?.id]);

  const startTracking = async (trip: any) => {
    try {
      await startTripTracking(trip._id);
      Alert.alert('Trip Started', 'Trip has been started successfully');
      setSelectedTrip(trip);
      setIsTracking(true);
      // Update trips list
      const updatedTrips = trips.map(t => 
        t._id === trip._id ? { ...t, status: 'started' } : t
      );
      setTrips(updatedTrips);
    } catch (error) {
      console.error('Error starting trip tracking:', error);
      Alert.alert('Error', 'An error occurred while starting the trip');
    }
  };

  const endTracking = async (trip: any) => {
    try {
      await endTripTracking(trip._id);
      Alert.alert('Trip Ended', 'Trip has been ended successfully');
      setSelectedTrip(null);
      setIsTracking(false);
      // Update trips list
      const updatedTrips = trips.map(t => 
        t._id === trip._id ? { ...t, status: 'ended' } : t
      );
      setTrips(updatedTrips);
    } catch (error) {
      console.error('Error ending trip tracking:', error);
      Alert.alert('Error', 'An error occurred while ending the trip');
    }
  };

  if (loading) {
    return (
      <>
        <CustomHeader title="Home" subtitle="Welcome to the bus tracking system" />
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading data...</Text>
        </View>
      </>
    );
  }

  // Filter today's trips for drivers
  const todayTrips = user?.role === 'driver' ? trips.filter(trip => {
    const tripDate = new Date(trip.date);
    const today = new Date();
    return tripDate.toDateString() === today.toDateString();
  }) : trips;

  // Pagination logic
  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(todayTrips.length / ITEMS_PER_PAGE);
  const paginatedTrips = todayTrips.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <>
              <CustomHeader 
          title="Home" 
          subtitle="Welcome to the bus tracking system" 
          showNotifications={false}
        />
      <StatusBar style="light" />
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Driver Stats */}
        {user?.role === 'driver' && (
          <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
            <Text style={styles.sectionTitle}>Driver Statistics</Text>
            <View style={styles.statsGridDriver}>
              {getDriverStats(trips).map((stat, index) => (
                <Animated.View 
                  key={index} 
                  style={styles.statCardDriver}
                  entering={FadeInDown.delay(300 + index * 100)}
                >
                  <LinearGradient 
                    colors={[stat.color + '20', stat.color + '10']} 
                    style={styles.statGradientDriver}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.statIconContainerDriver}>
                      <stat.icon size={24} color={stat.color} />
                    </View>
                    <Text style={[styles.statValueDriver, { color: stat.color }]}>{stat.value}</Text>
                    <Text style={styles.statLabelDriver}>{stat.label}</Text>
                  </LinearGradient>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Driver Trips Section - Moved to top */}
        {user?.role === 'driver' && (
          <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's Trips</Text>
              <View style={styles.tripCountBadge}>
                <Text style={styles.tripCountText}>{todayTrips.length} trips today</Text>
              </View>
            </View>
            
            {todayTrips.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="bus-clock" size={80} color="#CBD5E1" />
                <Text style={styles.emptyStateTitle}>No trips today</Text>
                <Text style={styles.emptyStateSubtitle}>
                  No trips assigned to you today. Check your weekly schedule.
                </Text>
              </View>
            ) : (
              <>
                {/* Selected Trip Details */}
                {selectedTrip && (
                  <Animated.View 
                    style={[styles.selectedTripCard, { borderColor: getStatusColor(selectedTrip.status) }]}
                    entering={FadeInDown.delay(300)}
                  >
                    <LinearGradient 
                      colors={[getStatusColor(selectedTrip.status) + '15', getStatusColor(selectedTrip.status) + '05']} 
                      style={styles.selectedTripGradient}
                    >
                      <View style={styles.selectedTripHeader}>
                        <View style={styles.selectedTripTitleSection}>
                          <MaterialCommunityIcons 
                            name="star" 
                            size={24} 
                            color={getStatusColor(selectedTrip.status)} 
                          />
                          <Text style={[styles.selectedTripTitle, { color: getStatusColor(selectedTrip.status) }]}>
                            Selected Trip
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => setSelectedTrip(null)}
                          style={styles.closeButton}
                        >
                          <MaterialCommunityIcons name="close" size={20} color="#64748b" />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.selectedTripContent}>
                        <View style={styles.selectedTripInfo}>
                          <Text style={styles.selectedTripRouteName}>
                            {(typeof selectedTrip.routeId === 'object' && selectedTrip.routeId?.name) ? selectedTrip.routeId.name : (typeof selectedTrip.routeId === 'string' ? selectedTrip.routeId : 'Route not specified')}
                          </Text>
                          <Text style={styles.selectedTripBusInfo}>
                            Bus: {selectedTrip.busId?.BusNumber || selectedTrip.busNumber || 'Not specified'}
                          </Text>
                        </View>

                        <View style={styles.selectedTripDetails}>
                          <View style={styles.selectedTripDetailItem}>
                            <Calendar size={16} color="#64748b" />
                            <Text style={styles.selectedTripDetailText}>
                              {new Date(selectedTrip.date).toLocaleDateString('en-US')} - {selectedTrip.startTime || 'Time not specified'}
                            </Text>
                          </View>
                          
                          <View style={styles.selectedTripDetailItem}>
                            <MapPin size={16} color="#64748b" />
                            <Text style={styles.selectedTripDetailText}>
                              {(typeof selectedTrip.routeId?.start_point === 'object'
                                ? selectedTrip.routeId?.start_point?.name
                                : selectedTrip.routeId?.start_point) || 'Start point'}
                              {' → '}
                              {(typeof selectedTrip.routeId?.end_point === 'object'
                                ? selectedTrip.routeId?.end_point?.name
                                : selectedTrip.routeId?.end_point) || 'End point'}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.selectedTripActions}>
                          {selectedTrip.status === 'scheduled' && (
                            <TouchableOpacity
                              style={[styles.selectedTripActionButton, { backgroundColor: Colors.primary }]}
                              onPress={async () => { await startTracking(selectedTrip); }}
                              activeOpacity={0.8}
                            >
                              <Navigation size={18} color="#fff" />
                              <Text style={styles.selectedTripActionText}>Start Trip</Text>
                            </TouchableOpacity>
                          )}
                          
                          {selectedTrip.status === 'started' && (
                            <>
                              <TouchableOpacity
                                style={[styles.selectedTripActionButton, { backgroundColor: '#10B981' }]}
                                onPress={() => router.push('/tracking')}
                                activeOpacity={0.8}
                              >
                                <MapPin size={18} color="#fff" />
                                <Text style={styles.selectedTripActionText}>View Tracking</Text>
                              </TouchableOpacity>
                              
                              <TouchableOpacity
                                style={[styles.selectedTripActionButton, { backgroundColor: '#EF4444' }]}
                                onPress={async () => { await endTracking(selectedTrip); }}
                                activeOpacity={0.8}
                              >
                                <MaterialCommunityIcons name="stop-circle" size={18} color="#fff" />
                                <Text style={styles.selectedTripActionText}>End Trip</Text>
                              </TouchableOpacity>
                            </>
                          )}

                          {selectedTrip.status === 'ended' && (
                            <View style={styles.completedTripBadge}>
                              <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
                              <Text style={styles.completedTripText}>Trip Completed</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </LinearGradient>
                  </Animated.View>
                )}

                {/* All Trips List */}
                {paginatedTrips.map((trip, idx) => (
                  <Animated.View 
                    key={trip._id || idx} 
                    style={[
                      styles.tripCard,
                      selectedTrip?._id === trip._id && styles.selectedTripCardHighlight
                    ]}
                    entering={FadeInRight.delay(500 + idx * 150)}
                  >
                    <TouchableOpacity
                      onPress={() => setSelectedTrip(trip)}
                      activeOpacity={0.8}
                    >
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
                                {(typeof trip.routeId === 'object' && trip.routeId?.name) ? trip.routeId.name : (typeof trip.routeId === 'string' ? trip.routeId : 'Route not specified')}
                              </Text>
                              <Text style={styles.tripCardSubtitle}>
                                Bus: {trip.busId?.BusNumber || trip.busNumber || 'Not specified'}
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
                              {new Date(trip.date).toLocaleDateString('en-US')} - {trip.startTime || 'Time not specified'}
                            </Text>
                          </View>
                          
                          <View style={styles.tripDetailItem}>
                            <MapPin size={16} color="#64748b" />
                            <Text style={styles.tripDetailText}>
                              {(typeof trip.routeId?.start_point === 'object'
                                ? trip.routeId?.start_point?.name
                                : trip.routeId?.start_point) || 'Start point'}
                              {' → '}
                              {(typeof trip.routeId?.end_point === 'object'
                                ? trip.routeId?.end_point?.name
                                : trip.routeId?.end_point) || 'End point'}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.tripCardFooter}>
                          <Text style={styles.tapToSelectText}>Tap to select this trip</Text>
                          <MaterialCommunityIcons name="chevron-right" size={16} color="#64748b" />
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
                
                {/* Enhanced Pagination */}
                {totalPages > 1 && (
                  <View style={styles.paginationContainer}>
                    <TouchableOpacity 
                      disabled={currentPage === 1} 
                      onPress={() => setCurrentPage(currentPage - 1)} 
                      style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                    >
                      <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>Previous</Text>
                    </TouchableOpacity>
                    <View style={styles.paginationInfo}>
                      <Text style={styles.paginationText}>{currentPage} of {totalPages}</Text>
                    </View>
                    <TouchableOpacity 
                      disabled={currentPage === totalPages} 
                      onPress={() => setCurrentPage(currentPage + 1)} 
                      style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
                    >
                      <Text style={[styles.paginationButtonText, currentPage === totalPages && styles.paginationButtonTextDisabled]}>Next</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </Animated.View>
        )}

        {/* Today's Stats for other roles */}
        {(user?.role === 'parent' || user?.role === 'admin') && (
          <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Overview</Text>
            <View style={styles.statsGrid}>
              {getTodayStats(children, trips, buses).map((stat, index) => (
                <Animated.View 
                  key={index} 
                  style={styles.statCard}
                  entering={FadeInDown.delay(300 + index * 100)}
                >
                  <LinearGradient 
                    colors={[stat.color + '20', stat.color + '10']} 
                    style={styles.statGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.statIconContainer}>
                      <stat.icon size={24} color={stat.color} />
                    </View>
                    <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                    <View style={[styles.statTrend, { backgroundColor: stat.color }]}> 
                      <TrendingUp size={12} color="#fff" />
                    </View>
                  </LinearGradient>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/tracking')}
              activeOpacity={0.8}
            >
              <LinearGradient 
                colors={[Colors.primary, '#3A6D8C']} 
                style={styles.actionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.actionIconContainer}>
                  <MapPin size={28} color="#fff" />
                </View>
                <Text style={styles.actionTitle}>Live Tracking</Text>
                <Text style={styles.actionSubtitle}>View real-time location</Text>
                <View style={styles.actionArrowContainer}>
                  <ArrowRight size={18} color="#fff" />
                </View>
                <View style={styles.actionOverlay} />
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/scanner')}
              activeOpacity={0.8}
            >
              <LinearGradient 
                colors={['#06B6D4', '#0891B2']} 
                style={styles.actionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.actionIconContainer}>
                  <Activity size={28} color="#fff" />
                </View>
                <Text style={styles.actionTitle}>QR Scanner</Text>
                <Text style={styles.actionSubtitle}>Scan bus QR codes</Text>
                <View style={styles.actionArrowContainer}>
                  <ArrowRight size={18} color="#fff" />
                </View>
                <View style={styles.actionOverlay} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Recent Activity */}
        {(user?.role === 'parent' || user?.role === 'admin') && (
          <Animated.View entering={FadeInDown.delay(600)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.activityList}>
              {recentActivity.map((activity, index) => (
                <Animated.View 
                  key={activity.id} 
                  style={styles.activityItem}
                  entering={FadeInRight.delay(700 + index * 150)}
                >
                  <View style={styles.timelineContainer}>
                    <View style={[styles.timelineDot, { backgroundColor: getStatusColor(activity.status) }]} />
                    {index < recentActivity.length - 1 && (
                      <View style={styles.timelineLine} />
                    )}
                  </View>
                  <View style={styles.activityContent}>
                    <View style={styles.activityHeader}>
                      <Text style={styles.activityTitle}>{activity.title}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(activity.status) + '20' }]}> 
                        <Text style={[styles.statusText, { color: getStatusColor(activity.status) }]}> 
                          {activity.status}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.activityLocation}>{activity.location}</Text>
                    <Text style={styles.activityTime}>{activity.time}</Text>
                  </View>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Safety Status */}
        <Animated.View entering={FadeInUp.delay(800)} style={styles.section}>
          <View style={styles.safetyCard}>
            <LinearGradient 
              colors={['#10B981', '#059669']} 
              style={styles.safetyGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.safetyContent}>
                <View style={styles.safetyIconContainer}>
                  <Users size={28} color="#fff" />
                  <View style={styles.safetyPulse} />
                </View>
                <View style={styles.safetyText}>
                  <Text style={styles.safetyTitle}>All Children Safe</Text>
                  <Text style={styles.safetySubtitle}>
                    All children are accounted for and safely transported
                  </Text>
                  <View style={styles.safetyMetrics}>
                    <Text style={styles.safetyMetric}>✅ {children.length}/{children.length} Children Safe</Text>
                    <Text style={styles.safetyMetric}>🕐 Last Update: 2 min ago</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/notifications')}
        activeOpacity={0.8}
      >
        <Bell size={20} color="#fff" />
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  content: { 
    flex: 1, 
    backgroundColor: '#f8fafc' 
  },
  
  // Hero Section
  heroSection: { 
    marginBottom: 24 
  },
  heroGradient: { 
    borderRadius: 20, 
    padding: 24, 
    marginHorizontal: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  heroTitle: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#fff', 
    marginBottom: 8,
    textAlign: 'center'
  },
  heroSubtitle: { 
    fontSize: 16, 
    color: 'rgba(255,255,255,0.9)', 
    marginBottom: 16,
    textAlign: 'center'
  },
  heroStats: { 
    flexDirection: 'row', 
    justifyContent: 'center',
    gap: 16 
  },
  heroStat: { 
    fontSize: 14, 
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600'
  },

  // Section Styles
  section: { 
    marginTop: 32,
    paddingHorizontal: 24
  },
  sectionTitle: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#1e293b', 
    marginBottom: 16 
  },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  viewAllText: { 
    fontSize: 14, 
    color: '#4F46E5', 
    fontWeight: '600' 
  },
  tripCountBadge: {
    backgroundColor: Colors.primary + '10',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tripCountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginTop: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
    paddingHorizontal: 20,
  },
  tripCard: {
    marginBottom: 14,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2, // Reduced shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, // Reduced shadow opacity
    shadowRadius: 4, // Reduced shadow radius
  },
  tripCardGradient: {
    padding: 16,
    position: 'relative',
  },
  tripCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tripCardTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripCardTitleContainer: {
    marginLeft: 10,
  },
  tripCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  tripCardSubtitle: {
    fontSize: 13,
    color: '#64748b',
  },
  tripCardDetails: {
    marginBottom: 12,
  },
  tripDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tripDetailText: {
    fontSize: 14,
    color: '#64748b',
  },
  tripCardActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  paginationButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    marginHorizontal: 5,
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
    color: '#ccc',
  },
  paginationInfo: {
    marginHorizontal: 10,
  },
  paginationText: {
    fontSize: 14,
    color: '#64748b',
  },

  // Enhanced Stats
  statsGrid: { 
    flexDirection: 'row', 
    justifyContent: 'space-between' 
  },
  statCard: { 
    flex: 1, 
    marginHorizontal: 6, 
    borderRadius: 20, 
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  statGradient: { 
    padding: 20, 
    alignItems: 'center',
    position: 'relative'
  },
  statIconContainer: { 
    width: 50, 
    height: 50, 
    borderRadius: 15, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  statValue: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 4 
  },
  statLabel: { 
    fontSize: 12, 
    color: '#64748b', 
    textAlign: 'center' 
  },
  statTrend: { 
    position: 'absolute', 
    top: 12, 
    right: 12, 
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },

  // Enhanced Actions
  quickActions: { 
    flexDirection: 'row', 
    justifyContent: 'space-between' 
  },
  actionCard: { 
    flex: 1, 
    marginHorizontal: 6, 
    borderRadius: 20, 
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  actionGradient: { 
    padding: 24, 
    position: 'relative',
    minHeight: 120
  },
  actionIconContainer: { 
    width: 56, 
    height: 56, 
    borderRadius: 18, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  actionTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#fff', 
    marginBottom: 4 
  },
  actionSubtitle: { 
    fontSize: 12, 
    color: 'rgba(255,255,255,0.8)' 
  },
  actionArrowContainer: { 
    position: 'absolute', 
    top: 20, 
    right: 20 
  },
  actionOverlay: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    backgroundColor: 'rgba(255,255,255,0.1)' 
  },

  // Timeline Activity
  activityList: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 20, 
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  activityItem: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    marginBottom: 20 
  },
  timelineContainer: { 
    alignItems: 'center', 
    marginRight: 16 
  },
  timelineDot: { 
    width: 16, 
    height: 16, 
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 2
  },
  timelineLine: { 
    width: 2, 
    height: 40, 
    backgroundColor: '#e2e8f0', 
    marginTop: 4 
  },
  activityContent: { 
    flex: 1 
  },
  activityHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 4 
  },
  activityTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#1e293b' 
  },
  statusBadge: { 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 12 
  },
  statusText: { 
    fontSize: 10, 
    fontWeight: 'bold' 
  },
  activityLocation: { 
    fontSize: 14, 
    color: '#64748b',
    marginBottom: 2
  },
  activityTime: { 
    fontSize: 12, 
    color: '#94a3b8' 
  },

  // Enhanced Safety Card
  safetyCard: { 
    borderRadius: 20, 
    overflow: 'hidden', 
    marginBottom: 32,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  safetyGradient: { 
    padding: 24 
  },
  safetyContent: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  safetyIconContainer: { 
    position: 'relative',
    width: 60, 
    height: 60, 
    borderRadius: 20, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 20 
  },
  safetyPulse: { 
    position: 'absolute', 
    width: 60, 
    height: 60, 
    borderRadius: 20, 
    backgroundColor: 'rgba(255,255,255,0.3)', 
    opacity: 0.6 
  },
  safetyText: { 
    flex: 1 
  },
  safetyTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#fff', 
    marginBottom: 4 
  },
  safetySubtitle: { 
    fontSize: 14, 
    color: 'rgba(255,255,255,0.9)', 
    lineHeight: 20,
    marginBottom: 8
  },
  safetyMetrics: { 
    marginTop: 8 
  },
  safetyMetric: { 
    fontSize: 12, 
    color: 'rgba(255,255,255,0.9)', 
    marginBottom: 4 
  },

  // Floating Action Button
  fab: { 
    position: 'absolute', 
    bottom: 24, 
    right: 24, 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#64748b',
  },
  // New styles for driver stats grid - 2 per row
  statsGridDriver: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  statCardDriver: {
    width: '48%', // 2 cards per row with some spacing
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statGradientDriver: {
    padding: 16,
    alignItems: 'center',
    position: 'relative',
    minHeight: 120,
  },
  statIconContainerDriver: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValueDriver: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabelDriver: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Selected Trip Styles
  selectedTripCard: {
    marginBottom: 20,
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  selectedTripGradient: {
    padding: 20,
  },
  selectedTripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedTripTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedTripTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedTripContent: {
    gap: 16,
  },
  selectedTripInfo: {
    marginBottom: 12,
  },
  selectedTripRouteName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  selectedTripBusInfo: {
    fontSize: 14,
    color: '#64748b',
  },
  selectedTripDetails: {
    gap: 8,
  },
  selectedTripDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedTripDetailText: {
    fontSize: 14,
    color: '#64748b',
  },
  selectedTripActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  selectedTripActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedTripActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  completedTripBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#10B981' + '20',
    gap: 8,
  },
  completedTripText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: 'bold',
  },
  selectedTripCardHighlight: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  tripCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  tapToSelectText: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
  },
});