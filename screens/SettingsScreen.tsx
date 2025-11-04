import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, Image, NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { API, RootAPI } from '../apiConfigs';
import * as ImagePicker from 'react-native-image-picker';
import apiClient from '../APIClient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DrawerComponent from '../Components/DrawerComponent';
import axios from 'axios';

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [tempProfile, setTempProfile] = useState({
    name: '',
    section: '',
    adviser: '',
    age: 0,
    gender: '',
    profilePic: '',
  });
  const [, setID] = useState('');
  const [Name, setName] = useState('');
  const [section, setSection] = useState('');
  const [adviser, setAdviser] = useState('');
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [notConfirmPic, setNotConfirmPic] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [picChanged, setPicChanged] = useState(false);

  const [logoutModal, setLogoutModal] = useState(false);
  const [pictureChangeModal, setPictureChangeModal] = useState(false);
  const [emailChange, setEmailChange] = useState(false);
  const [emailTemp, setEmailTemp] = useState('');
  const [code, setCode] = useState(['', '', '', '']);
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const [passwordChange, setPasswordChange] = useState(false);
  const [truePassword, setTruePassword] = useState('');
  const [oldPass, setOldPass] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [oldPassVisibility, setOldPassVisibility] = useState(false);
  const [newPassVisibility, setNewPassVisibility] = useState(false);
  const [confPassVisibility, setConfPassVisibility] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [message, setMessage] = useState('');
  const [, setNothing] = useState(false);
  const [codeModal, setCodeModal] = useState(false);

  const [messageError, setMessageError] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [alertModal, setAlertModal] = useState(false);

  const refreshUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await apiClient.get(`${API}/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.user) {
        setID(response.data.user.id);
        setName(response.data.user.firstName + ' ' + response.data.user.lastName);
        setSection(response.data.user.section);
        setAdviser(response.data.user.adviser);
        setProfilePic(response.data.user.profilePic);
        setNotConfirmPic(response.data.user.profilePic);
        setEmail(response.data.user.email);
        setEmailTemp(response.data.user.email);
        setTruePassword(response.data.user.password);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
          setIsSuccessful(false);
          setMessageError('Email and Password are required.');
          setAlertModal(true);
          setTimeout(() => {
            navigation.navigate('Login');
          }, 1000);
          return;
        }
        const response = await apiClient.get(`${API}/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.user) {
          setID(response.data.user.id);
          setName(response.data.user.firstName + ' ' + response.data.user.lastName);
          setSection(response.data.user.section);
          setAdviser(response.data.user.adviser);
          setProfilePic(response.data.user.profilePic);
          setNotConfirmPic(response.data.user.profilePic);
          setEmail(response.data.user.email);
          setEmailTemp(response.data.user.email);
          setTruePassword(response.data.user.password);
          // Password is not typically fetched from the server
          setPassword('*****************');
        } else {
          setIsSuccessful(false);
          setMessageError('Server Error: Unable to connect. Please try again.');
          setAlertModal(true);
        }
      }
      catch (error: any) {
        console.error('Error fetching user:', error);

        // Handle session expiration
        if (error.logout) {
          (async () => {
            setIsSuccessful(false);
            setMessageError('Session Expired. Please log in again');
            setAlertModal(true);
            await AsyncStorage.clear();
            navigation.navigate('Login');
          })();
        } else {
          setIsSuccessful(false);
          setMessageError('Server Error: Unable to connect. Please try again.');
          setAlertModal(true);
        }
      }
    };
    fetchUserData();
  }, [navigation]);

  const handleLogout = async () => {
    // Remove the stored token
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('refreshToken');
    // Optionally, you can clear other stored data here

    // Navigate to Login screen (or Splash if you want to recheck auth)
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const handleChangeProfilePic = () => {
    const options: ImagePicker.ImageLibraryOptions = {
      mediaType: 'photo',
      quality: 1,
      includeBase64: false,
    };

    ImagePicker.launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
        setIsSuccessful(false);
        setMessageError('Failed to pick image.');
        setAlertModal(true);
      } else if (response.assets && response.assets[0].uri) {
        setPicChanged(true);
        setProfilePic(response.assets[0].uri);
        setTempProfile({
          ...tempProfile,
          profilePic: response.assets[0].uri,
        });
        // Auto-save profile after selection
      }
    });
    setPictureChangeModal(true);
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsEmailValid(emailRegex.test(text));
  };

  const renderField = (label: string, value: string, editable: boolean, setModal: Function) => {
    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.input}>
            {value}
          </Text>
          {editable && <Ionicons name="create-outline" size={15} style={styles.editIcon} onPress={() => setModal(true)}/>}
        </View>
      </View>
    );
  };

  const handlePasswordConfirm = async () => {
    if (truePassword !== oldPass) {
      setMessage('Incorrect Old Password. Please try again.');
      setTruePassword('');
      setTempPassword('');
      setConfirmPassword('');
      return;
    } else if (tempPassword !== confirmPassword) {
      setMessage('New Password and Confirm Password do not match.');
      setTempPassword('');
      setConfirmPassword('');
      return;
    } else {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const response = await apiClient.put(`${API}/update-password`,
          { password: tempPassword, firstLogin: false },
          { headers: { Authorization: `Bearer ${token}` }}
        );

        if (response.data.success) {
          setPasswordChange(false);
          setTempPassword('');
          setConfirmPassword('');
          setOldPass('');
          setPassword('*****************');
          refreshUserData();
          setIsSuccessful(true);
          setMessageError('Password updated successfully.');
          setAlertModal(true);
        }
      } catch (error: any) {
        setIsSuccessful(false);
        setMessageError('Failed to update password. Please your check connection before trying again');
        setAlertModal(true);
      }
    }
  };

  const handleProfileConfirm = async () => {
    try {
      if (!picChanged) {
        setPictureChangeModal(false);
        return;
      }

      const token = await AsyncStorage.getItem('userToken');

      // Create form data for image upload
      const formData = new FormData();
      let filename = profilePic && profilePic.split('/').pop();
      let match = filename && /\.(\w+)$/.exec(filename);
      let type = match ? `image/${match[1]}` : 'image';

      formData.append('profilePic', {
        uri: profilePic,
        name: filename,
        type,
      });

      const response = await apiClient.put(`${API}/update-profile-pic`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        setPictureChangeModal(false);
        setNotConfirmPic(response.data.profilePicPath);
        setPicChanged(false);
        refreshUserData();
        setIsSuccessful(true);
        setMessageError('Profile picture updated successfully.');
        setAlertModal(true);
      }
    } catch (error: any) {
      setIsSuccessful(false);
      setMessageError('Failed to update profile picture. Please check your connection before trying again.');
      setAlertModal(true);
      setProfilePic(notConfirmPic);
      setPicChanged(false);
    }
  };

  const isPasswordValid = (passwordinput: string): boolean => {
    setMessage('password must be atleast 10 characters, have uppercase, lowercase, number and special character');
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

  const handleSendCode = async () => {
    try {
      const respond = await axios.post(`${API}/send-code`, {
        email: email,
      }, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (respond.status === 200) {
        setEmailChange(false);
        setCodeModal(true);
      }
    } catch (err) {
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

  const handleChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleSubmit = async () => {
    const joinedCode = code.join('');
    if (joinedCode.length === 4) {
      try {
        const response = await axios.post(`${API}/verify-code`, {
          email: email,
          code: joinedCode,
          }, {
          headers: { 'Content-Type': 'application/json' },
          });

        if(response.status === 200) {
          try {
            const token = await AsyncStorage.getItem('userToken');
            const responded = await apiClient.put(`${API}/update-email`,
              { email },
              { headers: { Authorization: `Bearer ${token}` }}
            );

            if (responded.data.success) {
              setEmailChange(false);
              setEmailTemp(email);
              setIsSuccessful(true);
              setMessageError('Email updated successfully.');
              setAlertModal(true);
              refreshUserData();
            }
          } catch (error : any) {
            setIsSuccessful(false);
            setMessageError('Failed to update email. Please check your internet before trying again.');
            setAlertModal(true);
            setEmail(emailTemp);
          }
        }
      } catch (error) {
      }
    }
  };

  return (
    <View style={styles.container}>
      <DrawerComponent Initial={'Profile'} />
      <View style={styles.titleBox}>
          <Text style={styles.title}>
              Profile Settings
          </Text>
      </View>
      <View style={styles.imageHolder}>
        <Image
        source={profilePic ? picChanged ? { uri: profilePic } : { uri: `${RootAPI}${profilePic}` } : require('../assets/images/default_profile.png')}
        style={styles.Image}
        />
        <TouchableOpacity onPress={handleChangeProfilePic}>
          <Ionicons name="camera" size={moderateScale(30)} style={styles.imageIcon} />
        </TouchableOpacity>
      </View>
      <View>
        <Text style={styles.name}>{Name}</Text>
      </View>
      <View style={styles.inputFields}>
        {renderField('Email', email, true, setEmailChange)}
        {renderField('Section', section, false, setNothing)}
        {renderField('Adviser', adviser, false, setNothing)}
        {renderField('Password', password, true, setPasswordChange)}
        <TouchableOpacity style={styles.logout} onPress={() => {setLogoutModal(true); setProfilePic(notConfirmPic);}}>
          <Ionicons name="log-out-outline" size={30} style={styles.logoutIcon}/>
          <Text style={styles.logoutText}>LOG OUT</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Modal */}
      <Modal
        visible={logoutModal}
        animationType="fade"
        transparent
      >
        <View style={styles.overlay}>
          <View style={styles.LogoutModal}>
            <View style={styles.LogoutHeader}>
              <Text style={styles.LogoutTitleStyled}>Log out</Text>
              <TouchableOpacity onPress={() => setLogoutModal(false)}>
                <Ionicons name="close" size={22} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.padding}>
              <Text style={styles.LogoutConfirmation}>Are you sure you want to log out the accout?</Text>
            </View>
            <View style={styles.LogoutActions}>
              <TouchableOpacity onPress={() => setLogoutModal(false)}>
                <Text style={styles.backText}>BACK</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sendBtn}
                onPress={handleLogout}
              >
                <Text style={styles.LogoutButtonText}>Log out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Picture Modal */}
      <Modal
        visible={pictureChangeModal}
        animationType="fade"
        transparent
      >
        <View style={styles.overlay}>
          <View style={styles.LogoutModal}>
            <View style={[styles.LogoutHeader, styles.BGGreen]}>
              <Text style={styles.LogoutTitleStyled}>Change Profile</Text>
              <TouchableOpacity onPress={() => {setPictureChangeModal(false); setProfilePic(notConfirmPic); setPicChanged(false);}}>
                <Ionicons name="close" size={22} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.padding}>
              <Text style={styles.LogoutConfirmation}>Are you sure you want to change profile?</Text>
            </View>
            <View style={styles.LogoutActions}>
              <TouchableOpacity onPress={() => {setPictureChangeModal(false); setProfilePic(notConfirmPic); setPicChanged(false);}}>
                <Text style={styles.backText}>BACK</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sendBtn, styles.BGGreen]}
                onPress={handleProfileConfirm}
              >
                <Text style={styles.LogoutButtonText}>Change Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Email Modal */}
      <Modal
        visible={emailChange}
        animationType="fade"
        transparent
        onRequestClose={() => {setEmailChange(false); setEmail(emailTemp);}}
      >
        <View style={styles.overlay}>
          <View style={styles.LogoutModal}>
            <View style={[styles.LogoutHeader, styles.BGGreen]}>
              <Text style={[styles.LogoutTitleStyled, styles.blackText]}>Change Email</Text>
              <TouchableOpacity onPress={() => {setEmailChange(false); setEmail(emailTemp);}}>
                <Ionicons name="close" size={22} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.padding}>
              <Text style={styles.LogoutConfirmation}>Are you sure you want to email?</Text>
            </View>
            <View>
            <View style={[styles.fieldContainer, styles.paddingField]}>
              <Text style={styles.fieldLabel}>Email</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, !isEmailValid && styles.incorrect]}
                  value={email}
                  onChangeText={handleEmailChange}
                />
              </View>
            </View>
            </View>
            <View style={styles.LogoutActions}>
              <TouchableOpacity onPress={() => {setEmailChange(false);}}>
                <Text style={styles.backText}>BACK</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sendBtn, styles.BGGreen]}
                disabled={!email || !isEmailValid}
                onPress={handleSendCode}
              >
                <Text style={styles.LogoutButtonText}>Send Code</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* code modal */}
        <Modal
          visible={codeModal}
          animationType="fade"
          transparent
          onRequestClose={() => {setCodeModal(false); setEmail(emailTemp);}}
          >
          <View style={styles.overlay}>
            <View style={styles.LogoutModal}>
              <View style={[styles.LogoutHeader, styles.BGGreen]}>
                <Text style={[styles.LogoutTitleStyled, styles.blackText]}>Enter Verification Code</Text>
                <TouchableOpacity onPress={() => {setCodeModal(false); setEmail(emailTemp);}}>
                  <Ionicons name="close" size={22} color="#333" />
                </TouchableOpacity>
              </View>
              <View style={styles.padding}>
                <Text style={styles.LogoutConfirmation}>We’ve sent a code on your new email account enter code to proceed</Text>
              </View>
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

              <View style={styles.LogoutActions}>
                <TouchableOpacity onPress={() => setCodeModal(false)}>
                  <Text style={styles.backText}>BACK</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  // eslint-disable-next-line react-native/no-inline-styles
                  style={[styles.sendBtn, styles.BGGreen, { opacity: code.join('').length === 4 ? 1 : 0.5 }]}
                  disabled={code.join('').length !== 4}
                  onPress={handleSubmit}
                >
                  <Text style={styles.LogoutButtonText}>Submit Code</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      {/* Password Modal */}
      <Modal
        visible={passwordChange}
        animationType="fade"
        transparent
      >
        <View style={styles.overlay}>
          <View style={styles.LogoutModal}>
            <View style={[styles.LogoutHeader, styles.BGGreen]}>
              <Text style={[styles.LogoutTitleStyled, styles.blackText]}>Change Password</Text>
              <TouchableOpacity onPress={() => {setPasswordChange(false); setTempPassword(''); setConfirmPassword(''); setOldPass('');}}>
                <Ionicons name="close" size={22} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.padding}>
              <Text style={styles.LogoutConfirmation}>Are you sure you want to Password?</Text>
            </View>
            <View>
              <View style={[styles.fieldContainer, styles.paddingField]}>
                <Text style={styles.fieldLabel}>Old Password</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    onChangeText={(e) => {setOldPass(e); setPasswordError(!isPasswordValid(e));}}
                    secureTextEntry={!oldPassVisibility}
                  />
                  <TouchableOpacity
                    style={styles.visibilityIcon}
                    onPress={() => setOldPassVisibility(!oldPassVisibility)}
                  >
                    <Ionicons name={oldPassVisibility ? 'eye-off' : 'eye'} size={20} color="gray" />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={[styles.fieldContainer, styles.paddingField]}>
                <Text style={styles.fieldLabel}>New Password</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input]}
                    value={tempPassword}
                    onChangeText={(e) => {setTempPassword(e); setPasswordError(!isPasswordValid(e));}}
                    secureTextEntry={!newPassVisibility}
                  />
                  <TouchableOpacity
                    style={styles.visibilityIcon}
                    onPress={() => setNewPassVisibility(!newPassVisibility)}
                  >
                    <Ionicons name={newPassVisibility ? 'eye-off' : 'eye'} size={20} color="gray" />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={[styles.fieldContainer, styles.paddingField]}>
                <Text style={styles.fieldLabel}>Confirm New Password</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input]}
                    value={confirmPassword}
                    onChangeText={(e) => {setConfirmPassword(e); setPasswordError(!isPasswordValid(e));}}
                    secureTextEntry={!confPassVisibility}
                  />
                  <TouchableOpacity
                    style={styles.visibilityIcon}
                    onPress={() => setConfPassVisibility(!confPassVisibility)}
                  >
                    <Ionicons name={confPassVisibility ? 'eye-off' : 'eye'} size={20} color="gray" />
                  </TouchableOpacity>
                </View>
              </View>
              {passwordError && <Text style={styles.hint}>{message}</Text>}
            </View>
            <View style={styles.LogoutActions}>
              <TouchableOpacity onPress={() => {setPasswordChange(false); setTempPassword(''); setConfirmPassword(''); setOldPass('');}}>
                <Text style={styles.backText}>BACK</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sendBtn, styles.BGGreen]}
                onPress={() => {
                    handlePasswordConfirm();
                }}
              >
                <Text style={styles.LogoutButtonText}>Change Password</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={alertModal} animationType="fade" transparent>
          <View style={styles.overlay2}>
            <View style={styles.forgotModal2}>
              <View style={[styles.modalHeader2, !isSuccessful && styles.redHeader]}>
                <Text style={styles.modalTitleStyled2}>{isSuccessful ? 'Successful' : 'Error'}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setAlertModal(false);
                    setMessageError('');
                    setIsSuccessful(false);
                  }}>
                  <Ionicons name="close" size={22} color="#333" />
                </TouchableOpacity>
              </View>
              <Text style={[styles.instructions2, styles.marginB]}>{messageError}</Text>
              <View style={styles.actions2}>
                <TouchableOpacity
                      style={[styles.sendBtn2, !isSuccessful && styles.redHeader]}
                      onPress={() => {
                        setAlertModal(false);
                        setMessageError('');
                        setIsSuccessful(false);
                      }}
                    >
                      <Text style={styles.sendText2}>OK</Text>
                    </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

    </View>
    );
  }

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  titleBox: {
      backgroundColor: '#b7e3cc',
      paddingVertical: verticalScale(5),
      paddingHorizontal: scale(50),
      borderRadius: moderateScale(25),
      marginTop: verticalScale(10),
      marginBottom: verticalScale(30),
  },
  title: {
      fontSize: moderateScale(15),
      letterSpacing: moderateScale(2),
      fontFamily: 'Poppins-ExtraBold',
      color: 'black',
  },
  Image: { width: '100%', height: '100%', borderRadius: moderateScale(9999), borderColor: '#b7e3cc', borderWidth: moderateScale(5) },
  imageHolder: {width: '50%', height: '28.5%', borderRadius: moderateScale(9999), position: 'relative', marginBottom: verticalScale(25)},
  imageIcon: {backgroundColor: '#b7e3cc', color: 'white', width: moderateScale(45), height: verticalScale(40), padding: moderateScale(7.5), borderRadius: moderateScale(9999), position: 'absolute', bottom: verticalScale(-20), left: '40%'},
  name: {fontFamily: 'Poppins-ExtraBold', fontSize: moderateScale(25), textAlign: 'center', marginBottom: verticalScale(5), color: '#317873'},
  inputFields: {width: '80%', flex: 1},
  fieldContainer: {marginBottom: verticalScale(15), position: 'relative'},
  fieldLabel: {
    color: '#317873',
    fontFamily: 'Poppins-SemiBold',
    fontSize: moderateScale(12),
    marginBottom: verticalScale(3),
    position: 'absolute',
    top: verticalScale(-12),
    left: scale(15),
    zIndex: 20,
    borderRadius: moderateScale(20),
    borderColor: '#b7e3cc',
    borderWidth: moderateScale(2),
    paddingHorizontal: scale(10),
    backgroundColor: 'white',
  },
  inputContainer: {
    borderRadius: moderateScale(10),
    borderColor: '#b7e3cc',
    borderWidth: moderateScale(2),
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: scale(10),
    backgroundColor: 'white',
    position: 'relative',
  },
  input: {flex: 1, paddingVertical: verticalScale(8), paddingHorizontal: scale(15), fontFamily: 'Poppins-Regular',color: '#333'},
  editIcon: {color: '#5a9c7a', position: 'absolute', top: verticalScale(2), right: scale(5)},
  logout: {flexDirection: 'row', width: '45%', backgroundColor: '#d9534f', paddingVertical: verticalScale(5), paddingHorizontal: scale(20), borderRadius: moderateScale(20), marginHorizontal: 'auto'},
  logoutIcon: {color: 'white', marginLeft: scale(-3), marginRight: scale(3)},
  logoutText: {color: 'white', textAlignVertical: 'center', fontFamily: 'Poppins-Medium', fontSize: moderateScale(15)},
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)'},
  LogoutModal: {
    width: '85%',
    borderRadius: moderateScale(15),
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: scale(0), height: verticalScale(3) },
    elevation: 5,
    backgroundColor: 'white',
  },
  LogoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#d9534f',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(10),
    borderTopLeftRadius: moderateScale(15),
    borderTopRightRadius: moderateScale(15),
  },
  LogoutTitleStyled: {
    fontSize: moderateScale(18),
    color: '#333',
    fontFamily: 'Poppins-Bold',
  },
  padding: {width: '100%', margin: 'auto', paddingHorizontal: '25%', paddingVertical: verticalScale(20)},
  LogoutConfirmation: {fontFamily: 'Lora-SemiBold', textAlign: 'center', color: 'black'},
  LogoutActions: {
    flexDirection: 'row',
    gap: moderateScale(10),
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginRight: scale(10),
    marginBottom: verticalScale(10),
  },
  backText: {
    color: 'gray',
    fontFamily: 'Poppins-ExtraBold',
  },
  sendBtn: {
    backgroundColor: '#d9534f',
    paddingHorizontal: scale(20),
    borderRadius: moderateScale(30),
  },
  LogoutButtonText: {
    color: 'white',
    fontFamily: 'Poppins-ExtraBold',
    shadowRadius: moderateScale(3),
    shadowOffset: {width: scale(1), height: verticalScale(1)},
    shadowColor: 'gray',
    fontSize: moderateScale(15),
  },
  BGGreen: {backgroundColor: '#b7e3cc'},
  blackText: {color: 'black'},
  paddingField: {paddingHorizontal: scale(20)},
  incorrect: {color: 'red'},
  visibilityIcon: {
    position: 'absolute',
    right: scale(10),
    top: '30%',
  },
  hint: {color: '#ed5450', textAlign: 'left', paddingHorizontal: scale(20), fontFamily: 'Lora-Regular', marginBottom: verticalScale(10), marginTop: verticalScale(-10)},
  wrongInput: {borderColor: 'red'},
  codeInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: verticalScale(20),
    paddingHorizontal: scale(40),
  },
  codeInput: {
    width: scale(50),
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
  overlay2: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(49, 120, 115, 0.8)',
  },
  forgotModal2: {
    width: '85%',
    borderRadius: moderateScale(15),
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: scale(0), height: verticalScale(3) },
    elevation: 5,
    backgroundColor: 'white',
  },
  modalHeader2: {
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
  modalTitleStyled2: {
    fontSize: moderateScale(18),
    color: '#333',
    fontFamily: 'Poppins-Bold',
  },
  instructions2: {
    fontFamily: 'Lora-Bold',
    color: '#4a4a4a',
    paddingHorizontal: scale(40),
    textAlign: 'center',
  },
  actions2: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(10),
    justifyContent: 'flex-end',
  },
  sendBtn2: {
    backgroundColor: '#b7e3cc',
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(20),
    borderRadius: moderateScale(10),
  },
  sendText2: {
    color: 'white',
    fontFamily: 'Poppins-ExtraBold',
    shadowRadius: moderateScale(3),
    shadowOffset: {width: scale(1), height: verticalScale(1)},
    shadowColor: 'gray',
    fontSize: moderateScale(15),
  },
});
