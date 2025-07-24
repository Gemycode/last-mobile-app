import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bus, MapPin, Users, Shield, ArrowRight } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';

const { width } = Dimensions.get('window');

const features = [
  {
    icon: Bus,
    color: Colors.primary,
    title: 'Live Bus Tracking',
    description: 'Track your child’s bus in real-time with accurate location updates.'
  },
  {
    icon: MapPin,
    color: '#10B981',
    title: 'Smart Routes',
    description: 'Optimized routes for safe and timely pickups and drop-offs.'
  },
  {
    icon: Users,
    color: '#F59E0B',
    title: 'Family Management',
    description: 'Easily manage multiple children and their bus assignments.'
  },
  {
    icon: Shield,
    color: '#EF4444',
    title: 'Safety First',
    description: 'Verified drivers and secure rides for peace of mind.'
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const fadeValue = useSharedValue(0);
  React.useEffect(() => {
    fadeValue.value = withSpring(1, { damping: 15, stiffness: 100 });
  }, []);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeValue.value,
    transform: [{ translateY: (1 - fadeValue.value) * 30 }],
  }));

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={[Colors.primary, '#3A6D8C']} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Hero Section */}
          <Animated.View style={[styles.heroSection, animatedStyle]}>
            <View style={styles.logoContainer}>
              <LinearGradient colors={['#fff', '#f8fafc']} style={styles.logoBackground}>
                <Text style={styles.logoText}>🚌</Text>
              </LinearGradient>
            </View>
            <Text style={styles.appName}>SafeBus</Text>
            <Text style={styles.tagline}>Safe school transportation made simple</Text>
            <Image
              source={{ uri: 'https://images.pexels.com/photos/5088017/pexels-photo-5088017.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop' }}
              style={styles.heroImage}
            />
          </Animated.View>

          {/* Features Section */}
          <Animated.View style={[styles.featuresSection, animatedStyle]}>
            <Text style={styles.featuresTitle}>Why Choose SafeBus?</Text>
            {features.map((feature, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.featureCard,
                  animatedStyle,
                  { 
                    transform: [{ 
                      translateY: useSharedValue(fadeValue.value + (index * 20)) 
                    }] 
                  }
                ]}
              >
                <View style={[styles.featureIcon, { backgroundColor: feature.color + '20' }]}> 
                  <feature.icon size={24} color={feature.color} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </Animated.View>
            ))}
          </Animated.View>
        </ScrollView>
        {/* Action Buttons */}
        <Animated.View style={[styles.actionSection, animatedStyle]}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <LinearGradient colors={[Colors.primary, '#3A6D8C']} style={styles.buttonGradient}>
              <Text style={[styles.primaryButtonText, { color: Colors.primary }]}>Get Started</Text>
              <ArrowRight size={20} color={Colors.primary} />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.secondaryButtonText}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    fontSize: 40,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 32,
  },
  heroImage: {
    width: width - 80,
    height: 200,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  featuresSection: {
    flex: 1,
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    backdropFilter: 'blur(10px)',
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
  },
  actionSection: {
    paddingBottom: 40,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginRight: 8,
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  secondaryButtonText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textDecorationLine: 'underline',
  },
  scrollContent: {
    paddingBottom: 60,
  },
});