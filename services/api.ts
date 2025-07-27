import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const api = axios.create({
  baseURL: 'http://192.168.1.4:5000/api',
  timeout: 10000, // 10 second timeout
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

// Response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Response Error:', {
      url: error?.config?.url,
      method: error?.config?.method,
      status: error?.response?.status,
      message: error?.message,
      isNetworkError: !error?.response,
      isTimeout: error?.code === 'ECONNABORTED'
    });
    
    // Handle network errors specifically
    if (!error.response) {
      console.error('Network Error - No response received. Possible causes:');
      console.error('- Backend server is not running');
      console.error('- Network connectivity issues');
      console.error('- Incorrect IP address or port');
      console.error('- Firewall blocking the connection');
    }
    
    return Promise.reject(error);
  }
); 