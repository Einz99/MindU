import React, { useEffect, useState, useRef } from 'react';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { View, StyleSheet, Text, Modal, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
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
import CalendarComponent from './CalendarComponent';

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
  const [name, setName] = useState('');
  const [messageError, setMessageError] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false); // To track if we are touching the list
  const [openModal, setOpenModal] = useState(false);
  const [message, setMessage] = useState('');

  const scrollViewRef = useRef<ScrollView>(null); // Ref for the parent ScrollView

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
          setName(response.data.user.firstName + ' ' + response.data.user.lastName);
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
      transports: ['websocket'],
      reconnectionAttempts: 5,
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
      socket.disconnect();
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
    if (!dateString) {return 'Invalid Date';}
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

  const handleScrollStart = () => {
    setIsScrolling(true);
  };

  const handleScrollEnd = () => {
    setIsScrolling(false);
  };

  const sendBacklogRequest = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!message.trim()) {
        setIsSuccessful(false);
        setMessageError('Please enter message before submitting.');
        setAlertModal(true);
        setTimeout(() => {
            navigation.navigate('Login');
        }, 1000);
        return;
      }
      const payload = {
        student_id: ID,
        message: message,
      };

      const response = await apiClient.post(`${API}/backlogs`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200 || response.status === 201) {
        setIsSuccessful(true);
        setMessageError('Successfully requested appointment with guidance office. Please wait for schedule.');
        setAlertModal(true);

        // Log student activity for the Scheduler module
        try {
          await axios.post(`${API}/student-activities/insert`, { module: 'Scheduler' });
        } catch (err) {
          console.error('Error logging student activity:', err);
        }
      } else {
        setIsSuccessful(false);
        setMessageError('Server Error: Unable to connect. Please try again.');
        setAlertModal(true);
      }
    } catch (err) {
      setIsSuccessful(false);
        setMessageError('Server Error: Unable to connect. Please try again.');
        setAlertModal(true);
    } finally {
      setOpenModal(false);
      setMessage('');
      setLoading(false);
    }
  };

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      scrollEnabled={!isScrolling} // Disable scroll if touching the list
      onTouchStart={handleScrollStart}
      onTouchEnd={handleScrollEnd}
    >
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

      <CalendarComponent />

      <View style={styles.RequestBox}>
          <Text style={styles.RequestTitle}>Do you need the guidance office services?</Text>
          <Text style={styles.RequestSubtitle}>Request an appointment now!</Text>
          <TouchableOpacity style={styles.RequestBtn} onPress={() => {setOpenModal(true);}}>
              <Text style={styles.RequestBtnText}>Request</Text>
          </TouchableOpacity>
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
                }} >
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

      <Modal visible={openModal} animationType="fade" transparent>
        <View style={styles.overlay}>
          <View style={styles.RequestModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitleStyled}>Request Schedule</Text>
              <TouchableOpacity onPress={() => setOpenModal(false)}>
                <Ionicons name="close" size={22} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.ModalContentBlock}>
              <Text style={styles.Label}>Name</Text>
              <TextInput
                  value={name}
                  placeholder="Enter name"
                  placeholderTextColor="#888"
                  style={styles.input}
                  readOnly={true}
              />
              <Text style={styles.Label}>Message</Text>
              <TextInput
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Enter name"
                    placeholderTextColor="#888"
                    style={[styles.input, styles.messageBox]}
                    multiline
                    numberOfLines={5}
                    textAlignVertical="top"
                />
              </View>

              <View style={styles.forgotActions}>
                <TouchableOpacity onPress={() => setOpenModal(false)}>
                  <Text style={styles.backText}>BACK</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  // eslint-disable-next-line react-native/no-inline-styles
                  style={[styles.sendBtn, {opacity: loading ? 0.5 : 1}]}
                  disabled={loading}
                  onPress={sendBacklogRequest}
                >
                  <Text style={styles.sendText}>{loading ? 'Sending...' : 'Send'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
    </ScrollView>
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
    borderRadius: moderateScale(15),
    backgroundColor: '#b7e3cc',
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: '5%',
    marginBottom: '5%',
  },
  announcement: {
    width: '90%',
    maxHeight: verticalScale(375),
    marginLeft: 'auto',
    marginRight: 'auto',
    borderRadius: moderateScale(15),
    padding: moderateScale(10),
    position: 'relative',
  },
  announcementTitle: {
    fontSize: moderateScale(33),
    fontFamily: 'Poppins-Bold',
    textDecorationLine: 'underline',
    textAlign: 'center',
    color: '#b7e3cc',
    textShadowColor: 'grey',
    textShadowOffset: { width: scale(1), height: verticalScale(1) },
    textShadowRadius: moderateScale(2),
  },
  announcementTitleCont: {
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(49, 120, 115, 0.8)',
  },
  forgotModal: {
    width: '85%',
    borderRadius: moderateScale(15),
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: scale(0), height: verticalScale(3) },
    elevation: 5,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(20),
    backgroundColor: '#b7e3cc',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(10),
    borderTopLeftRadius: moderateScale(15),
    borderTopRightRadius: moderateScale(15),
  },
  redHeader: {
    backgroundColor: '#e3b7b7',
  },
  marginB: {
    marginBottom: verticalScale(10),
  },
  modalTitleStyled: {
    fontSize: moderateScale(18),
    color: '#333',
    fontFamily: 'Poppins-Bold',
  },
  instructions: {
    fontFamily: 'Lora-Bold',
    color: '#4a4a4a',
    paddingHorizontal: scale(40),
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(10),
    justifyContent: 'flex-end',
  },
  sendBtn: {
    backgroundColor: '#b7e3cc',
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(20),
    borderRadius: moderateScale(10),
  },
  sendText: {
    color: 'white',
    fontFamily: 'Poppins-ExtraBold',
    shadowRadius: moderateScale(3),
    shadowOffset: {width: scale(1), height: verticalScale(1)},
    shadowColor: 'gray',
    fontSize: moderateScale(15),
  },
  RequestBox: { borderColor: '#da2f47',backgroundColor: 'white', borderWidth: 2, borderRadius: moderateScale(20), marginBottom: verticalScale(80), paddingVertical: verticalScale(20), paddingHorizontal: scale(15), width: '85%', marginHorizontal: 'auto', marginTop: verticalScale(20)},
  RequestTitle: { fontFamily: 'Poppins-Bold', color: '#317873', fontSize: moderateScale(21)},
  RequestSubtitle: { fontFamily: 'Lora-Bold', color: '#777'},
  RequestBtn: { backgroundColor: '#f57c00', width: '40%', marginTop: 10, borderRadius: moderateScale(25), paddingVertical: verticalScale(5), paddingHorizontal: scale(20)},
  RequestBtnText: { color: 'white', textAlign: 'center', textAlignVertical: 'center', fontFamily: 'Poppins-Bold'},
  RequestModal: {
    width: '85%',
    borderRadius: moderateScale(15),
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: scale(0), height: verticalScale(3) },
    elevation: 5,
    backgroundColor: 'white',
  },
  Label: {color: 'black', fontFamily: 'Poppins-Bold'},
  ModalContentBlock: {paddingHorizontal: scale(20)},
  input: {backgroundColor: '#F5F5F5', borderRadius: moderateScale(10), paddingHorizontal: scale(10), color: 'black'},
  messageBox: {marginBottom: verticalScale(20)},
  backButton: {position: 'absolute', zIndex: 10, top: verticalScale(20), right: scale(10)},
  overlay2: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(49, 120, 115, 0.8)',
  },
  forgotModal2: {
    width: '85%',
    borderRadius: moderateScale(15),
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: scale(0), height: verticalScale(3) },
    elevation: 5,
    backgroundColor: 'white',
  },
  modalHeader2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(20),
    backgroundColor: '#b7e3cc',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(10),
    borderTopLeftRadius: moderateScale(15),
    borderTopRightRadius: moderateScale(15),
  },
  forgotActions: {
    flexDirection: 'row',
    gap: moderateScale(10),
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: verticalScale(15),
    marginRight: scale(20),
  },
  backText: {
    color: 'gray',
    fontFamily: 'Poppins-ExtraBold',
  },
});
