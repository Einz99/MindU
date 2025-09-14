import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { API } from '../../apiConfigs';
import apiClient from '../../APIClient';

interface DecodedToken {
  firstLogin: boolean;
  exp: number;
}

export default function SplashScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    const checkAppStatus = async () => {
      try {
        // 🌟 First launch check
        const hasLaunched = await AsyncStorage.getItem('hasLaunched');
        console.log('📌 SplashScreen - hasLaunched:', hasLaunched);

        if (!hasLaunched) {
          console.log('🚀 First launch detected, navigating to Onboarding...');
          navigation.reset({
            index: 0,
            routes: [{ name: 'Onboarding' }],
          });
          return;
        }

        // ✅ Authentication check
        let accessToken = await AsyncStorage.getItem('userToken');
        const refreshToken = await AsyncStorage.getItem('refreshToken');

        if (accessToken) {
          try {
            const decoded: DecodedToken = jwtDecode(accessToken);
            const isExpired = decoded.exp * 1000 < Date.now();

            if (isExpired && refreshToken) {
              console.log('🔄 Access token expired, attempting refresh...');
              const refreshRes = await axios.post(`${API}/auth/refresh`, { refreshToken });
              if (refreshRes.data?.accessToken) {
                accessToken = refreshRes.data.accessToken;
                if (accessToken) {
                  await AsyncStorage.setItem('userToken', accessToken);
                  console.log('✅ Token refreshed successfully!');
                }
              } else {
                throw new Error('Invalid refresh response');
              }
            } else if (isExpired) {
              console.log('❌ No refresh token or expired, redirecting to Login...');
              await AsyncStorage.multiRemove(['userToken', 'refreshToken']);
              navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
              return;
            }

            // -------------------------
            // Fetch student info
            // -------------------------
            let student_id: number | null = null;
            try {
              const userRes = await apiClient.get(`${API}/user`, {
                headers: { Authorization: `Bearer ${accessToken}` },
              });

              if (userRes.data?.user) {
                student_id = userRes.data.user.id;
              }
            } catch (err) {
              console.error('❌ Failed to fetch user info:', err);
            }

            // -------------------------
            // Insert daily login
            // -------------------------
            if (student_id) {
              try {
                await axios.post(`${API}/student-login-percentages/insert`, { student_id });
                console.log('✅ Daily login recorded');
              } catch (insertErr) {
                console.error('❌ Failed to insert daily login:', insertErr);
              }
            }

            // -------------------------
            // Navigate to Homepage
            // -------------------------
            navigation.reset({ index: 0, routes: [{ name: 'Homepage' }] });
          } catch (err) {
            console.error('❌ Token decoding error:', err);
            await AsyncStorage.removeItem('userToken');
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          }
        } else {
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }
      } catch (error) {
        console.error('❌ SplashScreen error:', error);
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }
    };

    checkAppStatus();
  }, [navigation]);

  return (
    <View style={styles.Splash}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  Splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
