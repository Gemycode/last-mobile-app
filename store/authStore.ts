import { create } from 'zustand';
import { User } from '../types';
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
  { id: '3', email: 'admin@demo.com', password: 'demo123', name: 'Lisa Admin', role: 'admin' },
  { id: '4', email: 'student@demo.com', password: 'demo123', name: 'Alex Smith', role: 'student' },
];

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    const mockUser = mockUsers.find(u => u.email === email && u.password === password);
    
    if (mockUser) {
      const user = { id: mockUser.id, email: mockUser.email, name: mockUser.name, role: mockUser.role };
      await AsyncStorage.setItem('user', JSON.stringify(user));
      set({ user, isAuthenticated: true });
      return true;
    }
    return false;
  },

  register: async (userData) => {
    // For demo purposes, just create a new user
    const newUser = {
      id: Date.now().toString(),
      email: userData.email,
      name: userData.name,
      role: userData.role,
    };
    
    await AsyncStorage.setItem('user', JSON.stringify(newUser));
    set({ user: newUser, isAuthenticated: true });
    return true;
  },

  logout: async () => {
    await AsyncStorage.removeItem('user');
    set({ user: null, isAuthenticated: false });
  },

  loadUser: async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        set({ user, isAuthenticated: true });
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      set({ isLoading: false });
    }
  },
}));