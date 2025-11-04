import { NavigatorScreenParams } from '@react-navigation/native';

export type BottomTabParamList = {
  Home: undefined;
  Resources: NavigatorScreenParams<ResourcesStackParamList>; // ✅ Changed
  Chatbot: undefined;
  Wellness: NavigatorScreenParams<WellnessStackParamList>; // ✅ Changed
  Mood: undefined;
  Settings?: undefined; // If Settings is inside BottomTabs
};


export type ResourcesStackParamList = {
  ResourcesMain: undefined;
  ArticlesList: undefined;
  VideosList: undefined;
  EmergencyList: undefined;
};

export type WellnessStackParamList = {
  Wellnesses: undefined;
  Meditation: undefined;
  Breathing: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Forgot: { email?: string };
  Updating: undefined;
  Onboarding: undefined;
  Homepage: NavigatorScreenParams<BottomTabParamList>; // 👈 nested tab
  Debug: undefined;
  Drawer: undefined;
  Settings: undefined;

  Resources: NavigatorScreenParams<ResourcesStackParamList>; // 👈 nested stack
  Wellness: NavigatorScreenParams<WellnessStackParamList>;  // 👈 nested stack
};
