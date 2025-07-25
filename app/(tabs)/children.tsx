import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { Plus, User, GraduationCap, School } from 'lucide-react-native';
import CustomHeader from '../../components/CustomHeader';
import Card from '../../components/Card';
import { Colors } from '../../constants/Colors';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import { fetchChildren, addChild, deleteChild, updateChild, fetchActiveBuses } from '../../services/busService';
import { useEffect } from 'react';
import { Picker } from '@react-native-picker/picker';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { X, Check } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function ChildrenScreen() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    grade: string;
    school: string;
    busId?: string;
  }>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    grade: '',
    school: '',
    busId: '',
  });
  const [children, setChildren] = useState<any[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editChild, setEditChild] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: undefined as string | undefined,
    grade: '',
    school: '',
    busId: '',
  });
  const [buses, setBuses] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  const user = useAuthStore(state => state.user);
  // تم حذف أي destructuring من useAppStore لأنه غير مستخدم

  const fadeValue = useSharedValue(0);
  useEffect(() => {
    fadeValue.value = withSpring(1, { damping: 15, stiffness: 100 });
  }, []);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeValue.value,
    transform: [{ translateY: (1 - fadeValue.value) * 30 }],
  }));

  const { height } = Dimensions.get('window');

  // دالة لجلب رقم الباص من id
  const getBusNumberById = (id: string) => {
    const bus = buses.find(b => b._id === id || b.id === id);
    return bus ? (bus.busNumber || bus.name) : '';
  };

  // ChildCard component
  const ChildCard = ({ child, index }: { child: any, index: number }) => (
    <Animated.View
      style={[
        styles.childCard,
        animatedStyle,
        { transform: [{ translateY: (1 - fadeValue.value) * (index * 20 + 50) }] }
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.childInfo}>
          {/* صورة افتراضية أو صورة الطفل */}
          <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 22 }}>{child.firstName?.[0] || '?'}</Text>
          </View>
          <View style={styles.childDetails}>
            <Text style={styles.childName}>{child.firstName} {child.lastName}</Text>
            <Text style={styles.childSubInfo}>{child.grade} - {child.school}</Text>
            {child.busId ? (
              <Text style={{ color: Colors.primary, fontSize: 14, marginTop: 2 }}>
                Bus: {getBusNumberById(child.busId)}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
      {/* أزرار Edit, Delete في الأسفل */}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 12 }}>
        <TouchableOpacity onPress={() => openEditModal(child)} style={{ marginRight: 12 }}>
          <Text style={{ color: Colors.primary, fontWeight: 'bold' }}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {
          Alert.alert(
            'Delete Child',
            'Are you sure you want to delete this child?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => handleDeleteChild(child._id) }
            ]
          );
        }} style={{ marginRight: 12 }}>
          <Text style={{ color: 'red', fontWeight: 'bold' }}>Delete</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  useEffect(() => {
    if (user?.role === 'parent') {
      fetchChildren().then(setChildren).catch(console.error);
    }
  }, [user?.role]);

  useEffect(() => {
    fetchActiveBuses().then(setBuses).catch(console.error);
  }, []);

  useEffect(() => {
    if (user?.role === 'driver') {
      router.replace('/');
    }
  }, [user]);

  // حماية: إذا لم يكن parent، أعد التوجيه
  React.useEffect(() => {
    if (user && user.role !== 'parent') {
      router.replace('/'); // يمكنك تغيير المسار حسب ما تريد
    }
  }, [user]);

  const handleAddChild = async () => {
    if (user?.role !== 'parent') return;
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    try {
      const childData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        grade: formData.grade,
        school: formData.school,
        busId: formData.busId,
      };
      await addChild(childData);
      setFormData({ firstName: '', lastName: '', email: '', password: '', grade: '', school: '', busId: '' });
      setModalVisible(false);
      Alert.alert('Success', 'Child added successfully!');
      // إعادة جلب الأطفال
      fetchChildren().then(setChildren);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to add child');
    }
  };

  const handleDeleteChild = async (childId: string) => {
    if (user?.role !== 'parent') return;
    try {
      await deleteChild(childId);
      setChildren(children.filter((c: any) => c._id !== childId));
      Alert.alert('Success', 'Child deleted successfully!');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to delete child');
    }
  };

  const openEditModal = (child: any) => {
    setFormData({
      firstName: child.firstName || '',
      lastName: child.lastName || '',
      email: child.email || '',
      password: '', // لا تملأ كلمة المرور
      grade: child.grade || '',
      school: child.school || '',
      busId: child.busId || ''
    });
    setEditChild(child);
    setShowAddForm(true);
  };

  const handleEditChild = async () => {
    if (!editChild) return;
    try {
      const dataToSend = { ...formData };
      if (!dataToSend.password) { delete dataToSend.password; }
      await updateChild(editChild._id, dataToSend);
      fetchChildren().then(setChildren);
      Alert.alert('Success', 'Child updated successfully!');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to update child');
    }
  };

  return (
    <>
      <CustomHeader title="Children" />
      <StatusBar style="light" />
      
      {/* Add New Child Form (يظهر فقط عند showAddForm) */}
      {showAddForm && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ width: '100%' }}
          keyboardVerticalOffset={100}
        >
          <ScrollView
            style={{
              backgroundColor: '#fff',
              borderRadius: 20,
              margin: 16,
              padding: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 6,
              maxHeight: 420,
            }}
            contentContainerStyle={{ paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: Colors.primary }}>Add New Child</Text>
              <TouchableOpacity onPress={() => setShowAddForm(false)}>
                <Text style={{ color: Colors.primary, fontWeight: 'bold', fontSize: 18 }}>X</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>First Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter child's first name"
                placeholderTextColor="#94a3b8"
                value={formData.firstName}
                onChangeText={val => setFormData({ ...formData, firstName: val })}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter child's last name"
                placeholderTextColor="#94a3b8"
                value={formData.lastName}
                onChangeText={val => setFormData({ ...formData, lastName: val })}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter child's email"
                placeholderTextColor="#94a3b8"
                value={formData.email}
                onChangeText={val => setFormData({ ...formData, email: val })}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#94a3b8"
                value={formData.password}
                onChangeText={val => setFormData({ ...formData, password: val })}
                secureTextEntry
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Grade</Text>
              <TextInput
                style={styles.input}
                placeholder="Grade"
                placeholderTextColor="#94a3b8"
                value={formData.grade}
                onChangeText={val => setFormData({ ...formData, grade: val })}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>School</Text>
              <TextInput
                style={styles.input}
                placeholder="School name"
                placeholderTextColor="#94a3b8"
                value={formData.school}
                onChangeText={val => setFormData({ ...formData, school: val })}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bus</Text>
              <Picker
                selectedValue={formData.busId}
                onValueChange={val => setFormData({ ...formData, busId: val })}
                style={{ backgroundColor: '#f8fafc', borderRadius: 12 }}
              >
                <Picker.Item label="Select Bus" value="" />
                {buses.map(bus => (
                  <Picker.Item key={bus._id || bus.id} label={bus.busNumber || bus.name} value={bus._id || bus.id} />
                ))}
              </Picker>
            </View>
            <TouchableOpacity style={[styles.saveButton, { marginTop: 12 }]} onPress={async () => {
              if (editChild) {
                await handleEditChild();
                setEditChild(null);
              } else {
                await handleAddChild();
              }
              setShowAddForm(false);
            }}>
              <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.saveGradient}>
                <Text style={styles.saveButtonText}>{editChild ? 'Save Changes' : 'Add Child'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* Children List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginTop: 16, marginBottom: 0 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: Colors.primary }}>Children</Text>
          <TouchableOpacity
            onPress={() => {
              setShowAddForm(true);
              setEditChild(null);
              setFormData({
                firstName: '',
                lastName: '',
                email: '',
                password: '',
                grade: '',
                school: '',
                busId: '',
              });
            }}
            style={{
              backgroundColor: Colors.primary,
              borderRadius: 8,
              paddingHorizontal: 14,
              paddingVertical: 8,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Add</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.childrenList}>
          {children.map((child, index) => (
            <ChildCard key={child._id || index} child={child} index={index} />
          ))}
        </View>

        {/* Quick Stats */}
        <Animated.View style={[styles.statsContainer, animatedStyle]}>
          {/* <Text style={styles.statsTitle}>Quick Stats</Text> */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}></Text>
              <Text style={styles.statValue}>{children.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
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
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  childrenList: {
    paddingTop: 24,
  },
  childCard: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  childInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  childAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  childDetails: {
    flex: 1,
  },
  childName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  childSubInfo: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  infoItem: {
    width: '48%',
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 6,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  busInfo: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  busGradient: {
    padding: 16,
    alignItems: 'center',
  },
  busRoute: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  statsContainer: {
    marginTop: 24,
    marginBottom: 32,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  statEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1e293b',
    backgroundColor: '#f8fafc',
  },
  inputRow: {
    flexDirection: 'row',
  },
  saveButton: {
    margin: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  saveGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});