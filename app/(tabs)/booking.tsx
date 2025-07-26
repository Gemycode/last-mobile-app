import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Dimensions, RefreshControl } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import { useAuthStore } from '../../store/authStore';
import { fetchRoutes, fetchTrips, fetchActiveBuses, fetchChildren, bookSeat } from '../../services/busService';
import CustomHeader from '../../components/CustomHeader';
import Card from '../../components/Card';
import Animated, { 
  useSharedValue, 
  withSpring, 
  useAnimatedStyle,
  FadeInDown,
  FadeInUp,
  FadeInRight,
  SlideInRight,
  withRepeat,
  withTiming,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { 
  Bus, 
  Calendar, 
  MapPin, 
  Users, 
  CheckCircle, 
  ArrowRight, 
  RefreshCw, 
  Clock, 
  CreditCard,
  Shield,
  TrendingUp,
  Zap
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function BookingScreen() {
  const user = useAuthStore(state => state.user);
  const isParent = user?.role === 'parent';
  const isStudent = user?.role === 'student';

  // تشخيص دور المستخدم
  console.log('Current user:', user);
  console.log('User role:', user?.role);
  console.log('Is student:', isStudent);
  console.log('Is parent:', isParent);

  // الخطوة الحالية
  const [step, setStep] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  // بيانات الخطوات
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [trips, setTrips] = useState<any[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [pickupStops, setPickupStops] = useState<any[]>([]);
  const [selectedPickup, setSelectedPickup] = useState<string | null>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);

  // Animations
  const fadeValue = useSharedValue(0);
  const scaleValue = useSharedValue(0.8);
  const pulseValue = useSharedValue(1);

  useEffect(() => {
    fadeValue.value = withSpring(1, { damping: 15, stiffness: 100 });
    scaleValue.value = withSpring(1, { damping: 15, stiffness: 100 });
    pulseValue.value = withRepeat(
      withTiming(1.05, { duration: 2000 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeValue.value,
    transform: [
      { translateY: interpolate(fadeValue.value, [0, 1], [30, 0], Extrapolate.CLAMP) },
      { scale: scaleValue.value }
    ],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
  }));

  // جلب الراوتات عند التحميل
  const loadData = async () => {
    setLoading(true);
    try {
      const routesData = await fetchRoutes();
      setRoutes(routesData);
      
      if (isParent) {
        const childrenData = await fetchChildren();
        setChildren(childrenData);
      }
    } catch (error) {
      Alert.alert('خطأ', 'تعذر تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // جلب الرحلات عند اختيار الراوت
  useEffect(() => {
    if (!selectedRoute) return;
    setLoading(true);
    fetchTrips().then(data => {
      // فلترة الرحلات حسب الراوت المختار
      setTrips(data.filter((trip: any) => (trip.routeId === selectedRoute || trip.routeId?._id === selectedRoute) && new Date(trip.date) > new Date()));
    }).catch(() => {
      Alert.alert('خطأ', 'تعذر تحميل الرحلات');
    }).finally(() => setLoading(false));
  }, [selectedRoute]);

  // جلب محطات الركوب عند اختيار الرحلة
  useEffect(() => {
    if (!selectedTrip) return;
    const trip = trips.find((t: any) => t._id === selectedTrip);
    if (trip && trip.routeId && trip.routeId.stops) {
      setPickupStops(trip.routeId.stops);
    } else if (trip && trip.stops) {
      setPickupStops(trip.stops);
    } else {
      setPickupStops([]);
    }
  }, [selectedTrip, trips]);

  // تنفيذ الحجز
  const handleBooking = async () => {
    if (!selectedRoute || !selectedTrip || !selectedPickup) {
      Alert.alert('خطأ', 'يرجى اختيار جميع البيانات');
      return;
    }
    setLoading(true);
    try {
      const trip = trips.find((t: any) => t._id === selectedTrip);
      const pickup = pickupStops.find((s: any) => s._id === selectedPickup || s.id === selectedPickup);
      const bookingPayload: any = {
        studentId: isParent ? selectedChild : user?.id,
        tripId: selectedTrip,
        routeId: selectedRoute,
        busId: trip?.busId,
        date: trip?.date,
        pickupLocation: pickup,
        dropoffLocation: pickup, // يمكن تعديلها لاحقًا
      };
      
      // تشخيص البيانات المرسلة
      console.log('Booking payload:', bookingPayload);
      console.log('User role:', user?.role);
      console.log('Is parent:', isParent);
      console.log('Is student:', isStudent);
      
      const result = await bookSeat(bookingPayload);
      console.log('Booking result:', result);
      setBookingResult(result);
      setStep(4);
    } catch (e: any) {
      console.error('Booking error:', e);
      console.error('Error response:', e?.response?.data);
      Alert.alert('خطأ', e?.response?.data?.message || 'تعذر إتمام الحجز');
    } finally {
      setLoading(false);
    }
  };

  const resetBooking = () => {
    setStep(1);
    setBookingResult(null);
    setSelectedRoute(null);
    setSelectedTrip(null);
    setSelectedPickup(null);
    setSelectedChild(null);
  };

  // UI لكل خطوة
  const renderStep = () => {
    if (step === 1) {
      return (
        <Animated.View 
          style={[styles.stepContainer, animatedStyle]}
          entering={FadeInDown.delay(200)}
        >
          <LinearGradient
            colors={['#ffffff', '#f8fafc']}
            style={styles.stepGradient}
          >
            <View style={styles.stepHeader}>
              <View style={styles.stepIconContainer}>
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  style={styles.stepIconGradient}
                >
                  <Bus size={24} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={styles.stepTitle}>اختر المسار</Text>
              <Text style={styles.stepSubtitle}>حدد المسار الذي تريد السفر عليه</Text>
            </View>

            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedRoute}
                onValueChange={value => { 
                  setSelectedRoute(value); 
                  setSelectedTrip(null); 
                  setStep(2); 
                }}
                style={styles.picker}
              >
                <Picker.Item label="اختر المسار" value={null} />
                {routes.map(route => (
                  <Picker.Item 
                    key={route._id || route.id} 
                    label={route.name} 
                    value={route._id || route.id} 
                  />
                ))}
              </Picker>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.statGradient}
                >
                  <Bus size={20} color="#fff" />
                  <Text style={styles.statNumber}>{routes.length}</Text>
                  <Text style={styles.statLabel}>المسارات المتاحة</Text>
                </LinearGradient>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      );
    }

    if (step === 2) {
      return (
        <Animated.View 
          style={[styles.stepContainer, animatedStyle]}
          entering={FadeInRight.delay(200)}
        >
          <LinearGradient
            colors={['#ffffff', '#f8fafc']}
            style={styles.stepGradient}
          >
            <View style={styles.stepHeader}>
              <View style={styles.stepIconContainer}>
                <LinearGradient
                  colors={['#F59E0B', '#D97706']}
                  style={styles.stepIconGradient}
                >
                  <Calendar size={24} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={styles.stepTitle}>اختر الرحلة</Text>
              <Text style={styles.stepSubtitle}>حدد التاريخ والوقت المناسب</Text>
            </View>

            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedTrip}
                onValueChange={value => { 
                  setSelectedTrip(value); 
                  setStep(3); 
                }}
                style={styles.picker}
              >
                <Picker.Item label="اختر الرحلة" value={null} />
                {trips.map(trip => (
                  <Picker.Item 
                    key={trip._id || trip.id} 
                    label={`${trip.date?.slice(0, 10)} | ${trip.busId?.BusNumber || trip.busId}`} 
                    value={trip._id || trip.id} 
                  />
                ))}
              </Picker>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => setStep(1)}
              >
                <LinearGradient
                  colors={['#f1f5f9', '#e2e8f0']}
                  style={styles.backButtonGradient}
                >
                  <ArrowRight size={20} color={Colors.primary} />
                  <Text style={styles.backButtonText}>رجوع</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      );
    }

    if (step === 3) {
      return (
        <Animated.View 
          style={[styles.stepContainer, animatedStyle]}
          entering={FadeInRight.delay(200)}
        >
          <LinearGradient
            colors={['#ffffff', '#f8fafc']}
            style={styles.stepGradient}
          >
            <View style={styles.stepHeader}>
              <View style={styles.stepIconContainer}>
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED']}
                  style={styles.stepIconGradient}
                >
                  <MapPin size={24} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={styles.stepTitle}>اختر محطة الركوب</Text>
              <Text style={styles.stepSubtitle}>حدد المكان الذي ستنتظره فيه</Text>
            </View>

            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedPickup}
                onValueChange={value => setSelectedPickup(value)}
                style={styles.picker}
              >
                <Picker.Item label="اختر المحطة" value={null} />
                {pickupStops.map(stop => (
                  <Picker.Item 
                    key={stop._id || stop.id} 
                    label={stop.name} 
                    value={stop._id || stop.id} 
                  />
                ))}
              </Picker>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => setStep(2)}
              >
                <LinearGradient
                  colors={['#f1f5f9', '#e2e8f0']}
                  style={styles.backButtonGradient}
                >
                  <ArrowRight size={20} color={Colors.primary} />
                  <Text style={styles.backButtonText}>رجوع</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.confirmButton} 
                onPress={handleBooking}
                disabled={loading}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  style={styles.confirmButtonGradient}
                >
                  <CheckCircle size={20} color="#fff" />
                  <Text style={styles.confirmButtonText}>
                    {loading ? 'جاري الحجز...' : 'تأكيد الحجز'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      );
    }

    if (step === 4 && bookingResult) {
      return (
        <Animated.View 
          style={[styles.stepContainer, animatedStyle]}
          entering={FadeInUp.delay(200)}
        >
          <LinearGradient
            colors={['#ffffff', '#f8fafc']}
            style={styles.stepGradient}
          >
            <View style={styles.successHeader}>
              <Animated.View style={[styles.successIcon, pulseStyle]}>
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.successIconGradient}
                >
                  <CheckCircle size={48} color="#fff" />
                </LinearGradient>
              </Animated.View>
              <Text style={styles.successTitle}>تم الحجز بنجاح!</Text>
              <Text style={styles.successSubtitle}>سيتم إرسال تفاصيل الحجز عبر الإشعارات</Text>
            </View>

            <Card variant="gradient" gradientColors={['#f1f5f9', '#e2e8f0']}>
              <View style={styles.invoiceHeader}>
                <CreditCard size={20} color={Colors.primary} />
                <Text style={styles.invoiceTitle}>فاتورة الحجز</Text>
              </View>
              
              <View style={styles.invoiceDetails}>
                <View style={styles.invoiceRow}>
                  <Users size={16} color="#64748b" />
                  <Text style={styles.invoiceLabel}>اسم الطالب:</Text>
                  <Text style={styles.invoiceValue}>
                    {isParent ? (children.find(c => c.id === selectedChild)?.name || selectedChild) : user?.name}
                  </Text>
                </View>
                
                <View style={styles.invoiceRow}>
                  <Bus size={16} color="#64748b" />
                  <Text style={styles.invoiceLabel}>المسار:</Text>
                  <Text style={styles.invoiceValue}>
                    {routes.find(r => r._id === selectedRoute || r.id === selectedRoute)?.name}
                  </Text>
                </View>
                
                <View style={styles.invoiceRow}>
                  <Calendar size={16} color="#64748b" />
                  <Text style={styles.invoiceLabel}>تاريخ الرحلة:</Text>
                  <Text style={styles.invoiceValue}>
                    {bookingResult.date?.slice(0, 10)}
                  </Text>
                </View>
                
                <View style={styles.invoiceRow}>
                  <MapPin size={16} color="#64748b" />
                  <Text style={styles.invoiceLabel}>محطة الركوب:</Text>
                  <Text style={styles.invoiceValue}>
                    {pickupStops.find(s => s._id === selectedPickup || s.id === selectedPickup)?.name}
                  </Text>
                </View>
                
                <View style={styles.invoiceRow}>
                  <Bus size={16} color="#64748b" />
                  <Text style={styles.invoiceLabel}>رقم الباص:</Text>
                  <Text style={styles.invoiceValue}>
                    {bookingResult.busId?.BusNumber || bookingResult.busId}
                  </Text>
                </View>
                
                <View style={styles.invoiceRow}>
                  <Shield size={16} color="#64748b" />
                  <Text style={styles.invoiceLabel}>الحالة:</Text>
                  <Text style={[styles.invoiceValue, { color: '#10B981', fontWeight: 'bold' }]}>
                    {bookingResult.status}
                  </Text>
                </View>
              </View>
            </Card>

            <TouchableOpacity 
              style={styles.newBookingButton} 
              onPress={resetBooking}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                style={styles.newBookingButtonGradient}
              >
                <RefreshCw size={20} color="#fff" />
                <Text style={styles.newBookingButtonText}>حجز جديد</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      );
    }

    return null;
  };

  return (
    <>
      <CustomHeader 
        title="Book New Trip" 
        subtitle="Book a trip for your child easily"
        showNotifications={false}
      />
      <ScrollView 
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>جاري التحميل...</Text>
          </View>
        )}
        {renderStep()}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  stepContainer: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  stepGradient: {
    padding: 24,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  stepIconContainer: {
    marginBottom: 16,
  },
  stepIconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
  pickerContainer: {
    marginBottom: 24,
  },
  picker: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  statCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  statGradient: {
    padding: 20,
    alignItems: 'center',
    minWidth: 120,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  backButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  backButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  backButtonText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  confirmButton: {
    flex: 2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  confirmButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successIcon: {
    marginBottom: 16,
  },
  successIconGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
  invoiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  invoiceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    marginLeft: 12,
  },
  invoiceDetails: {
    gap: 16,
  },
  invoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  invoiceLabel: {
    fontSize: 16,
    color: '#64748b',
    marginLeft: 12,
    marginRight: 8,
    minWidth: 80,
  },
  invoiceValue: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
    flex: 1,
    textAlign: 'left',
  },
  newBookingButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 16,
  },
  newBookingButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  newBookingButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 8,
  },
}); 