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


const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
return (
  <NavigationContainer>
    <Stack.Navigator initialRouteName="Splash">
      <Stack.Screen name="Splash" component={SplashScreen} options={{headerShown: false}}/>
      <Stack.Screen name="Login" component={LoginScreen} options={{headerShown: false}}/>
      <Stack.Screen name="Forgot" component={ForgotScreen} options={{headerShown: false}}/>
      <Stack.Screen name="Updating" component={UpdatingPasswordScreen} options={{headerShown: false}}/>
      <Stack.Screen name="Homepage" component={BottomTabs} options={{headerShown: false}}/>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{headerShown: false}}/>
      <Stack.Screen name="Debug" component={DebugScreen} options={{headerShown: false}}/>
    </Stack.Navigator>
  </NavigationContainer>
);
}
