import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PetGameScreenProps {
  studentId: number;
  apiUrl: string;
  onClose?: () => void;
}

const PetGameScreen: React.FC<PetGameScreenProps> = ({ studentId, apiUrl, onClose }) => {
  const webViewRef = useRef<WebView>(null);

  // Load all saved data when component mounts
  useEffect(() => {
    loadAllSavedData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAllSavedData = async () => {
    try {
      // Get all keys from AsyncStorage
      const allKeys = await AsyncStorage.getAllKeys();
      const gameKeys = allKeys.filter(key =>
        key.startsWith('Pet_') ||
        key.startsWith('Toy_') ||
        key === 'LoginStreak' ||
        key === 'LastLoginDate' ||
        key === 'LastDailyReward' ||
        key === 'isSleeping'
      );

      if (gameKeys.length > 0) {
        const values = await AsyncStorage.multiGet(gameKeys);
        const data: { [key: string]: string } = {};

        values.forEach(([key, value]) => {
          if (value !== null) {
            data[key] = value;
          }
        });

        // Send to Unity once WebView is loaded
        console.log('📥 Loaded game data:', data);

        // Wait a bit for Unity to initialize
        setTimeout(() => {
          sendToUnity('LOAD_ALL_DATA', data);
        }, 2000);
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  };

  const sendToUnity = (type: string, data?: any) => {
    const message = JSON.stringify({ type, data });
    webViewRef.current?.injectJavaScript(`
      if (window.unityInstance) {
        window.unityInstance.SendMessage('StorageBridge', 'ReceiveAllPlayerPrefs', '${JSON.stringify(data)}');
      }
    `);
  };

  const handleMessage = async (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('📨 Message from Unity:', message);

      switch (message.type) {
        case 'SAVE_DATA':
          // Save single key-value pair
          await AsyncStorage.setItem(message.key, message.value);
          console.log(`💾 Saved: ${message.key} = ${message.value}`);
          break;

        case 'GET_DATA':
          // Get single value and send back to Unity
          const values = await AsyncStorage.getItem(message.key);
          const response = `${message.key}:${values || ''}`;
          webViewRef.current?.injectJavaScript(`
            if (typeof SendMessage !== 'undefined') {
              SendMessage('StorageBridge', 'ReceiveAsyncStorageValue', '${response}');
            }
          `);
          console.log(`📤 Sent to Unity: ${response}`);
          break;

        case 'SAVE_ALL_DATA':
          // Save all data at once
          const dataToSave = JSON.parse(message.data);
          if (dataToSave && dataToSave.data) {
            const pairs = Object.entries(dataToSave.data).map(([key, value]) => [
              key,
              String(value),
            ]);
            await AsyncStorage.multiSet(pairs as [string, string][]);
            console.log('💾 Saved all data:', Object.keys(dataToSave.data).length, 'keys');
          }
          break;

        case 'CLOSE_WEBVIEW':
          // Close the WebView modal
          console.log('🚪 Closing WebView');
          onClose?.();
          break;

        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  };

  const gameUrl = `${apiUrl}/play-pet/${studentId}`;

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: gameUrl }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error:', nativeEvent);
          Alert.alert('Error', 'Failed to load game');
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('HTTP error:', nativeEvent.statusCode);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
  },
});

export default PetGameScreen;
