/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect, useRef} from 'react';
import { AppState } from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
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
import { io, Socket } from 'socket.io-client';
import { MAIN_MENU, FAQ_TREE } from '../data/faqTree';
import { TriggerWords } from '../data/triggerData';
import { useIsFocused } from '@react-navigation/native';
import axios from 'axios';

type Message = {
  from: 'bot' | 'user' | 'counselor' | 'notification';
  text: string;
  options?: string[];
  topic?: string;
  lastQ?: string;
  isSelected?: number;
};

const InitialChat: Message = {
  from: 'bot',
  text: 'Hello there! Calmi here. What can I do for you?',
  options: ['FAQ', 'Chat with me', 'Connect to guidance'],
};

const FAQChat: Message = {
  from: 'bot',
  text: 'Hello there! Calmi here. What can I do for you?',
  options: [...MAIN_MENU, 'Go back'],
};

const { width } = Dimensions.get('window');

export default function ChatbotScreen() {
    const [appState, setAppState] = useState(AppState.currentState);
    const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
    const [picturePath, setPicturePath] = useState<string | null>();

    const [isAI, setIsAI] = useState<boolean>(false);
    const [isAgent, setIsAgent] = useState(false);
    const [isAgentAvailable, setIsAgentAvailable] = useState(false);
    const [isWaiting, setIsWaiting] = useState(false);
    const [lastMessageTime, setLastMessageTime] = useState<Date | null>(null);
    const [selectedOptionIndex, setSelectedOptionIndex] = useState<string[]>([]);
    const [alerted, setAlerted] = useState(false);

    // =================== Fetching Datas
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
            const profilePic = response.data.user.profilePic;
            if (!profilePic) {
              setPicturePath(`${RootAPI}/${profilePic}`);
            } else {
              setPicturePath(null);
            }
            setIsAgent(response.data.user.isAskingHelp === 1);
            setIsAgentAvailable(response.data.user.chatStatus === 'On-going');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // =================== Saving and loading States (isWaiting and alerted)
    useEffect(() => {
      const saveAgentAvailableState = async () => {
        try {
          await AsyncStorage.setItem(
            'isWaiting',
            JSON.stringify(isWaiting)
          );
          console.log('💾 Saved isWaiting:', isWaiting);
        } catch (error) {
          console.error('Error saving agent available state:', error);
        }
      };

      saveAgentAvailableState();
    }, [isWaiting]);

    useEffect(() => {
      const loadAgentAvailableState = async () => {
        try {
          const savedState = await AsyncStorage.getItem('isWaiting');
          if (savedState !== null) {
            const isWaitingState = JSON.parse(savedState);
            setIsWaiting(isWaitingState);
            console.log('📂 Loaded isWaiting:', isWaiting);
          }
        } catch (error) {
          console.error('Error loading agent available state:', error);
        }
      };

      loadAgentAvailableState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only once on mount

    useEffect(() => {
      const saveAgentAvailableState = async () => {
        try {
          await AsyncStorage.setItem(
            'isAlerted',
            JSON.stringify(alerted)
          );
          console.log('💾 Saved isAlerted:', alerted);
        } catch (error) {
          console.error('Error saving agent available state:', error);
        }
      };

      saveAgentAvailableState();
    }, [alerted]);

    useEffect(() => {
      const loadAlertedState = async () => {
        try {
          const savedState = await AsyncStorage.getItem('isAlerted');
          if (savedState !== null) {
            const isAlerted = JSON.parse(savedState);
            setAlerted(isAlerted);
            console.log('📂 Loaded Alerted State:', isAlerted);
          }
        } catch (error) {
          console.error('Error loading agent available state:', error);
        }
      };

      loadAlertedState();
    }, []); // Run only once on mount
    // ===================

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

    // Chat Initialization
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

            if (alerted)
            {
              setIsAI(true);
              setIsWaiting(true);
              addMessage({
                from: 'bot',
                text: 'I know your hurting please wait a bit more time. There is guidance to help you.',
              });
            }
            else if(isWaiting)
            {
              addMessage({
                from: 'bot',
                text: 'The guidance counselor is still unavailable to answer you, wait a bit more they will assist you shortly.',
              });
            }
            else {
              addMessage(InitialChat);
            }

            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

          } catch (err) {
            console.error('Error loading conversation:', err);
            setMessages([InitialChat]);
          }
        }
      };
      initializeChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [studentID]);

    useEffect(() => {
      if (!socketRef.current || !studentID) {return;}

      console.log('👂 Setting up agent-available listener for student:', studentID);

      const handleAgentAvailable = (data: any) => {
        console.log('🎉 Received agent-available event:', data);
        console.log('Current studentID:', studentID);
        console.log('Event student_id:', data.student_id);

        if (data.isAgentAvailable && data.student_id === studentID && !alerted) {
          console.log('✅ Conditions met - non-alerted flow');
          setIsAgent(true);
          setIsAgentAvailable(true);
          setIsWaiting(false);

          setMessages((prevMessages) => {
            const updatedMessages = [...prevMessages];
            updatedMessages.pop();
            return updatedMessages;
          });

          addMessage({
            from: 'notification',
            text: 'Someone responded from the guidance office.',
          });
        }

        if (data.isAgentAvailable && data.student_id === studentID && alerted) {
          console.log('✅ Conditions met - alerted flow');
          setIsAgent(true);
          setIsAI(false);
          setIsAgentAvailable(true);
          setIsWaiting(false);

          addMessage({
            from: 'notification',
            text: 'Someone from the guidance office wants to talk to you. You’re in a safe space — take your time',
          });
        }
      };

      socketRef.current.on('agent-available', handleAgentAvailable);

      return () => {
        if (socketRef.current) {
          console.log('🧹 Cleaning up agent-available listener');
          socketRef.current.off('agent-available', handleAgentAvailable);
        }
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socketRef.current, studentID, alerted]);

// Replace the existing agent-disconnection useEffect with this:
useEffect(() => {
  if (!socketRef.current || !studentID) {return;}

  const handleAgentDisconnection = async (data: { student_id: number; }) => {
    console.log('👋 Received agent-disconnection event:', data);
    console.log('Current studentID:', studentID);
    console.log('Event student_id:', data.student_id);

    // ✅ VERIFY this disconnection is for THIS student
    if (data.student_id === studentID) {
      console.log('✅ Disconnection confirmed for this student');
      // Add initial menu back
      addMessage(InitialChat);

      // Reset all states
      setIsAI(false);
      setIsAgent(false);
      setIsAgentAvailable(false);
      setIsWaiting(false);
      setAlerted(false);

      // Clear saved states from AsyncStorage
      try {
        await AsyncStorage.setItem('isWaiting', JSON.stringify(false));
        await AsyncStorage.setItem('isAlerted', JSON.stringify(false));
        console.log('✅ Cleared saved states');
      } catch (error) {
        console.error('Error clearing saved states:', error);
      }
    } else {
      console.log('⏭️ Disconnection not for this student - ignoring');
    }
  };

  socketRef.current.on('agent-disconnection', handleAgentDisconnection);

  return () => {
    if (socketRef.current) {
      console.log('🧹 Cleaning up agent-disconnection listener');
      socketRef.current.off('agent-disconnection', handleAgentDisconnection); // ✅ CORRECT EVENT NAME
    }
  };
}, [studentID]); // ✅ Include studentID as dependency


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
    }, [socketRef.current, studentID]);

    // Join chat room when student ID is available
    useEffect(() => {
      if (socketRef.current && studentID && isAgent) {
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

  const addMessage = (msg: Message) => {
    setMessages((prev) => [...prev, msg]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  useEffect(() => {
    setLastMessageTime(new Date());
  }, [messages]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to foreground - check inactivity
        if (isAgent && lastMessageTime && !isWaiting && !alerted) {
          const timeElapsed = new Date().getTime() - lastMessageTime.getTime();
          if (timeElapsed >= 180000) {
            // Disconnect due to inactivity
            setIsAgent(false);
            setIsAgentAvailable(false);
            setIsAI(false);
            setIsWaiting(false);
            addMessage(InitialChat);
            try {
              await axios.put(`${API}/chatbot/deactivateStatus/${studentID}`);
              console.log('Chat status deactivated due to inactivity');
            } catch (error) {
              console.error('Error deactivating chat status:', error);
            }
            try {
              await axios.post(`${API}/chatbot/insert-chat-message`, {
                student_id: studentID,
                message: 'You’ve been disconnected from the guidance office.',
                is_from_office: false,
              });
              console.log('Message sent to agent');
            } catch (error) {
              console.error('Error sending message to agent:', error);
            }
          }
        }
      }
      setAppState(nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, [alerted, appState, isAgent, isWaiting, lastMessageTime, studentID]);

  // Your existing timer (for when app is active)
  useEffect(() => {
    // Clear timeout immediately if agent is no longer active
    if ((!isAgent && isWaiting) || alerted) {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
        inactivityTimeoutRef.current = null;
      }
      return;
    }

    // Only set timeout if agent is active
    if (isAgent && lastMessageTime && !isWaiting) {
      // Clear any existing timeout
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }

      inactivityTimeoutRef.current = setTimeout(async () => {
        const timeElapsed = new Date().getTime() - lastMessageTime.getTime();
        if (timeElapsed >= 180000) {
          setIsAgent(false);
          setIsAgentAvailable(false);
          setIsAI(false);
          setIsWaiting(false);

          try {
            await axios.put(`${API}/chatbot/deactivateStatus/${studentID}`);
            console.log('Chat status deactivated due to inactivity');
          } catch (error) {
            console.error('Error deactivating chat status:', error);
          }
          try {
            await axios.post(`${API}/chatbot/insert-chat-message`, {
              student_id: studentID,
              message: 'You’ve been disconnected from the guidance office.',
              is_from_office: false,
            });
            console.log('Message sent to agent');
          } catch (error) {
            console.error('Error sending message to agent:', error);
          }
          addMessage(InitialChat);
        }
      }, 180000);
    }

    return () => {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
    };
  }, [lastMessageTime, isAgent, isWaiting, studentID, alerted]);

  // Handle user input and manage interaction flow
  const handleUserInput = async (text: string, idx: number | null, i: number | null) => {
  if (!text.trim()) {return;}

  // Log student activity for the Chatbot module
  try {
    await axios.post(`${API}/student-activities/insert`, { module: 'Chatbot' });
  } catch (err) {
    console.error('Error logging student activity:', err);
  }

  // If idx and i are provided (option button clicked)
  if (idx !== null && i !== null) {
    const selectedKey = `${idx}_${i}`;

    // Check if any option in this message has already been selected
    const alreadySelected = selectedOptionIndex.some((key) => key.startsWith(`${idx}_`));

    if (!alreadySelected) {
      // Mark this specific option as selected
      setSelectedOptionIndex((prev) => [...prev, selectedKey]);

      // Update the message to mark which option was selected
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages];
        if (updatedMessages[idx]) {
          updatedMessages[idx].isSelected = i;
        }
        return updatedMessages;
      });
    }
  }

  if (isAgent && !isAI && isAgentAvailable) {
    if (text.toLowerCase() === 'exit' && !isWaiting) {
      setIsAI(false);
      setIsAgentAvailable(false);
      setIsAgent(false);
      setIsWaiting(false);
      try {
        await axios.put(`${API}/chatbot/deactivateStatus/${studentID}`);
      } catch (error) {
        console.error('Error changing status');
      }
      addMessage({
        from: 'notification',
        text: 'Your session has expired.',
      });
      addMessage(InitialChat);
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

  if (isAI && (text.toLowerCase().includes('talk to a guidance counselor') || text.toLowerCase().includes('guidance office') || text.toLowerCase().includes('guidance councelor'))) {
    // Remove the AI chat and options message
    setMessages((prevMessages) => prevMessages.filter(msg => !msg.options));
    // Add a message indicating the redirection
    addMessage({
      from: 'bot',
      text: 'Connecting you to a guidance counselor...',
    });
    setIsAgent(true);
    setIsAI(false);  // Disable AI mode
    // Set isAgentAvailable to false since the student is waiting for a counselor
    setIsAgentAvailable(false); // <-- Indicate the student is waiting for the counselor
    setIsWaiting(true);
    // Call the backend to handle the redirection to counselor
    try {
      const response = await axios.put(`${API}/chatbot/get-help/${studentID}`);
      if (response.data.success) {
        // Join the chat room
        if (socketRef.current) {
          socketRef.current.emit('join-chat', studentID);
        }
        addMessage({
          from: 'notification',
          text: 'A counselor will be with you shortly. You can continue chatting while waiting.',
        });
      } else {
        addMessage({
          from: 'notification',
          text: 'Sorry, something went wrong while connecting you to the counselor. Please try again later.',
        });
      }
    } catch (error) {
      console.error('Error while connecting to counselor:', error);
      addMessage({
        from: 'notification',
        text: 'Oops! Something went wrong while connecting to the counselor. Please try again later.',
      });
    }
    return;
  }
  const normalizedText = text.toLowerCase();
  const matchedTrigger = TriggerWords.find(trigger => normalizedText.includes(trigger.toLowerCase()));
  // If in AI mode
  if (isAI) {
    // if triggers alerts.
    addMessage({
        from: 'user',
        text: text,
      });
    if (text.toLowerCase() === 'exit' && !alerted) {
      setIsAI(false);
      addMessage(InitialChat);
      return;
    }
    if (matchedTrigger && !alerted)
    {
      setAlerted(true);
      setIsWaiting(true);
      addMessage({
        from: 'bot',
        text: 'It sounds like you’re going through a really difficult time right now. I want you to know that you’re not alone — help is available.\n\nI’ve sent an alert to the Guidance Office so someone can reach out to you as soon as possible.\n\nIt might take a little while for them to respond, but please stay here if you can.\n\nWhile waiting would you want to continue chatting or would you like me to give you some self-care tips.',
      });
      try {
        // ✅ Send alert first
        await axios.post(`${API}/chatbot/${studentID}/alert`);
        console.log('Alert sent successfully');

        // Then activate help status
        const response = await axios.put(`${API}/chatbot/get-help/${studentID}`);

        if (response.data.success) {
          // Join the chat room
          if (socketRef.current) {
            socketRef.current.emit('join-chat', studentID);
          }
        } else {
          // If get-help fails, revert states
          setAlerted(false);
          setIsAgent(false);
          setIsWaiting(false);
          addMessage({
            from: 'bot',
            text: 'Sorry, something went wrong. Please try again.',
          });
        }
      } catch (error) {
        console.error('Error sending alert or connecting to counselor:', error);
        // Revert states on error
        setAlerted(false);
        setIsAgent(false);
        setIsWaiting(false);
        addMessage({
          from: 'bot',
          text: 'Oops! Something went wrong. Please try again later.',
        });
      }
      return;
    }
    if (text.toLowerCase() === 'dealert') {
      setIsAI(false);
      setAlerted(false);
      setIsAgent(false);
      addMessage(InitialChat);
      return;
    }
    if (alerted && matchedTrigger) {
      try {
        // ✅ Send alert first
        await axios.post(`${API}/chatbot/${studentID}/alert`);
        console.log('Alert sent successfully');

        // Then activate help status
        const response = await axios.put(`${API}/chatbot/get-help/${studentID}`);

        if (response.data.success) {
          // Join the chat room
          if (socketRef.current) {
            socketRef.current.emit('join-chat', studentID);
          }
        } else {
          // If get-help fails, revert states
          setAlerted(false);
          setIsAgent(false);
          setIsWaiting(false);
          addMessage({
            from: 'bot',
            text: 'Sorry, something went wrong. Please try again.',
          });
        }
      } catch (error) {
        console.error('Error sending alert or connecting to counselor:', error);
        // Revert states on error
        setAlerted(false);
        setIsAgent(false);
        setIsWaiting(false);
        addMessage({
          from: 'bot',
          text: 'Oops! Something went wrong. Please try again later.',
        });
      }
    }

    try {
      const response = await axios.post(`${API}/chatbot/send-message`, {
        message: text,
        userId: studentID,
      });
      addMessage({
        from: 'bot',
        text: response.data.fulfillmentText,
        });
    } catch (err) {
      console.error('Error sending message to the backend:', err);
    }

    return;
  }

  const lastBot = messages.filter((m) => m.from === 'bot').slice(-1)[0];

  // ================== Handles Menued Chats
  if (text === 'FAQ') {
    addMessage({
      from: 'user',
      text: 'FAQ',
    });
    addMessage(FAQChat);
    return;
  }
  if (MAIN_MENU.includes(text)) {
    const introText = FAQ_TREE[text]?.intro;
    const options = Object.keys(FAQ_TREE[text]?.questions || {});
    addMessage({
      from: 'user',
      text: text,
    });
    addMessage({
      from: 'bot',
      text: introText || 'I am here to help! Please choose a question below.',
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
      from: 'user',
      text: text,
    });
    addMessage({
      from: 'bot',
      text: answer,
      options: [
        ...(remaining.length > 0 ? ['Ask more about the topic'] : []),
        'Ask about a different topic',
        'End the conversation',
      ],
      topic: lastBot.topic,
      lastQ: text,
    });
    return;
  }
  if (text === 'Ask more about the topic') {
    const topic = messages.filter((m) => m.topic).slice(-1)[0]?.topic;
    if (topic) {
      const lastQ = messages.filter((m) => m.lastQ).slice(-1)[0]?.lastQ;
      const remaining = Object.keys(FAQ_TREE[topic].questions).filter(
        (q) => q !== lastQ
      );
      addMessage({
        from: 'user',
        text: text,
      });
      addMessage({
        from: 'bot',
        text: 'Sure! Here are your choices again:',
        options: [...remaining, 'Go back'],
        topic,
      });
    }
    return;
  }
  if (text === 'Ask about a different topic') {
    addMessage({
      from: 'user',
      text: text,
    });
    addMessage({
      from: 'bot',
      text: 'No problem! Let\'s go back to the main menu. Please choose a new topic below:',
      options: MAIN_MENU,
    });
    return;
  }
  if (text === 'End the conversation') {
      addMessage({
        from: 'bot',
        text: 'Thanks for chatting with me! 🌟 Come back anytime.',
    });
    setTimeout(() => {
      if (isFocused) {
        addMessage(InitialChat);
        setIsAI(false);
        setIsAgent(false);
        setIsAgentAvailable(false);
        setIsWaiting(false);
      }
    }, 1000);
    return;
  }
  if (text === 'Go back') {
  // Find the LAST bot message with options (before the current one)
    const botMessagesWithOptions = messages.filter((m) => m.from === 'bot' && m.options && m.options.length > 0);

    // Get the second-to-last one (skip the current message that has "Go back")
    const lastBotWithOptions = botMessagesWithOptions[botMessagesWithOptions.length - 2] || botMessagesWithOptions[botMessagesWithOptions.length - 1];

    if (lastBotWithOptions) {
      addMessage({
        from: 'user',
        text: 'Go back',
      });

      // Check if 'Go back' is already in the options
      const hasGoBack = lastBotWithOptions.options?.includes('Go back');

      // Create new message with the same content
      addMessage({
        from: 'bot',
        text: lastBotWithOptions.text,
        options: hasGoBack || lastBotWithOptions.text === 'Hello there! Calmi here. What can I do for you?'
          ? lastBotWithOptions.options
          : [...(lastBotWithOptions.options || []), 'Go back'],
        topic: lastBotWithOptions.topic,
        lastQ: lastBotWithOptions.lastQ,
      });
    }
    return;
  }
  if (text === 'Chat with me')
  {
    addMessage({
      from: 'bot',
      text: 'What can I do for you?',
    });
    setIsAI(true);
    return;
  }
  if (text === 'Connect to guidance') {
    setIsWaiting(true);
    try {
        const response = await axios.put(`${API}/chatbot/get-help/${studentID}`);

      if (response.data.success) {
        // Join the chat room
        if (socketRef.current) {
          socketRef.current.emit('join-chat', studentID);
        }
        addMessage({
          from: 'user',
          text: text,
        });
        addMessage({
          from: 'bot',
          text: 'Got it! I’ll connect you with someone from the guidance office. Sometimes it may take a bit of time before they can reply — but don’t worry, they’ll reach out as soon as they can.',
        });
        addMessage({
          from: 'notification',
          text: 'Waiting for someone to respond...',
        });
      } else {
        addMessage({
          from: 'bot',
          text: 'Sorry, something went wrong while connecting to the counselor. Please try again later.',
        });
        addMessage(InitialChat);
      }
    } catch (error) {
      console.error('Error while connecting to counselor:', error);
      addMessage({
        from: 'bot',
        text: 'Oops! Something went wrong while connecting to the counselor. Please try again later.',
      });
      addMessage(InitialChat);
    }
    return;
  }
  // =================
  if (text === 'reset') {
    setIsWaiting(false);
    setIsAI(false);
    setIsAgent(false);
    setIsAgentAvailable(false);
    setAlerted(false);
  }
  // Default Message
  addMessage({
    from: 'bot',
    text: 'I am sorry, I quite catch what you are trying to say. Try to select or type one of the options fully.',
    options: ['FAQ', 'Chat with me', 'Connect to guidance'],
  });
};

  const ifNotif = (text: string) =>
  {
    return (
      text.toLowerCase().trim().includes(('You’ve been disconnected from the guidance office.').toLowerCase()) ||
      text.toLowerCase().trim().includes(('Someone responded from the guidance office.').toLowerCase()) ||
      text.toLowerCase().trim().includes(('Your session has expired.').toLowerCase())
    );
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
          contentContainerStyle={{ paddingBottom: verticalScale(40) }}
          style={[styles.chatbotContainer, keyboardVisible && { maxHeight: '65%' }]}
        >
          {messages.map((msg, idx) => {
              // Check if this message should be treated as a notification
              const isNotification = msg.from === 'notification' || ifNotif(msg.text);

              return (
                <View
                  key={idx}
                  style={
                    isNotification
                      ? styles.notification
                      : (msg.from === 'bot' || msg.from === 'counselor')
                        ? styles.botChatAlign
                        : styles.userChatAlign
                  }
                >
                  <View
                    style={
                      isNotification
                        ? styles.notificationAlign // New style for notifications
                        : (msg.from === 'bot' || msg.from === 'counselor')
                          ? styles.botPictureAlign
                          : styles.userPictureAlign
                    }
                  >
                    {/* Only show image if NOT a notification */}
                    {!isNotification && (
                      <Image
                        source={
                          msg.from !== 'user'
                            ? require('../assets/images/appchatbot.png')
                            : picturePath
                              ? { uri: picturePath }
                              : require('../assets/images/default_profile.png')
                        }
                        style={styles.image}
                      />
                    )}

                    <View style={isNotification ? styles.notificationWidth : styles.chatWidth}>
                      <Text
                        style={
                          isNotification
                            ? styles.notificationMessage
                            : msg.from === 'user'
                              ? styles.userText
                              : styles.chatbotText
                        }
                      >
                        {msg.text}
                      </Text>

                      {/* Render options if available */}
                      {msg.options?.map((opt, i) => {
                        const isMessageSelected = selectedOptionIndex.some((key) => key.startsWith(`${idx}_`));
                        const isThisOptionSelected = selectedOptionIndex.includes(`${idx}_${i}`);

                        return (
                          <TouchableOpacity
                            key={i}
                            style={[
                              styles.optionBtn,
                              isThisOptionSelected && styles.optionBtnSelected,
                            ]}
                            onPress={() => handleUserInput(opt, idx, i)}
                            disabled={isMessageSelected}
                          >
                            <Text style={styles.optionText}>{opt}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </View>
              );
            })}

            {isAI && (
              <View style={styles.aiIndicatorContainer}>
                <Text style={styles.aiIndicatorText}>
                  💬 You are chatting with Calmi • Type "exit" to return to menu
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
            handleUserInput(input, null, null);
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
      paddingVertical: verticalScale(5),
      paddingHorizontal: scale(50),
      borderRadius: moderateScale(25),
      marginTop: verticalScale(10),
      marginBottom: verticalScale(10),
  },
  title: {
      fontSize: moderateScale(15),
      letterSpacing: moderateScale(2),
      fontFamily: 'Poppins-Bold',
      color: 'black',
  },
  flex1: { flex: 1},
  chatbotContainer: {
    backgroundColor: 'white',
    margin: 20,
    paddingHorizontal: scale(20),
    borderRadius: moderateScale(20),
    maxHeight: '73%',
    position: 'relative',
    paddingTop: verticalScale(20),
  },
  input: {
    height: verticalScale(45),
    borderWidth: moderateScale(1),
    marginBottom: verticalScale(20),
    paddingHorizontal: scale(15),
    borderRadius: moderateScale(25),
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
    borderRadius: moderateScale(20),
    paddingVertical: verticalScale(4),
    paddingHorizontal: scale(10),
    marginTop: verticalScale(5),
    borderWidth: moderateScale(3),
    borderColor: '#d6c9f3',
  },
  optionBtnSelected: {
    backgroundColor: '#d6c9f3',
  },
  optionText: { fontSize: moderateScale(12.5), color: '#333', fontFamily: 'Poppins-Regular' },
  image: {width: moderateScale(30), height: verticalScale(30), borderRadius: moderateScale(9999), borderWidth: moderateScale(2), borderColor: '#b7e3cc'},
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
  chatbotText: {color: 'black', fontFamily: 'Lora-Bold', textAlignVertical: 'center', fontSize: moderateScale(13), padding: moderateScale(5), textAlign: 'left', borderRadius: moderateScale(10), marginBottom: verticalScale(10)},
  userText: {color: 'black', fontFamily: 'Lora-Bold', textAlignVertical: 'center', fontSize: moderateScale(13), borderColor: '#b7e3cc', padding: moderateScale(5), textAlign: 'right', borderRadius: moderateScale(10), marginBottom: verticalScale(10)},
  chatWidth: {width: '65%', marginBottom: verticalScale(10)},
  notificationWidth: {width: '90%', textAlign: 'center'},
  notification: {marginHorizontal: 'auto', marginBottom: verticalScale(10)},
  notificationMessage: { fontFamily: 'Poppins-SemiBoldItalic', fontSize: moderateScale(11), color: '#6f6f6f', textAlign: 'center'},
  userChatAlign: {flex: 1, alignItems: 'flex-end', paddingHorizontal: scale(10)},
  userPictureAlign: {flexDirection: 'row-reverse', gap: moderateScale(10)},
  botChatAlign: { flex: 1, alignItems: 'flex-start', paddingHorizontal: scale(10) },
  botPictureAlign: {flexDirection: 'row', gap: moderateScale(10)},
  aiIndicatorContainer: {
    backgroundColor: '#e3f2fd',
    borderWidth: moderateScale(1),
    borderColor: '#90caf9',
    borderRadius: moderateScale(8),
    paddingVertical: verticalScale(6),
    paddingHorizontal: scale(8),
    marginBottom: verticalScale(8),
    marginTop: verticalScale(2),
  },
  aiIndicatorText: {
    fontSize: moderateScale(9),
    color: '#1565c0',
    fontFamily: 'Poppins-MediumItalic',
    textAlign: 'center',
  },
  notificationAlign: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
});
