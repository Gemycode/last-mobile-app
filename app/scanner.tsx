import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { QrCode, User, CircleCheck as CheckCircle, Circle as XCircle } from 'lucide-react-native';
import CustomHeader from '../../components/CustomHeader';
import Card from '../../components/Card';
import { Colors } from '../../constants/Colors';

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [scannedStudents, setScannedStudents] = useState<Array<{
    id: string;
    name: string;
    scannedAt: string;
  }>>([]);

  // Mock student data for QR codes
  const mockStudents = {
    'student_001': { name: 'Alex Johnson', grade: '5th Grade' },
    'student_002': { name: 'Emma Davis', grade: '4th Grade' },
    'student_003': { name: 'Michael Chen', grade: '6th Grade' },
  };

  const handleBarCodeScanned = ({ data }: BarcodeScanningResult) => {
    setScanning(false);
    
    // Check if it's a valid student QR code
    if (mockStudents[data as keyof typeof mockStudents]) {
      const student = mockStudents[data as keyof typeof mockStudents];
      const newScan = {
        id: data,
        name: student.name,
        scannedAt: new Date().toLocaleTimeString(),
      };
      
      // Check if already scanned
      if (scannedStudents.find(s => s.id === data)) {
        Alert.alert('Already Scanned', `${student.name} has already been marked present.`);
        return;
      }
      
      setScannedStudents(prev => [...prev, newScan]);
      Alert.alert('Student Checked In', `${student.name} has been marked present.`);
    } else {
      Alert.alert('Invalid QR Code', 'This is not a valid student QR code.');
    }
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.screen}>
        <CustomHeader title="QR Scanner" />
        <View style={styles.permissionContainer}>
          <QrCode size={64} color={Colors.gray[400]} />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need camera access to scan student QR codes for attendance tracking.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <CustomHeader title="QR Scanner" />
      
      <View style={styles.container}>
        <Card style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <QrCode size={24} color={Colors.primary} />
            <Text style={styles.infoTitle}>Student Attendance</Text>
          </View>
          <Text style={styles.infoText}>
            Scan student QR codes to mark their presence on the bus
          </Text>
        </Card>

        <TouchableOpacity 
          style={styles.scanButton}
          onPress={() => setScanning(true)}
        >
          <QrCode size={32} color={Colors.white} />
          <Text style={styles.scanButtonText}>Start Scanning</Text>
        </TouchableOpacity>

        <Card>
          <View style={styles.attendanceHeader}>
            <Text style={styles.attendanceTitle}>Today's Attendance</Text>
            <View style={styles.attendanceCount}>
              <Text style={styles.countText}>{scannedStudents.length}</Text>
            </View>
          </View>

          {scannedStudents.length === 0 ? (
            <View style={styles.emptyState}>
              <User size={32} color={Colors.gray[400]} />
              <Text style={styles.emptyText}>No students scanned yet</Text>
            </View>
          ) : (
            scannedStudents.map((student, index) => (
              <View key={student.id} style={styles.studentItem}>
                <CheckCircle size={20} color={Colors.success} />
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{student.name}</Text>
                  <Text style={styles.studentTime}>Scanned at {student.scannedAt}</Text>
                </View>
              </View>
            ))
          )}
        </Card>

        <View style={styles.demoSection}>
          <Text style={styles.demoTitle}>Demo QR Codes:</Text>
          <Text style={styles.demoText}>Use these codes for testing:</Text>
          <Text style={styles.demoCode}>student_001 - Alex Johnson</Text>
          <Text style={styles.demoCode}>student_002 - Emma Davis</Text>
          <Text style={styles.demoCode}>student_003 - Michael Chen</Text>
        </View>
      </View>

      <Modal
        visible={scanning}
        animationType="slide"
        onRequestClose={() => setScanning(false)}
      >
        <View style={styles.scannerContainer}>
          <View style={styles.scannerHeader}>
            <TouchableOpacity onPress={() => setScanning(false)}>
              <XCircle size={32} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.scannerTitle}>Scan Student QR Code</Text>
            <View style={{ width: 32 }} />
          </View>
          
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
          >
            <View style={styles.scannerOverlay}>
              <View style={styles.scanFrame} />
              <Text style={styles.scanInstructions}>
                Position the QR code within the frame
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
    backgroundColor: Colors.gray[100],
  },
  container: {
    flex: 1,
    padding: 16,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.gray[800],
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: Colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  infoCard: {
    marginBottom: 24,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.gray[800],
    marginLeft: 12,
  },
  infoText: {
    fontSize: 16,
    color: Colors.gray[600],
    lineHeight: 24,
  },
  scanButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  scanButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  attendanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  attendanceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.gray[800],
  },
  attendanceCount: {
    backgroundColor: Colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.gray[500],
    marginTop: 12,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  studentInfo: {
    marginLeft: 12,
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[800],
  },
  studentTime: {
    fontSize: 14,
    color: Colors.gray[600],
    marginTop: 2,
  },
  demoSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: Colors.gray[50],
    borderRadius: 8,
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.gray[700],
    marginBottom: 8,
  },
  demoText: {
    fontSize: 12,
    color: Colors.gray[600],
    marginBottom: 8,
  },
  demoCode: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: Colors.primary,
    marginBottom: 4,
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  scannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
  },
  scannerTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
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
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: Colors.white,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  scanInstructions: {
    color: Colors.white,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 32,
    paddingHorizontal: 32,
  },
});