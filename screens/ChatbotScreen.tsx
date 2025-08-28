import React, { useState, useEffect, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  Dimensions,
  KeyboardAvoidingView,
  Keyboard,
  Modal,
  Image,
  Text,
  TouchableOpacity,
} from 'react-native';
import DrawerComponent from '../Components/DrawerComponent';
import HomepageTop from '../Components/HomepageTop';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../APIClient';
import { API, RootAPI } from '../apiConfigs';
import Ionicons from 'react-native-vector-icons/Ionicons';


const { width } = Dimensions.get('window');

export default function ChatbotScreen() {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const [input, setInput] = useState('');
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [profilePic, setProfilePic] = useState<string | null>(null);
    const [messageError, setMessageError] = useState('');
    const [isSuccessful, setIsSuccessful] = useState(false);
    const [alertModal, setAlertModal] = useState(false);
    const scrollRef = useRef<ScrollView>(null);

    useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleInputChange = (inputted: string) => {
    setInput(inputted);
  };

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
              // Construct full image URL from local server
              const picPath = response.data.user.profilePic;
              if (picPath) {
                setProfilePic(`${RootAPI}${picPath}`);
              } else {
                setProfilePic(null); // No profile picture available
              }
            } else {
              setIsSuccessful(false);
              setMessageError('User not found. Please try logging in again.');
              setAlertModal(true);
            }
          } catch (error: any) {
            setIsSuccessful(false);
            setMessageError('Server Error: Unable to connect. Please try again.');
            setAlertModal(true);
          }
        };
        fetchUserData();
  }, [navigation]);

  useEffect(() => {
    const keyboardListener = Keyboard.addListener('keyboardDidShow', () => {
      // Wait briefly to ensure layout is updated
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => keyboardListener.remove();
  }, []);

  return (
    <KeyboardAvoidingView style={styles.flex1} behavior="height" keyboardVerticalOffset={20}>
      <View style={styles.container}>
        <DrawerComponent Initial={'Chatbot'} />
        <HomepageTop navigation={navigation} />
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          // eslint-disable-next-line react-native/no-inline-styles
          contentContainerStyle={{ paddingBottom: 40 }}
          // eslint-disable-next-line react-native/no-inline-styles
          style={[styles.chatbotContainer, keyboardVisible && {maxHeight: '35%'}]}>
            <View style={styles.userChatAlign}>
              <View style={styles.userPictureAlign}>
                <Image
                  source={
                    profilePic
                      ? { uri: profilePic }
                      : require('../assets/images/default_profile.png')
                  }
                  style={styles.image}
                />
                <Text style={styles.userChatText}>Hi!</Text>
              </View>
            </View>
            <View style={styles.botChatAlign}>
              <View style={styles.botPictureAlign}>
                <Image
                  source={require('../assets/images/default_profile.png')}
                  style={styles.image}
                />
                <View style={styles.chatWidth}>
                  <Text style={styles.chatbotText}>Hey there! 👋 What can I do for you today?</Text>
                </View>
              </View>
            </View>
        </ScrollView>
        <TextInput
          style={[
            styles.input,
            // eslint-disable-next-line react-native/no-inline-styles
            { bottom: keyboardVisible ? '2%' : '7%' },
          ]}
          placeholder="Type Here"
          value={input}
          onChangeText={handleInputChange}
          returnKeyType="next"  // or 'done', 'go', etc.
          onSubmitEditing={() => {
            // Your action here
            console.log('User pressed next/return!');
            // e.g. call a submit function, move focus, etc.
          }}
        />

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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  flex1: { flex: 1},
  chatbotContainer: {
    backgroundColor: 'white',
    margin: 20,
    paddingHorizontal: 20,
    borderRadius: 20,
    maxHeight: '55%',
    position: 'relative',
    paddingTop: 20,
  },
  input: {
    height: 45,
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 15,
    borderRadius: 25,
    minWidth: '80%',
    maxWidth: '80%',
    color: '#555',
    borderColor: '#fff',
    backgroundColor: '#d6c9f3',
    fontFamily: 'Lora-Regular',
    position: 'absolute',
    left: width / 2,
    transform: [{ translateX: -((width * 0.8) / 2) }],
  },
  image: {width: 30, height: 30, borderRadius: 20, borderWidth: 2, borderColor: '#b7e3cc'},
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
  chatbotText: {color: 'black', fontFamily: 'Lora-Bold', textAlignVertical: 'center', fontSize: 10, borderWidth: 1, borderColor: '#b7e3cc', padding: 5, textAlign: 'left', borderRadius: 10, marginBottom: 10},
  chatWidth: {width: '65%'},
  userChatAlign: {flex: 1, alignItems: 'flex-end', paddingHorizontal: 10, marginBottom: 20},
  userPictureAlign: {flexDirection: 'row-reverse', gap: 10},
  userChatText: {color: 'black', fontFamily: 'Lora-Bold', textAlignVertical: 'center', fontSize: 10, borderWidth: 1, borderColor: '#b7e3cc', padding: 5, textAlign: 'right', borderRadius: 10},
  botChatAlign: { flex: 1, alignItems: 'flex-start', paddingHorizontal: 10 },
  botPictureAlign: {flexDirection: 'row', gap: 10},
});
