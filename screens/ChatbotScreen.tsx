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
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../APIClient';
import { API, RootAPI } from '../apiConfigs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import stringSimilarity from 'string-similarity';

import { MAIN_MENU, MAIN_MENU_PROMPT, FAQ_TREE } from '../data/faqTree';
import { useIsFocused } from '@react-navigation/native';
import axios from 'axios';

type Message = {
  from: 'bot' | 'user';
  text: string;
  mode: 'faq' | 'chat' | 'counselor';
  options?: string[];
  topic?: string;
  lastQ?: string;
};

const { width } = Dimensions.get('window');

export default function ChatbotScreen() {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const scrollRef = useRef<ScrollView>(null);
    const isFocused = useIsFocused();

    const [input, setInput] = useState('');
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [profilePic, setProfilePic] = useState<string | null>(null);
    const [messageError, setMessageError] = useState('');
    const [alertModal, setAlertModal] = useState(false);
    const [isSuccessful, setIsSuccessful] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);

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

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
          setIsSuccessful(false);
          setMessageError('User not found. Please try logging in again.');
          setAlertModal(true);
          setTimeout(() => navigation.navigate('Login'), 1000);
          return;
        }
        const response = await apiClient.get(`${API}/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data?.user) {
          const picPath = response.data.user.profilePic;
          setProfilePic(picPath ? `${RootAPI}${picPath}` : null);
        } else {
          setIsSuccessful(false);
          setMessageError('User not found. Please try logging in again.');
          setAlertModal(true);
        }
      } catch (error) {
        setIsSuccessful(false);
        setMessageError('Server Error: Unable to connect. Please try again.');
        setAlertModal(true);
      }
    };
    fetchUserData();
  }, [navigation]);

  useEffect(() => {
    const keyboardListener = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    });
    return () => keyboardListener.remove();
  }, []);

  // Initial greeting
  useEffect(() => {
    setMessages([
      {
        from: 'bot',
        text: MAIN_MENU_PROMPT,
        mode: 'faq',
        options: [...MAIN_MENU, '💬 Chat with me', '👨‍🏫 Talk to a guidance counselor'],
      },
    ]);
  }, [isFocused]);

  // Add a message
  const addMessage = (msg: Message) => {
    setMessages((prev) => [...prev, msg]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleUserInput = async (text: string) => {
    if (!text.trim()) { return; }

    try {
      // Log student activity for the Wellness module
      await axios.post(`${API}/student-activities/insert`, { module: 'Chatbot' });
    } catch (err) {
      console.error('Error logging student activity:', err);
    }

    // Always add the raw user input to chat
    addMessage({ from: 'user', text, mode: 'faq' });

    const lastBot = messages.filter((m) => m.from === 'bot').slice(-1)[0];

    // ================================
    // Step 1: Check if we are in MAIN MENU
    // ================================
    if (lastBot?.options?.some((opt) => MAIN_MENU.includes(opt))) {
      const bestMatch = stringSimilarity.findBestMatch(text, MAIN_MENU);
      if (bestMatch.bestMatch.rating >= 0.6) {
        handleUserInput(bestMatch.bestMatch.target); // act like user tapped it
        return;
      }
    }

    // ================================
    // Step 2: Check if we are inside a TOPIC (questions list)
    // ================================
    if (lastBot?.topic && FAQ_TREE[lastBot.topic]) {
      const topicQuestions = Object.keys(FAQ_TREE[lastBot.topic].questions);
      const bestMatch = stringSimilarity.findBestMatch(text, topicQuestions);
      if (bestMatch.bestMatch.rating >= 0.6) {
        handleUserInput(bestMatch.bestMatch.target);
        return;
      }
    }

    // ================================
    // Step 3: Special cases
    // ================================
    if (text === '💬 Chat with me') {
      addMessage({
        from: 'bot',
        text: 'Sure! Type your question and I’ll do my best to help. 😊',
        mode: 'chat',
      });
      return;
    }

    if (text === '👨‍🏫 Talk to a guidance counselor') {
      addMessage({
        from: 'bot',
        text: 'Connecting you to a guidance counselor...',
        mode: 'counselor',
      });
      // TODO: trigger live agent connection here
      return;
    }

    // ================================
    // Step 4: FAQ topic selection
    // ================================
    if (FAQ_TREE[text]) {
      addMessage({
        from: 'bot',
        text: FAQ_TREE[text].intro,
        mode: 'faq',
        options: Object.keys(FAQ_TREE[text].questions),
        topic: text,
      });
      return;
    }

    // ================================
    // Step 5: FAQ question selection
    // ================================
    if (lastBot?.topic && FAQ_TREE[lastBot.topic]?.questions[text]) {
      const answer = FAQ_TREE[lastBot.topic].questions[text];
      const remaining = Object.keys(FAQ_TREE[lastBot.topic].questions).filter(
        (q) => q !== text
      );

      addMessage({
        from: 'bot',
        text: answer,
        mode: 'faq',
        options: [
          ...(remaining.length > 0 ? [`🔁 Ask another question about ${lastBot.topic}`] : []),
          '📚 Explore a different wellness topic',
          '👋 End the conversation',
        ],
        topic: lastBot.topic,
        lastQ: text,
      });
      return;
    }

    // ================================
    // Step 6: Follow-up options
    // ================================
    if (text.startsWith('🔁 Ask another question about')) {
      const topic = messages.filter((m) => m.topic).slice(-1)[0]?.topic;
      if (topic) {
        const lastQ = messages.filter((m) => m.lastQ).slice(-1)[0]?.lastQ;
        const remaining = Object.keys(FAQ_TREE[topic].questions).filter(
          (q) => q !== lastQ
        );
        addMessage({
          from: 'bot',
          text: 'Sure! Here are your choices again:',
          mode: 'faq',
          options: remaining,
          topic,
        });
      }
      return;
    }

    if (text === '📚 Explore a different wellness topic') {
      addMessage({
        from: 'bot',
        text: 'No problem! Let’s go back to the main menu. Please choose a new topic below:',
        mode: 'faq',
        options: MAIN_MENU,
      });
      return;
    }

    if (text === '👋 End the conversation') {
      addMessage({
        from: 'bot',
        text: 'Thanks for chatting with me! 🌟 Come back anytime.',
        mode: 'faq',
      });
      return;
    }

    // ================================
    // Step 7: Fallback
    // ================================
    addMessage({
      from: 'bot',
      text: 'I didn’t catch that. Try picking a wellness topic or ask for a live agent.',
      mode: 'faq',
      options: [...MAIN_MENU, '💬 Chat with me', '👨‍🏫 Talk to a guidance counselor'],
    });
  };

 return (
    <KeyboardAvoidingView style={styles.flex1} behavior="height" keyboardVerticalOffset={20}>
      <View style={styles.screen}>
        <DrawerComponent Initial={'Chatbot'} />

        {/* Title */}
        <View style={styles.container}>
          <View style={styles.titleBox}>
            <Text style={styles.title}>Chatbot</Text>
          </View>
        </View>

        {/* Chat area */}
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          // eslint-disable-next-line react-native/no-inline-styles
          contentContainerStyle={{ paddingBottom: 40 }}
          // eslint-disable-next-line react-native/no-inline-styles
          style={[styles.chatbotContainer, keyboardVisible && { maxHeight: '65%' }]}
        >
          {messages.map((msg, idx) => (
            <View
              key={idx}
              style={msg.from === 'bot' ? styles.botChatAlign : styles.userChatAlign}
            >
              <View
                style={msg.from === 'bot' ? styles.botPictureAlign : styles.userPictureAlign}
              >
                <Image
                  source={
                    msg.from === 'user'
                      ? profilePic
                        ? { uri: profilePic }
                        : require('../assets/images/default_profile.png')
                      : require('../assets/images/default_profile.png')
                  }
                  style={styles.image}
                />
                <View style={styles.chatWidth}>
                  <Text style={styles.chatbotText}>{msg.text}</Text>

                  {/* Show options */}
                  {msg.options?.map((opt, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.optionBtn}
                      onPress={() => handleUserInput(opt)}
                    >
                      <Text style={styles.optionText}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Input */}
        <TextInput
          // eslint-disable-next-line react-native/no-inline-styles
          style={[styles.input, { bottom: keyboardVisible ? '2%' : '7%' }]}
          placeholder="Type Here"
          value={input}
          onChangeText={setInput}
          returnKeyType="send"
          onSubmitEditing={() => {
            handleUserInput(input);
            setInput('');
          }}
        />

        {/* Error Modal */}
        <Modal visible={alertModal} animationType="fade" transparent>
          <View style={styles.overlay}>
            <View style={styles.forgotModal}>
              <View style={[styles.modalHeader, !isSuccessful && styles.redHeader]}>
                <Text style={styles.modalTitleStyled}>
                  {isSuccessful ? 'Successful' : 'Error'}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setAlertModal(false);
                    setMessageError('');
                    setIsSuccessful(false);
                  }}
                >
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
  screen: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
      width: '100%',
      alignItems: 'center',
  },
  titleBox: {
      backgroundColor: '#b7e3cc',
      paddingVertical: 5,
      paddingHorizontal: 50,
      borderRadius: 25,
      marginTop: 10,
      marginBottom: 10,
  },
  title: {
      fontSize: 15,
      letterSpacing: 2,
      fontFamily: 'Poppins-Bold',
      color: 'black',
  },
  flex1: { flex: 1},
  chatbotContainer: {
    backgroundColor: 'white',
    margin: 20,
    paddingHorizontal: 20,
    borderRadius: 20,
    maxHeight: '73%',
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
  optionBtn: {
    backgroundColor: '#eee',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginTop: 4,
  },
  optionText: { fontSize: 12, color: '#333', fontFamily: 'Poppins-Regular' },
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
  chatWidth: {width: '65%', marginBottom: 10},
  userChatAlign: {flex: 1, alignItems: 'flex-end', paddingHorizontal: 10},
  userPictureAlign: {flexDirection: 'row-reverse', gap: 10},
  userChatText: {color: 'black', fontFamily: 'Lora-Bold', textAlignVertical: 'center', fontSize: 10, borderWidth: 1, borderColor: '#b7e3cc', padding: 5, textAlign: 'right', borderRadius: 10},
  botChatAlign: { flex: 1, alignItems: 'flex-start', paddingHorizontal: 10 },
  botPictureAlign: {flexDirection: 'row', gap: 10},
});
