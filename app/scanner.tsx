import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, Dimensions, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { QrCode, User, CircleCheck as CheckCircle, Circle as XCircle, Camera, RotateCcw, Clock, MapPin, Bus, AlertCircle, CheckCircle2, Users, Activity, Zap, TrendingUp } from 'lucide-react-native';
import CustomHeader from '../components/CustomHeader';
import Card from '../components/Card';
import { Colors } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
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

const { width, height } = Dimensions.get('window');

// Enhanced mock student data
const MOCK_STUDENTS = {
  'student_001': { 
    name: 'أحمد محمد', 
    grade: 'الصف الخامس',
    busId: 'bus_001',
    parentPhone: '01123456789',
    emergencyContact: '01234567890'
  },
  'student_002': { 
    name: 'فاطمة علي', 
    grade: 'الصف الرابع',
    busId: 'bus_001',
    parentPhone: '01123456788',
    emergencyContact: '01234567891'
  },
  'student_003': { 
    name: 'محمد أحمد', 
    grade: 'الصف السادس',
    busId: 'bus_002',
    parentPhone: '01123456787',
    emergencyContact: '01234567892'
  },
  'student_004': { 
    name: 'عائشة حسن', 
    grade: 'الصف الثالث',
    busId: 'bus_002',
    parentPhone: '01123456786',
    emergencyContact: '01234567893'
  },
  'student_005': { 
    name: 'يوسف محمود', 
    grade: 'الصف الخامس',
    busId: 'bus_001',
    parentPhone: '01123456785',
    emergencyContact: '01234567894'
  }
};

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [scannedStudents, setScannedStudents] = useState<Array<{
    id: string;
    name: string;
    grade: string;
    scannedAt: string;
    status: 'present' | 'absent' | 'late';
    busId: string;
  }>>([]);
  const [scanStats, setScanStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    late: 0
  });

  // Enhanced animations
  const fadeValue = useSharedValue(0);
  const scaleValue = useSharedValue(0.8);
  const pulseValue = useSharedValue(1);
  const scanValue = useSharedValue(0);

  useEffect(() => {
    fadeValue.value = withSpring(1, { damping: 15, stiffness: 100 });
    scaleValue.value = withSpring(1, { damping: 15, stiffness: 100 });
    pulseValue.value = withRepeat(
      withTiming(1.05, { duration: 2000 }),
      -1,
      true
    );
    scanValue.value = withRepeat(
      withTiming(1, { duration: 1500 }),
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

  const scanStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scanValue.value, [0, 0.5, 1], [0.3, 1, 0.3], Extrapolate.CLAMP),
  }));

  // Update stats when scanned students change
  useEffect(() => {
    const present = scannedStudents.filter(s => s.status === 'present').length;
    const absent = scannedStudents.filter(s => s.status === 'absent').length;
    const late = scannedStudents.filter(s => s.status === 'late').length;
    
    setScanStats({
      total: Object.keys(MOCK_STUDENTS).length,
      present,
      absent,
      late
    });
  }, [scannedStudents]);

  const handleBarCodeScanned = ({ data }: BarcodeScanningResult) => {
    setScanning(false);
    
    // Check if it's a valid student QR code
    if (MOCK_STUDENTS[data as keyof typeof MOCK_STUDENTS]) {
      const student = MOCK_STUDENTS[data as keyof typeof MOCK_STUDENTS];
      
      // Check if already scanned
      if (scannedStudents.find(s => s.id === data)) {
        Alert.alert(
          'تم المسح مسبقاً', 
          `${student.name} تم تسجيل حضوره مسبقاً.`,
          [{ text: 'حسناً', style: 'default' }]
        );
        return;
      }
      
             // Determine status based on time (mock logic)
       const currentHour = new Date().getHours();
       const status: 'present' | 'absent' | 'late' = currentHour < 8 ? 'present' : currentHour < 9 ? 'late' : 'absent';
      
      const newScan = {
        id: data,
        name: student.name,
        grade: student.grade,
        scannedAt: new Date().toLocaleTimeString('ar-EG'),
        status,
        busId: student.busId
      };
      
      setScannedStudents(prev => [...prev, newScan]);
      
      Alert.alert(
        'تم تسجيل الحضور', 
        `${student.name} تم تسجيل حضوره بنجاح.`,
        [{ text: 'ممتاز', style: 'default' }]
      );
    } else {
      Alert.alert(
        'رمز QR غير صحيح', 
        'هذا ليس رمز QR صحيح للطالب.',
        [{ text: 'حسناً', style: 'default' }]
      );
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const clearAttendance = () => {
    Alert.alert(
      'مسح الحضور',
      'هل أنت متأكد من مسح جميع سجلات الحضور؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'مسح', 
          style: 'destructive',
          onPress: () => setScannedStudents([])
        }
      ]
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle2 size={16} color="#10B981" />;
      case 'late':
        return <Clock size={16} color="#F59E0B" />;
             case 'absent':
         return <XCircle size={16} color="#EF4444" />;
      default:
        return <User size={16} color="#6B7280" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return '#10B981';
      case 'late':
        return '#F59E0B';
      case 'absent':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present':
        return 'حاضر';
      case 'late':
        return 'متأخر';
      case 'absent':
        return 'غائب';
      default:
        return 'غير محدد';
    }
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.screen}>
        <StatusBar style="light" />
        <LinearGradient colors={[Colors.primary, '#3A6D8C']} style={styles.permissionGradient}>
          <View style={styles.permissionContainer}>
            <Animated.View style={[styles.permissionIcon, pulseStyle]}>
              <LinearGradient
                colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                style={styles.permissionIconGradient}
              >
                <Camera size={64} color="#fff" />
              </LinearGradient>
            </Animated.View>
            
            <Text style={styles.permissionTitle}>إذن الكاميرا مطلوب</Text>
            <Text style={styles.permissionText}>
              نحتاج إلى إذن الكاميرا لمسح رموز QR للطلاب لتتبع الحضور
            </Text>
            
            <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
              <LinearGradient
                colors={['#ffffff', '#f8fafc']}
                style={styles.permissionButtonGradient}
              >
                <Text style={styles.permissionButtonText}>منح الإذن</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <CustomHeader title="ماسح QR" subtitle="تسجيل حضور الطلاب" />
      
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Stats Cards */}
        <Animated.View style={[styles.statsSection, animatedStyle]}>
          <View style={styles.statsGrid}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.statCard}
            >
              <View style={styles.statIcon}>
                <Users size={24} color="#fff" />
              </View>
              <Text style={styles.statNumber}>{scanStats.present}</Text>
              <Text style={styles.statLabel}>حاضر</Text>
            </LinearGradient>

            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              style={styles.statCard}
            >
              <View style={styles.statIcon}>
                <Clock size={24} color="#fff" />
              </View>
              <Text style={styles.statNumber}>{scanStats.late}</Text>
              <Text style={styles.statLabel}>متأخر</Text>
            </LinearGradient>

            <LinearGradient
              colors={['#EF4444', '#DC2626']}
              style={styles.statCard}
            >
                             <View style={styles.statIcon}>
                 <XCircle size={24} color="#fff" />
               </View>
              <Text style={styles.statNumber}>{scanStats.absent}</Text>
              <Text style={styles.statLabel}>غائب</Text>
            </LinearGradient>

            <LinearGradient
              colors={[Colors.primary, '#3A6D8C']}
              style={styles.statCard}
            >
                             <View style={styles.statIcon}>
                 <TrendingUp size={24} color="#fff" />
               </View>
              <Text style={styles.statNumber}>{scanStats.total}</Text>
              <Text style={styles.statLabel}>إجمالي</Text>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Scan Button */}
        <Animated.View style={[styles.scanSection, animatedStyle]}>
          <LinearGradient
            colors={['#ffffff', '#f8fafc']}
            style={styles.scanCard}
          >
            <View style={styles.scanHeader}>
              <QrCode size={28} color={Colors.primary} />
              <Text style={styles.scanTitle}>مسح رمز QR</Text>
            </View>
            
            <Text style={styles.scanDescription}>
              اضغط على الزر أدناه لبدء مسح رموز QR للطلاب
            </Text>

            <TouchableOpacity 
              style={styles.scanButton}
              onPress={() => setScanning(true)}
            >
              <LinearGradient
                colors={[Colors.primary, '#3A6D8C']}
                style={styles.scanButtonGradient}
              >
                <Camera size={32} color="#fff" />
                <Text style={styles.scanButtonText}>بدء المسح</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>

        {/* Attendance List */}
        <Animated.View style={[styles.attendanceSection, animatedStyle]}>
          <LinearGradient
            colors={['#ffffff', '#f8fafc']}
            style={styles.attendanceCard}
          >
            <View style={styles.attendanceHeader}>
              <View style={styles.attendanceTitleRow}>
                <Users size={24} color={Colors.primary} />
                <Text style={styles.attendanceTitle}>سجل الحضور اليوم</Text>
              </View>
              
              <View style={styles.attendanceActions}>
                <TouchableOpacity style={styles.actionButton} onPress={clearAttendance}>
                  <RotateCcw size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>

            {scannedStudents.length === 0 ? (
              <View style={styles.emptyState}>
                <LinearGradient
                  colors={['#f1f5f9', '#e2e8f0']}
                  style={styles.emptyIcon}
                >
                  <User size={48} color="#94a3b8" />
                </LinearGradient>
                <Text style={styles.emptyTitle}>لا يوجد طلاب مسحوا بعد</Text>
                <Text style={styles.emptyText}>
                  ابدأ بمسح رموز QR للطلاب لتسجيل حضورهم
                </Text>
              </View>
            ) : (
              <View style={styles.studentsList}>
                {scannedStudents.map((student, index) => (
                  <Animated.View 
                    key={student.id} 
                    style={styles.studentItem}
                    entering={FadeInUp.delay(index * 100)}
                  >
                    <LinearGradient
                      colors={['#ffffff', '#f8fafc']}
                      style={styles.studentGradient}
                    >
                      <View style={styles.studentAvatar}>
                        {getStatusIcon(student.status)}
                      </View>
                      
                      <View style={styles.studentInfo}>
                        <Text style={styles.studentName}>{student.name}</Text>
                        <Text style={styles.studentGrade}>{student.grade}</Text>
                        <View style={styles.studentMeta}>
                          <Clock size={12} color="#64748b" />
                          <Text style={styles.studentTime}>{student.scannedAt}</Text>
                          <View style={[
                            styles.statusBadge,
                            { backgroundColor: getStatusColor(student.status) + '20' }
                          ]}>
                            <Text style={[
                              styles.statusText,
                              { color: getStatusColor(student.status) }
                            ]}>
                              {getStatusText(student.status)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </LinearGradient>
                  </Animated.View>
                ))}
              </View>
            )}
          </LinearGradient>
        </Animated.View>

        {/* Demo Section */}
        <Animated.View style={[styles.demoSection, animatedStyle]}>
          <LinearGradient
            colors={['#f8fafc', '#e2e8f0']}
            style={styles.demoCard}
          >
            <View style={styles.demoHeader}>
              <QrCode size={20} color={Colors.primary} />
              <Text style={styles.demoTitle}>رموز QR للتجربة:</Text>
            </View>
            <Text style={styles.demoText}>استخدم هذه الرموز للاختبار:</Text>
            {Object.entries(MOCK_STUDENTS).map(([code, student]) => (
              <View key={code} style={styles.demoCodeItem}>
                <Text style={styles.demoCode}>{code}</Text>
                <Text style={styles.demoStudentName}>- {student.name}</Text>
              </View>
            ))}
          </LinearGradient>
        </Animated.View>
      </ScrollView>

      {/* Scanner Modal */}
      <Modal
        visible={scanning}
        animationType="slide"
        onRequestClose={() => setScanning(false)}
      >
        <View style={styles.scannerContainer}>
          <StatusBar style="light" />
          
          {/* Scanner Header */}
          <LinearGradient colors={['#000000', '#1a1a1a']} style={styles.scannerHeader}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setScanning(false)}>
              <XCircle size={32} color="#fff" />
            </TouchableOpacity>
            
            <View style={styles.scannerTitleContainer}>
              <Text style={styles.scannerTitle}>مسح رمز QR</Text>
              <Text style={styles.scannerSubtitle}>قم بتوجيه الكاميرا نحو رمز QR</Text>
            </View>
            
            <View style={styles.scannerControls}>
                             <TouchableOpacity 
                 style={styles.controlButton}
                 onPress={() => setFlashOn(!flashOn)}
               >
                 {flashOn ? <Zap size={24} color="#fff" /> : <Zap size={24} color="rgba(255,255,255,0.5)" />}
               </TouchableOpacity>
            </View>
          </LinearGradient>
          
          {/* Camera View */}
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
            enableTorch={flashOn}
          >
            <View style={styles.scannerOverlay}>
              <Animated.View style={[styles.scanFrame, scanStyle]} />
              <View style={styles.scanCorners}>
                <View style={[styles.corner, styles.cornerTopLeft]} />
                <View style={[styles.corner, styles.cornerTopRight]} />
                <View style={[styles.corner, styles.cornerBottomLeft]} />
                <View style={[styles.corner, styles.cornerBottomRight]} />
              </View>
              <Text style={styles.scanInstructions}>
                ضع رمز QR داخل الإطار
              </Text>
            </View>
          </CameraView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    padding: 16,
  },

  // Permission Screen
  permissionGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  permissionIcon: {
    marginBottom: 24,
  },
  permissionIconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  permissionButtonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  permissionButtonText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },

  // Stats Section
  statsSection: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statIcon: {
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },

  // Scan Section
  scanSection: {
    marginBottom: 24,
  },
  scanCard: {
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  scanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scanTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginLeft: 12,
  },
  scanDescription: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
    marginBottom: 24,
  },
  scanButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  scanButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Attendance Section
  attendanceSection: {
    marginBottom: 24,
  },
  attendanceCard: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  attendanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  attendanceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendanceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginLeft: 12,
  },
  attendanceActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Students List
  studentsList: {
    padding: 24,
  },
  studentItem: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  studentGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  studentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  studentGrade: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  studentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  studentTime: {
    fontSize: 12,
    color: '#64748b',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Demo Section
  demoSection: {
    marginBottom: 24,
  },
  demoCard: {
    padding: 20,
    borderRadius: 16,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginLeft: 8,
  },
  demoText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  demoCodeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  demoCode: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: Colors.primary,
    fontWeight: 'bold',
    marginRight: 8,
  },
  demoStudentName: {
    fontSize: 12,
    color: '#64748b',
  },

  // Scanner Modal
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  scannerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  scannerSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  scannerControls: {
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 280,
    height: 280,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  scanCorners: {
    position: 'absolute',
    width: 280,
    height: 280,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: Colors.primary,
    borderWidth: 3,
  },
  cornerTopLeft: {
    top: -2,
    left: -2,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: 16,
  },
  cornerTopRight: {
    top: -2,
    right: -2,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: 16,
  },
  cornerBottomLeft: {
    bottom: -2,
    left: -2,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomLeftRadius: 16,
  },
  cornerBottomRight: {
    bottom: -2,
    right: -2,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomRightRadius: 16,
  },
  scanInstructions: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
    paddingHorizontal: 32,
    lineHeight: 24,
  },
});