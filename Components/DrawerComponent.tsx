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
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { BottomTabParamList, RootStackParamList } from '../types';
import Ionicons from 'react-native-vector-icons/Ionicons';

type DrawerProps = {
    Initial: string;
};

export default function DrawerComponent({ Initial }: DrawerProps) {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const BottomNavigation = useNavigation<NavigationProp<BottomTabParamList>>();
    const [isOpen, setIsOpen] = useState(false);
    const [expanded, setExpanded] = useState<'resource' | 'wellness' | null>(null);

    const translateX = useRef(new Animated.Value(-225)).current;

    const toggleSidebar = () => {
        setIsOpen((prevState) => {
            Animated.timing(translateX, {
                toValue: prevState ? -225 : 0,
                duration: 300,
                easing: Easing.ease,
                useNativeDriver: true,
            }).start();
            return !prevState;
        });
    };

    const closeSidebar = () => {
        if (isOpen) {
            Animated.timing(translateX, {
                toValue: -225,
                duration: 300,
                easing: Easing.ease,
                useNativeDriver: true,
            }).start();
            setIsOpen(false);
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
            <Text style={[styles.menuText, (isDisabled || subItem) && styles.disabledText]}>{title}</Text>
        </TouchableOpacity>
    );

    // eslint-disable-next-line react/no-unstable-nested-components
    const SubItem = ({ title, onPress, isDisabled }: { title: string; onPress: () => void; isDisabled: boolean }) => (
        <TouchableOpacity onPress={!isDisabled ? onPress : undefined} style={styles.subItem}>
            <Text style={[styles.subText, isDisabled && styles.disabledText]}>{title}</Text>
        </TouchableOpacity>
    );

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
                          onPress={() => BottomNavigation.navigate('Home')}
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
                              onPress={() => navigation.navigate('Resources', { screen: 'ArticlesList' })}
                              isDisabled={Initial === 'Articles'}
                            />
                            <SubItem
                              title="Videos"
                              onPress={() => navigation.navigate('Resources', { screen: 'VideosList' })}
                              isDisabled={Initial === 'Videos'}
                            />
                            <SubItem
                              title="Crisis Helpline"
                              onPress={() => navigation.navigate('Resources', { screen: 'EmergencyList' })}
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
                              onPress={() => navigation.navigate('Wellness', { screen: 'Meditation' })}
                              isDisabled={Initial === 'Meditation Guides'}
                            />
                            <SubItem
                              title="Breathing Exercises"
                              onPress={() => navigation.navigate('Wellness', { screen: 'Breathing' })}
                              isDisabled={Initial === 'Breathing Exercises'}
                            />
                          </>
                        )}

                        <MenuItem title="Chatbot" onPress={() => BottomNavigation.navigate('Chatbot')} isDisabled={Initial === 'Chatbot'} subItem={false}/>
                        <MenuItem title="Mood tracker" onPress={() => BottomNavigation.navigate('Mood')} isDisabled={Initial === 'Mood tracker'} subItem={false}/>
                        <MenuItem title="Profile" onPress={() => navigation.navigate('Settings')} isDisabled={Initial === 'Profile'} subItem={false}/>
                    </ScrollView>
                </View>
            </Animated.View>
        </>
    );
}

const styles = StyleSheet.create({
    relative: { position: 'relative' },
    backButton: { position: 'absolute', top: 5, right: 20, zIndex: 10 },
    Button: {
        position: 'absolute',
        zIndex: 20,
        top: 15,
        left: 15,
    },
    Icon: {
        fontSize: 20,
        fontFamily: 'Poppins-ExtraBold',
        color: 'black',
    },
    Sidebar: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 225,
        height: '100%',
        backgroundColor: '#317873',
        zIndex: 100,
    },
    SidebarContent: {
        marginTop: 50,
        paddingLeft: 20,
        paddingRight: 10,
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
        fontSize: 35,
        textAlign: 'left',
        marginBottom: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        position: 'relative',
    },
    menuText: {
        fontSize: 16,
        color: 'white',
        fontFamily: 'Poppins-Medium',
    },
    subItem: {
        paddingLeft: 18,
        marginBottom: 10,
    },
    subText: {
        fontSize: 14,
        color: 'white',
        fontFamily: 'Poppins-Regular',
        marginLeft: 25,
    },
    // Disabled styling for the MenuItem
    disabledItem: {
        opacity: 0.5, // Dim the disabled item
    },
    disabledText: {
        color: '#b7e3cc', // Set text color for disabled items
    },
    Image: {height: 150, width: 150, marginHorizontal: 'auto', marginTop: 50},
});
