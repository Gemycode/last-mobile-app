import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Colors } from '../../constants/Colors';
import { useAuthStore } from '../../store/authStore';
import { fetchRoutes, fetchTrips, fetchActiveBuses, fetchChildren, bookSeat } from '../../services/busService';
import CustomHeader from '../../components/CustomHeader';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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

  // جلب الراوتات عند التحميل
  useEffect(() => {
    setLoading(true);
    fetchRoutes().then(data => {
      setRoutes(data);
    }).catch(() => {
      Alert.alert('خطأ', 'تعذر تحميل المسارات');
    }).finally(() => setLoading(false));
    if (isParent) {
      fetchChildren().then(data => setChildren(data));
    }
  }, []);

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

  // UI لكل خطوة
  const renderStep = () => {
    if (step === 1) {
      return (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>اختر المسار</Text>
          <Picker
            selectedValue={selectedRoute}
            onValueChange={value => { setSelectedRoute(value); setSelectedTrip(null); setStep(2); }}
            style={styles.picker}
          >
            <Picker.Item label="اختر المسار" value={null} />
            {routes.map(route => (
              <Picker.Item key={route._id || route.id} label={route.name} value={route._id || route.id} />
            ))}
          </Picker>
        </View>
      );
    }
    if (step === 2) {
      return (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>اختر الرحلة القادمة</Text>
          <Picker
            selectedValue={selectedTrip}
            onValueChange={value => { setSelectedTrip(value); setStep(3); }}
            style={styles.picker}
          >
            <Picker.Item label="اختر الرحلة" value={null} />
            {trips.map(trip => (
              <Picker.Item key={trip._id || trip.id} label={trip.date?.slice(0, 10) + ' | ' + (trip.busId?.BusNumber || trip.busId)} value={trip._id || trip.id} />
            ))}
          </Picker>
          <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
            <MaterialCommunityIcons name="arrow-right" size={20} color={Colors.primary} />
            <Text style={styles.backButtonText}>رجوع</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (step === 3) {
      return (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>اختر محطة الركوب</Text>
          <Picker
            selectedValue={selectedPickup}
            onValueChange={value => setSelectedPickup(value)}
            style={styles.picker}
          >
            <Picker.Item label="اختر المحطة" value={null} />
            {pickupStops.map(stop => (
              <Picker.Item key={stop._id || stop.id} label={stop.name} value={stop._id || stop.id} />
            ))}
          </Picker>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity style={styles.backButton} onPress={() => setStep(2)}>
              <MaterialCommunityIcons name="arrow-right" size={20} color={Colors.primary} />
              <Text style={styles.backButtonText}>رجوع</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={handleBooking}>
              <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
              <Text style={styles.confirmButtonText}>تأكيد الحجز</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    if (step === 4 && bookingResult) {
      return (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>تم الحجز بنجاح!</Text>
          <View style={styles.invoiceBox}>
            <Text style={styles.invoiceTitle}>فاتورة الحجز</Text>
            <Text style={styles.invoiceText}>اسم الطالب: {isParent ? (children.find(c => c.id === selectedChild)?.name || selectedChild) : user?.name}</Text>
            <Text style={styles.invoiceText}>المسار: {routes.find(r => r._id === selectedRoute || r.id === selectedRoute)?.name}</Text>
            <Text style={styles.invoiceText}>تاريخ الرحلة: {bookingResult.date?.slice(0, 10)}</Text>
            <Text style={styles.invoiceText}>محطة الركوب: {pickupStops.find(s => s._id === selectedPickup || s.id === selectedPickup)?.name}</Text>
            <Text style={styles.invoiceText}>رقم الباص: {bookingResult.busId?.BusNumber || bookingResult.busId}</Text>
            <Text style={styles.invoiceText}>الحالة: {bookingResult.status}</Text>
          </View>
          <TouchableOpacity style={styles.confirmButton} onPress={() => { setStep(1); setBookingResult(null); setSelectedRoute(null); setSelectedTrip(null); setSelectedPickup(null); }}>
            <MaterialCommunityIcons name="refresh" size={20} color="#fff" />
            <Text style={styles.confirmButtonText}>حجز جديد</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  };

  return (
    <>
      <CustomHeader title="حجز رحلة جديدة" />
      <ScrollView contentContainerStyle={styles.container}>
        {loading && <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 20 }} />}
        {renderStep()}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f8fafc',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  picker: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginTop: 8,
  },
  backButtonText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  invoiceBox: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  invoiceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  invoiceText: {
    fontSize: 15,
    color: '#334155',
    marginBottom: 4,
    textAlign: 'right',
  },
}); 