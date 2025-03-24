import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import HomepageScreen from '../screens/HomepageScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ResourcesScreen from '../screens/ResourcesScreen';

const Tab = createBottomTabNavigator();

export default function BottomBarNavComponent() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // eslint-disable-next-line react/no-unstable-nested-components
        tabBarIcon: () => {
          const icons: Record<string, string> = {
            Home: 'home-outline',
            Settings: 'settings-outline',
            Resources: 'podium-outline',
          };
          return <Icon name={icons[route.name] || 'alert-circle-outline'} size={25} color={'black'} />;
        },
      })}
      initialRouteName="Home">
      <Tab.Screen name="Home" component={HomepageScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Resources" component={ResourcesScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}
