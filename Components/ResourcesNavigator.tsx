import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ResourcesMainScreen from '../screens/resourceScreens/ResourcesMainScreen'; // Main Resources page (1st Image)
import ArticlesListScreen from '../screens/resourceScreens/ArticlesListScreen'; // Full article (3rd Image)
import VideosListScreen from '../screens/resourceScreens/VideoListScreen';
import EmergencyList from '../screens/resourceScreens/EmergencyList';
import { ResourcesStackParamList } from '../types';

const Stack = createNativeStackNavigator<ResourcesStackParamList>();

export default function ResourcesNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="ResourcesMain">
      <Stack.Screen name="ResourcesMain" component={ResourcesMainScreen} />
      <Stack.Screen name="ArticlesList" component={ArticlesListScreen} />
      <Stack.Screen name="VideosList" component={VideosListScreen} />
      <Stack.Screen name="EmergencyList" component={EmergencyList} />
    </Stack.Navigator>
  );
}
