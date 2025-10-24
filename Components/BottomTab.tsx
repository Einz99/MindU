import React, { useState, useEffect } from 'react';
import { Keyboard, View, StyleSheet, TouchableOpacity, Image, Modal, Dimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomepageScreen from '../screens/HomepageScreen';
import ResourcesNavigator from './ResourcesNavigator';
import WellnessNavigator from './WellnessNavigator';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MoodScreen from '../screens/MoodScreen';
import ChatbotScreen from '../screens/ChatbotScreen';
import { useNavigationState, NavigationState } from '@react-navigation/native';
// import UnityView from 'react-native-unity-view'; // Import UnityView component

const { width } = Dimensions.get('window');

const Tab = createBottomTabNavigator();

//      <Modal
//         visible={modalVisible}
//         transparent
//         animationType="fade"
//         onRequestClose={() => setModalVisible(false)}
//       >
//         <View style={styles.modalContainer}>
//           {/* UnityView inside modal */}
//           {/* eslint-disable-next-line react-native/no-inline-styles */}
//           <UnityView style={{ flex: 1 }} />
// 
//           {/* Close button */}
//           {/* eslint-disable-next-line react-native/no-inline-styles */}
//           <View style={{ position: 'absolute', right: 20, top: 10, zIndex: 1000 }}>
//             <TouchableOpacity onPress={() => setModalVisible(false)}>
//               <Ionicons name="arrow-back" size={25} color="#000" />
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>
export default function BottomBarNavComponent() {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const state = useNavigationState(state => state);

  const getActiveRouteName = (navState: NavigationState | undefined): string | null => {
    if (!navState || !navState.routes) {return null;}
    const route = navState.routes[navState.index];
    // If this route has nested state, recurse
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
          onPress={() => setModalVisible(true)}
          style={styles.stickyButton}
        >
          <Image
            source={require('../assets/images/28.png')} // replace with your own icon
            style={styles.stickyImage}
          />
        </TouchableOpacity>
      }
      {/* Modal */}
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#b8e6c9',  // or any color
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

          const iconName = iconSource[route.name as keyof typeof iconSource] || require('../assets/images/apphome.png'); // Default to Home if not found

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
            // Only trigger a reset if not already on the main screen
            // This assumes you have a logic check or a navigation state reference.
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
    bottom: 60, // just above the tab bar
    right: 20, // right side
    zIndex: 20,
    backgroundColor: 'transparent',
  },
  stickyImage: {
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
});
