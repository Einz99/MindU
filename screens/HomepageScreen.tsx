// HomepageScreen.tsx
import React, { useEffect, useState } from 'react';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { View, StyleSheet, Text, Modal, TouchableOpacity } from 'react-native';
import HomepageTop from '../Components/HomepageTop';
import axios from 'axios';
import AnnouncementList from '../Components/AnnouncementList';
import { API, RootAPI } from '../apiConfigs';
import { io } from 'socket.io-client';
import MoodHistory from '../Components/MoodHistory';
import DrawerComponent from '../Components/DrawerComponent';
import apiClient from '../APIClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface Announcement {
  ID: number;
  title: string;
  category: string;
  announcementContent: string;
  modified_at: string;
  end_date: string;
  student_id: number;
}

export default function HomepageScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [ID, setID] = useState<number>(0);
  const [messageError, setMessageError] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [alertModal, setAlertModal] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
          setIsSuccessful(false);
          setMessageError('User not found. Please try logging in again.');
          setAlertModal(true);
          setTimeout(() => {
            navigation.navigate('Login');
          }, 1000);
          return;
        }
        const response = await apiClient.get(`${API}/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data && response.data.user) {
          setID(response.data.user.id);
        } else {
          setIsSuccessful(false);
          setMessageError('Server Error: Unable to connect. Please try again.');
          setAlertModal(true);
        }
      } catch (error: any) {
        setIsSuccessful(false);
        setMessageError('Server Error: Unable to connect. Please try again.');
        setAlertModal(true);
      }
    };
    fetchUserData();

    const fetchAnnouncements = async () => {
      try {
        const response = await axios.get(`${API}/announcements`);
        setAnnouncements(response.data);
      } catch (error) {
        console.error('Error fetching announcements:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();

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

    socket.on('updateAnnouncements', (updatedAnnouncements: Announcement[]) => {
      console.log('📡 Announcements Updated:', updatedAnnouncements);
      setAnnouncements(updatedAnnouncements);
    });

    socket.on('deleteAnnouncement', ({ id }) => {
      setAnnouncements((prev) => prev.filter((a) => a.ID !== id));
    });

    socket.on('deleteAnnouncements', ({ ids }) => {
      setAnnouncements((prev) => prev.filter((a) => !ids.includes(a.ID)));
    });

    return () => {
      console.log('🛑 Cleaning up WebSocket...');
      socket.disconnect(); // Properly disconnects
      socket.off('updateAnnouncements');
      socket.off('deleteAnnouncement');
      socket.off('deleteAnnouncements');
    };
  }, [navigation]);

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'important':
        return '#D9534F';
      case 'update':
        return '#FFB74D';
      case 'general':
        return '#81C784';
      case 'advisory':
        return '#64B5F6';
      default:
        return '#81C784';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) {return 'Invalid Date';} // Prevent crash if dateString is missing
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
  };

  const validAnnouncements = announcements.filter((announcement) => {
    const now = new Date();
    const endDate = new Date(announcement.end_date);

    const isNotExpired = endDate >= now;
    const isRelevantToUser = !announcement.student_id || announcement.student_id === ID;

    return isNotExpired && isRelevantToUser;
  });

  return (
    <View style={styles.container}>
      <DrawerComponent Initial={'Home'} />
      <HomepageTop navigation={navigation} />
        <MoodHistory />
      <View style={styles.announcement}>
        <View style={styles.announcementTitleCont}>
          <Text style={styles.announcementTitle}>ANNOUNCEMENTS</Text>
        </View>
        <AnnouncementList
          announcements={validAnnouncements}
          loading={loading}
          getCategoryColor={getCategoryColor}
          formatDate={formatDate}
        />
      </View>

      <Modal visible={alertModal} animationType="fade" transparent>
        <View style={styles.overlay}>
          <View style={styles.forgotModal}>
            <View style={[styles.modalHeader, !isSuccessful && styles.redHeader]}>
              <Text style={styles.modalTitleStyled}>{isSuccessful ? 'Successful' : 'Error'}</Text>
              <TouchableOpacity
                onPress={() => {
                  setAlertModal(false);
                  setMessageError('');
                  setIsSuccessful(false);
                }}>
                <Ionicons name="close" size={22} color="#333" />
              </TouchableOpacity>
            </View>
            <Text style={[styles.instructions, styles.marginB]}>{messageError}</Text>
            <View style={styles.actions}>
              <TouchableOpacity
                    style={[styles.sendBtn, !isSuccessful && styles.redHeader]}
                    onPress={() => {
                      setAlertModal(false);
                      setMessageError('');
                      setIsSuccessful(false);
                    }}
                  >
                    <Text style={styles.sendText}>OK</Text>
                  </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  moodHistory: {
    width: '95%',
    height: '15%',
    borderRadius: 15,
    backgroundColor: '#b7e3cc',
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: '5%',
    marginBottom: '5%',
  },
  announcement: {
    width: '90%',
    minHeight: 375,
    maxHeight: 375,
    marginLeft: 'auto',
    marginRight: 'auto',
    borderRadius: 15,
    padding: 10,
    position: 'relative',
  },
  announcementTitle: {
    fontSize: 33,
    fontFamily: 'Poppins-Bold',
    textDecorationLine: 'underline',
    textAlign: 'center',
    color: '#b7e3cc',
    textShadowColor: 'grey',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  announcementTitleCont: {
    alignItems: 'center',
    marginBottom: 20,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(49, 120, 115, 0.8)',
  },
  forgotModal: {
    width: '85%',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#b7e3cc',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  redHeader: {
    backgroundColor: '#e3b7b7',
  },
  marginB: {
    marginBottom: 10,
  },
  modalTitleStyled: {
    fontSize: 18,
    color: '#333',
    fontFamily: 'Poppins-Bold',
  },
  instructions: {
    fontFamily: 'Lora-Bold',
    color: '#4a4a4a',
    paddingHorizontal: 40,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 10,
    justifyContent: 'flex-end',
  },
  sendBtn: {
    backgroundColor: '#b7e3cc',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  sendText: {
    color: 'white',
    fontFamily: 'Poppins-ExtraBold',
    shadowRadius: 3,
    shadowOffset: {width: 1, height: 1},
    shadowColor: 'gray',
    fontSize: 15,
  },
});
