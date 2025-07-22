import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { User, Mail, Phone, Bell, Shield, LogOut, CreditCard as Edit, Settings } from 'lucide-react-native';
import CustomHeader from '../../components/CustomHeader';
import Card from '../../components/Card';
import { Colors } from '../../constants/Colors';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

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
            router.replace('/(auth)/welcome');
          }
        },
      ]
    );
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

  return (
    <View style={styles.screen}>
      <CustomHeader title="Profile" />
      
      <ScrollView style={styles.container}>
        {/* Profile Header */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <User size={32} color={Colors.white} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name}</Text>
              <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user?.role || '') }]}>
                <Text style={styles.roleText}>{getRoleLabel(user?.role || '')}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <Edit size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.contactInfo}>
            <View style={styles.contactRow}>
              <Mail size={16} color={Colors.gray[500]} />
              <Text style={styles.contactText}>{user?.email}</Text>
            </View>
            <View style={styles.contactRow}>
              <Phone size={16} color={Colors.gray[500]} />
              <Text style={styles.contactText}>+1 (555) 123-4567</Text>
            </View>
          </View>
        </Card>

        {/* Quick Actions */}
        {user?.role === 'parent' && (
          <Card>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionGrid}>
              <TouchableOpacity style={styles.actionItem}>
                <User size={24} color={Colors.primary} />
                <Text style={styles.actionText}>My Children</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionItem}>
                <Bell size={24} color={Colors.primary} />
                <Text style={styles.actionText}>Notifications</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Settings */}
        <Card>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <Bell size={20} color={Colors.gray[600]} />
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Notifications</Text>
              <Text style={styles.settingSubtitle}>Manage push notifications</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Shield size={20} color={Colors.gray[600]} />
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Privacy & Security</Text>
              <Text style={styles.settingSubtitle}>Account security settings</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Settings size={20} color={Colors.gray[600]} />
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>App Preferences</Text>
              <Text style={styles.settingSubtitle}>Language, theme, and more</Text>
            </View>
          </TouchableOpacity>
        </Card>

        {/* Role-specific Information */}
        {user?.role === 'driver' && (
          <Card>
            <Text style={styles.sectionTitle}>Driver Information</Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>License Number</Text>
                <Text style={styles.infoValue}>DL12345678</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Assigned Bus</Text>
                <Text style={styles.infoValue}>B001</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Years of Service</Text>
                <Text style={styles.infoValue}>3 years</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Safety Rating</Text>
                <Text style={[styles.infoValue, { color: Colors.success }]}>Excellent</Text>
              </View>
            </View>
          </Card>
        )}

        {user?.role === 'admin' && (
          <Card>
            <Text style={styles.sectionTitle}>Admin Controls</Text>
            <TouchableOpacity style={styles.adminAction}>
              <Text style={styles.adminActionText}>Manage Users</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.adminAction}>
              <Text style={styles.adminActionText}>System Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.adminAction}>
              <Text style={styles.adminActionText}>Reports & Analytics</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* About */}
        <Card>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.aboutInfo}>
            <Text style={styles.aboutText}>SchoolBus Tracker v1.0.0</Text>
            <Text style={styles.aboutText}>© 2024 School Transportation</Text>
          </View>
        </Card>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
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
  profileCard: {
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.gray[800],
    marginBottom: 8,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  editButton: {
    padding: 8,
  },
  contactInfo: {
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
    paddingTop: 16,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 16,
    color: Colors.gray[700],
    marginLeft: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.gray[800],
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  actionItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: Colors.gray[50],
    borderRadius: 8,
  },
  actionText: {
    fontSize: 14,
    color: Colors.gray[700],
    marginTop: 8,
    fontWeight: '500',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  settingContent: {
    marginLeft: 16,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[800],
  },
  settingSubtitle: {
    fontSize: 14,
    color: Colors.gray[600],
    marginTop: 2,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  infoItem: {
    flex: 1,
    minWidth: '45%',
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.gray[600],
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[800],
  },
  adminAction: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  adminActionText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
  },
  aboutInfo: {
    alignItems: 'center',
  },
  aboutText: {
    fontSize: 14,
    color: Colors.gray[600],
    marginBottom: 4,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
    marginLeft: 8,
  },
  bottomPadding: {
    height: 32,
  },
});