import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WellnessStackParamList } from '../types';
import WellnessScreen from '../screens/WellnessScreens/WellnessScreen';
import MeditationScreen from '../screens/WellnessScreens/MeditationScreen';
import BreathingExerciseScreen from '../screens/WellnessScreens/BreathingScreen';

const Stack = createNativeStackNavigator<WellnessStackParamList>();

export default function WellnessNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
      initialRouteName="Wellnesses"
    >
      <Stack.Screen name="Wellnesses" component={WellnessScreen} />
      <Stack.Screen name="Meditation" component={MeditationScreen} />
      <Stack.Screen name="Breathing" component={BreathingExerciseScreen} />
    </Stack.Navigator>
  );
}
