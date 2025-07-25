import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MapPin, Bell, Clock, Users } from 'lucide-react-native';
import CustomHeader from '../../components/CustomHeader';
import Card from '../../components/Card';
import { Colors } from '../../constants/Colors';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { fetchActiveBuses, fetchRoutes, fetchTrips, fetchChildren } from '../../services/busService';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { ArrowRight, Activity } from 'lucide-react-native';
import { Dimensions } from 'react-native';
const { width } = Dimensions.get('window');

// todayStats ديناميكي بناءً على البيانات الحقيقية
const getTodayStats = (children: any[], trips: any[], buses: any[]) => [
  { icon: MapPin, label: 'Active Buses', value: buses.length, color: Colors.primary },
  { icon: Users, label: 'Children Tracked', value: children.length, color: '#06B6D4' },
  { icon: Clock, label: 'Active Trips', value: trips.length, color: '#10B981' },
];
const recentActivity = [
  {
    id: '1',
    type: 'pickup',
    title: 'Emma picked up',
    time: '8:15 AM',
    location: 'Maple Street Stop',
    status: 'completed',
  },
  {
    id: '2',
    type: 'enroute',
    title: 'Bus #12 en route',
    time: '8:20 AM',
    location: 'Lincoln Elementary',
    status: 'active',
  },
  {
    id: '3',
    type: 'arrived',
    title: 'Safe arrival at school',
    time: '8:45 AM',
    location: 'Lincoln Elementary',
    status: 'completed',
  },
];
const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return Colors.primary;
    case 'completed': return '#10B981';
    case 'warning': return '#F59E0B';
    default: return '#94a3b8';
  }
};

export default function HomeScreen() {
  const user = useAuthStore(state => state.user);
  const router = useRouter();
  // const { children, buses, trips } = useAppStore();
  const [buses, setBuses] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]); // يمكنك لاحقًا جلب الرحلات من API الباك اند (fetchActiveBuses, fetchRoutes)
  const [children, setChildren] = useState<any[]>([]); // يمكنك لاحقًا جلب الأطفال من API

  const fadeValue = useSharedValue(0);
  useEffect(() => {
    fadeValue.value = withSpring(1, { damping: 15, stiffness: 100 });
  }, []);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeValue.value,
    transform: [{ translateY: (1 - fadeValue.value) * 30 }],
  }));

  useEffect(() => {
    if (user?.role === 'parent') {
      fetchChildren().then(setChildren).catch(console.error);
      fetchActiveBuses().then(setBuses).catch(console.error);
      fetchTrips().then(setTrips).catch(console.error);
    } else if (user?.role === 'driver') {
      fetchActiveBuses().then(setBuses).catch(console.error);
      fetchTrips().then(setTrips).catch(console.error);
    } else if (user?.role === 'admin') {
      fetchActiveBuses().then(setBuses).catch(console.error);
      fetchTrips().then(setTrips).catch(console.error);
    } else if (user?.role === 'student') {
      fetchActiveBuses().then(setBuses).catch(console.error);
      fetchTrips().then(setTrips).catch(console.error);
    }
  }, [user?.role]);

  const renderParentDashboard = () => (
    <ScrollView style={styles.container}>
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Welcome back, {user?.name || ''}!</Text>
        <Text style={styles.welcomeSubtext}>Track your children's bus safely</Text>
      </View>
      <View style={styles.quickStats}>
        {getTodayStats(children, trips, buses).map((stat, index) => (
          <Card key={index} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}> 
              <stat.icon size={20} color={stat.color} />
            </View>
            <Text style={[styles.statNumber, { color: stat.color }]}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </Card>
        ))}
      </View>
      {/* جدول أو قائمة الرحلات الفعلية */}
      <Card>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Today's Trips</Text>
          <Clock size={20} color={Colors.secondary} />
        </View>
        {trips.length === 0 ? (
          <Text style={styles.trackingSubtext}>No trips for today.</Text>
        ) : (
          trips.map((trip, idx) => (
            <View key={trip._id || idx} style={styles.scheduleItem}>
              <Text style={styles.scheduleTime}>{trip.startTime || '--'}</Text>
              <Text style={styles.scheduleText}>Bus {trip.busNumber || trip.busId || '--'} - {trip.routeName || trip.route || '--'}</Text>
            </View>
          ))
        )}
      </Card>
      {/* قائمة الباصات النشطة */}
      <Card>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Active Buses</Text>
          <MapPin size={20} color={Colors.success} />
        </View>
        {buses.length === 0 ? (
          <Text style={styles.trackingSubtext}>No active buses.</Text>
        ) : (
          buses.map((bus, idx) => (
            <View key={bus._id || bus.id || idx} style={styles.busItem}>
              <Text style={styles.busNumber}>Bus {bus.busNumber || bus.name || '--'}</Text>
              <Text style={styles.busStatus}>{bus.status || '--'}</Text>
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );

  const renderDriverDashboard = () => (
    <ScrollView style={styles.container}>
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Good morning, {user?.name}!</Text>
        <Text style={styles.welcomeSubtext}>Your assigned trips for today</Text>
      </View>

      {/* إحصائيات سريعة */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 16 }}>
        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>{trips.length}</Text>
          <Text style={styles.statLabel}>Trips</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>{buses.length}</Text>
          <Text style={styles.statLabel}>Active Buses</Text>
        </Card>
      </View>

      {/* الرحلة القادمة */}
      <Card>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Next Trip</Text>
          <Clock size={20} color={Colors.secondary} />
        </View>
        {trips.length === 0 ? (
          <Text style={styles.trackingSubtext}>No trips assigned.</Text>
        ) : (
          <View>
            <Text style={styles.tripInfo}>Bus: {trips[0].busNumber || trips[0].busId}</Text>
            <Text style={styles.tripDetails}>Route: {trips[0].routeName || trips[0].route}</Text>
            <Text style={styles.tripDetails}>Start: {trips[0].startTime}</Text>
            <View style={styles.tripActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Start Trip</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Confirm Arrival</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Card>

      {/* الباصات النشطة */}
      <Card>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Active Buses</Text>
          <MapPin size={20} color={Colors.success} />
        </View>
        {buses.length === 0 ? (
          <Text style={styles.trackingSubtext}>No active buses.</Text>
        ) : (
          buses.map((bus, idx) => (
            <View key={bus._id || bus.id || idx} style={styles.busItem}>
              <Text style={styles.busNumber}>Bus {bus.busNumber || bus.name || '--'}</Text>
              <Text style={styles.busStatus}>{bus.status || '--'}</Text>
            </View>
          ))
        )}
      </Card>

      {/* آخر التنبيهات */}
      <Card>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Recent Alerts</Text>
          <Bell size={20} color={Colors.warning} />
        </View>
        {/* يمكنك جلب التنبيهات من API أو state */}
        <Text style={styles.trackingSubtext}>No new alerts.</Text>
      </Card>
    </ScrollView>
  );

  const renderAdminDashboard = () => (
    <ScrollView style={styles.container}>
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Admin Dashboard</Text>
        <Text style={styles.welcomeSubtext}>Monitor all fleet operations</Text>
      </View>
      {/* إحصائيات ديناميكية */}
      <View style={styles.quickStats}>
        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>{buses.length}</Text>
          <Text style={styles.statLabel}>Active Buses</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>{trips.length}</Text>
          <Text style={styles.statLabel}>Today's Trips</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>{children.length}</Text>
          <Text style={styles.statLabel}>Total Children</Text>
        </Card>
      </View>
      {/* قائمة الباصات */}
      <Card>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Fleet Status</Text>
          <View style={[styles.statusBadge, styles.successStatus]}>
            <Text style={styles.statusText}>All Good</Text>
          </View>
        </View>
        {buses.length === 0 ? (
          <Text style={styles.trackingSubtext}>No buses found.</Text>
        ) : (
          buses.map((bus, idx) => (
            <View key={bus.busId || bus.id || idx} style={styles.busItem}>
              <Text style={styles.busNumber}>Bus {bus.busNumber || bus.name || '--'}</Text>
              <Text style={styles.busStatus}>{bus.status || '--'}</Text>
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );

  const renderStudentDashboard = () => (
    <ScrollView style={styles.container}>
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Hello {user?.name}!</Text>
        <Text style={styles.welcomeSubtext}>Your bus information</Text>
      </View>
      {/* قائمة الباصات */}
      <Card>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>My Buses</Text>
          <MapPin size={20} color={Colors.success} />
        </View>
        {buses.length === 0 ? (
          <Text style={styles.trackingSubtext}>No buses assigned.</Text>
        ) : (
          buses.map((bus, idx) => (
            <View key={bus.busId || bus.id || idx} style={styles.busItem}>
              <Text style={styles.busNumber}>Bus {bus.busNumber || bus.name || '--'}</Text>
              <Text style={styles.busStatus}>{bus.status || '--'}</Text>
            </View>
          ))
        )}
      </Card>
      {/* قائمة الرحلات */}
      <Card>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>My Trips</Text>
          <Clock size={20} color={Colors.secondary} />
        </View>
        {trips.length === 0 ? (
          <Text style={styles.trackingSubtext}>No trips found.</Text>
        ) : (
          trips.map((trip, idx) => (
            <View key={trip._id || idx} style={styles.scheduleItem}>
              <Text style={styles.scheduleTime}>{trip.startTime || '--'}</Text>
              <Text style={styles.scheduleText}>Bus {trip.busNumber || trip.busId || '--'} - {trip.routeName || trip.route || '--'}</Text>
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );

  const renderDashboard = () => {
    switch (user?.role) {
      case 'parent':
        return renderParentDashboard();
      case 'driver':
        return renderDriverDashboard();
      case 'admin':
        return renderAdminDashboard();
      case 'student':
        return renderStudentDashboard();
      default:
        return <Text>Unknown role</Text>;
    }
  };

  return (
    <>
      <CustomHeader title="Home" subtitle="Track your children safely" />
      <StatusBar style="light" />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Today's Stats */}
        {(user?.role === 'parent' || user?.role === 'admin') && (
          <Animated.View style={[styles.section, animatedStyle]}>
            <Text style={styles.sectionTitle}>Today's Overview</Text>
            <View style={styles.statsGrid}>
              {getTodayStats(children, trips, buses).map((stat, index) => (
                <View key={index} style={styles.statCard}>
                  <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}> 
                    <stat.icon size={20} color={stat.color} />
                  </View>
                  <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Quick Actions */}
        <Animated.View style={[styles.section, animatedStyle]}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/tracking')}
            >
              <LinearGradient colors={[Colors.primary, '#3A6D8C']} style={styles.actionGradient}>
                <MapPin size={24} color="#fff" />
                <Text style={styles.actionTitle}>Live Tracking</Text>
                <Text style={styles.actionSubtitle}>View real-time location</Text>
                <ArrowRight size={16} color="#fff" style={styles.actionArrow} />
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/scanner')}
            >
              <LinearGradient colors={['#06B6D4', '#0891B2']} style={styles.actionGradient}>
                <Activity size={24} color="#fff" />
                <Text style={styles.actionTitle}>QR Scanner</Text>
                <Text style={styles.actionSubtitle}>Scan bus QR codes</Text>
                <ArrowRight size={16} color="#fff" style={styles.actionArrow} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Recent Activity */}
        {(user?.role === 'parent' || user?.role === 'admin') && (
          <Animated.View style={[styles.section, animatedStyle]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.activityList}>
              {recentActivity.map((activity, index) => (
                <View key={activity.id} style={styles.activityItem}>
                  <View style={[styles.activityDot, { backgroundColor: getStatusColor(activity.status) }]} />
                  <View style={styles.activityContent}>
                    <View style={styles.activityHeader}>
                      <Text style={styles.activityTitle}>{activity.title}</Text>
                      <Text style={styles.activityTime}>{activity.time}</Text>
                    </View>
                    <Text style={styles.activityLocation}>{activity.location}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Safety Status */}
        <Animated.View style={[styles.section, animatedStyle]}>
          <View style={styles.safetyCard}>
            <LinearGradient colors={['#10B981', '#059669']} style={styles.safetyGradient}>
              <View style={styles.safetyContent}>
                <View style={styles.safetyIcon}>
                  <Users size={24} color="#fff" />
                </View>
                <View style={styles.safetyText}>
                  <Text style={styles.safetyTitle}>All Children Safe</Text>
                  <Text style={styles.safetySubtitle}>
                    Both children are accounted for and safely transported
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </Animated.View>
      </ScrollView>
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
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#e2e8f0',
    marginTop: 4,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  welcomeSection: {
    marginTop: 32,
    marginBottom: 24,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 8,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  scheduleTime: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: 'bold',
    marginRight: 8,
  },
  scheduleText: {
    fontSize: 14,
    color: '#64748b',
  },
  trackingText: {
    fontSize: 15,
    color: Colors.primary,
    marginTop: 8,
  },
  trackingSubtext: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 8,
  },
  trackButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  trackButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  section: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionGradient: {
    padding: 20,
    position: 'relative',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  actionArrow: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  activityList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  activityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  activityTime: {
    fontSize: 12,
    color: '#94a3b8',
  },
  activityLocation: {
    fontSize: 14,
    color: '#64748b',
  },
  safetyCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 32,
  },
  safetyGradient: {
    padding: 24,
  },
  safetyContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  safetyIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  safetyText: {
    flex: 1,
  },
  safetyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  safetySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  activeStatus: {
    backgroundColor: Colors.primary,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  tripInfo: {
    fontSize: 15,
    color: Colors.primary,
    marginTop: 8,
  },
  tripDetails: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 8,
  },
  tripActions: {
    flexDirection: 'row',
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginRight: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  studentCount: {
    fontSize: 15,
    color: Colors.primary,
    marginTop: 8,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    marginTop: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  successStatus: {
    backgroundColor: '#10B981',
  },
  busItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  busNumber: {
    fontWeight: 'bold',
    color: Colors.primary,
    fontSize: 15,
  },
  busStatus: {
    color: '#64748b',
    fontSize: 14,
  },
  busInfo: {
    fontSize: 15,
    color: Colors.primary,
    marginTop: 8,
  },
  busDetails: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 8,
  },
});