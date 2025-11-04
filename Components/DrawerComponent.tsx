import React, { useState, useRef, useEffect } from 'react';
import {
    TouchableOpacity,
    StyleSheet,
    Text,
    View,
    Animated,
    Easing,
    TouchableWithoutFeedback,
    ScrollView,
    Image,
    Modal,
} from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDrawer } from './DrawerContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

type DrawerProps = {
    Initial: string;
};

export default function DrawerComponent({ Initial }: DrawerProps) {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const [isOpen, setIsOpen] = useState(false);
    const [expanded, setExpanded] = useState<'resource' | 'wellness' | null>(null);
    const { setIsDrawerOpen } = useDrawer();
    const [logoutModal, setLogoutModal] = useState(false);

    const translateX = useRef(new Animated.Value(scale(-225))).current;

    const toggleSidebar = () => {
        setIsOpen((prevState) => {
            const newState = !prevState;
            Animated.timing(translateX, {
                toValue: newState ? 0 : scale(-225),
                duration: 300,
                easing: Easing.ease,
                useNativeDriver: true,
            }).start();

            setIsDrawerOpen(newState); // ✅ Update context

            return newState;
        });
    };

    const closeSidebar = () => {
        if (isOpen) {
            Animated.timing(translateX, {
                toValue: scale(-225),
                duration: 300,
                easing: Easing.ease,
                useNativeDriver: true,
            }).start();
            setIsOpen(false);
            setIsDrawerOpen(false); // ✅ Update context
        }
    };

    const toggleExpand = (section: 'resource' | 'wellness') => {
        setExpanded((prev) => (prev === section ? null : section));
    };

    useEffect(() => {
        if(Initial === 'Articles' || Initial === 'Videos' || 'Crisis Helpline')
        {toggleExpand('resource');}
        if(Initial === 'Breathing Exercises' || Initial === 'Meditation Guides')
        {toggleExpand('wellness');}
    }, [Initial]);

    // eslint-disable-next-line react/no-unstable-nested-components
    const MenuItem = ({ title, onPress, isDisabled, subItem }: { title: string; onPress: () => void; isDisabled: boolean; subItem: boolean }) => (
        <TouchableOpacity
            onPress={!isDisabled ? onPress : undefined}
            style={[styles.menuItem, isDisabled && styles.disabledItem]}>
            {/* eslint-disable-next-line react-native/no-inline-styles */}
            <Text style={[styles.menuText, title === 'Log Out' && {color: 'red'} ,(isDisabled || subItem) && styles.disabledText]}>{title}</Text>
        </TouchableOpacity>
    );

    // eslint-disable-next-line react/no-unstable-nested-components
    const SubItem = ({ title, onPress, isDisabled }: { title: string; onPress: () => void; isDisabled: boolean }) => (
        <TouchableOpacity onPress={!isDisabled ? onPress : undefined} style={styles.subItem}>
            <Text style={[styles.subText, isDisabled && styles.disabledText]}>{title}</Text>
        </TouchableOpacity>
    );

    const navigateAndClose = (navigationFn: () => void) => {
        closeSidebar();
        // Add small delay to let animation finish
        setTimeout(() => {
            navigationFn();
        }, 100);
    };

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

    return (
        <>
            <TouchableOpacity style={styles.Button} onPress={toggleSidebar}>
                <Text style={styles.Icon}>☰</Text>
            </TouchableOpacity>

            {isOpen && (
                <TouchableWithoutFeedback onPress={closeSidebar}>
                    <View style={styles.Overlay} />
                </TouchableWithoutFeedback>
            )}

            <Animated.View style={[styles.Sidebar, { transform: [{ translateX }] }]}>
                <View style={styles.relative}>
                    <TouchableOpacity style={styles.backButton} onPress={closeSidebar}>
                        <Ionicons name="return-up-back-outline" size={30} color="white" />
                    </TouchableOpacity>
                </View>
                <Image
                    source={require('../assets/images/MindUIcon.png')}
                    style={styles.Image}
                />
                <View style={styles.SidebarContent}>
                    <Text style={styles.SidebarTitle}>MIND-U</Text>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <MenuItem
                          title="Home"
                          isDisabled={Initial === 'Home'}
                          onPress={() => navigateAndClose(() => navigation.navigate('Homepage', { screen: 'Home' }))}
                          subItem={false}
                        />

                        <MenuItem
                          title="Resource Library"
                          onPress={() => toggleExpand('resource')}
                          isDisabled={false}
                          subItem={Initial === 'Articles' || Initial === 'Videos' || Initial === 'Crisis Helpline' || Initial === 'Resource Library'}
                        />
                        {expanded === 'resource' && (
                          <>
                            <SubItem
                                title="Articles"
                                onPress={() => navigateAndClose(() =>
                                  navigation.navigate('Homepage', {
                                    screen: 'Resources',
                                    params: { screen: 'ArticlesList' },
                                  })
                                )}
                                isDisabled={Initial === 'Articles'}
                            />
                            <SubItem
                                title="Videos"
                                onPress={() => navigateAndClose(() =>
                                  navigation.navigate('Homepage', {
                                    screen: 'Resources',
                                    params: { screen: 'VideosList' },
                                  })
                                )}
                                isDisabled={Initial === 'Videos'}
                            />
                            <SubItem
                                title="Crisis Helpline"
                                onPress={() => navigateAndClose(() =>
                                  navigation.navigate('Homepage', {
                                    screen: 'Resources',
                                    params: { screen: 'EmergencyList' },
                                  })
                                )}
                                isDisabled={Initial === 'Crisis Helpline'}
                            />
                          </>
                        )}

                        <MenuItem
                          title="Wellness Tools"
                          onPress={() => toggleExpand('wellness')}
                          isDisabled={Initial === 'Wellness Tools'}
                          subItem={Initial === 'Breathing Exercises' || Initial === 'Meditation Guides' || Initial === 'Wellness Tools'}
                        />
                        {expanded === 'wellness' && (
                          <>
                            <SubItem
                                title="Meditation Guides"
                                onPress={() => navigateAndClose(() =>
                                  navigation.navigate('Homepage', {
                                    screen: 'Wellness',
                                    params: { screen: 'Meditation' },
                                  })
                                )}
                                isDisabled={Initial === 'Meditation Guides'}
                            />
                            <SubItem
                                title="Breathing Exercises"
                                onPress={() => navigateAndClose(() =>
                                  navigation.navigate('Homepage', {
                                    screen: 'Wellness',
                                    params: { screen: 'Breathing' },
                                  })
                                )}
                                isDisabled={Initial === 'Breathing Exercises'}
                            />
                          </>
                        )}

                        <MenuItem
                            title="Chatbot"
                            onPress={() => navigateAndClose(() => navigation.navigate('Homepage', { screen: 'Chatbot' }))}
                            isDisabled={Initial === 'Chatbot'}
                            subItem={false}
                        />
                        <MenuItem
                            title="Mood tracker"
                            onPress={() => navigateAndClose(() => navigation.navigate('Homepage', { screen: 'Mood' }))}
                            isDisabled={Initial === 'Mood tracker'}
                            subItem={false}
                        />
                        <MenuItem
                            title="Profile"
                            onPress={() => navigateAndClose(() => navigation.navigate('Settings'))}
                            isDisabled={Initial === 'Profile'}
                            subItem={false}
                        />
                        <MenuItem
                            title="Log Out"
                            onPress={() => setLogoutModal(true)}
                            isDisabled={false}
                            subItem={false}
                        />
                    </ScrollView>

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
                              onPress={() => navigateAndClose(() => handleLogout())}
                            >
                              <Text style={styles.LogoutButtonText}>Log out</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </Modal>
                </View>
            </Animated.View>
        </>
    );
}

const styles = StyleSheet.create({
    relative: { position: 'relative' },
    backButton: { position: 'absolute', top: verticalScale(5), right: scale(20), zIndex: 10 },
    Button: {
        position: 'absolute',
        zIndex: 20,
        top: verticalScale(15),
        left: scale(15),
    },
    Icon: {
        fontSize: moderateScale(20),
        fontFamily: 'Poppins-ExtraBold',
        color: 'black',
    },
    Sidebar: {
        position: 'absolute',
        top: verticalScale(0),
        left: scale(0),
        width: scale(225),
        height: '100%',
        backgroundColor: '#317873',
        zIndex: 100,
    },
    SidebarContent: {
        marginTop: verticalScale(50),
        paddingLeft: scale(20),
        paddingRight: scale(10),
        flex: 1,
    },
    Overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        zIndex: 50,
    },
    SidebarTitle: {
        fontFamily: 'Poppins-Bold',
        color: 'white',
        fontSize: moderateScale(35),
        textAlign: 'center',
        marginBottom: verticalScale(20),
        marginTop: -75,
        marginLeft: -10,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: verticalScale(16),
        position: 'relative',
    },
    menuText: {
        fontSize: moderateScale(16),
        color: 'white',
        fontFamily: 'Poppins-Medium',
    },
    subItem: {
        paddingLeft: scale(18),
        marginBottom: verticalScale(10),
    },
    subText: {
        fontSize: moderateScale(14),
        color: 'white',
        fontFamily: 'Poppins-Regular',
        marginLeft: scale(25),
    },
    // Disabled styling for the MenuItem
    disabledItem: {
        opacity: 0.5, // Dim the disabled item
    },
    disabledText: {
        color: '#b7e3cc', // Set text color for disabled items
    },
    Image: {height: 150, width: 150, marginHorizontal: 'auto', marginTop: verticalScale(50)},
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
});
