import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const api = axios.create({
  baseURL: 'http://192.168.1.4:5000/api',
});


// Interceptor لإضافة التوكن تلقائياً
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  // تم حذف طباعة التوكن من الكونسول بناءً على طلب المستخدم
  if (token) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}); 