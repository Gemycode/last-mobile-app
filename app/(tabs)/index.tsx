import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MapPin, Bell, Clock, Users, Activity, ArrowRight } from 'lucide-react-native';
import CustomHeader from '../../components/CustomHeader';
import { Colors } from '../../constants/Colors';
import { useAuthStore } from '../../store/authStore';
import { fetchActiveBuses, fetchTrips, fetchChildren, bookSeat } from '../../services/busService';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';

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
    } else {
      fetchActiveBuses().then(setBuses).catch(console.error);
      fetchTrips().then(setTrips).catch(console.error);
    }
  }, [user?.role]);

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

        {/* احجز رحلة لطفلك - تظهر فقط للparent */}
        {user?.role === 'parent' && (
          <View style={{ marginTop: 18, marginBottom: 18 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: Colors.primary, marginBottom: 10, marginLeft: 4 }}>
              <Activity size={20} color={Colors.primary} />  احجز رحلة لطفلك
            </Text>
            {children.length === 0 ? (
              <Text style={{ color: '#64748b', fontSize: 15, marginBottom: 10 }}>لا يوجد أطفال مسجلين.</Text>
            ) : trips.length === 0 ? (
              <Text style={{ color: '#64748b', fontSize: 15, marginBottom: 10 }}>لا توجد رحلات متاحة للحجز حالياً.</Text>
            ) : (
              trips.map((trip: any, idx: number) => (
                <View key={trip._id || idx} style={{
                  backgroundColor: '#fff',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 14,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                  elevation: 2,
                  borderWidth: 1,
                  borderColor: '#f1f5f9',
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <Activity size={18} color={Colors.primary} style={{ marginRight: 6 }} />
                    <Text style={{ fontWeight: 'bold', color: Colors.primary, fontSize: 16 }}>{String(trip.routeName || trip.route || '--')}</Text>
                  </View>
                  <Text style={{ color: '#64748b', fontSize: 13, marginBottom: 2 }}>الباص: {String(trip.busNumber || trip.busId || '--')}</Text>
                  <Text style={{ color: '#64748b', fontSize: 13, marginBottom: 8 }}>الوقت: {String(trip.startTime || '--')}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {children.map((child: any) => (
                      <TouchableOpacity
                        key={String(child._id)}
                        style={{
                          backgroundColor: '#10B981',
                          borderRadius: 16,
                          paddingVertical: 6,
                          paddingHorizontal: 14,
                          marginRight: 8,
                          marginBottom: 6,
                          flexDirection: 'row',
                          alignItems: 'center',
                          shadowColor: '#10B981',
                          shadowOpacity: 0.12,
                          shadowRadius: 2,
                          elevation: 2,
                        }}
                        onPress={async () => {
                          console.log('Booking for studentId:', child._id, 'tripId:', trip._id);
                          try {
                            await bookSeat({ studentId: child._id, tripId: trip._id });
                            alert(`تم حجز الرحلة بنجاح للطفل ${String(child.firstName)}`);
                          } catch (e: any) {
                            alert(e?.response?.data?.message || e?.message || 'حدث خطأ أثناء الحجز');
                          }
                        }}
                      >
                        <Users size={14} color="#fff" style={{ marginLeft: 4 }} />
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>احجز لـ {String(child.firstName)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))
            )}
          </View>
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
  content: { flex: 1, paddingHorizontal: 24, backgroundColor: '#f8fafc' },
  section: { marginTop: 32 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#1e293b', marginBottom: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { flex: 1, backgroundColor: '#fff', padding: 20, borderRadius: 16, alignItems: 'center', marginHorizontal: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  statIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statValue: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#64748b', textAlign: 'center' },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between' },
  actionCard: { flex: 1, marginHorizontal: 4, borderRadius: 16, overflow: 'hidden' },
  actionGradient: { padding: 20, position: 'relative' },
  actionTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginTop: 12, marginBottom: 4 },
  actionSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  actionArrow: { position: 'absolute', top: 20, right: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  viewAllText: { fontSize: 14, color: '#4F46E5', fontWeight: '600' },
  activityList: { backgroundColor: '#fff', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  activityItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  activityDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4, marginRight: 16 },
  activityContent: { flex: 1 },
  activityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  activityTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  activityTime: { fontSize: 12, color: '#94a3b8' },
  activityLocation: { fontSize: 14, color: '#64748b' },
  safetyCard: { borderRadius: 16, overflow: 'hidden', marginBottom: 32 },
  safetyGradient: { padding: 24 },
  safetyContent: { flexDirection: 'row', alignItems: 'center' },
  safetyIcon: { width: 50, height: 50, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  safetyText: { flex: 1 },
  safetyTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  safetySubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 20 },
});