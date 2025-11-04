import React, {  } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './screens/startingScreens/LoginScreen';
import UpdatingPasswordScreen from './screens/startingScreens/UpdatePasswordScreen';
import SplashScreen from './screens/startingScreens/SplashScreen';
import { RootStackParamList } from './types';
import BottomTabs from './Components/BottomTab';
import ForgotScreen from './screens/startingScreens/ForgotScreen';
import OnboardingScreen from './screens/startingScreens/OnBoardingScreen';
import DebugScreen from './screens/Debugger';
import 'text-encoding';
import { NetworkInfo } from 'react-native-network-info';
import SettingsScreen from './screens/SettingsScreen';
import { DrawerProvider } from './Components/DrawerContext';


const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {

NetworkInfo.getIPV4Address().then(ipAddress => {
  console.log('Local IPv4:', ipAddress); // Should show 192.168.1.6
});


return (
  <DrawerProvider>
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
        >
        <Stack.Screen name="Splash" component={SplashScreen}/>
        <Stack.Screen name="Login" component={LoginScreen}/>
        <Stack.Screen name="Forgot" component={ForgotScreen}/>
        <Stack.Screen name="Updating" component={UpdatingPasswordScreen}/>
        <Stack.Screen name="Homepage" component={BottomTabs}/>
        <Stack.Screen name="Onboarding" component={OnboardingScreen}/>
        <Stack.Screen name="Debug" component={DebugScreen}/>
        <Stack.Screen name="Settings" component={SettingsScreen}/>
      </Stack.Navigator>
    </NavigationContainer>
  </DrawerProvider>
);
}
