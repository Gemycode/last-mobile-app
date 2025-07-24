import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, FlatList } from 'react-native';
import Animated, { useSharedValue, withSpring, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Zap, Bus, MapPin, Users, Clock, Calendar } from 'lucide-react-native';
import CustomHeader from '../../components/CustomHeader';
import Card from '../../components/Card';
import { Colors } from '../../constants/Colors';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import { fetchActiveBuses, fetchRoutes, bookSeat, fetchChildren } from '../../services/busService';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function BusesScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [buses, setBuses] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'maintenance'>('all');
  const [search, setSearch] = useState('');
  const [children, setChildren] = useState<any[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const fadeValue = useSharedValue(0);
  const pulseValue = useSharedValue(1);

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

  const filters = [
    { id: 'all', label: 'All Buses', count: buses.length },
    { id: 'active', label: 'Active', count: buses.filter(b => b.status === 'active').length },
    { id: 'maintenance', label: 'Maintenance', count: buses.filter(b => b.status === 'maintenance').length },
  ];

  const user = useAuthStore(state => state.user);
  const router = useRouter();

  useEffect(() => {
    fetchActiveBuses().then(setBuses).catch(console.error);
    fetchRoutes().then(setRoutes).catch(console.error);
    if (user?.role === 'parent') {
      fetchChildren().then(setChildren).catch(console.error);
    }
  }, [user?.role]);

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

  // BusCard component for FlatList
  const BusCard = ({ bus, index }: { bus: any, index: number }) => {
    const route = routes.find(r => r._id === bus.routeId || r.id === bus.routeId);
    return (
      <Animated.View
        style={[
          styles.busCard,
          animatedStyle,
          { transform: [{ translateY: (1 - fadeValue.value) * (index * 15 + 30) }] }
        ]}
      >
        <View style={styles.busHeader}>
          <View style={styles.busInfo}>
            <View style={[styles.busNumber, { backgroundColor: Colors.primary }]}> {/* يمكنك تخصيص اللون حسب الباص */}
              <Bus size={20} color="#fff" />
              {/* <Text style={styles.busNumberText}>{bus.busNumber || bus.number}</Text> */}
              {bus.busNumber || bus.number ? (
                <Text style={styles.busNumberText}>{bus.busNumber || bus.number}</Text>
              ) : null}
            </View>
            <View style={styles.busDetails}>
              {route?.name ? (
                <Text style={styles.busRoute}>{route.name}</Text>
              ) : null}
              <Text style={styles.busDriver}>Driver: {bus.driver ? bus.driver : (bus.driverId ? 'Assigned' : 'Unassigned')}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: Colors.primary }]}> {/* يمكنك تخصيص اللون حسب الحالة */}
            <Text style={styles.statusText}>{bus.status}</Text>
          </View>
        </View>
        <View style={styles.busStats}>
          <View style={styles.statItem}>
            <Users size={16} color={Colors.primary} />
            <Text style={styles.statLabel}>Capacity</Text>
            <Text style={[styles.statValue, { color: Colors.primary }]}>{bus.currentLoad || 0}/{bus.capacity}</Text>
          </View>
          <View style={styles.statItem}>
            <MapPin size={16} color={Colors.primary} />
            <Text style={styles.statLabel}>Location</Text>
            <Text style={styles.statValue}>{bus.currentLocation ? 'On Route' : 'At Depot'}</Text>
          </View>
          <View style={styles.statItem}>
            <Clock size={16} color={Colors.primary} />
            <Text style={styles.statLabel}>ETA</Text>
            <Text style={[styles.statValue, { color: Colors.primary }]}>{bus.eta || 'N/A'}</Text>
          </View>
        </View>
        {/* يمكنك إضافة مزيد من التفاصيل هنا */}
      </Animated.View>
    );
  };

  return (
    <>
      <CustomHeader title="Buses" />
      <StatusBar style="light" />
      
      {/* Filter Tabs */}
      <Animated.View style={[styles.filterContainer, animatedStyle]}>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
    {filters.map((filter) => (
      <TouchableOpacity
        key={filter.id}
        style={[
          styles.filterTab,
          selectedFilter === filter.id && styles.activeFilterTab
        ]}
        onPress={() => setSelectedFilter(filter.id)}
      >
        <Text style={[
          styles.filterText,
          selectedFilter === filter.id && styles.activeFilterText
        ]}>
          {filter.label ? String(filter.label) : ''}
        </Text>

        <View style={[
          styles.filterBadge,
          selectedFilter === filter.id && styles.activeFilterBadge
        ]}>
          <Text style={[
            styles.filterBadgeText,
            selectedFilter === filter.id && styles.activeFilterBadgeText
          ]}>
            {typeof filter.count === 'number' ? String(filter.count) : ''}
          </Text>
        </View>
      </TouchableOpacity>
    ))}
  </ScrollView>
</Animated.View>


      {/* Buses List */}
      <FlatList
        data={filteredBuses}
        renderItem={({ item, index }) => <BusCard bus={item} index={index} />}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.busList}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
  headerStats: {
    alignItems: 'flex-end',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  liveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
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
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activeFilterTab: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginRight: 8,
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
  busList: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  busCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  busHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  busInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  busNumber: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    flexDirection: 'row',
  },
  busNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  busDetails: {
    flex: 1,
  },
  busRoute: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
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
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  busStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 6,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  childrenSection: {
    marginBottom: 16,
  },
  childrenTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  childrenList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  childTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 6,
  },
  childName: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressSection: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 16,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  nextStop: {
    fontSize: 12,
    color: '#64748b',
  },
});