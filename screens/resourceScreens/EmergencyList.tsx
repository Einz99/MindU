import React, { useState } from 'react';
import {View, StyleSheet, Text, ScrollView, TouchableOpacity, Modal, Linking} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DrawerComponent from '../../Components/DrawerComponent';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../types';

export default function EmergencyList() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [messageError, setMessageError] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [isDialing, setIsDialing] = useState(false);

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

    const dialNumber = async (phoneNumber: string) => {
      if (isDialing) {return;} // 🚫 Ignore if a call is already being initiated

      const cleanedNumber = phoneNumber.replace(/[^\d+]/g, ''); // remove non-digit chars
      if (!cleanedNumber) {return;} // no valid number

      setIsDialing(true);
      const url = `tel:${cleanedNumber}`;

      try {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        } else {
          throw new Error('Unable to open dialer');
        }
      } catch (error) {
        setIsSuccessful(false);
        setMessageError('Unable to initiate call. Please try again.');
        setAlertModal(true);
      } finally {
        setIsDialing(false);
      }
    };


    return(
        <>
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.container}>
                  <DrawerComponent Initial={'Crisis Helpline'} />
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
                </View>
            </ScrollView>

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

