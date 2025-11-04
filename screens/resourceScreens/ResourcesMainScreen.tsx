import React, { useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Image,
 } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { ResourcesStackParamList } from '../../types';
import DrawerComponent from '../../Components/DrawerComponent';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

export default function ResourcesMainScreen() {
    const navigation = useNavigation<NavigationProp<ResourcesStackParamList>>();

    const handlePressArticles = useCallback(() => {
        navigation.navigate('ArticlesList');
      }, [navigation]);

      const handlePressVideos = useCallback(() => {
        navigation.navigate('VideosList');
      }, [navigation]);

      const handlePressEmergency = useCallback(() => {
        navigation.navigate('EmergencyList');
      }, [navigation]);

    return (
        <View style={styles.container}>
            <DrawerComponent Initial={'Resource Library'} />
            <View style={styles.titleBox}>
                <Text style={styles.title}>
                    Resource Library
                </Text>
            </View>
            <TouchableOpacity style={styles.articleBox} onPress={handlePressArticles}>
                <Image source={require('../../assets/images/Article.png')} style={[styles.Image, styles.imageLeft]}/>
                <Text style={styles.rightAlignTitle}>Articles</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.videoBox} onPress={handlePressVideos}>
                <Image source={require('../../assets/images/Video.png')} style={[styles.Image, styles.imageRight]}/>
                <Text style={styles.leftAlignTitle}>Videos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.crisisBox} onPress={handlePressEmergency}>
                <Image source={require('../../assets/images/Hotline.png')} style={[styles.Image, styles.imageLeft]}/>
                <Text style={styles.rightAlignTitle}>Crisis{'\n'}Helpline</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        fontFamily: 'Poppins-Bold',
        color: 'black',
    },
    articleBox: {
        borderWidth: moderateScale(4), // Border thickness
        borderColor: '#fff59d', // Border color
        borderRadius: moderateScale(25), // Optional: Rounded corners
        backgroundColor: '#fff', // Keep background transparent if needed
        width: '75%',
        height: '15%',
        justifyContent: 'center',
        marginBottom: verticalScale(60),
        position: 'relative',
        marginLeft: scale(40),
    },
    videoBox: {
        borderWidth: moderateScale(4), // Border thickness
        borderColor: '#d6c9f3', // Border color
        borderRadius: moderateScale(25), // Optional: Rounded corners
        backgroundColor: '#fff', // Keep background transparent if needed
        width: '75%',
        height: '15%',
        justifyContent: 'center',
        marginBottom: verticalScale(60),
        marginRight: scale(40),
        position: 'relative',
    },
    crisisBox: {
        borderWidth: moderateScale(4), // Border thickness
        borderColor: '#d9534f', // Border color
        borderRadius: moderateScale(25), // Optional: Rounded corners
        backgroundColor: '#fff', // Keep background transparent if needed
        width: '75%',
        height: '15%',
        justifyContent: 'center',
        position: 'relative',
        marginLeft: scale(40),
    },
    rightAlignTitle: {
        textAlign: 'right',
        paddingRight: scale(20),
        fontSize: moderateScale(25),
        fontFamily: 'Lora-Bold',
        color: 'black',
    },
    leftAlignTitle: {
        textAlign: 'left',
        paddingLeft: scale(20),
        fontSize: moderateScale(25),
        fontFamily: 'Lora-Bold',
        color: 'black',
    },
    Image: {
        width: '100%',
        height: '200%',
        position: 'absolute',
    },
    imageLeft: {
        top: -70,
        left: '-30%',
    },
    imageRight: {
        top: -70,
        right: '-40%',
    },
  });
