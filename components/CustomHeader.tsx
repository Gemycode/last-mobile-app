import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Bell, Menu } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import { useAuthStore } from '../store/authStore';

interface CustomHeaderProps {
  title: string;
  showBackButton?: boolean;
  onMenuPress?: () => void;
}

export default function CustomHeader({ title, showBackButton, onMenuPress }: CustomHeaderProps) {
  const user = useAuthStore(state => state.user);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.leftSection}>
          {onMenuPress && (
            <TouchableOpacity onPress={onMenuPress} style={styles.iconButton}>
              <Menu size={24} color={Colors.white} />
            </TouchableOpacity>
          )}
          <Text style={styles.title}>{title}</Text>
        </View>
        
        <View style={styles.rightSection}>
          <TouchableOpacity style={styles.iconButton}>
            <Bell size={24} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileButton}>
            <User size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.primary,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
});