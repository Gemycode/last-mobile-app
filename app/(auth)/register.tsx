import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Mail, Lock, User, Eye, EyeOff, Phone, ArrowLeft, ArrowRight, Edit } from 'lucide-react-native';
import AuthLayout from '../../components/AuthLayout';
import { Colors } from '../../constants/Colors';
import { useAuthStore } from '../../store/authStore';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    licenseNumber: '',
    role: 'parent' as 'parent' | 'driver' | 'student',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const fadeValue = useSharedValue(0);
  React.useEffect(() => {
    fadeValue.value = withSpring(1, { damping: 15, stiffness: 100 });
  }, []);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeValue.value,
    transform: [{ translateY: (1 - fadeValue.value) * 30 }],
  }));
  
  const router = useRouter();
  const register = useAuthStore(state => state.register);

  const handleRegister = async () => {
    const { firstName, lastName, email, password, confirmPassword, role, phone, licenseNumber } = formData;
    
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (role === 'driver' && (!phone || !licenseNumber)) {
      Alert.alert('Error', 'Phone and license number are required for drivers');
      return;
    }

    setLoading(true);
    const payload: any = { firstName, lastName, email, password, role };
    if (phone) payload.phone = phone;
    if (role === 'driver' && licenseNumber) payload.licenseNumber = licenseNumber;
    const success = await register(payload);
    
    if (success) {
      router.replace('/(tabs)');
    } else {
      Alert.alert('Error', 'Registration failed');
    }
    setLoading(false);
  };

  const updateFormData = (key: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const { firstName, lastName, email, password, confirmPassword, phone, licenseNumber, role } = formData;

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      
      <LinearGradient colors={[Colors.primary, '#3A6D8C']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Account</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Welcome Section */}
          <Animated.View style={[styles.welcomeSection, animatedStyle]}>
            <View style={styles.logoContainer}>
              <LinearGradient colors={['#fff', '#f8fafc']} style={styles.logoBackground}>
                <Text style={styles.logoText}>🚌</Text>
              </LinearGradient>
            </View>
            <Text style={styles.welcomeTitle}>Join SafeBus</Text>
            <Text style={styles.welcomeSubtitle}>
              Create your account to start tracking your children's safe transportation
            </Text>
          </Animated.View>

          {/* Form Section */}
          <Animated.View style={[styles.formSection, animatedStyle]}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>First Name</Text>
              <View style={styles.inputWrapper}>
                <User size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={firstName}
                  onChangeText={val => updateFormData('firstName', val)}
                  placeholder="Enter your first name"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="words"
                />
              </View>
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <View style={styles.inputWrapper}>
                <User size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={lastName}
                  onChangeText={val => updateFormData('lastName', val)}
                  placeholder="Enter your last name"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Mail size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={val => updateFormData('email', val)}
                  placeholder="Enter your email"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <View style={styles.inputWrapper}>
                <Phone size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={val => updateFormData('phone', val)}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                />
              </View>
            </View>
            {role === 'driver' && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>License Number</Text>
                <View style={styles.inputWrapper}>
                  <Edit size={20} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={licenseNumber}
                    onChangeText={val => updateFormData('licenseNumber', val)}
                    placeholder="Enter your license number"
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="characters"
                  />
                </View>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputWrapper}>
                <Lock size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={password}
                  onChangeText={val => updateFormData('password', val)}
                  placeholder="Create a password"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#64748b" />
                  ) : (
                    <Eye size={20} color="#64748b" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <Lock size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={confirmPassword}
                  onChangeText={val => updateFormData('confirmPassword', val)}
                  placeholder="Confirm your password"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color="#64748b" />
                  ) : (
                    <Eye size={20} color="#64748b" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                By creating an account, you agree to our{' '}
                <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.registerButton, loading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              <LinearGradient colors={[Colors.primary, '#3A6D8C']} style={styles.registerGradient}>
                <Text style={[styles.registerButtonText, { color: Colors.primary }]}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Text>
                {!loading && <ArrowRight size={20} color={Colors.primary} />}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Social Register Section */}
          <Animated.View style={[styles.socialSection, animatedStyle]}>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or sign up with</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialButtons}>
              <TouchableOpacity style={styles.socialButton}>
                <Text style={styles.socialButtonText}>📱 Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Text style={styles.socialButtonText}>📧 Apple</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Sign In Link */}
          <Animated.View style={[styles.signinSection, animatedStyle]}>
            <Text style={styles.signinText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.signinLink}>Sign In</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoBackground: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    fontSize: 28,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
  formSection: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    backdropFilter: 'blur(10px)',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    paddingVertical: 12,
  },
  passwordInput: {
    paddingRight: 12,
  },
  eyeButton: {
    padding: 8,
  },
  termsContainer: {
    marginBottom: 24,
  },
  termsText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
  termsLink: {
    color: '#fff',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  registerButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  registerButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginRight: 8,
  },
  socialSection: {
    marginBottom: 24,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dividerText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginHorizontal: 16,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  socialButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 6,
    backdropFilter: 'blur(10px)',
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  signinSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  signinText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  signinLink: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textDecorationLine: 'underline',
  },
});