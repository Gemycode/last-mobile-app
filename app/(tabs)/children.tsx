import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { Plus, Users } from 'lucide-react-native';
import CustomHeader from '../../components/CustomHeader';
import { Colors } from '../../constants/Colors';
import { useAuthStore } from '../../store/authStore';
import { fetchChildren, addChild, deleteChild, updateChild, fetchActiveBuses } from '../../services/busService';
import { Picker } from '@react-native-picker/picker';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 8;
const CARD_WIDTH = (width - 48 - CARD_MARGIN) / 2; // 24 padding each side, 8 margin between

export default function ChildrenScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState<{ [key: string]: string }>({
    firstName: '', lastName: '', email: '', password: '', grade: '', school: '', busId: ''
  });
  const [children, setChildren] = useState<any[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editChild, setEditChild] = useState<any | null>(null);

  const user = useAuthStore(state => state.user);

  // Animation
  const fadeValue = useSharedValue(0);
  useEffect(() => { fadeValue.value = withSpring(1, { damping: 15, stiffness: 100 }); }, []);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeValue.value,
    transform: [{ translateY: (1 - fadeValue.value) * 30 }],
  }));

  // جلب الأطفال والباصات
  useEffect(() => {
    if (user?.role === 'parent') fetchChildren().then(setChildren).catch(console.error);
    fetchActiveBuses().then(setBuses).catch(console.error);
  }, [user?.role]);

  // حماية: إذا لم يكن parent، أعد التوجيه
  useEffect(() => {
    if (user && user.role !== 'parent') router.replace('/');
  }, [user]);

  // دالة لجلب رقم الباص من id
  const getBusNumberById = (id: any) => {
    const bus = buses.find((b: any) => b._id === id || b.id === id);
    return bus ? (bus.busNumber || bus.name) : '';
  };

  // إضافة طفل
  const handleAddChild = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    try {
      await addChild(formData);
      setFormData({ firstName: '', lastName: '', email: '', password: '', grade: '', school: '', busId: '' });
      setShowAddForm(false);
      fetchChildren().then(setChildren);
      Alert.alert('Success', 'Child added successfully!');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to add child');
    }
  };

  // حذف طفل
  const handleDeleteChild = async (childId: any) => {
    try {
      await deleteChild(childId);
      setChildren(children.filter((c: any) => c._id !== childId));
      Alert.alert('Success', 'Child deleted successfully!');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to delete child');
    }
  };

  // تعديل طفل
  const handleEditChild = async () => {
    if (!editChild) return;
    try {
      const dataToSend: any = { ...formData };
      if (!dataToSend.password) { delete dataToSend.password; }
      await updateChild(editChild._id, dataToSend);
      fetchChildren().then(setChildren);
      setEditChild(null);
      setShowAddForm(false);
      Alert.alert('Success', 'Child updated successfully!');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to update child');
    }
  };

  // فتح فورم التعديل
  const openEditModal = (child: any) => {
    setFormData({
      firstName: child.firstName || '',
      lastName: child.lastName || '',
      email: child.email || '',
      password: '',
      grade: child.grade || '',
      school: child.school || '',
      busId: child.busId || ''
    });
    setEditChild(child);
    setShowAddForm(true);
  };

  // مكون الكارد العصري
  const ChildCard = ({ child, index }: { child: any, index: number }) => (
    <Animated.View style={[
      styles.childCard,
      animatedStyle,
      {
        marginRight: index % 2 === 0 ? CARD_MARGIN : 0,
        marginLeft: index % 2 === 1 ? CARD_MARGIN : 0,
        width: CARD_WIDTH,
      }
    ]}>
      <LinearGradient
        colors={['#f8fafc', '#e0e7ef']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
          <View style={styles.childAvatar}>
            <Text style={styles.avatarText}>{child.firstName?.[0] || '?'}</Text>
          </View>
          <View style={styles.childDetails}>
            <Text style={styles.childName}>{child.firstName} {child.lastName}</Text>
            <Text style={styles.childSubInfo}>{child.grade} - {child.school}</Text>
            {child.busId ? (
              <Text style={styles.busText}>Bus: {getBusNumberById(child.busId)}</Text>
            ) : null}
          </View>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity onPress={() => openEditModal(child)} style={styles.actionBtn}>
            <Text style={{ color: Colors.primary, fontWeight: 'bold' }}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            Alert.alert('Delete Child', 'Are you sure you want to delete this child?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => handleDeleteChild(child._id) }
            ]);
          }} style={styles.actionBtn}>
            <Text style={{ color: 'red', fontWeight: 'bold' }}>Delete</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  return (
    <>
      <CustomHeader title="Children" />
      <StatusBar style="light" />
      {/* Add/Edit Child Form */}
      {showAddForm && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ width: '100%' }}
          keyboardVerticalOffset={100}
        >
          <ScrollView
            style={styles.formContainer}
            contentContainerStyle={{ paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>{editChild ? 'Edit Child' : 'Add New Child'}</Text>
              <TouchableOpacity onPress={() => { setShowAddForm(false); setEditChild(null); }}>
                <Text style={{ color: Colors.primary, fontWeight: 'bold', fontSize: 18 }}>X</Text>
              </TouchableOpacity>
            </View>
            {/* Form Inputs */}
            {['firstName', 'lastName', 'email', 'password'].map((field: string, idx: number) => (
              <View style={styles.inputGroup} key={field}>
                <Text style={styles.inputLabel}>{field.charAt(0).toUpperCase() + field.slice(1)}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={`Enter ${field}`}
                  placeholderTextColor="#94a3b8"
                  value={formData[field]}
                  onChangeText={(val: string) => setFormData({ ...formData, [field]: val })}
                  secureTextEntry={field === 'password'}
                  keyboardType={field === 'email' ? 'email-address' : 'default'}
                  autoCapitalize={field === 'email' ? 'none' : 'sentences'}
                />
              </View>
            ))}
            {/* احذف/اخفِ حقل اختيار الباص (busId) من الفورم */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bus</Text>
              <Picker
                selectedValue={formData.busId}
                onValueChange={(val: string) => setFormData({ ...formData, busId: val })}
                style={{ backgroundColor: '#f8fafc', borderRadius: 12 }}
              >
                <Picker.Item label="Select Bus" value="" />
                {buses.map((bus: any) => (
                  <Picker.Item key={bus._id || bus.id} label={bus.busNumber || bus.name} value={bus._id || bus.id} />
                ))}
              </Picker>
            </View>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={async () => {
                if (editChild) await handleEditChild();
                else await handleAddChild();
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
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Children</Text>
          <TouchableOpacity
            onPress={() => {
              setShowAddForm(true);
              setEditChild(null);
              setFormData({ firstName: '', lastName: '', email: '', password: '', grade: '', school: '', busId: '' });
            }}
            style={styles.addBtn}
          >
            <Plus size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        {/* 2 Columns Grid */}
        <View style={styles.grid}>
          {children.map((child: any, index: number) => (
            <ChildCard key={child._id || index} child={child} index={index} />
          ))}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 16, backgroundColor: '#f8fafc' },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 8 },
  listTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.primary },
  addBtn: { backgroundColor: Colors.primary, borderRadius: 8, padding: 8, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 8 },
  childCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    minHeight: 160,
    justifyContent: 'space-between',
  },
  cardGradient: { borderRadius: 20, padding: 16, flex: 1, justifyContent: 'space-between' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  childAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 22 },
  childDetails: { flex: 1 },
  childName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 2 },
  childSubInfo: { fontSize: 13, color: '#64748b', marginBottom: 2 },
  busText: { color: Colors.primary, fontSize: 13, marginTop: 2 },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 8 },
  actionBtn: { marginLeft: 8 },
  formContainer: { backgroundColor: '#fff', borderRadius: 20, margin: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6, maxHeight: 480 },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  formTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.primary },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#1e293b', backgroundColor: '#f8fafc' },
  saveButton: { marginTop: 12, borderRadius: 16, overflow: 'hidden' },
  saveGradient: { paddingVertical: 14, alignItems: 'center' },
  saveButtonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
});