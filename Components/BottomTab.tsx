import React, { useState, useEffect, useRef } from 'react';
import { Keyboard, View, StyleSheet, TouchableOpacity, Image, Modal, Text, Alert } from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { WebView } from 'react-native-webview';
import HomepageScreen from '../screens/HomepageScreen';
import ResourcesNavigator from './ResourcesNavigator';
import WellnessNavigator from './WellnessNavigator';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MoodScreen from '../screens/MoodScreen';
import ChatbotScreen from '../screens/ChatbotScreen';
import { useNavigationState, NavigationState } from '@react-navigation/native';
import apiClient from '../APIClient';
import { API, RootAPI } from '../apiConfigs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDrawer } from './DrawerContext';
import axios from 'axios';

const Tab = createBottomTabNavigator();

export default function BottomBarNavComponent() {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [gameModal, setGameModal] = useState(false);
  const [openGameConfirm, setOpenGameConfirm] = useState(false);
  const [studentID, setStudentID] = useState(0);
  const [hasLowStats, setHasLowStats] = useState(false);
  const { isDrawerOpen } = useDrawer();
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const response = await apiClient.get(`${API}/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.user) {
          setStudentID(response.data.user.id);
        } else {
          setStudentID(0);
        }
      } catch (error: any) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUserData();
  }, []);

  // Fetch pet stats and check if any stat <= 50
  useEffect(() => {
    const fetchPetStats = async () => {
      if (!studentID) {return;}

      try {
        const response = await apiClient.get(`${API}/pets/${studentID}`);

        if (response.data.pet) {
          const pet = response.data.pet;

          // Check if any stat is <= 50
          const isLowStat =
            pet.hunger <= 50 ||
            pet.playfulness <= 50 ||
            pet.hygiene <= 50 ||
            pet.sleep <= 50;

          setHasLowStats(isLowStat);
        } else {
          setHasLowStats(false);
        }
      } catch (error: any) {
        console.error('Error fetching pet stats:', error);
        setHasLowStats(false);
      }
    };

    fetchPetStats();
  }, [studentID]);

  // Load saved game data when game opens
  useEffect(() => {
    if (gameModal) {
      loadAllSavedData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameModal]);

  const loadAllSavedData = async () => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const gameKeys = allKeys.filter(key =>
        key.startsWith('Pet_') ||
        key.startsWith('Toy_') ||
        key === 'LoginStreak' ||
        key === 'LastLoginDate' ||
        key === 'LastDailyReward' ||
        key === 'isSleeping'
      );

      if (gameKeys.length > 0) {
        const values = await AsyncStorage.multiGet(gameKeys);
        const data: { [key: string]: string } = {};

        values.forEach(([key, value]) => {
          if (value !== null) {
            data[key] = value;
          }
        });

        console.log('📥 Loaded game data:', data);

        // Send to Unity after a delay to ensure WebView is ready
        setTimeout(() => {
          sendToUnity('LOAD_ALL_DATA', data);
        }, 2000);
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  };

  const sendToUnity = (type: string, data?: any) => {
    webViewRef.current?.injectJavaScript(`
      if (window.unityInstance) {
        window.unityInstance.SendMessage('StorageBridge', 'ReceiveAllPlayerPrefs', '${JSON.stringify(data)}');
      }
    `);
  };

  const handleWebViewMessage = async (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('📨 Message from Unity:', message);

      switch (message.type) {
        case 'SAVE_DATA':
          await AsyncStorage.setItem(message.key, message.value);
          console.log(`💾 Saved: ${message.key} = ${message.value}`);
          break;

        case 'GET_DATA':
          const values = await AsyncStorage.getItem(message.key);
          const response = `${message.key}:${values || ''}`;
          webViewRef.current?.injectJavaScript(`
            if (typeof SendMessage !== 'undefined') {
              SendMessage('StorageBridge', 'ReceiveAsyncStorageValue', '${response}');
            }
          `);
          console.log(`📤 Sent to Unity: ${response}`);
          break;

        case 'SAVE_ALL_DATA':
          const dataToSave = JSON.parse(message.data);
          if (dataToSave && dataToSave.data) {
            const pairs = Object.entries(dataToSave.data).map(([key, value]) => [
              key,
              String(value),
            ]);
            await AsyncStorage.multiSet(pairs as [string, string][]);
            console.log('💾 Saved all data:', Object.keys(dataToSave.data).length, 'keys');
          }
          break;

        case 'CLOSE_WEBVIEW':
          console.log('🚪 Closing WebView');
          setGameModal(false);
          break;

        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-shadow
  const state = useNavigationState(state => state);

  const getActiveRouteName = (navState: NavigationState | undefined): string | null => {
    if (!navState || !navState.routes) {return null;}
    const route = navState.routes[navState.index];
    if (
      route.state &&
      typeof route.state === 'object' &&
      'routes' in route.state &&
      typeof route.state.index === 'number'
    ) {
      return getActiveRouteName(route.state as NavigationState);
    }
    return route.name;
  };

  const currentRouteName = getActiveRouteName(state);

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

  const handleOpenGame = async () => {
    setOpenGameConfirm(false);
    try {
      await axios.post(`${API}/student-activities/${studentID}/insert`, { module: 'Pet' });
    } catch (err) {
      console.error('Error logging student activity:', err);
    }
    setGameModal(true);
  };

  const handleCloseGame = () => {
    setGameModal(false);
  };

  const gameUrl = `${RootAPI}/play-pet/${studentID}`;

  return (
    // eslint-disable-next-line react-native/no-inline-styles
    <View style={{ flex: 1 }}>
      {/* Sticky image button */}
      {(currentRouteName === 'Home' || currentRouteName === 'Homepage') &&
        <TouchableOpacity
          onPress={() => setOpenGameConfirm(true)}
          style={styles.stickyButton}
        >
          <Image
            source={require('../assets/images/28.png')}
            style={styles.stickyImage}
          />
          {hasLowStats && (
            <Image
              source={require('../assets/images/Exclamation.png')}
              style={styles.stickyImage2}
            />
          )}
        </TouchableOpacity>
      }

      {/* Confirmation Modal */}
      <Modal
        visible={openGameConfirm}
        animationType="fade"
        transparent
      >
        <View style={styles.overlay}>
          <View style={styles.LogoutModal}>
            <View style={styles.LogoutHeader}>
              <Text style={styles.LogoutTitleStyled}>Open Pet Game</Text>
              <TouchableOpacity onPress={() => setOpenGameConfirm(false)}>
                <Ionicons name="close" size={22} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.padding}>
              <Text style={styles.LogoutConfirmation}>Do you want to open the pet game?</Text>
              <Text style={styles.reminder}>Exit properly to save game data</Text>
              {hasLowStats && (
                <Text style={styles.warningText}>⚠️ Your pet needs attention!</Text>
              )}
            </View>
            <View style={styles.LogoutActions}>
              <TouchableOpacity onPress={() => setOpenGameConfirm(false)}>
                <Text style={styles.backText}>BACK</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sendBtn}
                onPress={handleOpenGame}
              >
                <Text style={styles.LogoutButtonText}>Open Game</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Pet Game Modal */}
      <Modal
        visible={gameModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleCloseGame}
      >
        <View style={styles.gameContainer}>
          {/* WebView Game */}
          <WebView
            ref={webViewRef}
            source={{ uri: gameUrl }}
            style={styles.webview}
            onMessage={handleWebViewMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}

            // Debug logging
            onLoadStart={() => console.log('🔄 WebView loading...')}
            onLoadEnd={() => console.log('✅ WebView loaded')}

            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('WebView error:', nativeEvent);
              Alert.alert('Error', 'Failed to load game');
            }}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('HTTP error:', nativeEvent.statusCode);
            }}
          />
        </View>
      </Modal>

      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarStyle: isDrawerOpen ? { display: 'none' } : {
            position: 'absolute',
            bottom: verticalScale(0),
            left: scale(0),
            right: scale(0),
            backgroundColor: '#b8e6c9',
            borderTopWidth: moderateScale(0),
            height: verticalScale(50),
            elevation: 0,
            shadowOpacity: 0,
            paddingTop: verticalScale(10),
            zIndex: 10,
          },
          animation: 'shift',
          // eslint-disable-next-line react/no-unstable-nested-components
          tabBarIcon: ({ focused }) => {
            const iconSource: Record<'Home' | 'Chatbot' | 'Wellness' | 'Resources' | 'Mood', any> = {
              Home: require('../assets/images/apphome.png'),
              Chatbot: require('../assets/images/appchatbot.png'),
              Wellness: require('../assets/images/appwellnesstools.png'),
              Resources: require('../assets/images/applibrary.png'),
              Mood: require('../assets/images/appmoodtracker.png'),
            };

            const iconName = iconSource[route.name as keyof typeof iconSource] || require('../assets/images/apphome.png');

            if (route.name === 'Chatbot') {
              return (
                <View
                  style={[
                    styles.centerIconContainer,
                    // eslint-disable-next-line react-native/no-inline-styles
                    keyboardVisible && { bottom: -20 },
                  ]}
                >
                  <View style={styles.centerIconCircle}>
                    <View style={styles.centerIcon}>
                      <Image source={iconName} style={{ width: moderateScale(40), height: moderateScale(40) }} />
                    </View>
                  </View>
                  {focused && <View style={styles.indicatorDot} />}
                </View>
              );
            } else {
              return (
                <View style={styles.tabIconWrapper}>
                  <Image source={iconName} style={{ width: moderateScale(40), height: moderateScale(40) }} />
                  {focused && <View style={styles.indicatorDot} />}
                </View>
              );
            }
          },
          tabBarLabel: () => null,
          tabBarVisible: true,
          headerShown: false,
          tabBarHideOnKeyboard: true,
        })}
        initialRouteName="Home"
      >
        <Tab.Screen name="Home" component={HomepageScreen} />
        <Tab.Screen
          name="Resources"
          component={ResourcesNavigator}
          listeners={({ navigation }) => ({
            tabPress: () => {
              navigation.navigate('Resources', { screen: 'ResourcesMain' });
            },
          })}
        />
        <Tab.Screen name="Chatbot" component={ChatbotScreen} />
        <Tab.Screen
          name="Wellness"
          component={WellnessNavigator}
          listeners={({ navigation }) => ({
            tabPress: () => {
              navigation.navigate('Wellness', { screen: 'Wellnesses' });
            },
          })}
        />
        <Tab.Screen name="Mood" component={MoodScreen} />
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  centerIconContainer: {
    position: 'absolute',
    bottom: verticalScale(0),
    height: verticalScale(60),
    width: scale(60),
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerIconCircle: {
    width: moderateScale(70),
    height: moderateScale(70),
    borderRadius: moderateScale(35),
    backgroundColor: '#b8e6c9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerIcon: {
    borderRadius: moderateScale(9999),
    borderColor: '#317873',
    borderWidth: moderateScale(3),
    padding: moderateScale(7.5),
  },
  tabIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  indicatorDot: {
    width: scale(6),
    height: verticalScale(6),
    borderRadius: moderateScale(3),
    backgroundColor: '#317873',
    position: 'absolute',
    bottom: -6,
  },
  stickyButton: {
    position: 'absolute',
    bottom: verticalScale(60),
    right: scale(20),
    zIndex: 20,
    backgroundColor: 'transparent',
  },
  stickyImage: {
    width: scale(80),
    height: verticalScale(80),
    resizeMode: 'contain',
    elevation: 5,
  },
  stickyImage2: {
    position: 'absolute',
    width: scale(80),
    height: verticalScale(80),
    resizeMode: 'contain',
    elevation: 5,
    left: scale(5),
    top: verticalScale(15),
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#fff',
    borderRadius: moderateScale(15),
    padding: moderateScale(2),
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  LogoutModal: {
    width: '85%',
    borderRadius: moderateScale(15),
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: scale(0), height: verticalScale(3) },
    elevation: 5,
    backgroundColor: 'white',
  },
  LogoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#b7e3cc',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(10),
    borderTopLeftRadius: moderateScale(15),
    borderTopRightRadius: moderateScale(15),
  },
  LogoutTitleStyled: {
    fontSize: moderateScale(18),
    color: '#333',
    fontFamily: 'Poppins-Bold',
  },
  padding: {
    width: '100%',
    margin: 'auto',
    paddingHorizontal: '25%',
    paddingVertical: verticalScale(20),
  },
  LogoutConfirmation: {
    fontFamily: 'Lora-SemiBold',
    textAlign: 'center',
    color: 'black',
  },
  reminder: {
    fontFamily: 'Lora-SemiBold',
    marginTop: verticalScale(5),
    textAlign: 'center',
    color: '#888',
    fontSize: moderateScale(10),
  },
  warningText: {
    fontFamily: 'Lora-SemiBold',
    textAlign: 'center',
    color: '#ff4444',
    marginTop: verticalScale(10),
    fontSize: moderateScale(14),
  },
  LogoutActions: {
    flexDirection: 'row',
    gap: moderateScale(10),
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginRight: scale(10),
    marginBottom: verticalScale(10),
  },
  backText: {
    color: 'gray',
    fontFamily: 'Poppins-ExtraBold',
  },
  sendBtn: {
    backgroundColor: '#b7e3cc',
    paddingHorizontal: scale(20),
    borderRadius: moderateScale(30),
  },
  LogoutButtonText: {
    color: 'white',
    fontFamily: 'Poppins-ExtraBold',
    shadowRadius: moderateScale(3),
    shadowOffset: { width: scale(1), height: verticalScale(1) },
    shadowColor: 'gray',
    fontSize: moderateScale(15),
  },
  gameContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  closeButton: {
    position: 'absolute',
    top: moderateScale(40),
    right: moderateScale(20),
    zIndex: 999,
  },
  closeButtonInner: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: moderateScale(20),
    width: moderateScale(40),
    height: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  webview: {
    flex: 1,
  },
});
