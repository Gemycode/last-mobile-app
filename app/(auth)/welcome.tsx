import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bus, MapPin, Users, Shield } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Bus size={80} color={Colors.white} />
        <Text style={styles.title}>SchoolBus Tracker</Text>
        <Text style={styles.subtitle}>Safe, reliable, and connected transportation for your children</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.features}>
          <View style={styles.feature}>
            <MapPin size={24} color={Colors.secondary} />
            <Text style={styles.featureText}>Real-time tracking</Text>
          </View>
          <View style={styles.feature}>
            <Users size={24} color={Colors.secondary} />
            <Text style={styles.featureText}>Multi-user support</Text>
          </View>
          <View style={styles.feature}>
            <Shield size={24} color={Colors.secondary} />
            <Text style={styles.featureText}>Secure & safe</Text>
          </View>
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]} 
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.primaryButtonText}>Sign In</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]} 
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={styles.secondaryButtonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flex: 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.white,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light,
    textAlign: 'center',
    lineHeight: 24,
  },
  content: {
    flex: 0.4,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 40,
    justifyContent: 'space-between',
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 40,
  },
  feature: {
    alignItems: 'center',
  },
  featureText: {
    fontSize: 12,
    color: Colors.gray[600],
    marginTop: 8,
    textAlign: 'center',
  },
  buttons: {
    gap: 12,
    paddingBottom: 20,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.secondary,
  },
  secondaryButtonText: {
    color: Colors.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
});