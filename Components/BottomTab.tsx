import React, { useState, useEffect } from 'react';
import { Keyboard, View, StyleSheet, TouchableOpacity, Image, Modal, Dimensions, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomepageScreen from '../screens/HomepageScreen';
import ResourcesNavigator from './ResourcesNavigator';
import WellnessNavigator from './WellnessNavigator';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MoodScreen from '../screens/MoodScreen';
import ChatbotScreen from '../screens/ChatbotScreen';
import { useNavigationState, NavigationState } from '@react-navigation/native';
import apiClient from '../APIClient';
import { API } from '../apiConfigs';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const Tab = createBottomTabNavigator();

export default function BottomBarNavComponent() {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [, setModalVisible] = useState(false);
  const [openGameConfirm, setOpenGameConfirm] = useState(false);
  const [studentID, setStudentID] = useState(0);
  const [hasLowStats, setHasLowStats] = useState(false);

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

  return (
    // eslint-disable-next-line react-native/no-inline-styles
    <View style={{ flex: 1 }}>
      {/* Sticky image button */}
      {currentRouteName === 'Home' &&
        <TouchableOpacity
          onPress={() => setOpenGameConfirm(true)}
          style={styles.stickyButton}
        >
          <Image
            source={require('../assets/images/28.png')}
            style={styles.stickyImage}
          />
          {hasLowStats && (
            <></>
          )}
        </TouchableOpacity>
      }
      {/* Modal */}
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
            </View>
            <View style={styles.LogoutActions}>
              <TouchableOpacity onPress={() => setOpenGameConfirm(false)}>
                <Text style={styles.backText}>BACK</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sendBtn}
                onPress={() => {setOpenGameConfirm(false); setModalVisible(true);}}
              >
                <Text style={styles.LogoutButtonText}>Open Game</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#b8e6c9',
            borderTopWidth: 0,
            height: 50,
            elevation: 0,
            shadowOpacity: 0,
            paddingTop: 10,
            zIndex: 10,
          },
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
                      {/* eslint-disable-next-line react-native/no-inline-styles */}
                      <Image source={iconName} style={{ width: 30, height: 30 }} />
                    </View>
                  </View>
                  {focused && <View style={styles.indicatorDot} />}
                </View>
              );
            } else {
              return (
                <View style={styles.tabIconWrapper}>
                  {/* eslint-disable-next-line react-native/no-inline-styles */}
                  <Image source={iconName} style={{ width: 25, height: 25 }} />
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
    bottom: 0,
    height: 60,
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#b8e6c9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerIcon: {
    borderRadius: 9999,
    borderColor: '#317873',
    borderWidth: 3,
    padding: 7.5,
  },
  tabIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#317873',
    position: 'absolute',
    bottom: -6,
  },
  stickyButton: {
    position: 'absolute',
    bottom: 60,
    right: 20,
    zIndex: 20,
    backgroundColor: 'transparent',
  },
  stickyImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    elevation: 5,
  },
  stickyImage2: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  page: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#b8e6c9',
  },
  pageText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    position: 'absolute',
    bottom: 0,
    width: width,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  LogoutModal: {
    width: '85%',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
    backgroundColor: 'white',
  },
  LogoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#b7e3cc',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  LogoutTitleStyled: {
    fontSize: 18,
    color: '#333',
    fontFamily: 'Poppins-Bold',
  },
  padding: {
    width: '100%',
    margin: 'auto',
    paddingHorizontal: '25%',
    paddingVertical: 20,
  },
  LogoutConfirmation: {
    fontFamily: 'Lora-SemiBold',
    textAlign: 'center',
    color: 'black',
  },
  LogoutActions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 10,
  },
  backText: {
    color: 'gray',
    fontFamily: 'Poppins-ExtraBold',
  },
  sendBtn: {
    backgroundColor: '#b7e3cc',
    paddingHorizontal: 20,
    borderRadius: 30,
  },
  LogoutButtonText: {
    color: 'white',
    fontFamily: 'Poppins-ExtraBold',
    shadowRadius: 3,
    shadowOffset: { width: 1, height: 1 },
    shadowColor: 'gray',
    fontSize: 15,
  },
});
