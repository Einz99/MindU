import React from 'react';
import {View, StyleSheet, Text, TouchableOpacity, Image} from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { WellnessStackParamList } from '../../types';
import DrawerComponent from '../../Components/DrawerComponent';


export default function Wellness() {
    const navigation = useNavigation<NavigationProp<WellnessStackParamList>>();
    return (
        <View style={styles.container}>
            <DrawerComponent Initial={'Wellness Tools'} />
            <View style={styles.titleBox}>
                <Text style={styles.title}>
                    Wellness Tools
                </Text>
            </View>
            <View style={styles.container2}>
                <TouchableOpacity style={styles.Box} onPress={() => {navigation.navigate('Meditation');}}>
                    <Image source={require('../../assets/images/MGTitle.png')} resizeMode="contain" style={styles.image} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.Box} onPress={() => {navigation.navigate('Breathing');}}>
                    <Image source={require('../../assets/images/BETitle.png')} resizeMode="contain" style={styles.image} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
    },
    container2: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
    },
    titleBox: {
        backgroundColor: '#b7e3cc',
        paddingVertical: verticalScale(5),
        paddingHorizontal: scale(50),
        borderRadius: moderateScale(25),
        marginTop: verticalScale(10),
        marginBottom: verticalScale(80),
    },
    title: {
        fontSize: moderateScale(15),
        letterSpacing: moderateScale(2),
        fontFamily: 'Poppins-ExtraBold',
        color: 'black',
    },
    Box: {
        width: '80%',
        height: '40%',
        marginBottom: verticalScale(25),
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: moderateScale(15),
    },
});
