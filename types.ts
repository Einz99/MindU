import { NavigatorScreenParams } from '@react-navigation/native';

export type BottomTabParamList = {
  Home: undefined;
  Resources: undefined;
  Wellness: undefined;
  Chatbot: undefined;
  Mood: undefined;
  Calendar: undefined;
  Settings: undefined;
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

  Resources: NavigatorScreenParams<ResourcesStackParamList>; // 👈 nested stack
  Wellness: NavigatorScreenParams<WellnessStackParamList>;  // 👈 nested stack
};
