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
import { API } from '../apiConfigs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import stringSimilarity from 'string-similarity';
import { io } from 'socket.io-client';
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

    const [input, setInput] = useState('');
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [messageError, setMessageError] = useState('');
    const [alertModal, setAlertModal] = useState(false);
    const [isSuccessful, setIsSuccessful] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [studentID, setStudentID] = useState(0);

    const [isAI, setIsAI] = useState(false);
    const [isAgent, setIsAgent] = useState(false);
    const [isAgentAvailable, setIsAgentAvailable] = useState(false);

    const socket = useRef(io(API));

    useEffect(() => {
      // Store socket.current in a local variable
      const currentSocket = socket.current;

      // Listen for real-time updates from the backend
      currentSocket.on('chat-update', (data) => {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            from: data.isBot ? 'bot' : 'user',
            text: data.message,
            mode: isAgent ? 'counselor' : isAI ? 'chat' : 'faq',
          },
        ]);
        // Automatically scroll to the newest message
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      });

      // Cleanup function to remove event listener when the component is unmounted
      return () => {
        currentSocket.off('chat-update');
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      // Store socket.current in a local variable
      const currentSocket = socket.current;

      // Listen for agent availability (acceptance of chat)
      currentSocket.on('agent-available', (data) => {
        // If agent is available, update the states
        if (data.isAgentAvailable) {
          setIsAI(false); // Exit AI mode
          setIsAgentAvailable(true); // Set agent as available
          setIsAgent(true); // Indicate that the user is now in agent mode
        }
      });

      // Cleanup function to remove event listener when the component is unmounted
      return () => {
        currentSocket.off('agent-available');
      };
    }, []);

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
          setStudentID(response.data.user.id);
          setIsAgent(response.data.user.isAskingHelp);
          setIsAI(response.data.user.isAskingHelp);
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
  }, [navigation]);

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
          // Fetch both chatbot and office chat history
          const response = await axios.get(`${API}/chatbot/get-conversation/${studentID}`);

          const botMessages = response.data.botConversation.map((msg: { message: any; created_at: string | number | Date; }) => ({
            sender: 'bot', // Marking sender as bot for chatbot history
            text: msg.message,
            timestamp: new Date(msg.created_at).toLocaleString(),
            mode: 'faq',
          }));

          const officeMessages = response.data.officeConversation.map((msg: { message: any; created_at: string | number | Date; }) => ({
            sender: 'office', // Marking sender as office for office chat history
            text: msg.message,
            timestamp: new Date(msg.created_at).toLocaleString(),
            mode: 'chat',
          }));

          // Combine the messages
          const combinedMessages = [...botMessages, ...officeMessages];

          // Sort the messages by timestamp (ascending order)
          combinedMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

          // Set the sorted messages to state
          setMessages(combinedMessages);

          // Scroll to bottom after setting messages
          setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

        } catch (err) {
          console.error('Error loading conversation:', err);
          // Fallback to welcome message
          setMessages([{
            from: 'bot',
            text: 'Welcome! How can I support your wellbeing today?',
            mode: 'faq',
            options: [...MAIN_MENU, '💬 Chat with me', '👨‍🏫 Talk to a guidance counselor'],
          }]);
        }
      }
    };

    if (studentID && isFocused) {
      initializeChat();
    }
  }, [studentID, isFocused, isAgent, isAI]);

  // Add a message
  const addMessage = (msg: Message) => {
    setMessages((prev) => [...prev, msg]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleUserInput = async (text: string) => {
  if (!text.trim()) { return; }

  // Log student activity for the Wellness module
  try {
    await axios.post(`${API}/student-activities/insert`, { module: 'Chatbot' });
  } catch (err) {
    console.error('Error logging student activity:', err);
  }

  // Always add the raw user input to chat
  addMessage({ from: 'user', text, mode: 'faq' });

  const lastBot = messages.filter((m) => m.from === 'bot').slice(-1)[0];

  // ================================
  // Step 1: Check if in AI mode
  // ================================
  if (isAI) {
    // If user types "exit", stop chatting with AI and bring up the menu again
    if (text.toLowerCase() === 'exit' && !isAgent) {
      setIsAI(false); // Exit AI mode
      addMessage({
        from: 'bot',
        text: 'You have exited AI chat. How can I assist you further?',
        mode: 'faq',
        options: [...MAIN_MENU, '💬 Chat with me', '👨‍🏫 Talk to a guidance counselor'],
      });
      return;
    }

    // Continue the conversation with the AI without any further checks
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

  if (isAgentAvailable) {
    // Insert the student's message into the office chat (from the student)
    try {
      const studentMessage = text; // The message entered by the student
      await axios.post(`${API}/chatbot/insert-chat-message`, {
        student_id: studentID,
        message: studentMessage,
        is_from_office: false, // Indicate that it's from the student (not the office)
      });

      // Emit event to notify clients about the new chat message
      if (socket.current) {
        socket.current.emit('new-chat-message', {
          student_id: studentID,
          message: studentMessage,
          is_from_office: false, // Indicating the message is from the student
        });
      }

      // Add the student's message to the chat
      addMessage({
        from: 'user', // Message is from the student (user)
        text: studentMessage,
        mode: 'chat',
      });

    } catch (error) {
      console.error('Error inserting student chat message:', error);
    }
  }

  // ================================
  // Step 2: If in Main Menu, process the user input to go to the right topic
  // ================================
  const currentMenuOptions = lastBot?.options || [];
  const isInMainMenu = currentMenuOptions.some((opt) => MAIN_MENU.includes(opt));
  const hasMenuOptions = currentMenuOptions.length > 0;

  // Check for exact menu matches first
  if (MAIN_MENU.includes(text)) {
    // Direct FAQ topic selection
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

  // Then check for string similarity if we're clearly in a menu context
  if (isInMainMenu && hasMenuOptions) {
    const bestMatch = stringSimilarity.findBestMatch(text, MAIN_MENU);
    if (bestMatch.bestMatch.rating >= 0.6) {
      if (bestMatch.bestMatch.target !== text) {
        handleUserInput(bestMatch.bestMatch.target); // Act like user tapped it
        return;
      }
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
    setIsAI(true);
    return;
  }

  if (text === '👨‍🏫 Talk to a guidance counselor') {
    addMessage({
      from: 'bot',
      text: 'Connecting you to a guidance counselor...',
      mode: 'counselor',
    });

    // Set isAgent to true to indicate the switch to the agent
    setIsAgent(true);

    try {
      // Make the API call to initiate the help request
      const response = await axios.put(`${API}/chatbot/get-help/${studentID}`);

      // Check if the API call was successful
      if (response.data.success) {
        // Handle successful response if needed
        addMessage({
          from: 'bot',
          text: 'A counselor will be with you shortly. For while you can chat with bot while waiting for counselor to reply.',
          mode: 'counselor',
        });
      } else {
        // Handle failure in API call (if applicable)
        addMessage({
          from: 'bot',
          text: 'Sorry, something went wrong while connecting you to the counselor. Please try again later.',
          mode: 'counselor',
        });
      }
    } catch (error) {
      // Handle error during API call (e.g., network issues)
      console.error('Error while connecting to counselor:', error);
      addMessage({
        from: 'bot',
        text: 'Oops! Something went wrong while connecting to the counselor. Please try again later.',
        mode: 'counselor',
      });
    }

    return;
  }

  // ================================
  // Step 4: Handle when the user picks a topic from the main menu
  // ================================
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

  // ================================
  // Step 5: Handle FAQ question selection
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
  // Step 6: Handle follow-up options
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
    setTimeout(() => {
      // After a short delay, reset messages and show the main menu
      if (isFocused) {
        setMessages([ // Reset the conversation
          {
            from: 'bot',
            text: MAIN_MENU_PROMPT, // Welcome message
            mode: 'faq',
            options: [...MAIN_MENU, '💬 Chat with me', '👨‍🏫 Talk to a guidance counselor'],
          },
        ]);
        setIsAI(false); // Reset AI state
        setIsAgent(false); // Reset agent state
      }
    }, 2000); // Adjust the timeout as needed to make the transition smooth
    return;
  }

  // ================================
  // Step 7: Fallback (unrecognized input)
  // ================================
  addMessage({
    from: 'bot',
    text: 'I didn’t catch that. Try picking a wellness topic or ask for a live agent.',
    mode: 'faq',
    options: [...MAIN_MENU, '💬 Chat with me', '👨‍🏫 Talk to a guidance counselor'],
  });
};

  useEffect(() => {
    const currentSocket = socket.current;

    // Listen for new chat messages from both students and agents
    currentSocket.on('new-chat-message', (data) => {
      const { message, is_from_office } = data;

      // Update the state based on the sender
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          from: is_from_office ? 'counselor' : 'user', // Use 'counselor' instead of 'office'
          text: message,
          mode: is_from_office ? 'counselor' : 'faq', // Use 'counselor' mode for office messages
        },
      ]);

      // Scroll to the latest message
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    });

    // Cleanup function to remove event listener when the component is unmounted
    return () => {
      currentSocket.off('new-chat-message');
    };
  }, [socket, messages]); // Listen for socket changes and messages


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
                  {/* Show options */}
                  {msg.options?.map((opt, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.optionBtn}
                      onPress={() => handleUserInput(opt)}
                      // disabled={isAI || isAgent}
                    >
                      <Text style={styles.optionText}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          ))}
          {/* AI Mode Indicator - styled to match the chat design */}
          {(isAI && !isAgent ) && (
            <View style={styles.aiIndicatorContainer}>
              <Text style={styles.aiIndicatorText}>
                💬 You are chatting with AI • Type "exit" to return to menu
              </Text>
            </View>
          )}
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
  aiIndicatorContainer: {
  backgroundColor: '#e3f2fd', // Light blue background
  borderWidth: 1,
  borderColor: '#90caf9', // Blue border
  borderRadius: 8,
  paddingVertical: 6,
  paddingHorizontal: 8,
  marginBottom: 8,
  marginTop: 2,
  },
  aiIndicatorText: {
    fontSize: 9,
    color: '#1565c0', // Dark blue text
    fontFamily: 'Poppins-MediumItalic',
    textAlign: 'center',
  },
});
