import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Alert, TextInput, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { API, RootAPI } from '../apiConfigs';
import * as ImagePicker from 'react-native-image-picker';
import RNPickerSelect from 'react-native-picker-select';
import apiClient from '../APIClient';
import { io } from 'socket.io-client';

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [isModalVisible, setModalVisible] = useState(false);
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
  const [age, setAge] = useState(0);
  const [gender, setGender] = useState<string | null>(null);
  const [profilePic, setProfilePic] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
            if (!token) {
              Alert.alert('Error', 'User token not found. Please log in again.');
              navigation.navigate('Login');
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
          setAge(response.data.user.age);
          setGender(response.data.user.gender);
          setProfilePic(response.data.user.profilePic);
        } else {
          Alert.alert('Error', 'Failed to fetch user details.');
        }
      }
      catch (error: any) {
        console.error('Error fetching user:', error);

        // Handle session expiration
        if (error.logout) {
          (async () => {
            Alert.alert('Session Expired', 'Please log in again.');
            await AsyncStorage.clear();
            navigation.navigate('Login');
          })();
        } else {
          Alert.alert('Error', error.response?.data?.message || 'An error occurred.');
        }
      }
    };
    fetchUserData();

  } , [navigation]);

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

  const socket = io(RootAPI, { transports: ['websocket'], reconnectionAttempts: 5 });

  const handleSaveProfile = async () => {
    const token = await AsyncStorage.getItem('userToken');

    const formData = new FormData();
    formData.append('age', tempProfile.age.toString());
    formData.append('gender', tempProfile.gender);

    if (profilePic) {
      const fileName = profilePic.split('/').pop();
      const fileType = fileName ? fileName.split('.').pop() : '';

      formData.append('profilePic', {
        uri: profilePic,
        name: fileName,
        type: `image/${fileType}`,
      });
    }

    try {
      const response = await fetch(`${API}/update-profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setProfilePic(data.profilePicPath);
        setModalVisible(false);

        // Emit event via WebSocket when the profile is updated
        socket.emit('profileUpdated', { profilePic: data.profilePicPath, name: Name });

      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
    setModalVisible(false);
  };

  const pickImage = () => {
    ImagePicker.launchImageLibrary({ mediaType: 'photo' }, (response) => {
      if (response.assets && response.assets.length > 0) {
        if (response.assets[0].uri) {
          setProfilePic(response.assets[0].uri); // Save image URI
        }
      }
    });
  };

  const openProfileModal = () => {
    setTempProfile({
      name: Name,
      section,
      adviser,
      age,
      gender: gender ?? '',
      profilePic: profilePic ?? '',
    });
    setModalVisible(true);
  };

  const handleCancel = () => {
    setName(tempProfile.name);
    setSection(tempProfile.section);
    setAdviser(tempProfile.adviser);
    setAge(tempProfile.age);
    setGender(tempProfile.gender);
    setProfilePic(tempProfile.profilePic);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <TouchableOpacity style={styles.button} onPress={() => openProfileModal()}>
        <Text style={styles.buttonText}>profile</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>

      {/* Profile Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.profileModal}>
          <Text style={styles.title}>Profile Settings</Text>
          <TouchableOpacity style={styles.changeImage} onPress={pickImage}>
            <Image
              source={profilePic ? { uri: profilePic } : require('../assets/images/default-profile.png')}
              style={styles.image}
            />
            <Text style={styles.buttonText}>Change Profile</Text>
          </TouchableOpacity>
          <View style={styles.fields}>
            <Text>Name:      </Text>
            <Text style={styles.input}>{Name}</Text>
          </View>
          <View style={styles.fields}>
            <Text>Section:   </Text>
            <Text style={styles.input}>{section}</Text>
          </View>
          <View style={styles.fields}>
            <Text>Adviser:   </Text>
            <Text style={styles.input}>{adviser}</Text>
          </View>
          <View style={styles.fields}>
            <Text>Gender:    </Text>
            <View style={styles.picker}>
            <RNPickerSelect
              placeholder={{ label: 'Select Gender', value: null }}
              onValueChange={(value) => setGender(value)}
              items={[
                { label: 'Male', value: 'M' },
                { label: 'Female', value: 'F' },
                { label: 'Other', value: 'O' },
              ]}
              value={gender}
              style={{
                inputIOS: { color: 'black' },
                inputAndroid: { color: 'black' },
              }}
            />
            </View>
          </View>
          <View style={styles.fields}>
            <Text>Age:          </Text>
            <TextInput
              style={styles.input}
              placeholder="Age"
              keyboardType="number-pad"
              value={age ? age.toString() : ''}
              onChangeText={(text) => {
                const numericValue = parseInt(text, 10);
                if (!isNaN(numericValue)) {
                  setAge(numericValue);
                } else {
                  setAge(0);
                }
              }}
            />
          </View>
          <View style={styles.modalButtons}>
            <TouchableOpacity onPress={() => handleCancel()}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleSaveProfile()}>
              <Text style={styles.save}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
    );
  }

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  title: { fontSize: 24, marginBottom: 20, marginTop: 40, textAlign: 'center' },
  button: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    minWidth: '100%',
    borderBottomWidth: 1,
    borderBottomColor: 'gray',
    alignItems: 'center',  // Centers items horizontally
    justifyContent: 'center', // Centers items vertically
    flexDirection: 'column', // Stacks image and text vertically
  },
  fields: {
    flexDirection: 'row', alignItems: 'center',
  },
  changeImage: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    minWidth: '100%',
    alignItems: 'center',  // Centers items horizontally
    justifyContent: 'center', // Centers items vertically
    flexDirection: 'column', // Stacks image and text vertically
  },
  buttonText: { color: '#000', fontSize: 16, textAlign: 'center' },
  profileModal: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 30,
    width: '100%',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: '10%',
  },
  cancel: {
    color: 'red',
    fontSize: 16,
  },
  save: {
    color: 'blue',
    fontSize: 16,
  },
  input: {
    fontSize: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
    color: 'black',
    width: '80%',
  },
  image: {
    width: 200,
    height: 200,
    marginTop: 20,
    borderRadius: 9999,
  },
  picker: {
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
    color: 'black',
    width: '80%',
  },
});
