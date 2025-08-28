import React, { useEffect, useState } from 'react';
import {View, StyleSheet, Text, ScrollView, TouchableOpacity, Modal, TextInput, Linking} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../APIClient';
import { API } from '../../apiConfigs';
import DrawerComponent from '../../Components/DrawerComponent';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../types';

export default function EmergencyList() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [openModal, setOpenModal] = useState(false);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [ID, setID] = useState(0);
  const [loading, setLoading] = useState(false);
  const [messageError, setMessageError] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [alertModal, setAlertModal] = useState(false);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const response = await apiClient.get(`${API}/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });

          if (response.data.user) {
            setID(response.data.user.id);
            setName(response.data.user.firstName + ' ' + response.data.user.lastName);
          }
        } catch (error) {
          console.error('Error refreshing data:', error);
        }
      };
    fetchStudentData();
  }, []);

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

    const Hotlines = [
        {
            Title: 'National Center for Mental Health (NCMH) Crisis Hotline',
            Landline: 'Landline: 1553 (Nationwide, toll-free)',
            Mobile: 'Mobile: 0966-351-4518',
        },
        {
            Title: 'Hopeline PH',
            Landline: 'PLDT/Smart/Sun: (02) 8804-4673\nToll-Free for PLDT: 2919\nGlobe/TM: 0917-558-467',
            Mobile: '',
        },
        {
            Title: 'In Touch Crisis Lines',
            Landline: 'Landline: (02) 8893-7603',
            Mobile: 'Mobile: 0917-800-1123 (Globe) / 0922-893-8944 (Sun)',
        },
        {
            Title: 'Philippine Red Cross - Mental Health and Psychosocial Support Services (MHPSS)',
            Landline: 'Hotline Number: 143 (Nationwide)',
            Mobile: '',
        },
    ];

    const dialNumber = (phoneNumber: string) => {
      const cleanedNumber = phoneNumber.replace(/[^\d+]/g, ''); // remove spaces, text, etc.
      const url = `tel:${cleanedNumber}`;
      Linking.openURL(url).catch(() => {
        setIsSuccessful(false);
        setMessageError('Email and Password are required.');
        setAlertModal(true);
      });
    };

    return(
        <>
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.container}>
                  <DrawerComponent Initial={'Resource Library'} />
                      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={25} color="#000" />
                      </TouchableOpacity>
                    <View style={styles.titleBox}>
                        <Text style={styles.title}>
                            Resource Library
                        </Text>
                    </View>
                    <View style={styles.EmergencyContainer}>
                        {Hotlines.map((item, index) => (
                        <View key={index} style={styles.Shadow}>
                            <View style={[styles.IconShadow, index % 2 === 0 ? styles.LeftIcon : styles.RightIcon]}><></></View>
                            <View style={[styles.ContentBlock, index % 2 === 0 ? styles.LeftCB : styles.RightCB]}>
                                <Text style={[styles.ContentTitle, index % 2 === 0 ? styles.TextPaddingLeft : styles.TextPaddingRight]}>{item.Title}</Text>
                                <Text
                                  style={[index % 2 === 0 ? styles.TextPaddingLeft : styles.TextPaddingRight]}
                                  onPress={() => dialNumber(item.Landline)}
                                >
                                  {item.Landline}
                                </Text>
                                {item.Mobile !== '' && (
                                    <Text
                                    style={[index % 2 === 0 ? styles.TextPaddingLeft : styles.TextPaddingRight]}
                                    onPress={() => dialNumber(item.Mobile)}
                                    >
                                      {item.Mobile}
                                    </Text>
                                )}
                            </View>
                            <View style={[styles.IconBox, index % 2 === 0 ? styles.leftIconBox : styles.rightIconBox]}>
                                <Ionicons name="call" size={40} color="#da2f47" style={styles.Icon}/>
                            </View>
                        </View>
                        ))}
                    </View>

                    <View style={styles.RequestBox}>
                        <Text style={styles.RequestTitle}>Do you need the guidance office services?</Text>
                        <Text style={styles.RequestSubtitle}>Request an appointment now!</Text>
                        <TouchableOpacity style={styles.RequestBtn} onPress={() => {setOpenModal(true);}}>
                            <Text style={styles.RequestBtnText}>Request</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
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
                        onChangeText={setName}
                        placeholder="Enter name"
                        placeholderTextColor="#888"
                        style={styles.input}
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
                      <Text style={styles.sendText}>{loading ? 'Requesting...' : 'Send request'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>

            <Modal visible={alertModal} animationType="fade" transparent>
              <View style={styles.overlay2}>
                <View style={styles.forgotModal2}>
                  <View style={[styles.modalHeader2, !isSuccessful && styles.redHeader]}>
                    <Text style={styles.modalTitleStyled2}>{isSuccessful ? 'Successful' : 'Error'}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setAlertModal(false);
                        setMessageError('');
                        setIsSuccessful(false);
                      }}>
                      <Ionicons name="close" size={22} color="#333" />
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.instructions2, styles.marginB]}>{messageError}</Text>
                  <View style={styles.actions2}>
                    <TouchableOpacity
                          style={[styles.sendBtn2, !isSuccessful && styles.redHeader]}
                          onPress={() => {
                            setAlertModal(false);
                            setMessageError('');
                            setIsSuccessful(false);
                          }}
                        >
                          <Text style={styles.sendText2}>OK</Text>
                        </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1, // Important for ScrollView to take up all available space
    },
    container: {
        flex: 1,
        alignItems: 'center',
    },
    titleBox: {
      backgroundColor: '#d9534f',
      paddingVertical: 10,
      paddingHorizontal: 50,
      borderBottomLeftRadius: 25,
      borderBottomRightRadius: 25,
      marginBottom: 75,
    },
    title: {
      fontSize: 15,
      letterSpacing: 2,
      fontFamily: 'Poppins-ExtraBold',
      color: 'black',
    },
    EmergencyContainer: {
        width: '100%',
        alignItems: 'center',
    },
    Shadow: {
        backgroundColor: '#da2f47',
        width: '85%',
        height: 80,
        borderRadius: 9999,
        position: 'relative',
        marginBottom: 70,
    },
    IconShadow: {
         position: 'absolute',
         backgroundColor: '#da2f47',
         width: '35%',
         height: '140%',
         borderRadius: 9999,
         top: -15,
    },
    LeftIcon: {
        left: -10,
    },
    RightIcon: {
        right: -10,
    },
    IconBox: {
        position: 'absolute',
        backgroundColor: 'white',
        width: '35%',
        height: '140%',
        borderRadius: 9999,
        top: -25,
    },
    leftIconBox:
    {
        left: -10,
    },
    rightIconBox:
    {
        right: -10,
    },
    Icon: {
        borderWidth: 15,
        borderColor: '#da2f47',
        borderRadius: 9999,
        padding: 5,
        width: '75%',
        margin: 'auto',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        textAlignVertical: 'center',
    },
    ContentBlock: {
        backgroundColor: 'white',
        width: '100%',
        height: '100%',
        borderRadius: 9999,
        paddingVertical: 10,
        position: 'absolute',
        top: -10,
    },
    LeftCB: {
        left: -10,
    },
    RightCB: {
        right: -10,
    },
    TextPaddingLeft: {
        paddingLeft: '35%',
        fontSize: 12,
        color: 'black',
    },
    TextPaddingRight: {
        paddingRight: '35%',
        textAlign: 'right',
        fontSize: 12,
        color: 'black',
    },
    ContentTitle: {
        fontFamily: 'Lora-Bold',
        color: 'black',
    },
    RequestBox: { borderColor: '#da2f47',backgroundColor: 'white', borderWidth: 2, borderRadius: 20, marginBottom: 150, paddingVertical: 20, paddingHorizontal: 15, width: '85%'},
    RequestTitle: { fontFamily: 'Poppins-Bold', color: '#317873', fontSize: 21},
    RequestSubtitle: { fontFamily: 'Lora-Bold', color: '#777'},
    RequestBtn: { backgroundColor: '#f57c00', width: '40%', marginTop: 10, borderRadius: 25, paddingVertical: 5, paddingHorizontal: 20},
    RequestBtnText: { color: 'white', textAlign: 'center', textAlignVertical: 'center', fontFamily: 'Poppins-Bold'},
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(49, 120, 115, 0.8)',
    },
    RequestModal: {
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
      backgroundColor: '#f57c00',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderTopLeftRadius: 15,
      borderTopRightRadius: 15,
    },
    modalTitleStyled: {
      fontSize: 18,
      color: '#333',
      fontFamily: 'Poppins-Bold',
    },
    forgotActions: {
      flexDirection: 'row',
      gap: 10,
      justifyContent: 'flex-end',
      alignItems: 'center',
      marginBottom: 15,
      marginRight: 20,
    },
    backText: {
      color: 'gray',
      fontFamily: 'Poppins-ExtraBold',
    },
    sendBtn: {
      backgroundColor: '#f57c00',
      paddingVertical: 5,
      paddingHorizontal: 20,
      borderRadius: 30,
    },
    sendText: {
      color: 'white',
      fontFamily: 'Poppins-ExtraBold',
      shadowRadius: 3,
      shadowOffset: {width: 1, height: 1},
      shadowColor: 'gray',
      fontSize: 15,
    },
    Label: {color: 'black', fontFamily: 'Poppins-Bold'},
    ModalContentBlock: {paddingHorizontal: 20},
    input: {backgroundColor: '#F5F5F5', borderRadius: 10, paddingHorizontal: 10, color: 'black'},
    messageBox: {marginBottom: 20},
    backButton: {position: 'absolute', zIndex: 10, top: 20, right: 10},
    overlay2: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(49, 120, 115, 0.8)',
    },
    forgotModal2: {
      width: '85%',
      borderRadius: 15,
      shadowColor: '#000',
      shadowOpacity: 0.3,
      shadowOffset: { width: 0, height: 3 },
      elevation: 5,
      backgroundColor: 'white',
    },
    modalHeader2: {
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
    modalTitleStyled2: {
      fontSize: 18,
      color: '#333',
      fontFamily: 'Poppins-Bold',
    },
    instructions2: {
      fontFamily: 'Lora-Bold',
      color: '#4a4a4a',
      paddingHorizontal: 40,
      textAlign: 'center',
    },
    actions2: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 20,
      paddingBottom: 10,
      justifyContent: 'flex-end',
    },
    sendBtn2: {
      backgroundColor: '#b7e3cc',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 10,
    },
    sendText2: {
      color: 'white',
      fontFamily: 'Poppins-ExtraBold',
      shadowRadius: 3,
      shadowOffset: {width: 1, height: 1},
      shadowColor: 'gray',
      fontSize: 15,
    },
});

