import React from 'react';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';

export default function OnboardingScreen() {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();

    const handleGetStarted = async () => {
        try {
            await AsyncStorage.setItem('hasLaunched', JSON.stringify(true));
            console.log('✅ Onboarding completed. hasLaunched set to true.');

            navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
            });
        } catch (error) {
            console.error('Error storing hasLaunched:', error);
        }
    };

    return (
        <View style={styles.container}>
            <Image source={require('../../assets/images/Onboarding.png')} style={styles.image} />
            <Text style={styles.quote}>
                'Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit...'
            </Text>
            <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
                <Text style={styles.buttonText}>GET STARTED</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8F8F8',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    quote: {
        position: 'absolute',
        top: '75%',
        fontSize: 16,
        textAlign: 'center',
        fontStyle: 'italic',
        color: '#333',
        width: '90%',
    },
    button: {
        position: 'absolute',
        top: '90%',
        backgroundColor: '#2D6A4F',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
