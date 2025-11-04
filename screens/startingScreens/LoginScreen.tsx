import { useNavigation, NavigationProp, CommonActions } from '@react-navigation/native';
import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  Modal,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import { RootStackParamList } from '../../types';
import { loginUser } from '../../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { API } from '../../apiConfigs';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import apiClient from '../../APIClient';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

GoogleSignin.configure({
  // Use web client ID only if you need offline access (optional)
  webClientId: '243983660210-pftvkd4r77dbmpmseak1s116tjf7jqdp.apps.googleusercontent.com',

  // Mandatory for Android validation
  offlineAccess: true, // if you need refresh tokens

  // Force code flow to avoid DEVELOPER_ERROR
  forceCodeForRefreshToken: true,
});

export default function LoginScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [isValidF, setIsValidF] = useState(true);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [codeModal, setCodeModal] = useState(false);
  const [code, setCode] = useState(['', '', '', '']);
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const [messageError, setMessageError] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [alertModal, setAlertModal] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim() || !isValid) {
      setIsSuccessful(false);
      setMessageError('Email and Password are required.');
      setAlertModal(true);
      return;
    }

    setLoading(true);
    try {
      const response = await loginUser(email, password);

      if (response.accessToken && response.refreshToken) {
        await AsyncStorage.setItem('userToken', response.accessToken);
        await AsyncStorage.setItem('refreshToken', response.refreshToken);

        let student_id = null;
        try {
          const userRes = await apiClient.get(`${API}/user`, {
            headers: { Authorization: `Bearer ${response.accessToken}` },
          });

          if (userRes.data && userRes.data.user) {
            student_id = userRes.data.user.id;
          } else {
            console.error('Failed to fetch user details.');
          }
        } catch (err) {
          console.error('Error fetching user info:', err);
        }

        // -------------------------
        // Insert daily login if student_id available
        // -------------------------
        if (student_id) {
          try {
            await axios.post(`${API}/student-login-percentages/insert`, { student_id });
          } catch (insertErr) {
            console.error('Error inserting daily login:', insertErr);
          }
        }

        if (response.user.firstLogin) {
          setIsSuccessful(true);
          setMessageError('Login Successful. Please Update Your Password');
          setAlertModal(true);
          setTimeout(() => {
            navigation.navigate('Updating');
          }, 1000); // 1000 milliseconds = 1 second
        } else {
            navigation.dispatch((CommonActions).reset({
              index: 0,
              routes: [{ name: 'Homepage'}],
            })
          );
        }
      } else {
        setIsSuccessful(false);
        setMessageError('Login Failed. Invalid Credentials');
        setAlertModal(true);
      }
    } catch (error) {
      setIsSuccessful(false);
      setMessageError('Server Error: Unable to connect. Please try again.');
      setAlertModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsValid(emailRegex.test(text)); // Validate email format
  };

  const handleForgotEmailChange = (text: string) => {
    setForgotEmail(text);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsValidF(emailRegex.test(text)); // Validate email format
  };

  const handleChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === 'Backspace' && code[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async () => {
    const joinedCode = code.join('');
    if (joinedCode.length === 4) {
      try {
        const response = await axios.post(`${API}/verify-code`, {
          email: forgotEmail,
          code: joinedCode,
          }, {
          headers: { 'Content-Type': 'application/json' },
          });

        if(response.status === 200) {
          setCodeModal(false);
          navigation.navigate('Forgot', { email: forgotEmail });
        }
      } catch (error) {
      }
    }
  };

  const handleSendCode = async () => {
    try {
      const respond = await axios.post(`${API}/send-code`, {
        email: forgotEmail,
      }, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (respond.status === 200) {
        setShowModal(false);
        setCodeModal(true);
      }
    } catch (err) {
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);

      await GoogleSignin.hasPlayServices();
      const userInfo: any = await GoogleSignin.signIn();
      const googleEmail = userInfo.user?.email ?? userInfo.email;

      console.log('Google email:', googleEmail);

      if (!googleEmail) {
        throw new Error('Unable to retrieve email from Google Sign-In');
      }

      // Call backend
      const res = await axios.post(`${API}/google-login`, { email: googleEmail });

      const { accessToken, refreshToken, user } = res.data;

      if (accessToken && refreshToken) {
        await AsyncStorage.setItem('userToken', accessToken);
        await AsyncStorage.setItem('refreshToken', refreshToken);

        if (user.firstLogin) {
          setIsSuccessful(true);
          setMessageError('Login Successful. Please Update Your Password');
          setAlertModal(true);
          setTimeout(() => navigation.navigate('Updating'), 1000);
        } else {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Homepage' }],
            })
          );
        }
      } else {
        setIsSuccessful(false);
        setMessageError('Login Failed. Invalid Credentials');
        setAlertModal(true);
      }
    } catch (error) {
      console.error('Google login error:', error);
      setIsSuccessful(false);
      setMessageError(
        axios.isAxiosError(error)
          ? 'Did not receive expected response from server. Please try again.'
          : 'Google login failed. Please try again.'
      );
      setAlertModal(true);
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
            style={[styles.input, !isValid && styles.invalidInput]} // Apply red border if invalid
            placeholder="Email"
            placeholderTextColor="lightgray"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={handleEmailChange}
          />
          {!isValid && email.length > 0 && <Text style={styles.errorText}>Invalid Email!</Text>}
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="lightgray"
              secureTextEntry={!passwordVisible}
              value={password}
              autoCapitalize="none"
              onChangeText={setPassword}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity
              style={styles.visibilityIcon}
              onPress={() => setPasswordVisible(!passwordVisible)}
            >
              <Text>
                <Ionicons name={passwordVisible ? 'eye-off' : 'eye'} size={20} color="gray" /> {/* Use Ionicons */}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.loginbtn} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.loginbtntext}>LOGIN</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.forgot} disabled={loading} onPress={() => setShowModal(true)}>
            <Text style={styles.forgotTxt}>Forgot Password</Text>
          </TouchableOpacity>
          {/* <TouchableOpacity onPress={handleGoogleLogin} disabled={loading}>
            <Image source={require('../../assets/images/google.png')} style={styles.google} />
          </TouchableOpacity> */}
        </View>

        {/* Forgot Password Modal */}
        <Modal visible={showModal} animationType="fade" transparent>
          <View style={styles.overlay}>
            <View style={styles.forgotModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitleStyled}>Forgot password</Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Ionicons name="close" size={22} color="#333" />
                </TouchableOpacity>
              </View>
              <View style={styles.padding}>
                <TextInput
                  style={styles.forgotInput}
                  placeholder="Enter email"
                  placeholderTextColor="#888"
                  value={forgotEmail}
                  onChangeText={handleForgotEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <View style={styles.forgotActions}>
                  <TouchableOpacity onPress={() => setShowModal(false)}>
                    <Text style={styles.backText}>BACK</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    // eslint-disable-next-line react-native/no-inline-styles
                    style={[styles.sendBtn, { opacity: (forgotEmail && isValidF) ? 1 : 0.5 }]}
                    onPress={() => {
                      handleSendCode();
                    }}
                    disabled={!isValidF || !forgotEmail}
                  >
                    <Text style={styles.sendText}>Send code</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {/* code modal */}
        <Modal visible={codeModal} animationType="fade" transparent>
          <View style={styles.overlay}>
            <View style={styles.forgotModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitleStyled}>Enter Verification Code</Text>
                <TouchableOpacity onPress={() => setCodeModal(false)}>
                  <Ionicons name="close" size={22} color="#333" />
                </TouchableOpacity>
              </View>

              <Text style={styles.instructions}>We’ve sent a code on your email account enter to proceed</Text>

              <View style={styles.codeInputContainer}>
                {code.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (inputRefs.current[index] = ref)}
                    style={styles.codeInput}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={digit}
                    onChangeText={(text) => handleChange(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                  />
                ))}
              </View>

              <View style={styles.actions}>
                <TouchableOpacity onPress={() => setCodeModal(false)}>
                  <Text style={styles.backText}>BACK</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  // eslint-disable-next-line react-native/no-inline-styles
                  style={[styles.sendBtn, { opacity: code.join('').length === 4 ? 1 : 0.5 }]}
                  disabled={code.join('').length !== 4}
                  onPress={handleSubmit}
                >
                  <Text style={styles.sendText}>Submit Code</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={alertModal} animationType="fade" transparent>
          <View style={styles.overlay}>
            <View style={styles.forgotModal}>
              <View style={[styles.modalHeader, !isSuccessful && styles.redHeader]}>
                <Text style={styles.modalTitleStyled}>{isSuccessful ? 'Successful' : 'Error'}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setAlertModal(false);
                    setMessageError('');
                    setIsSuccessful(false);
                  }}>
                  <Ionicons name="close" size={22} color="#333" />
                </TouchableOpacity>
              </View>
              <Text style={[styles.instructions, styles.marginB]}>{messageError}</Text>
              <View style={styles.actions}>
                <TouchableOpacity
                      style={[styles.sendBtn, !isSuccessful && styles.redHeader]}
                      onPress={() => {
                        setAlertModal(false);
                        setMessageError('');
                        setIsSuccessful(false);
                      }}
                    >
                      <Text style={styles.sendText}>OK</Text>
                    </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </View>
    </TouchableWithoutFeedback>
  );
}

const { height, width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  image: { position: 'absolute', top: verticalScale(0), width: width, height: height, resizeMode: 'contain' },
  login: { position: 'absolute', top: verticalScale(240), alignItems: 'center' },
  input: {
    height: verticalScale(40),
    borderWidth: moderateScale(1),
    marginBottom: verticalScale(20),
    paddingHorizontal: moderateScale(15),
    borderRadius: moderateScale(12),
    minWidth: '60%',
    color: 'black',
    borderColor: '#fff',
    backgroundColor: '#fff',
    fontFamily: 'Lora-Regular',
  },
  invalidInput: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: moderateScale(8),
    position: 'absolute',
    right: moderateScale(10),
    top: verticalScale(25),
  },
  loginbtn: {
    paddingVertical: verticalScale(5),
    borderColor: '#b7e3cc',
    backgroundColor: '#b7e3cc',
    borderWidth: moderateScale(1),
    borderRadius: moderateScale(10),
    minWidth: '50%',
    alignItems: 'center',
  },
  loginbtntext: { color: 'white', textAlign: 'center', fontFamily: 'Poppins-Bold', fontSize: moderateScale(12) },
  forgot: { marginTop: verticalScale(10) },
  forgotTxt: { color: '#fff', textShadowColor: 'gray', fontFamily: 'Lora-Regular' },
  passwordContainer: {
    position: 'relative',
  },
  visibilityIcon: {
    position: 'absolute',
    right: moderateScale(10),
    top: '20%',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(49, 120, 115, 0.8)',
  },
  forgotModal: {
    width: '85%',
    borderRadius: moderateScale(15),
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: moderateScale(0), height: moderateScale(3) },
    elevation: 5,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(20),
    backgroundColor: '#b7e3cc',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(10),
    borderTopLeftRadius: moderateScale(15),
    borderTopRightRadius: moderateScale(15),
  },
  modalTitleStyled: {
    fontSize: moderateScale(18),
    color: '#333',
    fontFamily: 'Poppins-Bold',
  },
  forgotInput: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(10),
    height: verticalScale(45),
    paddingHorizontal: scale(15),
    borderColor: '#b7e3cc',
    borderWidth: moderateScale(1),
    fontSize: moderateScale(16),
    color: '#333',
    marginBottom: verticalScale(20),
    fontFamily: 'Lora-Regular',
  },
  forgotActions: {
    flexDirection: 'row',
    gap: moderateScale(10),
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  backText: {
    color: 'gray',
    fontFamily: 'Poppins-ExtraBold',
    fontSize: moderateScale(12),
  },
  sendBtn: {
    backgroundColor: '#b7e3cc',
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(20),
    borderRadius: moderateScale(10),
  },
  sendText: {
    color: 'white',
    fontFamily: 'Poppins-ExtraBold',
    shadowRadius: moderateScale(3),
    shadowOffset: {width: moderateScale(1), height: moderateScale(1)},
    shadowColor: 'gray',
    fontSize: moderateScale(15),
  },
  padding: {
    padding: moderateScale(10),
  },
  instructions: {
    fontFamily: 'Lora-Bold',
    color: '#4a4a4a',
    paddingHorizontal: scale(40),
    textAlign: 'center',
    fontSize: moderateScale(12),
  },
  codeInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: verticalScale(20),
    paddingHorizontal: scale(40),
  },
  codeInput: {
    width: verticalScale(50),
    height: verticalScale(50),
    borderWidth: moderateScale(2),
    borderColor: '#b7e3cc',
    borderRadius: moderateScale(8),
    textAlign: 'center',
    fontSize: moderateScale(20),
    backgroundColor: '#f9f9f9',
    color: '#333',
    fontFamily: 'Lora-Regular',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(10),
    justifyContent: 'flex-end',
  },
  redHeader: {
    backgroundColor: '#e3b7b7',
  },
  marginB: {
    marginBottom: verticalScale(10),
  },
  google: { width: moderateScale(30), height: moderateScale(30), marginTop: verticalScale(15), borderRadius: moderateScale(99) },
});

