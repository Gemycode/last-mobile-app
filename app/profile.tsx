import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator, Image, Switch } from 'react-native';
import { User, Mail, Phone, Bell, Shield, LogOut, CreditCard as Edit, Settings, Sun, Moon, ArrowLeft, Camera, ChevronRight } from 'lucide-react-native';
import CustomHeader from '../components/CustomHeader';
import Card from '../components/Card';
import { Colors } from '../constants/Colors';
import { useAuthStore } from '../store/authStore';
import { useRouter } from 'expo-router';
import { fetchCurrentUser, changePassword, updateCurrentUser, uploadProfileImage } from '../services/busService';
import { useThemeStore } from '../store/appStore';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
  const { user: storeUser, logout } = useAuthStore();
  const [user, setUser] = useState<any>(storeUser);
  const router = useRouter();
  const { theme, setTheme } = useThemeStore();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changing, setChanging] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFirstName, setEditFirstName] = useState(user?.firstName || '');
  const [editLastName, setEditLastName] = useState(user?.lastName || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [savingEdit, setSavingEdit] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(theme === 'dark');


  useEffect(() => {
    if (storeUser) {
      fetchCurrentUser().then(res => {
        setUser(res.data?.user || storeUser);
      }).catch((error) => {
        console.error('Error fetching current user:', error);
        setUser(storeUser);
      });

    }
  }, [storeUser]);

  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          }
        },
      ]
    );
  };

  const handleChangePassword = () => {
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async () => {
    if (!oldPassword || !newPassword) {
      Alert.alert('Error', 'Please fill in both fields');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    setChanging(true);
    try {
      await changePassword(oldPassword, newPassword);
      Alert.alert('Success', 'Password changed successfully');
      setShowPasswordModal(false);
      setOldPassword('');
      setNewPassword('');
    } catch (e: any) {
      console.error('Password change error:', e);
      Alert.alert('Error', e?.response?.data?.message || 'Failed to change password. Please try again.');
    } finally {
      setChanging(false);
    }
  };

  const handleEdit = () => {
    setEditFirstName(user?.firstName || '');
    setEditLastName(user?.lastName || '');
    setEditPhone(user?.phone || '');
    setEditEmail(user?.email || '');
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editFirstName || !editLastName || !editEmail) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setSavingEdit(true);
    try {
      const res = await updateCurrentUser({ firstName: editFirstName, lastName: editLastName, phone: editPhone, email: editEmail });
      setUser(res.data.user);
      setShowEditModal(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (e: any) {
      console.error('Profile update error:', e);
      Alert.alert('Error', e?.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setUploading(true);
        try {
          const res = await uploadProfileImage(result.assets[0].uri);
          setUser((prev: any) => ({ ...prev, profileImage: res.data.data.profileImage }));
          Alert.alert('Success', 'Profile image updated');
        } catch (e: any) {
          console.error('Image upload error:', e);
          Alert.alert('Error', e?.response?.data?.message || 'Failed to upload image. Please try again.');
        } finally {
          setUploading(false);
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to access image library. Please check permissions.');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'parent': return Colors.success;
      case 'driver': return Colors.secondary;
      case 'admin': return Colors.error;
      case 'student': return Colors.accent;
      default: return Colors.gray[500];
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'parent': return 'Parent';
      case 'driver': return 'Bus Driver';
      case 'admin': return 'Administrator';
      case 'student': return 'Student';
      default: return 'User';
    }
  };

  // عناصر القائمة
  const menuItems = [
    {
      icon: Mail,
      title: 'Email',
      subtitle: user?.email || '',
      action: handleEdit,
    },
    {
      icon: Phone,
      title: 'Phone',
      subtitle: user?.phone || '',
      action: handleEdit,
    },
    {
      icon: Shield,
      title: 'Change Password',
      subtitle: 'Update your password',
      action: handleChangePassword,
    },
    {
      icon: Bell,
      title: 'Notifications',
      subtitle: notificationsEnabled ? 'Enabled' : 'Disabled',
      action: undefined,
      switch: notificationsEnabled,
      onSwitch: setNotificationsEnabled,
    },
    {
      icon: Sun,
      title: 'Dark Mode',
      subtitle: darkMode ? 'On' : 'Off',
      action: undefined,
      switch: darkMode,
      onSwitch: (val: boolean) => {
        setDarkMode(val);
        setTheme(val ? 'dark' : 'light');
      },
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={[Colors.primary, '#3A6D8C']} style={styles.headerGradient}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.placeholder} />
        </View>
        {/* Profile Info */}
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            <Image
              source={user?.profileImage ? { uri: user.profileImage } : require('../assets/images/icon.png')}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.cameraButton} onPress={handlePickImage}>
              <Camera size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          {/* Stats */}
          {/* <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: Colors.primary }]}>{profileStats?.trips ?? '--'}</Text>
              <Text style={styles.statLabel}>Trips</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: Colors.success }]}>{profileStats?.children ?? '--'}</Text>
              <Text style={styles.statLabel}>Children</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: Colors.warning }]}>{profileStats?.points ?? '--'}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
          </View> */}
        </View>
      </LinearGradient>
      {/* Menu Items */}
      <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
        <View>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.action}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: `${['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'][index]}20` }]}> 
                  <item.icon size={20} color={['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'][index]} />
                </View>
                <View style={styles.menuText}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
              <View style={styles.menuRight}>
                {item.switch !== undefined ? (
                  <Switch
                    value={item.switch}
                    onValueChange={item.onSwitch}
                    trackColor={{ false: '#e2e8f0', true: '#4F46E5' }}
                    thumbColor={item.switch ? '#fff' : '#f4f3f4'}
                    ios_backgroundColor="#e2e8f0"
                  />
                ) : (
                  <ChevronRight size={20} color="#94a3b8" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={async () => {
            await logout();
            router.replace('/(auth)/login');
          }}>
            <LogOut size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
        {/* App Version */}
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>
      {/* Modal تعديل البيانات */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '90%' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: Colors.primary, marginBottom: 16 }}>Edit Profile</Text>
            <TextInput
              style={[styles.input, { marginBottom: 12 }]}
              placeholder="First Name"
              value={editFirstName}
              onChangeText={setEditFirstName}
            />
            <TextInput
              style={[styles.input, { marginBottom: 12 }]}
              placeholder="Last Name"
              value={editLastName}
              onChangeText={setEditLastName}
            />
            <TextInput
              style={[styles.input, { marginBottom: 12 }]}
              placeholder="Email"
              value={editEmail}
              onChangeText={setEditEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={[styles.input, { marginBottom: 12 }]}
              placeholder="Phone"
              value={editPhone}
              onChangeText={setEditPhone}
              keyboardType="phone-pad"
            />
            <TouchableOpacity style={[styles.saveButton, { marginTop: 12 }]} onPress={handleSaveEdit} disabled={savingEdit}>
              <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.saveGradient}>
                {savingEdit ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save</Text>}
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowEditModal(false)} style={{ marginTop: 10, alignSelf: 'center' }}>
              <Text style={{ color: Colors.primary, fontWeight: 'bold' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Modal تغيير كلمة المرور */}
      <Modal visible={showPasswordModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '90%' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: Colors.primary, marginBottom: 16 }}>Change Password</Text>
            <TextInput
              style={[styles.input, { marginBottom: 12 }]}
              placeholder="Current Password"
              value={oldPassword}
              onChangeText={setOldPassword}
              secureTextEntry
            />
            <TextInput
              style={[styles.input, { marginBottom: 12 }]}
              placeholder="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <TouchableOpacity style={[styles.saveButton, { marginTop: 12 }]} onPress={handlePasswordSubmit} disabled={changing}>
              <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.saveGradient}>
                {changing ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Change Password</Text>}
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowPasswordModal(false)} style={{ marginTop: 10, alignSelf: 'center' }}>
              <Text style={{ color: Colors.primary, fontWeight: 'bold' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 44,
  },
  profileInfo: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#e2e8f0',
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    minWidth: 80,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#e2e8f0',
    marginTop: 4,
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  menuRight: {
    marginLeft: 16,
  },
  logoutContainer: {
    marginTop: 24,
    marginBottom: 40,
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1e293b',
    marginBottom: 12,
  },
  saveButton: {
    borderRadius: 16,
    padding: 18,
  },
  saveGradient: {
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});