import React from 'react';
import { View, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DebugScreen() {
  const clearStorage = async () => {
    try {
      await AsyncStorage.clear();
      console.log('✅ AsyncStorage Cleared!');
      // Verify if storage is really cleared
      const checkValue = await AsyncStorage.getItem('hasLaunched');
      console.log('📌 After Clear - hasLaunched:', checkValue); // Should be null
    } catch (error) {
      console.error('❌ Error clearing AsyncStorage:', error);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button title="Clear AsyncStorage" onPress={clearStorage} />
    </View>
  );
}
