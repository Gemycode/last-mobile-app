import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import AuthLayout from '../../components/AuthLayout';
import { Colors } from '../../constants/Colors';
import { useAuthStore } from '../../store/authStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const login = useAuthStore(state => state.login);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    const success = await login(email, password);
    
    if (success) {
      router.replace('/(tabs)');
    } else {
      Alert.alert('Error', 'Invalid credentials. Try demo accounts: parent@demo.com, driver@demo.com, admin@demo.com, student@demo.com (password: demo123)');
    }
    setLoading(false);
  };

  return (
    <AuthLayout 
      title="Welcome Back!" 
      subtitle="Sign in to continue tracking your school bus"
    >
      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Mail size={20} color={Colors.gray[500]} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Lock size={20} color={Colors.gray[500]} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            {showPassword ? 
              <EyeOff size={20} color={Colors.gray[500]} /> : 
              <Eye size={20} color={Colors.gray[500]} />
            }
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.loginButton, loading && styles.disabled]} 
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.loginButtonText}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Text>
        </TouchableOpacity>

        <View style={styles.demoSection}>
          <Text style={styles.demoTitle}>Demo Accounts:</Text>
          <Text style={styles.demoText}>parent@demo.com - Parent role</Text>
          <Text style={styles.demoText}>driver@demo.com - Driver role</Text>
          <Text style={styles.demoText}>admin@demo.com - Admin role</Text>
          <Text style={styles.demoText}>student@demo.com - Student role</Text>
          <Text style={styles.demoPassword}>Password: demo123</Text>
        </View>

        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.signupText}>
            Don't have an account? <Text style={styles.signupLink}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 16,
    backgroundColor: Colors.gray[50],
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    color: Colors.black,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: Colors.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  disabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  demoSection: {
    backgroundColor: Colors.gray[100],
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.gray[700],
    marginBottom: 8,
  },
  demoText: {
    fontSize: 12,
    color: Colors.gray[600],
    marginBottom: 2,
  },
  demoPassword: {
    fontSize: 12,
    color: Colors.secondary,
    fontWeight: '600',
    marginTop: 4,
  },
  signupText: {
    textAlign: 'center',
    fontSize: 14,
    color: Colors.gray[600],
  },
  signupLink: {
    color: Colors.secondary,
    fontWeight: '600',
  },
});