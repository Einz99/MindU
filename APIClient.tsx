import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootAPI, API } from './apiConfigs';

const apiClient = axios.create({
  baseURL: RootAPI,
  headers: { 'Content-Type': 'application/json' },
});

let isRefreshing = false;
let refreshQueue: ((token: string | null) => void)[] = [];

// Request Interceptor
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark request as retried once

      try {
        if (!isRefreshing) {
          isRefreshing = true;
          const refreshToken = await AsyncStorage.getItem('refreshToken');

          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          const refreshResponse = await axios.post(`${API}/refresh`, { refreshToken });
          const { accessToken } = refreshResponse.data;

          await AsyncStorage.setItem('userToken', accessToken);

          // Process queued requests
          refreshQueue.forEach((callback) => callback(accessToken));
          refreshQueue = [];

          isRefreshing = false;
          return apiClient(originalRequest); // Retry original request with new token
        } else {
          return new Promise((resolve) => {
            refreshQueue.push((newToken) => {
              if (newToken) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                resolve(apiClient(originalRequest));
              }
            });
          });
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);

        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('refreshToken');

        // Redirect to login
        return Promise.reject({ logout: true, message: 'Session expired. Please log in again.' });
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
