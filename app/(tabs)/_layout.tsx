import React from 'react';
import { Tabs } from 'expo-router';
import { Chrome as Home, Users, Bus, MapPin, ChartBar as BarChart3, QrCode, Calendar, Bell, MessageCircle } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { useAuthStore } from '../../store/authStore';
import { fetchChatMessages } from '../../services/busService';
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';

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
      const messages = await fetchChatMessages(busId);
      const unread = messages.filter((msg: any) => !msg.readBy?.includes(userId) && msg.senderId !== userId).length;
      setUnreadCount(unread);
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
          { name: 'index', title: 'Home', icon: Home },
          { name: 'children', title: 'Children', icon: Users },
          { name: 'buses', title: 'Buses', icon: Bus },
          { name: 'tracking', title: 'Track', icon: MapPin },
          { name: 'chat', title: 'Chat', icon: MessageCircle },
        ];
      case 'driver':
        return [
          { name: 'index', title: 'Trips', icon: Calendar },
          { name: 'tracking', title: 'Location', icon: MapPin },
          { name: 'chat', title: 'Chat', icon: MessageCircle },
        ];
      case 'student':
        return [
          { name: 'index', title: 'My Bus', icon: Bus },
          { name: 'tracking', title: 'Track', icon: MapPin },
          { name: 'chat', title: 'Chat', icon: MessageCircle },
        ];
      case 'admin':
        return [
          { name: 'index', title: 'Dashboard', icon: Home },
          { name: 'buses', title: 'Buses', icon: Bus },
          { name: 'tracking', title: 'Track', icon: MapPin },
          { name: 'chat', title: 'Chat', icon: MessageCircle },
        ];
      default:
        return [];
    }
  };

  const tabs = getTabsForRole();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray[500],
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.gray[200],
        },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, size }) =>
              tab.name === 'chat' && unreadCount > 0 ? (
                <View>
                  <tab.icon size={size} color={color} />
                  <View style={{ position: 'absolute', top: -4, right: -8, backgroundColor: 'red', borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 }}>
                    <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>{unreadCount}</Text>
                  </View>
                </View>
              ) : (
                <tab.icon size={size} color={color} />
              ),
          }}
        />
      ))}
    </Tabs>
  );
}