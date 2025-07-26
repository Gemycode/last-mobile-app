import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, FlatList, RefreshControl, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  withSpring, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  FadeInDown,
  FadeInUp,
  FadeInRight,
  SlideInRight
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { 
  Zap, 
  Bus, 
  MapPin, 
  Users, 
  Clock, 
  Calendar, 
  Search, 
  Filter, 
  Activity, 
  Shield, 
  Navigation,
  TrendingUp,
  AlertCircle
} from 'lucide-react-native';
import CustomHeader from '../../components/CustomHeader';
import Card from '../../components/Card';
import { Colors } from '../../constants/Colors';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import { fetchActiveBuses, fetchRoutes, bookSeat, fetchChildren } from '../../services/busService';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function BusesScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [buses, setBuses] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'maintenance'>('all');
  const [search, setSearch] = useState('');
  const [children, setChildren] = useState<any[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const fadeValue = useSharedValue(0);
  const pulseValue = useSharedValue(1);
  const searchValue = useSharedValue(0);

  useEffect(() => {
    fadeValue.value = withSpring(1, { damping: 15, stiffness: 100 });
    pulseValue.value = withRepeat(
      withTiming(1.05, { duration: 2000 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeValue.value,
    transform: [{ translateY: (1 - fadeValue.value) * 50 }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
  }));

  const searchAnimatedStyle = useAnimatedStyle(() => ({
    opacity: searchValue.value,
    transform: [{ translateY: (1 - searchValue.value) * 20 }],
  }));

  const filters = [
    { id: 'all', label: 'All Buses', count: buses.length, icon: Bus },
    { id: 'active', label: 'Active', count: buses.filter(b => b.status === 'active').length, icon: Activity },
    { id: 'maintenance', label: 'Maintenance', count: buses.filter(b => b.status === 'maintenance').length, icon: Shield },
  ];

  const user = useAuthStore(state => state.user);
  const router = useRouter();

  // Load data function
  const loadData = async () => {
    try {
      const [busesData, routesData] = await Promise.all([
        fetchActiveBuses(),
        fetchRoutes()
      ]);
      setBuses(busesData);
      setRoutes(routesData);
      
      if (user?.role === 'parent') {
        const childrenData = await fetchChildren();
        setChildren(childrenData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.role]);

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  React.useEffect(() => {
    if (user && user.role !== 'parent') {
      router.replace('/');
    }
  }, [user]);

  // فلترة و بحث
  const filteredBuses = buses.filter(bus => {
    const route = routes.find(r => r._id === bus.routeId || r.id === bus.routeId);
    const matchesFilter = selectedFilter === 'all' || bus.status === selectedFilter;
    const matchesSearch =
      search.trim() === '' ||
      (bus.busNumber && bus.busNumber.toString().toLowerCase().includes(search.toLowerCase())) ||
      (bus.number && bus.number.toString().toLowerCase().includes(search.toLowerCase())) ||
      (route && route.name && route.name.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

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

  // Get capacity percentage
  const getCapacityPercentage = (current: number, total: number) => {
    return Math.round((current / total) * 100);
  };

  // BusCard component for FlatList
  const BusCard = ({ bus, index }: { bus: any, index: number }) => {
    const route = routes.find(r => r._id === bus.routeId || r.id === bus.routeId);
    const statusColor = getStatusColor(bus.status);
    const capacityPercentage = getCapacityPercentage(bus.currentLoad || 0, bus.capacity || 1);
    
    return (
      <Animated.View
        style={[styles.busCard]}
        entering={FadeInDown.delay(index * 100)}
      >
        <LinearGradient
          colors={['#ffffff', '#f8fafc']}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.busHeader}>
            <View style={styles.busInfo}>
              <LinearGradient
                colors={[Colors.primary, '#3A6D8C']}
                style={styles.busNumber}
              >
                <Bus size={20} color="#fff" />
                {bus.busNumber || bus.number ? (
                  <Text style={styles.busNumberText}>{bus.busNumber || bus.number}</Text>
                ) : null}
              </LinearGradient>
              <View style={styles.busDetails}>
                {route?.name ? (
                  <Text style={styles.busRoute}>{route.name}</Text>
                ) : null}
                <View style={styles.driverInfo}>
                  <Users size={12} color={Colors.gray[500]} />
                  <Text style={styles.busDriver}>
                    {bus.driver ? bus.driver : (bus.driverId ? 'Assigned' : 'Unassigned')}
                  </Text>
                </View>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={styles.statusText}>{bus.status}</Text>
            </View>
          </View>

          <View style={styles.busStats}>
            <View style={styles.statItem}>
              <LinearGradient
                colors={['#E0F2FE', '#B3E5FC']}
                style={styles.statIconContainer}
              >
                <Users size={16} color={Colors.primary} />
              </LinearGradient>
              <Text style={styles.statLabel}>Capacity</Text>
              <Text style={styles.statValue}>
                {bus.currentLoad || 0}/{bus.capacity}
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${capacityPercentage}%`,
                      backgroundColor: capacityPercentage > 80 ? '#EF4444' : 
                                     capacityPercentage > 60 ? '#F59E0B' : '#10B981'
                    }
                  ]} 
                />
              </View>
            </View>

            <View style={styles.statItem}>
              <LinearGradient
                colors={['#F0FDF4', '#DCFCE7']}
                style={styles.statIconContainer}
              >
                <MapPin size={16} color={Colors.primary} />
              </LinearGradient>
              <Text style={styles.statLabel}>Location</Text>
              <Text style={styles.statValue}>
                {bus.currentLocation ? 'On Route' : 'At Depot'}
              </Text>
            </View>

            <View style={styles.statItem}>
              <LinearGradient
                colors={['#FEF3C7', '#FDE68A']}
                style={styles.statIconContainer}
              >
                <Clock size={16} color={Colors.primary} />
              </LinearGradient>
              <Text style={styles.statLabel}>ETA</Text>
              <Text style={styles.statValue}>{bus.eta || 'N/A'}</Text>
            </View>
          </View>

          {/* Route Information */}
          {route && (
            <View style={styles.routeSection}>
              <View style={styles.routeHeader}>
                <Navigation size={16} color={Colors.primary} />
                <Text style={styles.routeTitle}>Route Details</Text>
              </View>
              <View style={styles.routeInfo}>
                <Text style={styles.routeDescription}>
                  {route.description || 'No description available'}
                </Text>
                <View style={styles.routeStats}>
                  <View style={styles.routeStat}>
                    <MapPin size={12} color={Colors.gray[500]} />
                    <Text style={styles.routeStatText}>{route.stops?.length || 0} stops</Text>
                  </View>
                  <View style={styles.routeStat}>
                    <Clock size={12} color={Colors.gray[500]} />
                    <Text style={styles.routeStatText}>{route.duration || 'N/A'} min</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </LinearGradient>
      </Animated.View>
    );
  };

  return (
    <>
      <CustomHeader title="Buses" subtitle="Track and manage buses" showNotifications={false} />
      <StatusBar style="light" />
      
      {/* Stats Section */}
      <Animated.View entering={FadeInUp.delay(100)} style={styles.statsSection}>
        <View style={styles.statsContainer}>
          <LinearGradient
            colors={[Colors.primary, '#3A6D8C']}
            style={styles.statCard}
          >
            <Bus size={24} color="#fff" />
            <Text style={styles.statNumber}>{buses.length}</Text>
            <Text style={styles.statLabel}>Total Buses</Text>
          </LinearGradient>
          
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.statCard}
          >
            <Activity size={24} color="#fff" />
            <Text style={styles.statNumber}>
              {buses.filter(b => b.status === 'active').length}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </LinearGradient>
          
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            style={styles.statCard}
          >
            <Shield size={24} color="#fff" />
            <Text style={styles.statNumber}>
              {buses.filter(b => b.status === 'maintenance').length}
            </Text>
            <Text style={styles.statLabel}>Maintenance</Text>
          </LinearGradient>
        </View>
      </Animated.View>

      {/* Search Bar */}
      <Animated.View entering={FadeInUp.delay(200)} style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={Colors.gray[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search buses, routes..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor={Colors.gray[400]}
          />
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowSearch(!showSearch)}
          >
            <Filter size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Filter Tabs */}
      <Animated.View entering={FadeInUp.delay(300)} style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {filters.map((filter) => {
            const IconComponent = filter.icon;
            return (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.filterTab,
                  selectedFilter === filter.id && styles.activeFilterTab
                ]}
                onPress={() => setSelectedFilter(filter.id)}
                activeOpacity={0.7}
              >
                <IconComponent size={16} color={selectedFilter === filter.id ? '#fff' : Colors.primary} />
                <Text style={[
                  styles.filterText,
                  selectedFilter === filter.id && styles.activeFilterText
                ]}>
                  {filter.label}
                </Text>
                <View style={[
                  styles.filterBadge,
                  selectedFilter === filter.id && styles.activeFilterBadge
                ]}>
                  <Text style={[
                    styles.filterBadgeText,
                    selectedFilter === filter.id && styles.activeFilterBadgeText
                  ]}>
                    {filter.count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* Buses List */}
      <FlatList
        data={filteredBuses}
        renderItem={({ item, index }) => <BusCard bus={item} index={index} />}
        keyExtractor={(item, index) => item.id || item._id || index.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.busList}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        ListEmptyComponent={
          <Animated.View entering={FadeInUp.delay(400)} style={styles.emptyState}>
            <Bus size={64} color={Colors.gray[300]} />
            <Text style={styles.emptyStateTitle}>
              {search ? 'No buses found' : 'No buses available'}
            </Text>
            <Text style={styles.emptyStateSubtitle}>
              {search 
                ? 'Try adjusting your search terms' 
                : 'Check back later for available buses'
              }
            </Text>
          </Animated.View>
        }
      />
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

  // Search Section
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  filterButton: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: Colors.gray[100],
  },

  // Filter Section
  filterContainer: {
    paddingVertical: 16,
  },
  filterScroll: {
    paddingLeft: 24,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    gap: 8,
  },
  activeFilterTab: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  activeFilterText: {
    color: '#fff',
  },
  filterBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  activeFilterBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  activeFilterBadgeText: {
    color: '#fff',
  },

  // Bus List
  busList: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },

  // Enhanced Bus Card
  busCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  cardGradient: {
    borderRadius: 20,
    padding: 20,
  },
  busHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  busInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  busNumber: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    flexDirection: 'row',
    gap: 4,
  },
  busNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  busDetails: {
    flex: 1,
  },
  busRoute: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 6,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  busDriver: {
    fontSize: 14,
    color: '#64748b',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },

  // Enhanced Stats
  busStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 6,
    textAlign: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Route Section
  routeSection: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 16,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  routeInfo: {
    marginBottom: 8,
  },
  routeDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 8,
  },
  routeStats: {
    flexDirection: 'row',
    gap: 16,
  },
  routeStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  routeStatText: {
    fontSize: 12,
    color: '#64748b',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    width: '100%',
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.gray[600],
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: Colors.gray[500],
    textAlign: 'center',
  },
});