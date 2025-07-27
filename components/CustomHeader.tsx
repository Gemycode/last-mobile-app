import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Image, Animated, Easing, Dimensions, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Bell, Menu, QrCode, LogOut, ChevronRight, Settings, Shield, Clock, MapPin } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { useAuthStore } from '../store/authStore';
import { useRouter } from 'expo-router';

interface CustomHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onMenuPress?: () => void;
  showNotifications?: boolean;
  notificationCount?: number;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function CustomHeader({ 
  title, 
  subtitle, 
  showBackButton, 
  onMenuPress,
  showNotifications = true,
  notificationCount = 0 
}: CustomHeaderProps) {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const router = useRouter();

  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [pressedIndex, setPressedIndex] = useState<number | null>(null);
  const [drawerAnim] = useState(new Animated.Value(SCREEN_WIDTH * 0.75));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  // Enhanced animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const openDropdown = () => {
    setDropdownVisible(true);
    Animated.timing(drawerAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();
  };

  const closeDropdown = () => {
    Animated.timing(drawerAnim, {
      toValue: SCREEN_WIDTH * 0.75,
      duration: 250,
      useNativeDriver: true,
      easing: Easing.in(Easing.cubic),
    }).start(() => setDropdownVisible(false));
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield size={16} color={Colors.primary} />;
      case 'driver':
        return <MapPin size={16} color={Colors.primary} />;
      case 'parent':
        return <User size={16} color={Colors.primary} />;
      case 'student':
        return <Clock size={16} color={Colors.primary} />;
      default:
        return <User size={16} color={Colors.primary} />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return '#FF6B6B';
      case 'driver':
        return '#4ECDC4';
      case 'parent':
        return '#45B7D1';
      case 'student':
        return '#96CEB4';
      default:
        return Colors.primary;
    }
  };

  const menuItems = [
    {
      label: 'Profile',
      icon: <User size={20} color={Colors.primary} style={styles.itemIcon} />,
      onPress: () => { closeDropdown(); router.push('/profile'); },
      badge: null
    },
    ...(showNotifications ? [{
      label: 'Notifications',
      icon: <Bell size={20} color={Colors.primary} style={styles.itemIcon} />,
      onPress: () => { closeDropdown(); router.push('/notifications'); },
      badge: notificationCount > 0 ? notificationCount : null
    }] : []),
    {
      label: 'Scanner',
      icon: <QrCode size={20} color={Colors.primary} style={styles.itemIcon} />,
      onPress: () => { closeDropdown(); router.push('/scanner'); },
      badge: null
    },
    {
      label: 'Settings',
      icon: <Settings size={20} color={Colors.primary} style={styles.itemIcon} />,
      onPress: () => { closeDropdown(); router.push('/settings'); },
      badge: null
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      
      <LinearGradient 
        colors={[Colors.primary, Colors.secondary, '#667eea']} 
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View 
          style={[
            styles.headerContent,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <View style={styles.welcomeSection}>
            <View style={styles.welcomeTitleRow}>
              <View style={styles.titleContainer}>
                <Text style={styles.welcomeText}>{title}</Text>
                {user?.role && (
                  <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) }]}>
                    {getRoleIcon(user.role)}
                    <Text style={styles.roleText}>{user.role}</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.headerActions}>
                {showNotifications && (
                  <TouchableOpacity
                    onPress={() => router.push('/notifications')}
                    style={styles.notificationButton}
                    accessibilityLabel="Notifications"
                  >
                    <Bell size={24} color={Colors.white} />
                    {notificationCount > 0 && (
                      <View style={styles.notificationBadge}>
                        <Text style={styles.notificationText}>
                          {notificationCount > 99 ? '99+' : notificationCount}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  onPress={openDropdown}
                  style={styles.profileButton}
                  accessibilityLabel="Open user menu"
                >
                  {user?.profileImage ? (
                    <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
                  ) : (
                    <View style={styles.profilePlaceholder}>
                      <User size={24} color={Colors.white} />
                    </View>
                  )}
                  <View style={styles.onlineIndicator} />
                </TouchableOpacity>
              </View>
            </View>
            
            {subtitle && (
              <Animated.Text 
                style={styles.welcomeSubtext}
                entering={Animated.timing(fadeAnim, {
                  toValue: 1,
                  duration: 1000,
                  delay: 300,
                  useNativeDriver: true,
                })}
              >
                {subtitle}
              </Animated.Text>
            )}
          </View>
        </Animated.View>
      </LinearGradient>

      <Modal
        visible={dropdownVisible}
        transparent
        animationType="none"
        onRequestClose={closeDropdown}
      >
        <TouchableOpacity
          style={styles.drawerOverlay}
          activeOpacity={1}
          onPress={closeDropdown}
        >
          <Animated.View
            style={[
              styles.drawer,
              {
                width: SCREEN_WIDTH * 0.8,
                transform: [{ translateX: drawerAnim }],
              },
            ]}
          >
            {/* Enhanced Avatar section */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatarCircle}>
                  {user?.profileImage ? (
                    <Image source={{ uri: user.profileImage }} style={styles.avatarImage} />
                  ) : (
                    <User size={36} color={Colors.primary} />
                  )}
                </View>
                <View style={styles.onlineStatus} />
                {user?.role === 'admin' && (
                  <View style={styles.adminBadge}>
                    <Shield size={12} color="#fff" />
                    <Text style={styles.adminBadgeText}>Admin</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.userInfo}>
                <Text style={styles.avatarName}>
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user?.name || 'Guest User'
                  }
                </Text>
                <View style={styles.roleContainer}>
                  {getRoleIcon(user?.role || 'user')}
                  <Text style={styles.avatarRole}>
                    {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Member'}
                  </Text>
                </View>
                <Text style={styles.userEmail}>{user?.email || 'No email'}</Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            {/* Enhanced Menu items */}
            {menuItems.map((item, idx) => (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.drawerItem,
                  pressedIndex === idx && styles.drawerItemActive,
                ]}
                activeOpacity={0.7}
                onPress={item.onPress}
                onPressIn={() => setPressedIndex(idx)}
                onPressOut={() => setPressedIndex(null)}
                accessibilityRole="menuitem"
                accessibilityLabel={item.label}
              >
                <View style={styles.menuItemContent}>
                  {React.cloneElement(item.icon, { size: 24, color: Colors.primary })}
                  <Text style={styles.drawerText}>{item.label}</Text>
                  {item.badge && (
                    <View style={styles.menuBadge}>
                      <Text style={styles.menuBadgeText}>{item.badge}</Text>
                    </View>
                  )}
                </View>
                <ChevronRight size={16} color={Colors.gray[400]} />
              </TouchableOpacity>
            ))}
            
            <View style={styles.divider} />
            
            {/* Enhanced Logout Button */}
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={async () => { 
                closeDropdown(); 
                await logout(); 
                router.replace('/(auth)/login'); 
              }}
              accessibilityRole="menuitem"
              accessibilityLabel="Logout"
            >
              <View style={styles.logoutContent}>
                <LogOut size={24} color="#D0021B" style={styles.itemIcon} />
                <Text style={styles.logoutText}>Logout</Text>
              </View>
              <View style={styles.logoutArrow}>
                <ChevronRight size={16} color="#D0021B" />
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  gradient: {
    width: '100%',
    paddingTop: 0,
    paddingBottom: 32,
    minHeight: 120,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  welcomeSection: {
    marginTop: 32,
    marginBottom: 24,
    alignItems: 'center',
    width: '100%',
  },
  welcomeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 24,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  welcomeText: {
    ...Typography.h1,
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 24,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  roleText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  notificationText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  profileButton: {
    position: 'relative',
    padding: 4,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  profilePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  welcomeSubtext: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 24,
    fontSize: 14,
  },

  // Enhanced Drawer styles
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  drawer: {
    backgroundColor: '#fff',
    height: '100%',
    borderTopLeftRadius: 32,
    borderBottomLeftRadius: 32,
    paddingTop: 32,
    paddingHorizontal: 24,
    shadowColor: 'rgba(0,0,0,0.3)',
    shadowOffset: { width: -8, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 16,
    zIndex: 100,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: Colors.primary,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    resizeMode: 'cover',
  },
  onlineStatus: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    borderWidth: 3,
    borderColor: Colors.white,
  },
  userInfo: {
    alignItems: 'center',
  },
  avatarName: {
    ...Typography.buttonText,
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 4,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  avatarRole: {
    ...Typography.caption,
    color: Colors.gray[600],
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  userEmail: {
    ...Typography.caption,
    color: Colors.gray[500],
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.gray[200],
    marginVertical: 16,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  drawerItemActive: {
    backgroundColor: Colors.primary + '10',
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  drawerText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: 16,
    flex: 1,
  },
  menuBadge: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  menuBadgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  itemIcon: {
    marginRight: 0,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#D0021B08',
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
    marginTop: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginHorizontal: 0,
    marginBottom: 8,
  },
  logoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoutText: {
    ...Typography.buttonText,
    color: '#D0021B',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 16,
  },
  logoutArrow: {
    marginLeft: 8,
  },
  adminBadge: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  adminBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
