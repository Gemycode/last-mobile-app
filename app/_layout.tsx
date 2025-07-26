import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/appStore';
import { Colors } from '../constants/Colors';
import Animated, { 
  useSharedValue, 
  withSpring, 
  useAnimatedStyle,
  withRepeat,
  withTiming,
  FadeIn,
  FadeInDown,
  FadeInUp,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { Bus, Shield, Users, Activity, Zap, TrendingUp } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function RootLayout() {
  const { theme, loadTheme } = useThemeStore();
  const [showSplash, setShowSplash] = useState(true);
  const [splashProgress, setSplashProgress] = useState(0);
  
  useFrameworkReady();
  const { loadUser, isAuthenticated, isLoading } = useAuthStore();

  // Animations
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const pulseValue = useSharedValue(1);
  const slideValue = useSharedValue(50);
  const progressValue = useSharedValue(0);

  useEffect(() => { 
    loadTheme(); 
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    // Splash screen animations
    logoScale.value = withSpring(1, { damping: 15, stiffness: 100 });
    logoOpacity.value = withSpring(1, { damping: 15, stiffness: 100 });
    slideValue.value = withSpring(0, { damping: 15, stiffness: 100 });
    
    // Pulse animation
    pulseValue.value = withRepeat(
      withTiming(1.05, { duration: 2000 }),
      -1,
      true
    );

    // Progress animation
    progressValue.value = withTiming(1, { duration: 2500 });

    // Simulate loading time
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
  }));

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideValue.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${interpolate(progressValue.value, [0, 1], [0, 100], Extrapolate.CLAMP)}%`,
  }));

  // Update progress
  useEffect(() => {
    const interval = setInterval(() => {
      setSplashProgress(prev => {
        if (prev >= 100) return 100;
        return prev + 2;
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  if (isLoading || showSplash) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar style="light" />
        <LinearGradient 
          colors={[Colors.primary, Colors.secondary, '#667eea']} 
          style={styles.splashGradient}
        >
          {/* Background Pattern */}
          <View style={styles.backgroundPattern}>
            {[...Array(20)].map((_, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.patternDot,
                  {
                    left: Math.random() * width,
                    top: Math.random() * height,
                    opacity: Math.random() * 0.3 + 0.1,
                  },
                  pulseStyle
                ]}
              />
            ))}
          </View>

          {/* Content */}
          <View style={styles.splashContent}>
            {/* Logo Section */}
            <Animated.View style={[styles.logoSection, logoStyle]}>
              <Animated.View style={[styles.logoContainer, pulseStyle]}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                  style={styles.logoGradient}
                >
                  <Bus size={64} color="#fff" />
                </LinearGradient>
              </Animated.View>
              
              <Animated.View style={[styles.titleContainer, slideStyle]}>
                <Text style={styles.appTitle}>BusMS</Text>
                <Text style={styles.appSubtitle}>نظام إدارة الباصات المدرسي</Text>
              </Animated.View>
            </Animated.View>

            {/* Features Section */}
            <Animated.View 
              style={[styles.featuresSection, slideStyle]}
              entering={FadeInUp.delay(500)}
            >
              <View style={styles.featuresGrid}>
                <Animated.View 
                  style={styles.featureCard}
                  entering={FadeInDown.delay(600)}
                >
                  <LinearGradient
                    colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
                    style={styles.featureGradient}
                  >
                    <Shield size={24} color="#fff" />
                    <Text style={styles.featureTitle}>الأمان</Text>
                    <Text style={styles.featureDescription}>تتبع آمن للطلاب</Text>
                  </LinearGradient>
                </Animated.View>

                <Animated.View 
                  style={styles.featureCard}
                  entering={FadeInDown.delay(700)}
                >
                  <LinearGradient
                    colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
                    style={styles.featureGradient}
                  >
                    <Activity size={24} color="#fff" />
                    <Text style={styles.featureTitle}>التتبع المباشر</Text>
                    <Text style={styles.featureDescription}>موقع الباص في الوقت الفعلي</Text>
                  </LinearGradient>
                </Animated.View>

                <Animated.View 
                  style={styles.featureCard}
                  entering={FadeInDown.delay(800)}
                >
                  <LinearGradient
                    colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
                    style={styles.featureGradient}
                  >
                    <Users size={24} color="#fff" />
                    <Text style={styles.featureTitle}>إدارة الطلاب</Text>
                    <Text style={styles.featureDescription}>تسجيل الحضور والغياب</Text>
                  </LinearGradient>
                </Animated.View>

                <Animated.View 
                  style={styles.featureCard}
                  entering={FadeInDown.delay(900)}
                >
                  <LinearGradient
                    colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
                    style={styles.featureGradient}
                  >
                    <TrendingUp size={24} color="#fff" />
                    <Text style={styles.featureTitle}>التقارير</Text>
                    <Text style={styles.featureDescription}>إحصائيات مفصلة</Text>
                  </LinearGradient>
                </Animated.View>
              </View>
            </Animated.View>

            {/* Loading Section */}
            <Animated.View 
              style={[styles.loadingSection, slideStyle]}
              entering={FadeInUp.delay(1000)}
            >
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.loadingText}>جاري تحميل التطبيق...</Text>
                
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <Animated.View style={[styles.progressFill, progressStyle]} />
                  </View>
                  <Text style={styles.progressText}>{splashProgress}%</Text>
                </View>
              </View>
            </Animated.View>

            {/* Footer */}
            <Animated.View 
              style={styles.footer}
              entering={FadeIn.delay(1200)}
            >
              <Text style={styles.footerText}>BusMS - نظام إدارة الباصات المدرسي</Text>
              <Text style={styles.versionText}>الإصدار 1.0.0</Text>
            </Animated.View>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{
        headerShown: false,
        contentStyle: { 
          backgroundColor: theme === 'dark' ? '#18181b' : '#fff' 
        },
        animation: 'slide_from_right',
        animationDuration: 300,
      }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen 
              name="(auth)" 
              options={{
                animation: 'fade',
              }}
            />
            <Stack.Screen name="+not-found" />
          </>
        ) : (
          <>
            <Stack.Screen 
              name="(tabs)" 
              options={{
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen name="+not-found" />
          </>
        )}
      </Stack>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    </>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
  },
  splashGradient: {
    flex: 1,
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  patternDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  splashContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 60,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  appSubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  featuresSection: {
    marginVertical: 40,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  featureCard: {
    width: (width - 60) / 2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  featureGradient: {
    padding: 20,
    alignItems: 'center',
    borderRadius: 16,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 16,
  },
  loadingSection: {
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#fff',
    marginTop: 16,
    marginBottom: 24,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  progressContainer: {
    alignItems: 'center',
    width: 200,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#fff',
    marginTop: 8,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 4,
  },
  versionText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
});