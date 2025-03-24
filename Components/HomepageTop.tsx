import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Alert, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { API, RootAPI } from '../apiConfigs';
import apiClient from '../APIClient';
import { io } from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';

interface ChildComponentProps {
    navigation: NavigationProp<RootStackParamList>;
  }

export default function HomepageTop( { navigation }: ChildComponentProps ) {
    const [today, setToday] = useState('');
    const [name, setName] = useState('');
    const [profilePic, setProfilePic] = useState<string | null>(null);
      useEffect(() => {
        const currentDate = new Date();
        const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(currentDate);
        const formattedDate = currentDate.toLocaleDateString('en-US');
        setToday(`${weekday}, ${formattedDate}`);

        const fetchUserData = async () => {
          try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
              Alert.alert('Error', 'User token not found. Please log in again.');
              navigation.navigate('Login');
              return;
            }
            const response = await apiClient.get(`${API}/user`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (response.data && response.data.user) {
              // Make sure to reference the correct property for firstName
              setName(response.data.user.firstName);

              // Construct full image URL from local server
              const picPath = response.data.user.profilePic;
              if (picPath) {
                setProfilePic(`${RootAPI}${picPath}`);
              } else {
                setProfilePic(null); // No profile picture available
              }
            } else {
              Alert.alert('Error', 'Failed to fetch user details.');
            }
          } catch (error: any) {
            console.error(error);
            Alert.alert(
              'Error',
              error.response?.data?.message ||
                'An error occurred while fetching user details.'
            );
          }
        };
        fetchUserData();

        const socket = io(RootAPI, {
              transports: ['websocket'], // Ensures WebSocket is used directly
              reconnectionAttempts: 5, // Tries to reconnect 5 times before giving up
            });

        socket.on('connect', () => {
          console.log('✅ WebSocket connected:', socket.id);
        });

        socket.on('connect_error', (err) => {
          console.error('❌ WebSocket Connection Error:', err);
        });

        socket.on('updateStudent', async (data) => {
          const token = await AsyncStorage.getItem('userToken');
          if (token) {
            const decodedToken: any = jwtDecode(token); // Decode token to get userId
            if (decodedToken?.userId === data.userId) {
              console.log('🔄 Updating user data as the logged-in user is affected.');
              fetchUserData();
            } else {
              console.log('🚫 Ignoring update as it does not belong to the logged-in user.');
            }
          }
        });

        return () => {
          socket.disconnect(); // Cleanup when component unmounts
        };
      }, [navigation]);
    return (
        <View>
            <View style={styles.topContainer}>
                <View style={styles.imageBorder}>
                    <View style={styles.imageholder}>
                      <Image
                        source={
                          profilePic
                            ? { uri: profilePic }
                            : require('../assets/images/default-profile.png')
                        }
                        style={styles.image}
                      />
                    </View>
                </View>
                <View style={styles.infoContainer}>
                    <Text style={styles.date}>{today}</Text>
                    <Text style={styles.name}>Hi, {name}!</Text>
                    <View style={styles.affirmation}>
                        <Text style={styles.affirmationTxt}>Everyday be thankful that you wake up.</Text>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    topContainer: {
        width: '100%',
        height: 190,
        backgroundColor: '#b7e3cc',
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        top: 0,
    },
    imageBorder: {
        width: '40%',
        height: '90%',
        backgroundColor: 'white',
        position: 'absolute',
        top: 0,
        left: '5%',
        borderBottomLeftRadius: 100,
        borderBottomRightRadius: 100,
    },
    imageholder: {
        height: '75%',
        width: '90%',
        backgroundColor: 'black',
        borderRadius: 200,
        position: 'absolute',
        bottom: '5%',
        left: '5%',
    },
    image: {
      width: '100%',
      height: '100%',
      borderRadius: 200,
    },
    infoContainer: {
        position: 'absolute',
        width: '52.5%',
        height: '100%',
        right: 0,
        top: 0,
    },
    date: {
        fontWeight: 600,
        fontSize: 15,
        marginTop: '5%',
        marginBottom: '10%',
    },
    name: {
        fontSize: 25,
        fontWeight: 800,
    },
    affirmation: {
        marginTop: '10%',
        width: '90%',
        height: '40%',
        backgroundColor: 'white',
        borderRadius: 15,
    },
    affirmationTxt: {
        marginLeft: 10,
        marginRight: 25,
        marginTop: 5,
        fontSize: 17,
        fontWeight: 300,
    },
});
