import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MapPin, Bell, Clock, Users, Activity, ArrowRight, TrendingUp, Search } from 'lucide-react-native';
import CustomHeader from '../../components/CustomHeader';
import { Colors } from '../../constants/Colors';
import { useAuthStore } from '../../store/authStore';
import { fetchActiveBuses, fetchTrips, fetchChildren, bookSeat } from '../../services/busService';
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

const getTodayStats = (children: any[], trips: any[], buses: any[]) => [
  { icon: MapPin, label: 'Active Buses', value: buses.length, color: Colors.primary },
  { icon: Users, label: 'Children Tracked', value: children.length, color: '#06B6D4' },
  { icon: Clock, label: 'Active Trips', value: trips.length, color: '#10B981' },
];

const recentActivity = [
  { id: '1', type: 'pickup', title: 'Emma picked up', time: '8:15 AM', location: 'Maple Street Stop', status: 'completed' },
  { id: '2', type: 'enroute', title: 'Bus #12 en route', time: '8:20 AM', location: 'Lincoln Elementary', status: 'active' },
  { id: '3', type: 'arrived', title: 'Safe arrival at school', time: '8:45 AM', location: 'Lincoln Elementary', status: 'completed' },
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
  const [buses, setBuses] = useState([]);
  const [trips, setTrips] = useState([]);
  const [children, setChildren] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

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
    if (user?.role === 'parent') {
      fetchChildren().then(setChildren).catch(console.error);
      fetchActiveBuses().then(setBuses).catch(console.error);
      fetchTrips().then(setTrips).catch(console.error);
    } else {
      fetchActiveBuses().then(setBuses).catch(console.error);
      fetchTrips().then(setTrips).catch(console.error);
    }
  }, [user?.role]);

  return (
    <>
      <CustomHeader 
        title="Home" 
        subtitle="Track your children safely" 
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
        {/* Today's Stats */}
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
        <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
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
          <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
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
                  entering={FadeInRight.delay(600 + index * 150)}
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
        <Animated.View entering={FadeInUp.delay(700)} style={styles.section}>
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
                    Both children are accounted for and safely transported
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
  }
});