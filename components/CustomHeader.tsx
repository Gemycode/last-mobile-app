import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Image, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Bell, Menu, QrCode, LogOut } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import { useAuthStore } from '../store/authStore';
import { useRouter } from 'expo-router';

interface CustomHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onMenuPress?: () => void;
}

export default function CustomHeader({ title, subtitle, showBackButton, onMenuPress }: CustomHeaderProps) {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const router = useRouter();
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [pressedIndex, setPressedIndex] = useState<number | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.95));
  const dropdownButtonRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const openDropdown = () => {
    if (dropdownButtonRef.current) {
      (dropdownButtonRef.current as any).measure((fx: number, fy: number, width: number, height: number, px: number, py: number) => {
        setDropdownPosition({ x: px, y: py, width, height });
        setDropdownVisible(true);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 180,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            friction: 7,
          })
        ]).start();
      });
    } else {
      setDropdownVisible(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 7,
        })
      ]).start();
    }
  };
  const closeDropdown = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 120,
        useNativeDriver: true,
      })
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
      <LinearGradient colors={[Colors.primary, '#3A6D8C']} style={styles.gradient}>
        <View style={styles.headerContent}>
          <View style={styles.centerSection}>
            <View style={styles.welcomeSection}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={styles.welcomeText}>{title}</Text>
                <TouchableOpacity ref={dropdownButtonRef} onPress={openDropdown} style={[styles.iconButton, { marginLeft: 12 }]}> 
                  <User size={28} color={Colors.white} />
                </TouchableOpacity>
              </View>
              {subtitle && (
                <Text style={styles.welcomeSubtext}>{subtitle}</Text>
              )}
            </View>
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
          <Animated.View style={[
            styles.dropdownMenu,
            {
              position: 'absolute',
              top: dropdownPosition.y + dropdownPosition.height + 8,
              left: dropdownPosition.x - 120 + dropdownPosition.width / 2,
            },
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
          ]}>
            {/* السهم أعلى القائمة */}
            <View style={styles.arrowContainer} pointerEvents="none">
              <View style={styles.arrow} />
            </View>
            {/* Avatar section */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarCircle}>
                {user?.avatar ? (
                  <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
                ) : (
                  <User size={32} color={Colors.primary} />
                )}
              </View>
              <Text style={styles.avatarName}>{user?.name || 'User'}</Text>
              <Text style={styles.avatarRole}>{user?.role || ''}</Text>
            </View>
            <View style={styles.divider} />
            {/* Menu items */}
            {menuItems.map((item, idx) => (
              <React.Fragment key={item.label}>
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    pressedIndex === idx && styles.dropdownItemActive
                  ]}
                  activeOpacity={0.7}
                  onPress={item.onPress}
                  onPressIn={() => setPressedIndex(idx)}
                  onPressOut={() => setPressedIndex(null)}
                >
                  <View style={styles.itemRow}>
                    {item.icon}
                    <Text style={styles.dropdownText}>{item.label}</Text>
                  </View>
                </TouchableOpacity>
                {idx < menuItems.length - 1 && <View style={styles.dividerThin} />}
              </React.Fragment>
            ))}
            {/* زر تسجيل الخروج */}
            <TouchableOpacity style={styles.logoutButton} onPress={async () => { closeDropdown(); await logout(); router.replace('/(auth)/login'); }}>
              <View style={styles.itemRow}>
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
    backgroundColor: Colors.primary,
  },
  gradient: {
    width: '100%',
    paddingTop: 0,
    paddingBottom: 32,
    minHeight: 100,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  centerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigTitle: {
    color: Colors.white,
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
    minHeight: 72,
    backgroundColor: Colors.primary,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  title: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  iconButton: {
    padding: 8,
  },
  profileButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  menuButton: {
    marginLeft: 8,
    padding: 8,
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  dropdownMenu: {
    backgroundColor: 'white',
    borderRadius: 22,
    margin: 16,
    minWidth: 230,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    alignItems: 'stretch',
    borderWidth: 0.5,
    borderColor: Colors.gray[100],
  },
  arrowContainer: {
    position: 'absolute',
    top: -12,
    right: 32,
    zIndex: 10,
    width: 24,
    height: 12,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  arrow: {
    width: 18,
    height: 18,
    backgroundColor: 'white',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    transform: [{ rotate: '45deg' }],
    marginTop: 6,
    borderWidth: 0.5,
    borderColor: Colors.gray[100],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
  },
  avatarSection: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: 'transparent',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    resizeMode: 'cover',
  },
  avatarName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  avatarRole: {
    fontSize: 13,
    color: Colors.gray[500],
    marginTop: 2,
  },
  divider: {
    height: 1.5,
    backgroundColor: Colors.gray[200],
    marginHorizontal: 0,
    marginBottom: 2,
  },
  dividerThin: {
    height: 1,
    backgroundColor: Colors.gray[100],
    marginHorizontal: 0,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: Colors.white,
  },
  dropdownItemActive: {
    backgroundColor: Colors.gray[100],
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIcon: {
    marginRight: 14,
  },
  dropdownText: {
    fontSize: 17,
    color: Colors.primary,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
    marginTop: 8,
  },
  logoutText: {
    fontSize: 17,
    color: Colors.error,
    fontWeight: '500',
  },
  welcomeSection: {
    marginTop: 32,
    marginBottom: 24,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 15,
    color: '#e2e8f0',
    marginBottom: 8,
    textAlign: 'center',
  },
});