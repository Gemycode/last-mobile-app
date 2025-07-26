import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Image, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Bell, Menu, QrCode, LogOut, ChevronRight } from 'lucide-react-native'; // Add ChevronRight
import { Colors } from '../constants/Colors'; // Make sure this path is correct
import { Typography } from '../constants/Typography'; // Make sure this path is correct, if you create this file
import { useAuthStore } from '../store/authStore';
import { useRouter } from 'expo-router';

interface CustomHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onMenuPress?: () => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function CustomHeader({ title, subtitle, showBackButton, onMenuPress }: CustomHeaderProps) {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const router = useRouter();

  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [pressedIndex, setPressedIndex] = useState<number | null>(null);

  const [drawerAnim] = useState(new Animated.Value(SCREEN_WIDTH * 0.75));

  const openDropdown = () => {
    setDropdownVisible(true);
    Animated.timing(drawerAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeDropdown = () => {
    Animated.timing(drawerAnim, {
      toValue: SCREEN_WIDTH * 0.75,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setDropdownVisible(false));
  };

  const menuItems = [
    {
      label: 'Profile',
      icon: <User size={20} color={Colors.primary} style={styles.itemIcon} />,
      onPress: () => { closeDropdown(); router.push('/profile'); }
    },
    {
      label: 'Notifications',
      icon: <Bell size={20} color={Colors.primary} style={styles.itemIcon} />,
      onPress: () => { closeDropdown(); router.push('/notifications'); }
    },
    {
      label: 'Scanner',
      icon: <QrCode size={20} color={Colors.primary} style={styles.itemIcon} />,
      onPress: () => { closeDropdown(); router.push('/scanner'); }
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.gradient}>
        <View style={styles.headerContent}>
          <View style={styles.welcomeSection}>
            <View style={styles.welcomeTitleRow}>
              <Text style={styles.welcomeText}>{title}</Text>
              <TouchableOpacity
                onPress={openDropdown}
                style={styles.iconButton}
                accessibilityLabel="Open user menu"
              >
                <User size={28} color={Colors.white} />
              </TouchableOpacity>
            </View>
            {subtitle && (
              <Text style={styles.welcomeSubtext}>{subtitle}</Text>
            )}
          </View>
        </View>
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
                  width: SCREEN_WIDTH * 0.75,
                  transform: [{ translateX: drawerAnim }],
                },
              ]}
          >
            {/* Avatar section */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarCircle}>
                {user?.avatar ? (
                  <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
                ) : (
                  <User size={36} color={Colors.primary} />
                )}
                {user?.role === 'admin' && (
                  <View style={styles.adminBadge}>
                    <Text style={styles.adminBadgeText}>Admin</Text>
                  </View>
                )}
              </View>
              <Text style={styles.avatarName}>{user?.name || 'Guest User'}</Text>
              <Text style={styles.avatarRole}>{user?.role || 'Member'}</Text>
            </View>
            <View style={styles.divider} />
            {/* Menu items */}
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
                {React.cloneElement(item.icon, { size: 24, color: '#4A90E2' })}
                <Text style={styles.drawerText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
            {/* Logout Button */}
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={async () => { closeDropdown(); await logout(); router.replace('/(auth)/login'); }}
              accessibilityRole="menuitem"
              accessibilityLabel="Logout"
            >
              <LogOut size={24} color="#D0021B" style={styles.itemIcon} />
              <Text style={[styles.drawerText, { color: '#D0021B' }]}>Logout</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    // backgroundColor: Colors.primary,
  },
  gradient: {
    width: '100%',
    paddingTop: 0,
    paddingBottom: 32,
    minHeight: 100,
    borderBottomLeftRadius: 24, // Softer, more modern radius
    borderBottomRightRadius: 24,
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
    width: '100%', // Ensure it takes full width for centering content
  },
  welcomeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center title and icon horizontally
    width: '100%', // Allow full width to position icon
    paddingHorizontal: 20, // Add padding to prevent content from touching edges
  },
  welcomeText: {
    ...Typography.h1, // Use defined typography
    flexShrink: 1, // Allow text to shrink if long
    marginRight: 12, // Space between title and icon
  },
  welcomeSubtext: {
    ...Typography.caption, // Use defined typography
    color: Colors.gray[100], // Brighter gray for better contrast on dark background
    marginTop: 8, // More spacing
    textAlign: 'center',
    paddingHorizontal: 20, // Consistent padding
  },
  iconButton: {
    padding: 10, // Larger touch target
    borderRadius: 24, // Make it a circle
    backgroundColor: 'rgba(255,255,255,0.15)', // Subtle background for the icon button
    marginLeft: 'auto', // Push icon to the right
  },

  // Drawer styles
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  drawer: {
    backgroundColor: '#fff',
    height: '100%',
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    paddingTop: 32,
    paddingHorizontal: 24,
    shadowColor: 'rgba(0,0,0,0.18)',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 12,
    zIndex: 100,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  drawerItemActive: {
    backgroundColor: '#F5A62322',
  },
  drawerText: {
    fontSize: 18,
    color: '#4A90E2',
    fontWeight: '600',
    marginLeft: 16,
  },
  arrowContainer: {
    position: 'absolute',
    top: -10, // Adjusted to overlap slightly for a cleaner look
    width: 20,
    height: 10,
    alignItems: 'center',
    overflow: 'hidden', // Hide parts of the rotated square
  },
  arrow: {
    width: 16,
    height: 16,
    backgroundColor: Colors.white,
    transform: [{ rotate: '45deg' }],
    borderTopLeftRadius: 3, // Match dropdown corner radius style
    borderTopRightRadius: 3,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.gray[200],
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, // Very subtle shadow for the arrow
    shadowRadius: 2,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24, // More padding for better spacing
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  avatarCircle: {
    width: 60, // Slightly larger avatar
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10, // More space below avatar
    overflow: 'hidden',
    borderWidth: 2, // Small border to define avatar
    borderColor: Colors.gray[200],
  },
  avatarImage: {
    width: '100%', // Fill the circle
    height: '100%',
    borderRadius: 30,
    resizeMode: 'cover',
  },
  avatarName: {
    ...Typography.buttonText, // Using a consistent text style
    color: Colors.primary,
    fontWeight: '600', // Slightly bolder for names
    marginBottom: 2,
  },
  avatarRole: {
    ...Typography.caption, // Using a consistent text style
    color: Colors.gray[500],
  },
  divider: {
    height: 1, // Thinner divider
    backgroundColor: Colors.gray[200],
    marginVertical: 8, // More vertical margin for separation
  },
  dividerThin: {
    height: StyleSheet.hairlineWidth, // Extremely thin line for subtle separation
    backgroundColor: Colors.gray[100],
    marginHorizontal: 20, // Indent thin dividers
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18, // More touchable
    paddingHorizontal: 24, // Better padding
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginHorizontal: 12,
    marginVertical: 3,
    minHeight: 52,
  },
  dropdownItemActive: {
    backgroundColor: Colors.gray[100],
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  itemIcon: {
    marginRight: 16,
  },
  dropdownText: {
    ...Typography.buttonText,
    color: Colors.primary,
    fontWeight: '500',
    fontSize: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    backgroundColor: '#D0021B08', // Subtle error background
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
    marginTop: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    minHeight: 52,
    marginHorizontal: 12,
    marginBottom: 8,
  },
  logoutText: {
    ...Typography.buttonText,
    color: '#D0021B',
    fontWeight: '600',
    fontSize: 16,
  },
  adminBadge: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  adminBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
