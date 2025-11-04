import React, { useState } from 'react';
import {View, StyleSheet, Text, ScrollView, TouchableOpacity, Modal, Linking, Dimensions} from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DrawerComponent from '../../Components/DrawerComponent';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../types';

const { width } = Dimensions.get('window');

export default function EmergencyList() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [messageError, setMessageError] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [isDialing, setIsDialing] = useState(false);

    const Hotlines = [
        {
            Title: 'National Center for Mental Health (NCMH) Crisis Hotline',
            Landline: ['1553 (Nationwide, toll-free)'],
            Mobile: ['0966-351-4518'],
        },
        {
            Title: 'Hopeline PH',
            Landline: [
              'PLDT/Smart/Sun: (02) 8804-4673',
              'Toll-Free for PLDT: 2919',
            ],
            Mobile: [
              'Globe/TM: 0917-558-467',
            ],
        },
        {
            Title: 'In Touch Crisis Lines',
            Landline: ['Landline: (02) 8893-7603'],
            Mobile: [
              'Mobile: 0917-800-1123 (Globe)',
              '0922-893-8944 (Sun)',
            ],
        },
        {
            Title: 'Philippine Red Cross - Mental Health & Psychosocial Support Services',
            Landline: ['Hotline Number: 143 (Nationwide)'],
            Mobile: [],
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

    // Helper component to render clickable phone numbers
    // eslint-disable-next-line react/no-unstable-nested-components
    const PhoneNumberText = ({ text, style }: { text: string; style: any }) => (
      <TouchableOpacity onPress={() => dialNumber(text)} activeOpacity={0.7}>
        <Text style={[style, styles.phoneNumber]}>{text}</Text>
      </TouchableOpacity>
    );

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
                                <Text style={[styles.ContentTitle, index % 2 === 0 ? styles.TextPaddingLeft : styles.TextPaddingRight]}>
                                  {item.Title}
                                </Text>

                                {/* Render each landline number separately */}
                                {item.Landline.map((number, idx) => (
                                  <PhoneNumberText
                                    key={`landline-${idx}`}
                                    text={number}
                                    style={[index % 2 === 0 ? styles.TextPaddingLeft : styles.TextPaddingRight]}
                                  />
                                ))}

                                {/* Render each mobile number separately */}
                                {item.Mobile.length > 0 && item.Mobile.map((number, idx) => (
                                  <PhoneNumberText
                                    key={`mobile-${idx}`}
                                    text={number}
                                    style={[index % 2 === 0 ? styles.TextPaddingLeft : styles.TextPaddingRight]}
                                  />
                                ))}
                            </View>
                            <View style={[styles.IconBox, index % 2 === 0 ? styles.leftIconBox : styles.rightIconBox]}>
                                <Ionicons name="call" size={moderateScale(60)} color="#da2f47" style={styles.Icon}/>
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
      paddingVertical: verticalScale(10),
      paddingHorizontal: scale(50),
      borderBottomLeftRadius: moderateScale(25),
      borderBottomRightRadius: moderateScale(25),
      marginBottom: verticalScale(75),
    },
    title: {
      fontSize: moderateScale(15),
      letterSpacing: moderateScale(2),
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
        height: verticalScale(80),
        borderRadius: moderateScale(9999),
        position: 'relative',
        marginBottom: verticalScale(70),
    },
    IconShadow: {
         position: 'absolute',
         backgroundColor: '#da2f47',
         width: '35%',
         height: '140%',
         borderRadius: moderateScale(9999),
         top: verticalScale(-15),
    },
    LeftIcon: {
        left: scale(-10),
    },
    RightIcon: {
        right: scale(-10),
    },
    IconBox: {
        position: 'absolute',
        backgroundColor: 'white',
        width: width * 0.285,
        height: '140%',
        borderRadius: moderateScale(9999),
        top: verticalScale(-25),
    },
    leftIconBox:
    {
        left: scale(-15),
    },
    rightIconBox:
    {
        right: scale(-15),
    },
    Icon: {
        borderWidth: moderateScale(10),
        borderColor: '#da2f47',
        borderRadius: moderateScale(9999),
        padding: moderateScale(5),
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
        borderRadius: moderateScale(9999),
        paddingVertical: verticalScale(10),
        position: 'absolute',
        top: verticalScale(-10),
    },
    LeftCB: {
        left: scale(-10),
    },
    RightCB: {
        right: scale(-10),
    },
    TextPaddingLeft: {
        paddingLeft: '35%',
        fontSize: moderateScale(12),
        color: 'black',
    },
    TextPaddingRight: {
        paddingRight: '35%',
        textAlign: 'right',
        fontSize: moderateScale(12),
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
      marginBottom: verticalScale(20),
      backgroundColor: '#f57c00',
      paddingHorizontal: scale(20),
      paddingVertical: verticalScale(10),
      borderTopLeftRadius: moderateScale(15),
      borderTopRightRadius: moderateScale(15),
    },
    modalTitleStyled: {
      fontSize: moderateScale(18),
      color: '#333',
      fontFamily: 'Poppins-Bold',
    },
    sendBtn: {
      backgroundColor: '#f57c00',
      paddingVertical: verticalScale(5),
      paddingHorizontal: scale(20),
      borderRadius: moderateScale(30),
    },
    sendText: {
      color: 'white',
      fontFamily: 'Poppins-ExtraBold',
      shadowRadius: moderateScale(3),
      shadowOffset: {width: scale(1), height: verticalScale(1)},
      shadowColor: 'gray',
      fontSize: moderateScale(15),
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
    redHeader: {
      backgroundColor: '#e3b7b7',
    },
    marginB: {
      marginBottom: verticalScale(10),
    },
    modalTitleStyled2: {
      fontSize: moderateScale(18),
      color: '#333',
      fontFamily: 'Poppins-Bold',
    },
    instructions2: {
      fontFamily: 'Lora-Bold',
      color: '#4a4a4a',
      paddingHorizontal: scale(40),
      textAlign: 'center',
    },
    actions2: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: moderateScale(10),
      paddingHorizontal: scale(20),
      paddingBottom: verticalScale(10),
      justifyContent: 'flex-end',
    },
    sendBtn2: {
      backgroundColor: '#b7e3cc',
      paddingVertical: verticalScale(10),
      paddingHorizontal: scale(20),
      borderRadius: moderateScale(10),
    },
    sendText2: {
      color: 'white',
      fontFamily: 'Poppins-ExtraBold',
      shadowRadius: moderateScale(3),
      shadowOffset: {width: scale(1), height: verticalScale(1)},
      shadowColor: 'gray',
      fontSize: moderateScale(15),
    },
    phoneNumber: {
      textDecorationLine: 'underline', // Visual cue that it's clickable
      color: '#1e40af', // Blue color for phone numbers
    },
});

