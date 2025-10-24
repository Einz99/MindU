/* eslint-disable react-native/no-inline-styles */
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
import { RootAPI, API } from '../apiConfigs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import stringSimilarity from 'string-similarity';
import { io, Socket } from 'socket.io-client';
import { MAIN_MENU, MAIN_MENU_PROMPT, FAQ_TREE } from '../data/faqTree';
import { useIsFocused } from '@react-navigation/native';
import axios from 'axios';

type Message = {
  from: 'bot' | 'user' | 'counselor';
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
    const socketRef = useRef<Socket | null>(null);

    const [input, setInput] = useState('');
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [messageError, setMessageError] = useState('');
    const [alertModal, setAlertModal] = useState(false);
    const [isSuccessful, setIsSuccessful] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [studentID, setStudentID] = useState(0);

    const [isAI, setIsAI] = useState<boolean>(false);
    const [isAgent, setIsAgent] = useState(false);
    const [isAgentAvailable, setIsAgentAvailable] = useState(false);

    const [lastMessageTime, setLastMessageTime] = useState<Date | null>(null);

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
            setStudentID(response.data.user.id);
            if (response.data.user.isAskingHelp && !isAgentAvailable) {
              setIsAgent(response.data.user.isAskingHelp);
              setIsAI(response.data.user.isAskingHelp && !isAgent);
            }
          } else {
            setIsSuccessful(false);
            setMessageError('User not found. Please try logging in again.');
            setAlertModal(true);
            setStudentID(0);
            setIsAI(false);
            setIsAgent(false);
          }
        } catch (error) {
          setIsSuccessful(false);
          setMessageError('Server Error: Unable to connect. Please try again.');
          setAlertModal(true);
        }
      };
      fetchUserData();
    }, [isAgent, isAgentAvailable, navigation]);

    // Initialize Socket.IO connection
    useEffect(() => {
      socketRef.current = io(RootAPI, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      socketRef.current.on('connect', () => {
        console.log('✅ Connected to server:', socketRef.current ? socketRef.current.id : 'unknown');
      });

      socketRef.current.on('disconnect', () => {
        console.log('❌ Disconnected from server');
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Connection error:', error);
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }, []);

    // Replace the "Listen for agent joining" useEffect with this:
    useEffect(() => {
      if (socketRef.current && studentID) {
        socketRef.current.on('agent-available', (data) => {
          console.log('🎉 Agent is now available:', data);

          if (data.isAgentAvailable && data.student_id === studentID) {
            setIsAI(false);
            setIsAgentAvailable(true);
            setIsAgent(true);

            addMessage({
              from: 'counselor',
              text: 'A counselor has joined the chat and will assist you shortly.',
              mode: 'counselor',
            });
          }
        });

        return () => {
          if (socketRef.current) {
            socketRef.current.off('agent-available');
          }
        };
      }
    }, [studentID]);

    useEffect(() => {
      if (socketRef.current && studentID) {
        socketRef.current.on('agent-disconnection', (data) => {
          console.log('🎉 Agent is now available:', data);

          if (data.isAgentAvailable && data.student_id === studentID) {
            setIsAI(false);
            setIsAgentAvailable(false);
            setIsAgent(false);

            addMessage({from: 'bot', text: 'Your Session With Guidance Office ended', mode: 'faq'});

            setMessages((prev) => [...prev, {
              from: 'bot',
              text: 'Welcome! How can I support your wellbeing today?',
              mode: 'faq',
              options: [...MAIN_MENU, '💬 Chat with me', '👨‍🏫 Talk to a guidance counselor'],
            }]);
          }
        });

        return () => {
          if (socketRef.current) {
            socketRef.current.off('agent-disconnecting');
          }
        };
      }
    }, [studentID]);

    useEffect(() => {
      const saveAgentAvailableState = async () => {
        try {
          await AsyncStorage.setItem(
            'isAgentAvailable',
            JSON.stringify(isAgentAvailable)
          );
          console.log('💾 Saved isAgentAvailable:', isAgentAvailable);
        } catch (error) {
          console.error('Error saving agent available state:', error);
        }
      };

      saveAgentAvailableState();
    }, [isAgentAvailable]);

    useEffect(() => {
      const loadAgentAvailableState = async () => {
        try {
          const savedState = await AsyncStorage.getItem('isAgentAvailable');
          if (savedState !== null) {
            const isAvailable = JSON.parse(savedState);
            setIsAgentAvailable(isAvailable);
            console.log('📂 Loaded isAgentAvailable:', isAvailable);
          }
        } catch (error) {
          console.error('Error loading agent available state:', error);
        }
      };

      loadAgentAvailableState();
    }, []); // Run only once on mount

    // Listen for new chat messages
    useEffect(() => {
      if (socketRef.current && studentID) {
        socketRef.current.on('new-chat-message', (data) => {
          console.log('📨 Received new-chat-message:', data);

          const { message, is_from_office, student_id } = data;

          // Only process messages for this student
          if (student_id === studentID) {
            addMessage({
                from: is_from_office ? 'counselor' : 'user',
                text: message,
                mode: is_from_office ? 'counselor' : isAI ? 'chat' : 'faq',
              });
          }
        });

        return () => {
          if (socketRef.current) {
            socketRef.current.off('new-chat-message');
          }
        };
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socketRef.current, studentID, isAI]);

    // Join chat room when student ID is available
    useEffect(() => {
      if (socketRef.current && studentID && isAgent) {
        console.log(`🔗 Joining chat room for student ${studentID}`);
        socketRef.current.emit('join-chat', studentID);
      }
    }, [studentID, isAgent]);

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
      const keyboardListener = Keyboard.addListener('keyboardDidShow', () => {
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      });
      return () => keyboardListener.remove();
    }, []);

    useEffect(() => {
      const initializeChat = async () => {
        if (studentID) {
          try {
            const response = await axios.get(`${API}/chatbot/get-conversation/${studentID}`);

            const botMessages = response.data.botConversation.map((msg: { is_from_bot: boolean, message: any; created_at: string | number | Date; }) => ({
              from: msg.is_from_bot ? 'bot' : 'user',
              text: msg.message,
              timestamp: new Date(msg.created_at).toLocaleString(),
              mode: 'faq',
            }));

            const officeMessages = response.data.officeConversation.map((msg: { is_from_office: boolean, message: any; created_at: string | number | Date; }) => ({
              from: msg.is_from_office ? 'counselor' : 'user',
              text: msg.message,
              timestamp: new Date(msg.created_at).toLocaleString(),
              mode: 'counselor',
            }));

            const combinedMessages = [...botMessages, ...officeMessages];
            combinedMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

            setMessages(combinedMessages);

            if (!isAgent || isAI) {
              setMessages((prev) => [...prev, {
                from: 'bot',
                text: 'Welcome! How can I support your wellbeing today?',
                mode: 'faq',
                options: [...MAIN_MENU, '💬 Chat with me', '👨‍🏫 Talk to a guidance counselor'],
              }]);
            }

            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

          } catch (err) {
            console.error('Error loading conversation:', err);
            setMessages([{
                from: 'bot',
                text: 'Welcome! How can I support your wellbeing today?',
                mode: 'faq',
                options: [...MAIN_MENU, '💬 Chat with me', '👨‍🏫 Talk to a guidance counselor'],
              }]);
            }
        }
      };
      initializeChat();
    }, [isAI, isAgent, studentID]);

  const addMessage = (msg: Message) => {
    setMessages((prev) => [...prev, msg]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  useEffect(() => {
    setLastMessageTime(new Date());
  }, [messages]);

  useEffect(() => {
    if (isAgent && !isAI) {
      // If an agent is active and chatting, start the inactivity timer
      if (lastMessageTime) {
        const timeout = setTimeout(() => {
          const timeElapsed = new Date().getTime() - lastMessageTime.getTime();
          if (timeElapsed >= 180000) { // 3 minutes in milliseconds
            // If 3 minutes have passed with no activity, disconnect
            setIsAgent(false);
            setIsAgentAvailable(false);
            setIsAI(false);
            addMessage({ from: 'bot', text: 'You have been disconnected due to inactivity.', mode: 'faq' });
            console.log('Disconnected due to inactivity');
          }
        }, 180000); // Check after 3 minutes

        // Clear the timer on cleanup or when messages are added
        return () => {
          if (timeout) {
            clearTimeout(timeout);
          }
        };
      }
    }
  }, [lastMessageTime, isAgent, isAI]);

  // Handle user input and manage interaction flow
  const handleUserInput = async (text: string) => {
    if (!text.trim()) { return; }

    try {
      await axios.post(`${API}/student-activities/insert`, { module: 'Chatbot' });
    } catch (err) {
      console.error('Error logging student activity:', err);
    }

    const lastBot = messages.filter((m) => m.from === 'bot').slice(-1)[0];
    const isOptions = messages.filter((m) => m.options).slice(-1).length > 0;

    if (isOptions) {
      setMessages((prevMessages) => prevMessages.slice(0, -1)); // Remove the last message
    }
    // If chatting with live agent
    if (isAgent && !isAI) {
      if (text.toLowerCase() === 'exit') {
        setIsAI(false);
        setIsAgentAvailable(false);
        setIsAgent(false);
        try {
          await axios.post(`${API}/chatbot/deactivateStatus/${studentID}`);
        } catch (error) {
          console.error('Error changing status');
        }

        setMessages((prev) => [...prev, {
          from: 'bot',
          text: 'Welcome! How can I support your wellbeing today?',
          mode: 'faq',
          options: [...MAIN_MENU, '💬 Chat with me', '👨‍🏫 Talk to a guidance counselor'],
        }]);
        return;
      }

      try {
        await axios.post(`${API}/chatbot/insert-chat-message`, {
          student_id: studentID,
          message: text,
          is_from_office: false,
        });

        console.log('Message sent to agent');
      } catch (error) {
        console.error('Error sending message to agent:', error);
      }
      return;
    }

    // If in AI mode and user wants to talk to a counselor
    if (isAI && text.toLowerCase().includes('talk to a guidance counselor')) {
      // Remove the AI chat and options message
      setMessages((prevMessages) => prevMessages.filter(msg => !msg.options));

      // Add a message indicating the redirection
      addMessage({
        from: 'bot',
        text: 'Connecting you to a guidance counselor...',
        mode: 'counselor',
      });

      setIsAgent(true);
      setIsAI(false);  // Disable AI mode

      // Set isAgentAvailable to false since the student is waiting for a counselor
      setIsAgentAvailable(false); // <-- Indicate the student is waiting for the counselor

      // Call the backend to handle the redirection to counselor
      try {
        const response = await axios.put(`${API}/chatbot/get-help/${studentID}`);

        if (response.data.success) {
          // Join the chat room
          if (socketRef.current) {
            socketRef.current.emit('join-chat', studentID);
          }

          addMessage({
            from: 'bot',
            text: 'A counselor will be with you shortly. You can continue chatting while waiting.',
            mode: 'counselor',
          });
        } else {
          addMessage({
            from: 'bot',
            text: 'Sorry, something went wrong while connecting you to the counselor. Please try again later.',
            mode: 'counselor',
          });
        }
      } catch (error) {
        console.error('Error while connecting to counselor:', error);
        addMessage({
          from: 'bot',
          text: 'Oops! Something went wrong while connecting to the counselor. Please try again later.',
          mode: 'counselor',
        });
      }

      return;
    }

    // If in AI mode and waiting for counselor, allow chatting with bot
    if (isAI && !isAgentAvailable) {
      try {
        const response = await axios.post(`${API}/chatbot/send-message`, {
          message: text,
          userId: studentID,
        });
        addMessage({ from: 'bot', text: response.data.fulfillmentText, mode: 'faq' });
      } catch (err) {
        console.error('Error sending message to the backend:', err);
      }

      return;
    }

    // If in AI mode
    if (isAI) {
      if (text.toLowerCase() === 'exit') {
        setIsAI(false);
        addMessage({
          from: 'bot',
          text: 'You have exited AI chat. How can I assist you further?',
          mode: 'faq',
          options: [...MAIN_MENU, '💬 Chat with me', '👨‍🏫 Talk to a guidance counselor'],
        });
        return;
      }

      try {
        const response = await axios.post(`${API}/chatbot/send-message`, {
          message: text,
          userId: studentID,
        });
        addMessage({ from: 'bot', text: response.data.fulfillmentText, mode: 'faq' });
      } catch (err) {
        console.error('Error sending message to the backend:', err);
      }

      return;
    }

    const currentMenuOptions = lastBot?.options || [];
    const isInMainMenu = currentMenuOptions.some((opt) => MAIN_MENU.includes(opt));
    const hasMenuOptions = currentMenuOptions.length > 0;

    if (MAIN_MENU.includes(text)) {
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
    }

    if (isInMainMenu && hasMenuOptions) {
      const bestMatch = stringSimilarity.findBestMatch(text, MAIN_MENU);
      if (bestMatch.bestMatch.rating >= 0.6) {
        if (bestMatch.bestMatch.target !== text) {
          handleUserInput(bestMatch.bestMatch.target);
          return;
        }
      }
    }

    if (text === '💬 Chat with me') {
      setMessages((prevMessages) => prevMessages.filter(msg => !msg.options));
      addMessage({
        from: 'bot',
        text: 'Sure! Type your question and I\'ll do my best to help. 😊',
        mode: 'chat',
      });
      setIsAI(true);
      return;
    }

    if (text === '👨‍🏫 Talk to a guidance counselor') {
      setMessages((prevMessages) => prevMessages.filter(msg => !msg.options));
      addMessage({
        from: 'bot',
        text: 'Connecting you to a guidance counselor...',
        mode: 'counselor',
      });

      setIsAgent(true);

      try {
        const response = await axios.put(`${API}/chatbot/get-help/${studentID}`);

        if (response.data.success) {
          // Join the chat room
          if (socketRef.current) {
            socketRef.current.emit('join-chat', studentID);
          }

          addMessage({
            from: 'bot',
            text: 'A counselor will be with you shortly. You can continue chatting while waiting.',
            mode: 'counselor',
          });
        } else {
          addMessage({
            from: 'bot',
            text: 'Sorry, something went wrong while connecting to the counselor. Please try again later.',
            mode: 'counselor',
          });
        }
      } catch (error) {
        console.error('Error while connecting to counselor:', error);
        addMessage({
          from: 'bot',
          text: 'Oops! Something went wrong while connecting to the counselor. Please try again later.',
          mode: 'counselor',
        });
      }

      return;
    }

    if (MAIN_MENU.includes(text)) {
      const introText = FAQ_TREE[text]?.intro;
      const options = Object.keys(FAQ_TREE[text]?.questions || {});

      addMessage({
        from: 'bot',
        text: introText || 'I am here to help! Please choose a question below.',
        mode: 'faq',
        options: options,
        topic: text,
      });
      return;
    }

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
        text: 'No problem! Let\'s go back to the main menu. Please choose a new topic below:',
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
      setTimeout(() => {
        if (isFocused) {
          addMessage(
            {
              from: 'bot',
              text: MAIN_MENU_PROMPT,
              mode: 'faq',
              options: [...MAIN_MENU, '💬 Chat with me', '👨‍🏫 Talk to a guidance counselor'],
            },
          );
          setIsAI(false);
          setIsAgent(false);
          setIsAgentAvailable(false);
        }
      }, 2000);
      return;
    }

    addMessage({
      from: 'bot',
      text: 'I didn\'t catch that. Try picking a wellness topic or ask for a live agent.',
      mode: 'faq',
      options: [...MAIN_MENU, '💬 Chat with me', '👨‍🏫 Talk to a guidance counselor'],
    });
  };


  return (
    <KeyboardAvoidingView style={styles.flex1} behavior="height" keyboardVerticalOffset={20}>
      <View style={styles.screen}>
        <DrawerComponent Initial={'Chatbot'} />

        <View style={styles.container}>
          <View style={styles.titleBox}>
            <Text style={styles.title}>Chatbot</Text>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 40 }}
          style={[styles.chatbotContainer, keyboardVisible && { maxHeight: '65%' }]}
        >
          {messages.map((msg, idx) => (
            <View
              key={idx}
              style={(msg.from === 'bot' || msg.from === 'counselor') ? styles.botChatAlign : styles.userChatAlign}
            >
              <View
                style={(msg.from === 'bot' || msg.from === 'counselor') ? styles.botPictureAlign : styles.userPictureAlign}
              >
                {(msg.from !== 'user') && (
                  <Image
                    source={
                      msg.from === 'bot'
                        ? require('../assets/images/appchatbot.png')
                        : require('../assets/images/default_profile.png')
                    }
                    style={styles.image}
                  />
                )}
                <View style={styles.chatWidth}>
                  <Text style={styles.chatbotText}>{msg.text}</Text>
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
          {(isAI && !isAgentAvailable) && (
            <View style={styles.aiIndicatorContainer}>
              <Text style={styles.aiIndicatorText}>
                💬 You are chatting with AI • Type "exit" to return to menu
              </Text>
            </View>
          )}
          {(isAgent && isAgentAvailable) && (
            <View style={[styles.aiIndicatorContainer, {backgroundColor: '#e8f5e9', borderColor: '#81c784'}]}>
              <Text style={[styles.aiIndicatorText, {color: '#2e7d32'}]}>
                👨‍🏫 Connected with guidance counselor • type "exit" to disconnect and return to menu.
              </Text>
            </View>
          )}
        </ScrollView>

        <TextInput
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
  botChatAlign: { flex: 1, alignItems: 'flex-start', paddingHorizontal: 10 },
  botPictureAlign: {flexDirection: 'row', gap: 10},
  aiIndicatorContainer: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#90caf9',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 8,
    marginTop: 2,
  },
  aiIndicatorText: {
    fontSize: 9,
    color: '#1565c0',
    fontFamily: 'Poppins-MediumItalic',
    textAlign: 'center',
  },
});
