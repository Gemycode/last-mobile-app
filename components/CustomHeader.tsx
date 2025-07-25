import React, { useState, useRef } from 'react';
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

const { width } = Dimensions.get('window'); // Get screen width for better positioning

export default function CustomHeader({ title, subtitle, showBackButton, onMenuPress }: CustomHeaderProps) {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const router = useRouter();

  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [pressedIndex, setPressedIndex] = useState<number | null>(null);

  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9)); // Start slightly smaller for a nice pop
  const [translateYAnim] = useState(new Animated.Value(-10)); // For subtle slide down effect

  const dropdownButtonRef = useRef<View>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const openDropdown = () => {
    dropdownButtonRef.current?.measure((fx, fy, width, height, px, py) => {
      setDropdownPosition({ x: px, y: py, width, height });
      setDropdownVisible(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 6,
          tension: 80,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
      ]).start();
    });
  };

  const closeDropdown = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200, // Slightly longer duration for smoother fade out
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9, // Return to initial scale
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: -10, // Return to initial translateY
        duration: 200,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      }),
    ]).start(() => setDropdownVisible(false));
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
                <View ref={dropdownButtonRef}>
                  <User size={28} color={Colors.white} />
                </View>
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
        <TouchableOpacity style={styles.dropdownOverlay} activeOpacity={1} onPress={closeDropdown}>
          <Animated.View
            style={[
              styles.dropdownMenu,
              {
                position: 'absolute',
                top: dropdownPosition.y + dropdownPosition.height + 0, // التصاق تام بأسفل الأيقونة
                right: width - (dropdownPosition.x + dropdownPosition.width), // محاذاة مع الأيقونة
                marginTop: 0,
                marginHorizontal: 0,
                width: 260, // عرض مناسب فقط
                alignSelf: 'flex-end',
              },
              { opacity: fadeAnim, transform: [{ scale: scaleAnim }, { translateY: translateYAnim }] }
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
              <React.Fragment key={item.label}>
                <Animated.View
                  style={{
                    opacity: fadeAnim,
                    transform: [{ translateY: translateYAnim }],
                  }}
                >
                  <TouchableOpacity
                    style={[
                      styles.dropdownItem,
                      pressedIndex === idx && styles.dropdownItemActive,
                      { justifyContent: 'center' },
                    ]}
                    activeOpacity={0.7}
                    onPress={item.onPress}
                    onPressIn={() => setPressedIndex(idx)}
                    onPressOut={() => setPressedIndex(null)}
                    accessibilityRole="menuitem"
                    accessibilityLabel={item.label}
                  >
                    <View style={[styles.itemRow, { justifyContent: 'center' }]}> {/* وسط العناصر */}
                      {item.icon}
                      <Text style={styles.dropdownText}>{item.label}</Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
                {idx < menuItems.length - 1 && <View style={styles.dividerThin} />}
              </React.Fragment>
            ))}
            {/* Logout Button */}
            <TouchableOpacity
              style={[styles.logoutButton, { justifyContent: 'center' }]}
              onPress={async () => { closeDropdown(); await logout(); router.replace('/(auth)/login'); }}
              accessibilityRole="menuitem"
              accessibilityLabel="Logout"
            >
              <View style={[styles.itemRow, { justifyContent: 'center' }]}> {/* وسط العناصر */}
                <LogOut size={20} color={Colors.error} style={styles.itemIcon} />
                <Text style={styles.logoutText}>Logout</Text>
              </View>
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

  // Dropdown styles
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)', // Slightly darker and more distinct overlay
  },
  dropdownMenu: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    minWidth: 220,
    maxWidth: 320,
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    alignItems: 'stretch',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.gray[200],
    paddingBottom: 8,
    paddingTop: 0,
    marginHorizontal: 0,
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
    paddingVertical: 20, // Increased padding for more breathing room
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
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
    paddingVertical: 16, // More touchable
    paddingHorizontal: 28, // More padding
    backgroundColor: Colors.white,
    borderRadius: 8,
    marginHorizontal: 8,
    marginVertical: 2,
    minHeight: 48,
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
    paddingVertical: 16,
    paddingHorizontal: 28,
    backgroundColor: Colors.error + '10', // Subtle error background
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.gray[200],
    marginTop: 12,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    minHeight: 48,
    marginHorizontal: 8,
    marginBottom: 4,
  },
  logoutText: {
    ...Typography.buttonText,
    color: Colors.error,
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
