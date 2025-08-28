// ForgotPasswordScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, Image, Dimensions, TouchableWithoutFeedback, Keyboard } from 'react-native';
import axios from 'axios';
import { RootStackParamList } from '../../types';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { API } from '../../apiConfigs';
import { useRoute, RouteProp } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';


export default function ForgotPasswordScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Forgot'>>();
  const passedEmail = route.params?.email || '';
  const [email] = useState<string>(passedEmail);
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [messageError, setMessageError] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [alertModal, setAlertModal] = useState(false);

  const handleForgotPassword = async () => {
    if (
      !newPassword ||
      !confirmPassword ||
      newPassword !== confirmPassword ||
      !isPasswordValid(newPassword) ||
      !isPasswordValid(confirmPassword)
    ) {
      setPasswordError(true);
      setNewPassword('');
      setConfirmPassword('');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/forgot-password`, {
        // Send email fields for testing purposes
        email: email,
        newPassword,
      });
      setIsSuccessful(true);
      setMessageError('Successfully Change Password');
      setAlertModal(true);
      setTimeout(() => {
        navigation.navigate('Login');
      }, 1000);
    } catch (error: any) {
      setIsSuccessful(false);
      setMessageError('Server Error: Unable to connect. Please try again.');
      setAlertModal(true);
    } finally {
      setLoading(false);
    }
  };

  const isPasswordValid = (password: string): boolean => {
    const minLength = /.{10,}/;
    const upper = /[A-Z]/;
    const lower = /[a-z]/;
    const number = /[0-9]/;
    const special = /[!@#$%^&*(),.?":{}|<>]/;

    return (
      minLength.test(password) &&
      upper.test(password) &&
      lower.test(password) &&
      number.test(password) &&
      special.test(password)
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <View style={styles.container}>
      <Image source={require('../../assets/images/ResettingPassword.png')} style={styles.bg}/>
      <View style={styles.textInputCont}>
        <Text style={styles.title}>RESET PASSWORD</Text>
        <View style={styles.inputField}>
          <TextInput
            style={[styles.input, passwordError === true && styles.errorpassword]}
            placeholder="Enter new password"
            secureTextEntry={!passwordVisible}
            value={newPassword}
            onChangeText={(e) => {setNewPassword(e); setPasswordError(!isPasswordValid(e));}}
            placeholderTextColor={'grey'}
          />
          <TouchableOpacity
            style={styles.visibilityIcon}
            onPress={() => setPasswordVisible(!passwordVisible)}
          >
            <Ionicons name={passwordVisible ? 'eye-off' : 'eye'} size={20} color="gray" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputField}>
          <TextInput
            style={[styles.input, passwordError === true && styles.errorpassword]}
            placeholder="Confirm new password"
            secureTextEntry={!confirmPasswordVisible}
            value={confirmPassword}
            onChangeText={(e) => {setConfirmPassword(e); setPasswordError(!isPasswordValid(e));}}
            placeholderTextColor={'grey'}
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
        <TouchableOpacity
          style={styles.button}
          onPress={handleForgotPassword}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Processing...' : 'Reset Password'}
          </Text>
        </TouchableOpacity>
      </View>

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

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Poppins-ExtraBold',
    fontSize: 30,
    textAlign: 'center',
    color: '#b7e3cc',
    letterSpacing: 3,
    marginBottom: 15,
  },
  input: {
    height: 50,
    borderColor: '#888',
    borderWidth: 1,
    paddingHorizontal: 15,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: 'white',
    color: 'black',
    fontFamily: 'Lora-Regular',
  },
  inputField: {
    marginBottom: 8,
    position: 'relative',
  },
  button: {
    backgroundColor: '#fff59d',
    paddingVertical: 15,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
    width: '75%',
    textAlign: 'center',
    margin: 'auto',
  },
  buttonText: {
    color: '#6d6e71',
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
  },
  bg: { position: 'absolute', top: 0, width: width, height: height },
  textInputCont: {
    width: width,
    padding: 75,
    justifyContent: 'center',
    position: 'absolute',
    top: 30,
  },
  disabledInput: {
    backgroundColor: '#f0f0f0',
    color: 'gray',
  },
  errorpassword: {
    borderColor: 'red',
  },
  errorpasswordhint: {
    color: '#ed5450',
    textAlign: 'left',
    fontSize: 10,
    fontFamily: 'Lora-Regular',
  },
  visibilityIcon: {
    position: 'absolute',
    right: 10,
    top: '30%',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(49, 120, 115, 0.8)',
  },
  forgotModal: {
    width: '85%',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#b7e3cc',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  redHeader: {
    backgroundColor: '#e3b7b7',
  },
  marginB: {
    marginBottom: 10,
  },
  modalTitleStyled: {
    fontSize: 18,
    color: '#333',
    fontFamily: 'Poppins-Bold',
  },
  instructions: {
    fontFamily: 'Lora-Bold',
    color: '#4a4a4a',
    paddingHorizontal: 40,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 10,
    justifyContent: 'flex-end',
  },
  sendBtn: {
    backgroundColor: '#b7e3cc',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  sendText: {
    color: 'white',
    fontFamily: 'Poppins-ExtraBold',
    shadowRadius: 3,
    shadowOffset: {width: 1, height: 1},
    shadowColor: 'gray',
    fontSize: 15,
  },
});
