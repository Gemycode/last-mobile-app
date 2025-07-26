import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
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
import { Colors } from '../constants/Colors';

const { width, height } = Dimensions.get('window');

export default function Index() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const [isLoading, setIsLoading] = useState(true);
  
  // Enhanced animations
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const pulseValue = useSharedValue(1);
  const slideValue = useSharedValue(0);
  const progressValue = useSharedValue(0);

  useEffect(() => {
    // Start animations
    logoOpacity.value = withSpring(1, { damping: 15, stiffness: 100 });
    logoScale.value = withSpring(1, { damping: 15, stiffness: 100 });
    
    // Pulse animation
    pulseValue.value = withRepeat(
      withTiming(1.05, { duration: 2000 }),
      -1,
      true
    );
    
    // Slide animation
    slideValue.value = withSpring(1, { damping: 15, stiffness: 100 });
    
    // Progress animation
    progressValue.value = withTiming(1, { duration: 2000 });
    
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);
    
    return () => clearTimeout(timer);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
  }));

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(slideValue.value, [0, 1], [50, 0], Extrapolate.CLAMP) }],
    opacity: slideValue.value,
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value * 100}%`,
  }));

  // If not loading and authenticated, redirect to tabs
  if (!isLoading && isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }
  
  // If not loading and not authenticated, redirect to welcome
  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/(auth)/welcome" />;
  }

  // Show loading screen
  return (
    <>
      <StatusBar style="light" />
      <LinearGradient
        colors={[Colors.primary, '#3A6D8C', '#667eea']}
        style={styles.container}
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
                  animationDelay: `${i * 100}ms`,
                },
              ]}
            />
          ))}
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Logo Section */}
          <Animated.View style={[styles.logoSection, logoStyle]}>
            <Animated.View style={[styles.logoContainer, pulseStyle]}>
              <LinearGradient
                colors={['#ffffff', '#f8fafc']}
                style={styles.logoGradient}
              >
                <Bus size={48} color={Colors.primary} />
              </LinearGradient>
            </Animated.View>
            
            <Animated.View style={[styles.titleContainer, slideStyle]}>
              <Text style={styles.appTitle}>BusMS</Text>
              <Text style={styles.appSubtitle}>نظام إدارة الباصات المدرسي</Text>
            </Animated.View>
          </Animated.View>

          {/* Features Section */}
          <Animated.View entering={FadeInUp.delay(500)} style={styles.featuresSection}>
            <View style={styles.featuresGrid}>
              <Animated.View entering={FadeInDown.delay(600)} style={styles.featureCard}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                  style={styles.featureGradient}
                >
                  <Shield size={24} color="#fff" />
                  <Text style={styles.featureTitle}>الأمان</Text>
                  <Text style={styles.featureDescription}>تتبع آمن للأطفال</Text>
                </LinearGradient>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(700)} style={styles.featureCard}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                  style={styles.featureGradient}
                >
                  <Activity size={24} color="#fff" />
                  <Text style={styles.featureTitle}>التتبع المباشر</Text>
                  <Text style={styles.featureDescription}>مراقبة الباصات في الوقت الفعلي</Text>
                </LinearGradient>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(800)} style={styles.featureCard}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                  style={styles.featureGradient}
                >
                  <Users size={24} color="#fff" />
                  <Text style={styles.featureTitle}>التواصل</Text>
                  <Text style={styles.featureDescription}>تواصل مباشر مع السائقين</Text>
                </LinearGradient>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(900)} style={styles.featureCard}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                  style={styles.featureGradient}
                >
                  <TrendingUp size={24} color="#fff" />
                  <Text style={styles.featureTitle}>الإحصائيات</Text>
                  <Text style={styles.featureDescription}>تقارير مفصلة ومحدثة</Text>
                </LinearGradient>
              </Animated.View>
            </View>
          </Animated.View>

          {/* Loading Section */}
          <Animated.View entering={FadeInUp.delay(1000)} style={styles.loadingSection}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>جاري التحميل...</Text>
              
              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <Animated.View style={[styles.progressFill, progressStyle]} />
                </View>
                <Text style={styles.progressText}>تهيئة النظام</Text>
              </View>
            </View>
          </Animated.View>

          {/* Footer */}
          <Animated.View entering={FadeIn.delay(1200)} style={styles.footer}>
            <Text style={styles.footerText}>© 2024 BusMS - جميع الحقوق محفوظة</Text>
            <Text style={styles.versionText}>الإصدار 2.0.0</Text>
          </Animated.View>
        </View>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Background Pattern
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  patternDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  
  // Content
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  
  // Logo Section
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  titleContainer: {
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  appSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  
  // Features Section
  featuresSection: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  featureCard: {
    width: (width - 64) / 2 - 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  featureGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 120,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 16,
  },
  
  // Loading Section
  loadingSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#fff',
    marginTop: 16,
    marginBottom: 24,
    fontWeight: '600',
  },
  progressContainer: {
    alignItems: 'center',
    width: 200,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  
  // Footer
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  versionText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
  },
});