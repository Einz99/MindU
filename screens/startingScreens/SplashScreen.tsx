import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { API } from '../../apiConfigs';

interface DecodedToken {
  firstLogin: boolean;
  exp: number;
}

export default function SplashScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    const checkAppStatus = async () => {
      try {
        // 🌟 Check if the app has launched before
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

        // ✅ Proceed with authentication check
        const accessToken = await AsyncStorage.getItem('userToken');
        const refreshToken = await AsyncStorage.getItem('refreshToken');

        if (accessToken) {
          try {
            const decoded: DecodedToken = jwtDecode(accessToken);
            const isExpired = decoded.exp * 1000 < Date.now();

            if (isExpired) {
              console.log('🔄 Access token expired, attempting refresh...');
              if (refreshToken) {
                try {
                  const response = await axios.post(`${API}/auth/refresh`, { refreshToken });

                  if (response.data?.accessToken) {
                    await AsyncStorage.setItem('userToken', response.data.accessToken);
                    console.log('✅ Token refreshed successfully!');
                    navigation.reset({ index: 0, routes: [{ name: 'Homepage' }] });
                  } else {
                    throw new Error('Invalid refresh response');
                  }
                } catch (refreshError) {
                  console.error('❌ Refresh token failed:', refreshError);
                  await AsyncStorage.removeItem('userToken');
                  await AsyncStorage.removeItem('refreshToken');
                  navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                }
              } else {
                console.log('❌ No refresh token, redirecting to Login...');
                await AsyncStorage.removeItem('userToken');
                navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
              }
            } else {
              navigation.reset({ index: 0, routes: [{ name: 'Homepage' }] });
            }
          } catch (error) {
            console.error('Error decoding token:', error);
            await AsyncStorage.removeItem('userToken');
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          }
        } else {
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }
      } catch (error) {
        console.error('Error in splash logic:', error);
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
