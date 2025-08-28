import React, { useState, useRef } from 'react';
import {
    TouchableOpacity,
    StyleSheet,
    Text,
    View,
    Animated,
    Easing,
    TouchableWithoutFeedback,
    ScrollView,
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

    // eslint-disable-next-line react/no-unstable-nested-components
    const MenuItem = ({ title, onPress }: { title: string; onPress: () => void }) => (
        <TouchableOpacity onPress={onPress} style={styles.menuItem}>
            <View style={styles.dot} />
            {(
              (expanded === null && Initial === title) ||
              (expanded === 'resource' && title === 'Resource Library') ||
              (expanded === 'wellness' && title === 'Wellness Tools')
            ) && <View style={styles.subDot} />}
            <Text style={styles.menuText}>{title}</Text>
        </TouchableOpacity>
    );

    // eslint-disable-next-line react/no-unstable-nested-components
    const SubItem = ({ title, onPress }: { title: string; onPress: () => void }) => (
        <TouchableOpacity onPress={onPress} style={styles.subItem}>
            <Text style={styles.subText}>{title}</Text>
        </TouchableOpacity>
    );

    const getSidebarHeight = () => {
        if (expanded === 'resource') {return 365;}
        else if (expanded === 'wellness') {return 330;}
        else {return 265;}
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
                <View style={styles.SidebarContent}>
                    <Text style={styles.SidebarTitle}>MIND-U</Text>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={[styles.verticalLine, {height: getSidebarHeight()}]} />
                        <MenuItem
                          title="Home"
                          onPress={() => {
                            navigation.navigate('Homepage', { screen: 'Home' });
                            closeSidebar();
                          }}
                        />

                        <MenuItem title="Resource Library" onPress={() => toggleExpand('resource')} />
                        {expanded === 'resource' && (
                          <>
                            <SubItem title="Articles" onPress={() => navigation.navigate('Resources', { screen: 'ArticlesList' })} />
                            <SubItem title="Videos" onPress={() => navigation.navigate('Resources', { screen: 'VideosList' })} />
                            <SubItem title="Crisis Helpline" onPress={() => navigation.navigate('Resources', { screen: 'EmergencyList' })} />
                          </>
                        )}

                        <MenuItem title="Wellness Tools" onPress={() => toggleExpand('wellness')} />
                        {expanded === 'wellness' && (
                          <>
                            <SubItem title="Meditation Guides" onPress={() => navigation.navigate('Wellness', { screen: 'Meditation' })} />
                            <SubItem title="Breathing Exercises" onPress={() => navigation.navigate('Wellness', { screen: 'Breathing' })} />
                          </>
                        )}

                        <MenuItem title="Chatbot" onPress={() => BottomNavigation.navigate('Chatbot')} />
                        <MenuItem title="Mood tracker" onPress={() => BottomNavigation.navigate('Mood')} />
                        <MenuItem title="Calendar" onPress={() => BottomNavigation.navigate('Calendar')} />
                        <MenuItem title="Profile" onPress={() => BottomNavigation.navigate('Settings')} />
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
        paddingLeft: 30,
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
        textAlign: 'center',
        marginBottom: 20,
    },
    verticalLine: {
        position: 'absolute',
        top: 10,
        bottom: 0,
        left: 3,
        width: 3,
        borderRadius: 9999,
        backgroundColor: '#b7e3cc',
        zIndex: 0, // behind
      },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        position: 'relative',
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#b7e3cc',
        position: 'absolute',
        left: 0, // center dot over the line at left: 18
        zIndex: 2, // make sure dot is above the line
      },
    menuText: {
        fontSize: 16,
        color: 'white',
        fontFamily: 'Poppins-Medium',
        paddingLeft: 10,
        marginLeft: 20,
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
    subDot: {
        width: 8,
        height: 8,
        borderRadius: 5,
        backgroundColor: '#317873',
        position: 'absolute',
        left: 0.8, // center dot over the line at left: 18
        top: 9.5,
        zIndex: 2, // make sure dot is above the line
      },
});
