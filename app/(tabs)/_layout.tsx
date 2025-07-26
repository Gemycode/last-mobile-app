import React from 'react';
import { Tabs } from 'expo-router';
import { 
  Home, 
  Users, 
  Bus, 
  MapPin, 
  BarChart3, 
  QrCode, 
  Calendar, 
  Bell, 
  MessageCircle,
  Shield,
  Activity,
  TrendingUp,
  BookOpen,
  Navigation,
  Car,
  School,
  UserCheck,
  Route,
  Clock,
  Zap
} from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { useAuthStore } from '../../store/authStore';
import { fetchChatMessages } from '../../services/busService';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  withSpring, 
  useAnimatedStyle,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function TabsLayout() {
  const user = useAuthStore(state => state.user);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const getUnread = async () => {
      // Try to get busId from user.busId or from first bus in user.buses array
      const busId =
        (user && 'busId' in user && user.busId) ||
        (user && 'buses' in user && Array.isArray(user.buses) && user.buses[0]?._id);

      // Try to get userId from user._id or user.id
      const userId =
        (user && '_id' in user && user._id) ||
        (user && 'id' in user && user.id);

      if (!busId || !userId) return;
      try {
        const messages = await fetchChatMessages(busId, '');
        const unread = messages.filter((msg: any) => !msg.readBy?.includes(userId) && msg.senderId !== userId).length;
        setUnreadCount(unread);
      } catch (error) {
        console.log('Error fetching chat messages:', error);
        setUnreadCount(0);
      }
    };
    getUnread();
    // يمكنك إضافة setInterval هنا للتحديث كل دقيقة
  }, [user]);

  // الحماية بعد كل الـ hooks
  if (!user) {
    return null;
  }

  const getTabsForRole = () => {
    switch (user?.role) {
      case 'parent':
        return [
          { 
            name: 'index', 
            title: 'Home', 
            icon: Home,
            gradientColors: ['#3B82F6', '#1D4ED8'],
            description: 'Dashboard'
          },
          { 
            name: 'children', 
            title: 'Children', 
            icon: Users,
            gradientColors: ['#10B981', '#059669'],
            description: 'Manage Children'
          },
          { 
            name: 'buses', 
            title: 'Buses', 
            icon: Bus,
            gradientColors: ['#F59E0B', '#D97706'],
            description: 'Bus Information'
          },
          { 
            name: 'tracking', 
            title: 'Tracking', 
            icon: MapPin,
            gradientColors: ['#8B5CF6', '#7C3AED'],
            description: 'Track Bus'
          },
          { 
            name: 'chat', 
            title: 'Chat', 
            icon: MessageCircle,
            gradientColors: ['#EF4444', '#DC2626'],
            description: 'Contact Driver'
          },
        ];
      case 'driver':
        return [
          { 
            name: 'index', 
            title: 'Trips', 
            icon: Calendar,
            gradientColors: ['#3B82F6', '#1D4ED8'],
            description: 'Trip Schedule'
          },
          { 
            name: 'tracking', 
            title: 'Location', 
            icon: Navigation,
            gradientColors: ['#10B981', '#059669'],
            description: 'Update Location'
          },
          { 
            name: 'chat', 
            title: 'Chat', 
            icon: MessageCircle,
            gradientColors: ['#8B5CF6', '#7C3AED'],
            description: 'Contact Parents'
          },
        ];
      case 'student':
        return [
          { 
            name: 'index', 
            title: 'My Bus', 
            icon: School,
            gradientColors: ['#3B82F6', '#1D4ED8'],
            description: 'Bus Information'
          },
          { 
            name: 'booking', 
            title: 'Booking', 
            icon: BookOpen,
            gradientColors: ['#10B981', '#059669'],
            description: 'Book Trip'
          },
          { 
            name: 'tracking', 
            title: 'Tracking', 
            icon: MapPin,
            gradientColors: ['#F59E0B', '#D97706'],
            description: 'Track Bus'
          },
          { 
            name: 'chat', 
            title: 'Chat', 
            icon: MessageCircle,
            gradientColors: ['#8B5CF6', '#7C3AED'],
            description: 'Contact Driver'
          },
        ];
      case 'admin':
        return [
          { 
            name: 'index', 
            title: 'Dashboard', 
            icon: BarChart3,
            gradientColors: ['#3B82F6', '#1D4ED8'],
            description: 'Statistics'
          },
          { 
            name: 'buses', 
            title: 'Buses', 
            icon: Car,
            gradientColors: ['#10B981', '#059669'],
            description: 'Manage Buses'
          },
          { 
            name: 'tracking', 
            title: 'Tracking', 
            icon: Route,
            gradientColors: ['#F59E0B', '#D97706'],
            description: 'Track All Buses'
          },
          { 
            name: 'chat', 
            title: 'Chat', 
            icon: MessageCircle,
            gradientColors: ['#8B5CF6', '#7C3AED'],
            description: 'Manage Chats'
          },
        ];
      default:
        return [];
    }
  };

  const tabs = getTabsForRole();

  const CustomTabIcon = ({ tab, color, size, focused }: any) => {
    const scaleValue = useSharedValue(1);
    const opacityValue = useSharedValue(0.6);

    React.useEffect(() => {
      if (focused) {
        scaleValue.value = withSpring(1.1, { damping: 10, stiffness: 100 });
        opacityValue.value = withSpring(1, { damping: 10, stiffness: 100 });
      } else {
        scaleValue.value = withSpring(1, { damping: 10, stiffness: 100 });
        opacityValue.value = withSpring(0.6, { damping: 10, stiffness: 100 });
      }
    }, [focused]);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scaleValue.value }],
      opacity: opacityValue.value,
    }));

    return (
      <Animated.View style={[styles.tabIconContainer, animatedStyle]}>
        {focused ? (
          <LinearGradient
            colors={tab.gradientColors}
            style={styles.iconGradient}
          >
            <tab.icon size={size - 2} color="#fff" />
          </LinearGradient>
        ) : (
          <View style={styles.iconContainer}>
            <tab.icon size={size} color={color} />
          </View>
        )}
        
        {tab.name === 'chat' && unreadCount > 0 && (
          <View style={styles.badgeContainer}>
            <LinearGradient
              colors={['#EF4444', '#DC2626']}
              style={styles.badge}
            >
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </LinearGradient>
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray[500],
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#f1f5f9',
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 8,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, size, focused }) => (
              <CustomTabIcon 
                tab={tab} 
                color={color} 
                size={size} 
                focused={focused} 
              />
            ),
          }}
        />
      ))}
      {/* Hide children and buses tabs for roles that shouldn't see them */}
      {!tabs.some(tab => tab.name === 'children') && (
        <Tabs.Screen name="children" options={{ href: null }} />
      )}
      {!tabs.some(tab => tab.name === 'buses') && (
        <Tabs.Screen name="buses" options={{ href: null }} />
      )}
      {!tabs.some(tab => tab.name === 'booking') && (
        <Tabs.Screen name="booking" options={{ href: null }} />
      )}
      {/* إخفاء تبويبات إضافية للطالب */}
      {user?.role === 'student' && (
        <>
          <Tabs.Screen name="children" options={{ href: null }} />
          <Tabs.Screen name="buses" options={{ href: null }} />
        </>
      )}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeContainer: {
    position: 'absolute',
    top: -4,
    right: -8,
    zIndex: 1,
  },
  badge: {
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});