import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types';
import { API } from '../../apiConfigs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

export default function UpdatingPasswordScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [messageError, setMessageError] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (
      !password ||
      !confirmPassword ||
      password !== confirmPassword ||
      !isPasswordValid(password) ||
      !isPasswordValid(confirmPassword)
    ) {
      setPasswordError(true);
      setPassword('');
      setConfirmPassword('');
      return;
    }
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setIsSuccessful(false);
        setMessageError('User is not found. Please try logging in again.');
        setAlertModal(true);
        setTimeout(() => {
          navigation.navigate('Login');
        }, 1000);
        return;
      }

      const payload = {
        password,
      };

      const response = await axios.put(`${API}/update-password`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setIsSuccessful(true);
        setMessageError('Your password has been updated.');
        setAlertModal(true);
        setLoading(false);
        setTimeout(() => {
          navigation.navigate('Login');
          }, 1000);
      } else {
        setIsSuccessful(false);
        setMessageError('Server Error: Unable to connect. Please try again.');
        setAlertModal(true);
        setLoading(false);
      }
    } catch (error: any) {
        setIsSuccessful(false);
        setMessageError('Server Error: Unable to connect. Please try again.');
        setAlertModal(true);
        setLoading(false);
    }
  };

  const isPasswordValid = (passwordinput: string): boolean => {
    const minLength = /.{10,}/;
    const upper = /[A-Z]/;
    const lower = /[a-z]/;
    const number = /[0-9]/;
    const special = /[!@#$%^&*(),.?":{}|<>]/;

    return (
      minLength.test(passwordinput) &&
      upper.test(passwordinput) &&
      lower.test(passwordinput) &&
      number.test(passwordinput) &&
      special.test(passwordinput)
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={require('../../assets/images/ResettingPassword.png')} style={styles.image}/>
      <View style={styles.inputContainer}>
        <Text style={styles.title}>RESET PASSWORD</Text>
        <View style={styles.fieldContainer}>
          <TextInput
            style={[styles.input, passwordError && styles.wrongInput]}
            placeholder="Enter New Password"
            secureTextEntry={!passwordVisible}
            value={password}
            onChangeText={(e) => {setPassword(e); setPasswordError(!isPasswordValid(e));}}
            placeholderTextColor="lightgray"
          />
          <TouchableOpacity
            style={styles.visibilityIcon}
            onPress={() => setPasswordVisible(!passwordVisible)}
          >
            <Ionicons name={passwordVisible ? 'eye-off' : 'eye'} size={20} color="gray" />
          </TouchableOpacity>
        </View>
        <View style={styles.fieldContainer}>
          <TextInput
            style={[styles.input, passwordError && styles.wrongInput]}
            placeholder="Confirm Password"
            secureTextEntry={!confirmPasswordVisible}
            value={confirmPassword}
            onChangeText={(e) => {setConfirmPassword(e); setPasswordError(!isPasswordValid(e));}}
            placeholderTextColor="lightgray"
          />
          <TouchableOpacity
            style={styles.visibilityIcon}
            onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
          >
            <Ionicons name={confirmPasswordVisible ? 'eye-off' : 'eye'} size={20} color="gray" />
          </TouchableOpacity>
        </View>
        {passwordError && (
          <Text style={styles.errorpasswordhint}>Password must be atleast 10 character, have uppercase, lowercase, number and special character</Text>
        )}
        {/* eslint-disable-next-line react-native/no-inline-styles */}
        <TouchableOpacity style={[styles.button, {opacity: loading ? 0.5 : 1}]} disabled={loading} onPress={handleUpdate}>
          <Text style={styles.buttonText}>Reset Password</Text>
        </TouchableOpacity>

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
    </ScrollView>
  );
}

const { height, width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    backgroundColor: '#fff',
    position: 'relative',
  },
  title: {
    fontSize: moderateScale(30),
    textAlign: 'center',
    marginBottom: verticalScale(12),
    color: '#b7e3cc',
    fontFamily: 'Poppins-ExtraBold',
  },
  fieldContainer: {
    marginBottom: verticalScale(8),
    position: 'relative',
  },
  label: {
    fontSize: moderateScale(16),
    marginBottom: verticalScale(5),
    color: 'black',
  },
  input: {
    height: verticalScale(50),
    borderColor: '#888',
    borderWidth: moderateScale(1),
    paddingHorizontal: scale(15),
    borderRadius: moderateScale(15),
    fontSize: moderateScale(16),
    backgroundColor: '#fff',
    color: 'black',
  },
  wrongInput: {
    borderColor: 'red',
  },
  button: {
    backgroundColor: '#fff59d',
    paddingVertical: verticalScale(15),
    borderRadius: moderateScale(20),
    marginTop: verticalScale(0),
    alignItems: 'center',
    width: '80%',
    marginHorizontal: 'auto',
  },
  buttonText: {
    color: '#6d6e71',
    fontSize: moderateScale(16),
    fontFamily: 'Poppins-Bold',
  },
  visibilityIcon: {
    position: 'absolute',
    right: scale(10),
    top: '30%',
  },
  image: { position: 'absolute', top: verticalScale(0), width: width, height: height },
  inputContainer: {
    paddingHorizontal: '20%',
    width: width,
    position: 'absolute',
    top: '15%', // need to have absolute number
  },
  errorpasswordhint: {
    color: '#EF5350',
    textAlign: 'left',
    fontSize: moderateScale(10),
    fontFamily: 'Lora-Regular',
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
    shadowOffset: { width: scale(0), height: verticalScale(3) },
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
  redHeader: {
    backgroundColor: '#e3b7b7',
  },
  marginB: {
    marginBottom: verticalScale(10),
  },
  modalTitleStyled: {
    fontSize: moderateScale(18),
    color: '#333',
    fontFamily: 'Poppins-Bold',
  },
  instructions: {
    fontFamily: 'Lora-Bold',
    color: '#4a4a4a',
    paddingHorizontal: scale(40),
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(10),
    justifyContent: 'flex-end',
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
    shadowOffset: {width: scale(1), height: verticalScale(1)},
    shadowColor: 'gray',
    fontSize: moderateScale(15),
  },
});
