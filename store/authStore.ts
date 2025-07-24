import { create } from 'zustand';
import { User } from '../types';
import { loginApi, registerApi } from '../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: Omit<User, 'id'> & { password: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
}

// Mock users for demo
const mockUsers: (User & { password: string })[] = [
  { id: '1', email: 'parent@demo.com', password: 'demo123', name: 'Sarah Johnson', role: 'parent' },
  { id: '2', email: 'driver@demo.com', password: 'demo123', name: 'Mike Chen', role: 'driver' },
  { id: '4', email: 'student@demo.com', password: 'demo123', name: 'Alex Smith', role: 'student' },
];

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    try {
      const res = await loginApi(email, password);
      const { token, user } = res.data || res;
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      if (user.role) {
        await AsyncStorage.setItem('role', user.role);
      }
      set({ user, isAuthenticated: true });
      return true;
    } catch (error) {
      return false;
    }
  },

  register: async (userData) => {
    try {
      const res = await registerApi(userData);
      const { token, user } = res.data || res;
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      if (user.role) {
        await AsyncStorage.setItem('role', user.role);
      }
      set({ user, isAuthenticated: true });
      return true;
    } catch (error) {
      return false;
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('role');
    set({ user: null, isAuthenticated: false });
  },

  loadUser: async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      const role = await AsyncStorage.getItem('role');
      if (userData) {
        const user = JSON.parse(userData);
        if (role) user.role = role;
        set({ user, isAuthenticated: true });
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      set({ isLoading: false });
    }
  },
}));