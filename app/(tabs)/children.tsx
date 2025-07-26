import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Dimensions, KeyboardAvoidingView, Platform, RefreshControl } from 'react-native';
import { Plus, Users, Edit, Trash2, User, Mail, School, Bus, Shield, MapPin, Clock, Activity } from 'lucide-react-native';
import CustomHeader from '../../components/CustomHeader';
import { Colors } from '../../constants/Colors';
import { useAuthStore } from '../../store/authStore';
import { fetchChildren, addChild, deleteChild, updateChild, fetchActiveBuses } from '../../services/busService';
import { Picker } from '@react-native-picker/picker';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  withSpring, 
  useAnimatedStyle,
  FadeInDown,
  FadeInRight,
  FadeInUp,
  SlideInRight,
  SlideOutLeft
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 8;
const CARD_WIDTH = (width - 48 - CARD_MARGIN) / 2;

export default function ChildrenScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState<{ [key: string]: string }>({
    firstName: '', lastName: '', email: '', password: '', grade: '', school: '', busId: ''
  });
  const [children, setChildren] = useState<any[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editChild, setEditChild] = useState<any | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const user = useAuthStore(state => state.user);

  // Enhanced animations
  const fadeValue = useSharedValue(0);
  const scaleValue = useSharedValue(0.9);
  
  useEffect(() => { 
    fadeValue.value = withSpring(1, { damping: 15, stiffness: 100 }); 
    scaleValue.value = withSpring(1, { damping: 15, stiffness: 100 });
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeValue.value,
    transform: [{ 
      translateY: (1 - fadeValue.value) * 30,
    }],
  }));

  // جلب الأطفال والباصات
  const loadData = async () => {
    try {
      if (user?.role === 'parent') {
        const childrenData = await fetchChildren();
        setChildren(childrenData);
      }
      const busesData = await fetchActiveBuses();
      setBuses(busesData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.role]);

  // حماية: إذا لم يكن parent، أعد التوجيه
  useEffect(() => {
    if (user && user.role !== 'parent') router.replace('/');
  }, [user]);

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // دالة لجلب رقم الباص من id
  const getBusNumberById = (id: any) => {
    const bus = buses.find((b: any) => b._id === id || b.id === id);
    return bus ? (bus.busNumber || bus.name) : '';
  };

  // تصفية الأطفال حسب البحث
  const filteredChildren = children.filter(child => 
    child.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    child.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    child.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    child.school?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // إضافة طفل
  const handleAddChild = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    try {
      await addChild(formData);
      setFormData({ firstName: '', lastName: '', email: '', password: '', grade: '', school: '', busId: '' });
      setShowAddForm(false);
      await loadData();
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
      await loadData();
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

  // مكون الكارد العصري المحسن
  const ChildCard = ({ child, index }: { child: any, index: number }) => (
    <Animated.View 
      style={[
        styles.childCard,
        {
          width: CARD_WIDTH,
        }
      ]}
      entering={FadeInDown.delay(index * 100)}
    >
      <LinearGradient
        colors={['#ffffff', '#f8fafc']}
        start={{ x: 0, y: 0 }} 
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
          <View style={styles.childAvatarContainer}>
            <LinearGradient
              colors={[Colors.primary, '#3A6D8C']}
              style={styles.childAvatar}
            >
              <Text style={styles.avatarText}>{child.firstName?.[0] || '?'}</Text>
            </LinearGradient>
            <View style={styles.onlineIndicator} />
          </View>
          
          <View style={styles.childDetails}>
            <Text style={styles.childName}>{child.firstName} {child.lastName}</Text>
            <View style={styles.childInfoRow}>
              <School size={12} color={Colors.gray[500]} />
              <Text style={styles.childSubInfo}>{child.grade} - {child.school}</Text>
            </View>
            {child.busId ? (
              <View style={styles.childInfoRow}>
                <Bus size={12} color={Colors.primary} />
                <Text style={styles.busText}>Bus: {getBusNumberById(child.busId)}</Text>
              </View>
            ) : (
              <View style={styles.childInfoRow}>
                <MapPin size={12} color={Colors.gray[400]} />
                <Text style={styles.noBusText}>No bus assigned</Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.cardActions}>
          <TouchableOpacity 
            onPress={() => openEditModal(child)} 
            style={styles.actionBtn}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[Colors.primary, '#3A6D8C']}
              style={styles.editButton}
            >
              <Edit size={14} color="#fff" />
              <Text style={styles.actionBtnText}>Edit</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => {
              Alert.alert('Delete Child', 'Are you sure you want to delete this child?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => handleDeleteChild(child._id) }
              ]);
            }} 
            style={styles.actionBtn}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#ef4444', '#dc2626']}
              style={styles.deleteButton}
            >
              <Trash2 size={14} color="#fff" />
              <Text style={styles.actionBtnText}>Delete</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  return (
    <>
      <CustomHeader title="Children" subtitle="Manage your children" showNotifications={false} />
      <StatusBar style="light" />
      
      {/* Add/Edit Child Form */}
      {showAddForm && (
        <Animated.View 
          style={styles.formOverlay}
          entering={SlideInRight}
          exiting={SlideOutLeft}
        >
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
                <View style={styles.formTitleContainer}>
                  <Users size={24} color={Colors.primary} />
                  <Text style={styles.formTitle}>{editChild ? 'Edit Child' : 'Add New Child'}</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => { setShowAddForm(false); setEditChild(null); }}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              {/* Form Inputs */}
              {[
                { field: 'firstName', icon: User, label: 'First Name' },
                { field: 'lastName', icon: User, label: 'Last Name' },
                { field: 'email', icon: Mail, label: 'Email' },
                { field: 'password', icon: Shield, label: 'Password' },
                { field: 'grade', icon: School, label: 'Grade' },
                { field: 'school', icon: School, label: 'School' }
              ].map(({ field, icon: Icon, label }, idx) => (
                <View style={styles.inputGroup} key={field}>
                  <View style={styles.inputLabelContainer}>
                    <Icon size={16} color={Colors.primary} />
                    <Text style={styles.inputLabel}>{label}</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder={`Enter ${label.toLowerCase()}`}
                    placeholderTextColor="#94a3b8"
                    value={formData[field]}
                    onChangeText={(val: string) => setFormData({ ...formData, [field]: val })}
                    secureTextEntry={field === 'password'}
                    keyboardType={field === 'email' ? 'email-address' : 'default'}
                    autoCapitalize={field === 'email' ? 'none' : 'sentences'}
                  />
                </View>
              ))}
              
              {/* Bus Selection */}
              <View style={styles.inputGroup}>
                <View style={styles.inputLabelContainer}>
                  <Bus size={16} color={Colors.primary} />
                  <Text style={styles.inputLabel}>Bus Assignment</Text>
                </View>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.busId}
                    onValueChange={(val: string) => setFormData({ ...formData, busId: val })}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select Bus (Optional)" value="" />
                    {buses.map((bus: any) => (
                      <Picker.Item 
                        key={bus._id || bus.id} 
                        label={`${bus.busNumber || bus.name} - ${bus.route || 'Route'}`} 
                        value={bus._id || bus.id} 
                      />
                    ))}
                  </Picker>
                </View>
              </View>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={async () => {
                  if (editChild) await handleEditChild();
                  else await handleAddChild();
                }}
                activeOpacity={0.8}
              >
                <LinearGradient 
                  colors={[Colors.primary, '#3A6D8C']} 
                  style={styles.saveGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Activity size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>
                    {editChild ? 'Save Changes' : 'Add Child'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>
      )}

      {/* Children List */}
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
        {/* Header Section */}
        <Animated.View entering={FadeInUp.delay(100)} style={styles.headerSection}>
          <View style={styles.statsContainer}>
            <LinearGradient
              colors={[Colors.primary, '#3A6D8C']}
              style={styles.statCard}
            >
              <Users size={24} color="#fff" />
              <Text style={styles.statNumber}>{children.length}</Text>
              <Text style={styles.statLabel}>Total Children</Text>
            </LinearGradient>
            
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.statCard}
            >
              <Bus size={24} color="#fff" />
              <Text style={styles.statNumber}>
                {children.filter(c => c.busId).length}
              </Text>
              <Text style={styles.statLabel}>Assigned to Bus</Text>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Search Bar */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Users size={20} color={Colors.gray[400]} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search children..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={Colors.gray[400]}
            />
          </View>
        </Animated.View>

        {/* List Header */}
        <Animated.View entering={FadeInUp.delay(300)} style={styles.listHeader}>
          <Text style={styles.listTitle}>Children List</Text>
          <TouchableOpacity
            onPress={() => {
              setShowAddForm(true);
              setEditChild(null);
              setFormData({ firstName: '', lastName: '', email: '', password: '', grade: '', school: '', busId: '' });
            }}
            style={styles.addBtn}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[Colors.primary, '#3A6D8C']}
              style={styles.addBtnGradient}
            >
              <Plus size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Children Grid */}
        <View style={styles.grid}>
          {filteredChildren.length > 0 ? (
            filteredChildren.map((child: any, index: number) => (
              <ChildCard key={child._id || index} child={child} index={index} />
            ))
          ) : (
            <Animated.View entering={FadeInUp.delay(400)} style={styles.emptyState}>
              <Users size={64} color={Colors.gray[300]} />
              <Text style={styles.emptyStateTitle}>
                {searchQuery ? 'No children found' : 'No children added yet'}
              </Text>
              <Text style={styles.emptyStateSubtitle}>
                {searchQuery 
                  ? 'Try adjusting your search terms' 
                  : 'Add your first child to get started'
                }
              </Text>
              {!searchQuery && (
                <TouchableOpacity
                  style={styles.emptyStateButton}
                  onPress={() => {
                    setShowAddForm(true);
                    setEditChild(null);
                    setFormData({ firstName: '', lastName: '', email: '', password: '', grade: '', school: '', busId: '' });
                  }}
                >
                  <LinearGradient
                    colors={[Colors.primary, '#3A6D8C']}
                    style={styles.emptyStateButtonGradient}
                  >
                    <Plus size={20} color="#fff" />
                    <Text style={styles.emptyStateButtonText}>Add First Child</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { 
    flex: 1, 
    backgroundColor: '#f8fafc' 
  },
  
  // Header Section
  headerSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
    textAlign: 'center',
  },

  // Search Bar
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1e293b',
  },

  // List Header
  listHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 24,
    marginBottom: 16
  },
  listTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#1e293b' 
  },
  addBtn: { 
    borderRadius: 16, 
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addBtnGradient: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Grid
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between', 
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 8,
  },

  // Enhanced Child Card
  childCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    minHeight: 180,
    justifyContent: 'space-between',
    
  },
  cardGradient: { 
    borderRadius: 20, 
    padding: 16, 
    flex: 1, 
    justifyContent: 'space-between' 
  },
  cardHeader: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    marginBottom: 12 
  },
  childAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  childAvatar: { 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 24 
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#fff',
  },
  childDetails: { 
    flex: 1 
  },
  childName: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#1e293b', 
    marginBottom: 6 
  },
  childInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  childSubInfo: { 
    fontSize: 13, 
    color: '#64748b' 
  },
  busText: { 
    color: Colors.primary, 
    fontSize: 13,
    fontWeight: '600'
  },
  noBusText: {
    color: Colors.gray[400],
    fontSize: 13,
    fontStyle: 'italic'
  },
  cardActions: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 12 
  },
  actionBtn: { 
    flex: 1,
    marginHorizontal: 4,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 4,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 4,
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },

  // Enhanced Form
  formOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: { 
    backgroundColor: '#fff', 
    borderRadius: 24, 
    margin: 24, 
    padding: 24, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 8 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 16, 
    elevation: 12, 
    maxHeight: '80%',
    width: '90%',
  },
  formHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 24 
  },
  formTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  formTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: Colors.primary 
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.gray[600],
  },
  inputGroup: { 
    marginBottom: 20 
  },
  inputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  inputLabel: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#374151' 
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    borderRadius: 12, 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    fontSize: 16, 
    color: '#1e293b', 
    backgroundColor: '#f8fafc' 
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
  },
  picker: {
    backgroundColor: 'transparent',
  },
  saveButton: { 
    marginTop: 20, 
    borderRadius: 16, 
    overflow: 'hidden' 
  },
  saveGradient: { 
    paddingVertical: 16, 
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#fff' 
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    width: '100%',
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.gray[600],
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: Colors.gray[500],
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  emptyStateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});