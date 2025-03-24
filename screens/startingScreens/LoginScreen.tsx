import { useNavigation, NavigationProp } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { RootStackParamList } from '../../types';
import { loginUser } from '../../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Validation Error', 'Email and Password are required.');
      return;
    }

    setLoading(true);
    try {
      const response = await loginUser(email, password);

      if (response.accessToken && response.refreshToken) {
        await AsyncStorage.setItem('userToken', response.accessToken);
        await AsyncStorage.setItem('refreshToken', response.refreshToken);

        if (response.user.firstLogin) {
          Alert.alert('Login Successful', 'Update Password');
          navigation.navigate('Updating');
        } else {
          Alert.alert('Login Successful', 'Welcome');
          navigation.navigate('Homepage');
        }
      } else {
        Alert.alert('Login Failed', response.message || 'Invalid credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Unable to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Image source={require('../../assets/images/Login.png')} style={styles.image} />
        <View style={styles.login}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="lightgray"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="lightgray"
            secureTextEntry={true}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity style={styles.loginbtn} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.loginbtntext}>LOGIN</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.forgot} onPress={() => navigation.navigate('Forgot')}>
            <Text style={styles.forgotTxt}>Forgot Password</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: '100%' },
  login: { position: 'absolute', top: '27.5%', alignItems: 'center' },
  input: {
    height: 50,
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 15,
    borderRadius: 12,
    minWidth: '70%',
    color: 'black',
    borderColor: '#fff',
    backgroundColor: '#fff',
  },
  loginbtn: {
    paddingVertical: 10,
    borderColor: '#b7e3cc',
    backgroundColor: '#b7e3cc',
    borderWidth: 1,
    borderRadius: 20,
    minWidth: '70%',
    alignItems: 'center',
  },
  loginbtntext: { color: 'white', textAlign: 'center' },
  forgot: { marginTop: 10 },
  forgotTxt: { color: '#fff', textShadowColor: 'gray', fontWeight: 'bold' },
});

