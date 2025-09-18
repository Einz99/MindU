import React, { useState, useEffect, useRef } from 'react';
import { Keyboard, View, StyleSheet, TouchableOpacity, Image, Modal, Text, ScrollView, Dimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomepageScreen from '../screens/HomepageScreen';
import ResourcesNavigator from './ResourcesNavigator';
import WellnessNavigator from './WellnessNavigator';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MoodScreen from '../screens/MoodScreen';
import ChatbotScreen from '../screens/ChatbotScreen';
import { useNavigationState, NavigationState } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const Tab = createBottomTabNavigator();

const bg = [
  { bg: require('../assets/images/pet/56.png') },
  { bg: require('../assets/images/pet/59.png') },
  { bg: require('../assets/images/pet/62.png') },
  { bg: require('../assets/images/pet/65.png') },
  { bg: require('../assets/images/pet/68.png') },
  { bg: require('../assets/images/pet/71.png') },
];

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

  const [pageIndex, setPageIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const totalPages = 6;

  const goToPage = (index: number) => {
    if (index >= 0 && index < totalPages) {
      setPageIndex(index);
      scrollRef.current?.scrollTo({ x: width * index, animated: true });
    }
  };

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
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
        <ScrollView
          horizontal
          pagingEnabled
          scrollEnabled={false} // Disable user scrolling
          showsHorizontalScrollIndicator={false}
          ref={scrollRef}
        >
          {bg.map((item, i) => (
            <View key={i} style={[{ width, height }]}>
              <Image
                source={item.bg}
                style={[{ width, height }]}
                resizeMode="cover" // or 'contain', depending on how you want the image to fill
              />
            </View>
          ))}
        </ScrollView>
        {/* eslint-disable react-native/no-inline-styles */}
        <View style={{position: 'absolute', right: 20, top: 10}}>
          <TouchableOpacity onPress={() => setModalVisible(false)}>
            <Ionicons name="arrow-back" size={25} color="#000" />
          </TouchableOpacity>
        </View>
        <View style={{position: 'absolute', right: 20, top: 40}}>
          <TouchableOpacity
            onPress={() => goToPage(pageIndex === 5 ? 0 : 5)}
            >
            <Image source={require('../assets/images/pet/shop.png')} style={{width: 110, height: 30}}/>
          </TouchableOpacity>
        </View>

      {pageIndex !== 5 && (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            onPress={() => goToPage(0)}
            disabled={pageIndex === 0}
          >
            {pageIndex === 0 ? <Image source={require('../assets/images/pet/20.png')} style={{width: 80, height: 80}}/> : <Image source={require('../assets/images/pet/21.png')} style={{width: 80, height: 80}}/>}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => goToPage(1)}
            disabled={pageIndex === 1}
          >
            {pageIndex === 1 ? <Image source={require('../assets/images/pet/22.png')} style={{width: 80, height: 80}}/> : <Image source={require('../assets/images/pet/23.png')} style={{width: 80, height: 80}}/>}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => goToPage(2)}
            disabled={pageIndex === 2}
          >
            {pageIndex === 2 ? <Image source={require('../assets/images/pet/24.png')} style={{width: 80, height: 80}}/> : <Image source={require('../assets/images/pet/25.png')} style={{width: 80, height: 80}}/>}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => goToPage(3)}
            disabled={pageIndex === 3}
          >
            {pageIndex === 3 ? <Image source={require('../assets/images/pet/26.png')} style={{width: 80, height: 80}}/> : <Image source={require('../assets/images/pet/27.png')} style={{width: 80, height: 80}}/>}
          </TouchableOpacity>
        </View>
        )}
        {(pageIndex === 4 || pageIndex === 3) &&
        <View style={{position: 'absolute', top: '45%', left: 15}}>
          <TouchableOpacity
            onPress={() => goToPage(pageIndex === 4 ? 3 : 4)}
            disabled={pageIndex === (pageIndex === 4 ? 3 : 4)}
            >
            <Text style={{color: 'black', fontFamily: 'Lora-Regular'}}>Tap Here</Text>
          </TouchableOpacity>
        </View>
        }
      </View>
      </Modal>

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
                  keyboardVisible && { bottom: -20 },
                ]}
              >
                <View style={styles.centerIconCircle}>
                  <View style={styles.centerIcon}>
                    <Image source={iconName} style={{ width: 30, height: 30 }} />
                  </View>
                </View>
                {focused && <View style={styles.indicatorDot} />}
              </View>
            );
          } else {
            return (
              <View style={styles.tabIconWrapper}>
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
