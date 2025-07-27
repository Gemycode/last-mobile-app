import { api } from './api';
import { useAuthStore } from '../store/authStore';

export const fetchActiveBuses = async () => {
  try {
    console.log('API: Fetching active buses from /bus-locations/active');
    const response = await api.get('/bus-locations/active');
    console.log('API: Active buses response received:', response.data);
    return response.data; // قائمة الباصات مع المواقع
  } catch (error: any) {
    console.error('API: Error fetching active buses:', error);
    console.error('API: Active buses error details:', {
      message: error?.message,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data
    });
    throw error;
  }
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
  try {
    console.log('API: Fetching children from /users/me/children');
    const response = await api.get('/users/me/children');
    console.log('API: Children response received:', response.data);
    return response.data.data.children; // استخراج المصفوفة فقط
  } catch (error: any) {
    console.error('API: Error fetching children:', error);
    console.error('API: Children error details:', {
      message: error?.message,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data
    });
    throw error;
  }
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
  // Use the current user from auth store instead of localStorage
  const response = await api.get('/notifications');
  return response.data;
};

export const fetchChatMessages = async (busId: string, tripId: string) => {
  const response = await api.get(`/chats/${busId}/${tripId}`);
  return response.data;
};

export const sendChatMessage = async (busId: string, tripId: string, data: { senderId: string, senderRole: string, senderName?: string, message: string, imageUrl?: string }) => {
  try {
    const response = await api.post(`/chats/${busId}/${tripId}`, data);
    return response.data;
  } catch (error) {
    console.error('Error sending chat message:', error);
    console.error('Request data:', { busId, tripId, data });
    throw error;
  }
};

export const markBusChatAsRead = async (busId: string, userId: string) => {
  return api.patch(`/chats/${busId}/read`, { userId });
};

export const fetchProfileStats = async () => {
  try {
    console.log('API: Fetching profile stats from /dashboard/stats');
    const response = await api.get('/dashboard/stats');
    console.log('API: Profile stats response received:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('API: Error fetching profile stats:', error);
    console.error('API: Profile stats error details:', {
      message: error?.message,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data
    });
    // Return default stats if API fails
    return { trips: 0, children: 0, points: 0 };
  }
};

export const fetchStudentBookings = async (studentId: string) => {
  const response = await api.get(`/bookings/student/${studentId}`);
  return response.data;
};

export const fetchDriverTodayTrips = async (driverId: string) => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;
  const response = await api.get(`/trips?date=${dateStr}&driverId=${driverId}`);
  return response.data;
};

export const fetchDriverInfo = async (driverId: string) => {
  try {
    const response = await api.get(`/users/${driverId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching driver info:', error);
    throw error;
  }
};

export const fetchAllDrivers = async () => {
  try {
    const response = await api.get('/users/drivers');
    console.log('fetchAllDrivers response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching all drivers:', error);
    // Return empty array if the endpoint fails
    return [];
  }
};

export const fetchBusInfo = async (busId: string) => {
  try {
    const response = await api.get(`/bus/${busId}`);
    console.log('fetchBusInfo response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching bus info:', error);
    return null;
  }
}; 