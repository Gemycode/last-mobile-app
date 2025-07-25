import { api } from './api';
import { useAuthStore } from '../store/authStore';

export const fetchActiveBuses = async () => {
  const response = await api.get('/bus-locations/active');
  return response.data; // قائمة الباصات مع المواقع
};

export const fetchRoutes = async () => {
  const response = await api.get('/routes');
  return response.data; // قائمة المسارات
};

export const fetchTrips = async () => {
  const response = await api.get('/trips');
  return response.data;
};

export const fetchChildren = async () => {
  const response = await api.get('/users/me/children');
  return response.data.data.children; // استخراج المصفوفة فقط
};

export const addChild = async (childData: any) => {
  const response = await api.post('/users/me/children', childData);
  return response.data;
};

export const deleteChild = async (childId: string) => {
  const response = await api.delete(`/users/children/${childId}`);
  return response.data;
};

export const bookSeat = async (bookingData: any) => {
  const response = await api.post('/bookings/create', bookingData);
  return response.data;
};

export const fetchCurrentUser = async () => {
  const response = await api.get('/users/me');
  return response.data;
};

export const updateCurrentUser = async (data: { firstName?: string; lastName?: string; phone?: string; email?: string }) => {
  return api.patch('/users/me', data);
};

export const changePassword = async (oldPassword: string, newPassword: string) => {
  return api.patch('/users/change-password', { oldPassword, newPassword });
};

export const uploadProfileImage = async (imageUri: string) => {
  const formData = new FormData();
  // Expo image picker returns uri, we need to extract filename and type
  const filename = imageUri.split('/').pop() || 'profile.jpg';
  const match = /\.([a-zA-Z0-9]+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : `image`;
  formData.append('image', {
    uri: imageUri,
    name: filename,
    type,
  } as any);
  return api.patch('/users/upload-profile-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const updateChild = async (childId: string, data: any) => {
  return api.patch(`/users/me/children/${childId}`, data);
};

export const fetchNotifications = async () => {
  // جلب userId من localStorage أو من useAuthStore
  const authStr = localStorage.getItem('auth');
  if (!authStr) throw new Error('User ID not found');
  let userId: string | undefined;
  try {
    userId = JSON.parse(authStr)?.user?._id;
  } catch {
    throw new Error('User ID not found');
  }
  if (!userId || typeof userId !== 'string') throw new Error('User ID not found');
  const response = await api.get(`/notifications/${userId}`);
  return response.data;
};

export const fetchChatMessages = async (busId: string) => {
  const response = await api.get(`/chats/${busId}`);
  return response.data;
};

export const sendChatMessage = async (busId: string, data: { senderId: string, senderRole: string, message: string }) => {
  const response = await api.post(`/chats/${busId}`, data);
  return response.data;
};

export const markBusChatAsRead = async (busId: string, userId: string) => {
  return api.patch(`/chats/${busId}/read`, { userId });
};

export const fetchProfileStats = async () => {
  const response = await api.get('/user/stats');
  return response.data;
}; 