import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MapPin, Bell, Clock, Users, Activity, ArrowRight, Calendar, Navigation, Bus } from 'lucide-react-native';
import CustomHeader from '../../components/CustomHeader';
import { Colors } from '../../constants/Colors';
import { useAuthStore } from '../../store/authStore';
import { fetchActiveBuses, fetchTrips, fetchChildren, bookSeat, fetchDriverTodayTrips, startTripTracking } from '../../services/busService';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const getTodayStats = (children: any[], trips: any[], buses: any[]) => [
  { icon: MapPin, label: 'Active Buses', value: buses.length, color: Colors.primary },
  { icon: Users, label: 'Children Tracked', value: children.length, color: '#06B6D4' },
  { icon: Clock, label: 'Active Trips', value: trips.length, color: '#10B981' },
];

const getDriverStats = (trips: any[], buses: any[]) => [
  { icon: Calendar, label: 'رحلات اليوم', value: trips.length, color: Colors.primary },
  { icon: Bus, label: 'الباصات المخصصة', value: buses.length, color: '#06B6D4' },
  { icon: Navigation, label: 'رحلات نشطة', value: trips.filter(t => t.status === 'started').length, color: '#10B981' },
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

export default function HomeScreen() {
  const user = useAuthStore(state => state.user);
  const router = useRouter();
  const [buses, setBuses] = useState([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [isTracking, setIsTracking] = useState(false);

  const fadeValue = useSharedValue(0);
  useEffect(() => {
    fadeValue.value = withSpring(1, { damping: 15, stiffness: 100 });
  }, []);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeValue.value,
    transform: [{ translateY: (1 - fadeValue.value) * 30 }],
  }));

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (user?.role === 'parent') {
          const [childrenData, busesData, tripsData] = await Promise.all([
            fetchChildren(),
            fetchActiveBuses(),
            fetchTrips()
          ]);
          setChildren(childrenData);
          setBuses(busesData);
          setTrips(tripsData);
        } else if (user?.role === 'driver') {
          const [busesData, tripsData] = await Promise.all([
            fetchActiveBuses(),
            fetchDriverTodayTrips(user.id)
          ]);
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
      Alert.alert('تم بدء التتبع', 'تم بدء تتبع الرحلة بنجاح');
      setSelectedTrip(trip);
      setIsTracking(true);
      // تحديث قائمة الرحلات
      const updatedTrips = trips.map(t => 
        t._id === trip._id ? { ...t, status: 'started' } : t
      );
      setTrips(updatedTrips);
    } catch (error) {
      console.error('Error starting trip tracking:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء بدء التتبع');
    }
  };

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
            <Clock size={16} color="#64748b" />
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
              <Navigation size={16} color="#64748b" />
              <Text style={styles.tripDetailText}>
                المدة المتوقعة: {trip.routeId.estimated_time} دقيقة
              </Text>
            </View>
          )}
        </View>

        <View style={styles.tripCardActions}>
          {trip.status === 'scheduled' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: Colors.primary }]}
              onPress={() => startTracking(trip)}
            >
              <Navigation size={16} color="#fff" />
              <Text style={styles.actionButtonText}>بدء التتبع</Text>
            </TouchableOpacity>
          )}
          
          {trip.status === 'started' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#10B981' }]}
              onPress={() => router.push('/tracking')}
            >
              <MapPin size={16} color="#fff" />
              <Text style={styles.actionButtonText}>عرض التتبع</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#6B7280' }]}
            onPress={() => router.push('/chat')}
          >
            <MaterialCommunityIcons name="chat" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>المحادثة</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  if (loading) {
    return (
      <>
        <CustomHeader title="الرئيسية" subtitle="مرحباً بك في نظام تتبع الباصات" />
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>جاري تحميل البيانات...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <CustomHeader title="الرئيسية" subtitle="مرحباً بك في نظام تتبع الباصات" />
      <StatusBar style="light" />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Today's Stats */}
        {user?.role === 'driver' ? (
          <Animated.View style={[styles.section, animatedStyle]}>
            <Text style={styles.sectionTitle}>إحصائيات اليوم</Text>
            <View style={styles.statsGrid}>
              {getDriverStats(trips, buses).map((stat, index) => (
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
        ) : (
          (user?.role === 'parent' || user?.role === 'admin') && (
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
          )
        )}

        {/* Driver Trips Section */}
        {user?.role === 'driver' && (
          <Animated.View style={[styles.section, animatedStyle]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>رحلات اليوم</Text>
              <Text style={styles.tripCount}>{trips.length} رحلة</Text>
            </View>
            
            {trips.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="bus-clock" size={80} color="#CBD5E1" />
                <Text style={styles.emptyStateTitle}>لا توجد رحلات اليوم</Text>
                <Text style={styles.emptyStateSubtitle}>
                  لا توجد رحلات مخصصة لك اليوم. تحقق من الجدول الأسبوعي.
                </Text>
              </View>
            ) : (
              <FlatList
                data={trips}
                renderItem={renderDriverTripCard}
                keyExtractor={(item) => item._id || item.id}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.tripsList}
              />
            )}
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
          <Text style={styles.sectionTitle}>إجراءات سريعة</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/tracking')}
            >
              <LinearGradient colors={[Colors.primary, '#3A6D8C']} style={styles.actionGradient}>
                <MapPin size={24} color="#fff" />
                <Text style={styles.actionTitle}>التتبع المباشر</Text>
                <Text style={styles.actionSubtitle}>عرض الموقع المباشر</Text>
                <ArrowRight size={16} color="#fff" style={styles.actionArrow} />
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/scanner')}
            >
              <LinearGradient colors={['#06B6D4', '#0891B2']} style={styles.actionGradient}>
                <Activity size={24} color="#fff" />
                <Text style={styles.actionTitle}>ماسح QR</Text>
                <Text style={styles.actionSubtitle}>مسح رموز الباص</Text>
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
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  tripCount: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
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
  safetySubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#64748b' },
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
  emptyState: { alignItems: 'center', paddingVertical: 40, backgroundColor: '#fff', borderRadius: 16, marginTop: 16 },
  emptyStateTitle: { fontSize: 18, fontWeight: 'bold', color: '#64748b', marginTop: 16, marginBottom: 8 },
  emptyStateSubtitle: { fontSize: 14, color: '#94a3b8', textAlign: 'center', paddingHorizontal: 32 },
});