import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/appStore';
import { View } from 'react-native';
import CustomHeader from '../components/CustomHeader';

export default function RootLayout() {
  const { theme, loadTheme } = useThemeStore();
  useEffect(() => { loadTheme(); }, []);
  useFrameworkReady();
  const { loadUser, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  if (isLoading) {
    return null; // Show splash screen while loading
  }

  return (
    <>
      <Stack screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme === 'dark' ? '#18181b' : '#fff' }
      }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="+not-found" />
          </>
        ) : (
          <>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="+not-found" />
          </>
        )}
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}