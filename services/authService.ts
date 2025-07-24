import { api } from './api';

export const loginApi = async (email: string, password: string) => {
  const response = await api.post('/users/login', { email, password });
  return response.data;
};

export const registerApi = async (userData: { name: string, email: string, password: string, role: string }) => {
  const response = await api.post('/users/register', userData);
  return response.data;
}; 