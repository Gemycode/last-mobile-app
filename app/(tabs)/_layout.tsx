import React from 'react';
import { Tabs } from 'expo-router';
import { Chrome as Home, Users, Bus, MapPin, ChartBar as BarChart3, QrCode, Calendar } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { useAuthStore } from '../../store/authStore';

export default function TabsLayout() {
  const user = useAuthStore(state => state.user);

  const getTabsForRole = () => {
    switch (user?.role) {
      case 'parent':
        return [
          { name: 'index', title: 'Home', icon: Home },
          { name: 'children', title: 'Children', icon: Users },
          { name: 'buses', title: 'Buses', icon: Bus },
          { name: 'tracking', title: 'Track', icon: MapPin },
          { name: 'profile', title: 'Profile', icon: Users },
        ];
      case 'driver':
        return [
          { name: 'index', title: 'Trips', icon: Calendar },
          { name: 'tracking', title: 'Location', icon: MapPin },
          { name: 'scanner', title: 'Scanner', icon: QrCode },
          { name: 'profile', title: 'Profile', icon: Users },
        ];
      case 'admin':
        return [
          { name: 'index', title: 'Dashboard', icon: BarChart3 },
          { name: 'buses', title: 'Buses', icon: Bus },
          { name: 'tracking', title: 'Tracking', icon: MapPin },
          { name: 'profile', title: 'Profile', icon: Users },
        ];
      case 'student':
        return [
          { name: 'index', title: 'My Bus', icon: Bus },
          { name: 'tracking', title: 'Track', icon: MapPin },
          { name: 'profile', title: 'Profile', icon: Users },
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
            tabBarIcon: ({ color, size }) => <tab.icon size={size} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}