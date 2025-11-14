import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Image, Modal, TextInput, TouchableOpacity, Dimensions } from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { API, RootAPI } from '../apiConfigs';
import apiClient from '../APIClient';
import { io } from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

const imageSize = width * 0.315; // 25% of screen width (adjust this as needed)

interface ChildComponentProps {
    navigation: NavigationProp<RootStackParamList>;
  }

export default function HomepageTop( { navigation }: ChildComponentProps ) {
    const [today, setToday] = useState('');
    const [name, setName] = useState('');
    const [profilePic, setProfilePic] = useState<string | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [newAffirmation, setNewAffirmation] = useState('');
    const [affirmation, setAffirmation] = useState('Everyday be thankful that you wake up.');
    const [messageError, setMessageError] = useState('');
    const [isSuccessful, setIsSuccessful] = useState(false);
    const [alertModal, setAlertModal] = useState(false);

      useEffect(() => {
        const currentDate = new Date();
        const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(currentDate);
        const formattedDate = currentDate.toLocaleDateString('en-US');
        setToday(`${weekday}, ${formattedDate}`);

        const fetchUserData = async () => {
          try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
              setIsSuccessful(false);
              setMessageError('User not found. Please try logging in again');
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

        const loadAffirmation = async () => {
          const saved = await AsyncStorage.getItem('affirmation');
          if (saved) {setAffirmation(saved);}
        };

        loadAffirmation();

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

      const handleSaveAffirmation = async () => {
        setAffirmation(newAffirmation);
        await AsyncStorage.setItem('affirmation', newAffirmation);
        setModalVisible(false);
      };

    return (
        <View>
            <View style={styles.topContainer}>
                <View style={styles.infoContainer}>
                    <Text style={styles.name}>
                      {/* eslint-disable-next-line react-native/no-inline-styles */}
                      Hi, <Text style={[styles.name, { color: 'white', textShadowColor: '#317873', textShadowOffset: { width: scale(1), height: verticalScale(1) }, textShadowRadius: moderateScale(2) }]}>{name}</Text>
                    </Text>
                    <Text style={styles.date}>{today}</Text>
                    <View style={styles.affirmation}>
                      <TouchableOpacity onPress={() => {
                        setNewAffirmation(affirmation);
                        setModalVisible(true);
                      }}>
                        <Ionicons name="create-outline" size={20} style={styles.icon} />
                      </TouchableOpacity>
                      <Text style={styles.affirmationTxt}>{affirmation}</Text>
                    </View>
                </View>
                <View style={styles.imageBorder}>
                    <View style={styles.imageholder}>
                      <Image
                        source={
                          profilePic
                            ? { uri: profilePic }
                            : require('../assets/images/default_profile.png')
                        }
                        style={styles.image}
                      />
                    </View>
                </View>
            </View>

            {/*Modal Affirmation*/}
            <Modal
              visible={modalVisible}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setModalVisible(false)}
            >
              <View style={styles.modalBackground}>
                <View style={styles.modalContainer}>
                  <Text style={styles.modalTitle}>Edit Affirmation</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={newAffirmation}
                    onChangeText={setNewAffirmation}
                    placeholder="Enter new affirmation"
                  />
                  <View style={styles.actionButton}>
                    <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalButton}>
                      <Text style={styles.white}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSaveAffirmation} style={styles.modalButton}>
                      <Text style={styles.white}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>

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
    topContainer: {
        width: '100%',
        height: verticalScale(180),
        backgroundColor: '#b7e3cc',
        borderBottomLeftRadius: moderateScale(25),
        borderBottomRightRadius: moderateScale(25),
        top: verticalScale(0),
    },
    imageBorder: {
        width: '35%',
        height: '90%',
        backgroundColor: 'white',
        position: 'absolute',
        top: verticalScale(0),
        right: '5%',
        borderBottomLeftRadius: moderateScale(100),
        borderBottomRightRadius: moderateScale(100),
    },
    imageholder: {
        height: imageSize,
        width: imageSize,
        backgroundColor: 'black',
        borderRadius: moderateScale(200),
        position: 'absolute',
        bottom: '5%',
        left: '5%',
    },
    image: {
      width: '100%',
      height: '100%',
      borderRadius: moderateScale(200),
      borderWidth: moderateScale(2),
      borderColor: '#b7e3cc',
    },
    infoContainer: {
        position: 'absolute',
        width: '52.5%',
        height: '100%',
        left: scale(15),
        top: verticalScale(0),
        textAlign: 'center',
    },
    date: {
        fontWeight: 600,
        fontSize: moderateScale(10),
        fontFamily: 'Lora-Regular',
        color: 'black',
        textAlign: 'center',
    },
    name: {
        fontSize: moderateScale(25),
        color: '#317873',
        textAlign: 'center',
        fontFamily: 'Poppins-ExtraBold',
        marginTop: '20%',
    },
    affirmation: {
        marginTop: '5%',
        width: '90%',
        marginLeft: '5%',
        height: '35%',
        backgroundColor: 'white',
        borderRadius: moderateScale(15),
        position: 'relative',
    },
    affirmationTxt: {
        marginLeft: scale(15),
        marginRight: scale(25),
        marginTop: verticalScale(7),
        fontSize: moderateScale(12),
        fontFamily: 'Lora-Regular',
        color: 'black',
        textAlignVertical: 'center',
    },
    icon: {
      position: 'absolute',
      right: scale(5),
      color: 'black',
    },
    modalBackground: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
      width: '80%',
      backgroundColor: 'white',
      padding: moderateScale(20),
      borderRadius: moderateScale(15),
      alignItems: 'center',
    },
    modalInput: {
      width: '100%',
      borderWidth: moderateScale(1),
      borderColor: '#ccc',
      borderRadius: moderateScale(8),
      padding: moderateScale(10),
      marginBottom: verticalScale(15),
      color: 'black',
      fontFamily: 'Lora-Regular',
    },
    modalButton: {
      backgroundColor: '#b7e3cc',
      paddingVertical: verticalScale(10),
      paddingHorizontal: scale(20),
      borderRadius: moderateScale(10),
    },
    modalTitle: { fontSize: moderateScale(18), marginBottom: verticalScale(10), color: 'black', fontFamily: 'Poppins-Regular' },
    actionButton: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
    white: { color: 'white', fontFamily: 'Lora-Regular' },
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

});
