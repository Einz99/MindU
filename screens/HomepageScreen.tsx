// HomepageScreen.tsx
import React, { useEffect, useState } from 'react';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import HomepageTop from '../Components/HomepageTop';
import axios from 'axios';
import AnnouncementList from '../Components/AnnouncementList';
import { API, RootAPI } from '../apiConfigs';
import { io } from 'socket.io-client';

interface Announcement {
  ID: number;
  title: string;
  category: string;
  announcementContent: string;
  created_at: string;
}

export default function HomepageScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await axios.get(`${API}/announcements`);
        setAnnouncements(response.data);
      } catch (error) {
        console.error('Error fetching announcements:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();

    const socket = io(RootAPI, {
      transports: ['websocket'], // Ensures WebSocket is used directly
      reconnectionAttempts: 5, // Tries to reconnect 5 times before giving up
    });

    socket.on('connect', () => {
      console.log('✅ WebSocket connected:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.error('❌ WebSocket Connection Error:', err);
    });

    socket.on('updateAnnouncements', (updatedAnnouncements: Announcement[]) => {
      console.log('📡 Announcements Updated:', updatedAnnouncements);
      setAnnouncements(updatedAnnouncements);
    });

    socket.on('deleteAnnouncement', ({ id }) => {
      setAnnouncements((prev) => prev.filter((a) => a.ID !== id));
    });

    socket.on('deleteAnnouncements', ({ ids }) => {
      setAnnouncements((prev) => prev.filter((a) => !ids.includes(a.ID)));
    });

    return () => {
      console.log('🛑 Cleaning up WebSocket...');
      socket.disconnect(); // Properly disconnects
      socket.off('updateAnnouncements');
      socket.off('deleteAnnouncement');
      socket.off('deleteAnnouncements');
    };
  }, []);

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'important':
        return 'red';
      case 'update':
        return 'yellow';
      case 'general':
        return 'black';
      case 'advisory':
        return 'orange';
      default:
        return 'black';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) {return 'Invalid Date';} // Prevent crash if dateString is missing
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
  };

  return (
    <View style={styles.container}>
      <HomepageTop navigation={navigation} />
      <View style={styles.moodHistory}>
        <Text>Di ko pa alam pano iimplement to baka later hehehe</Text>
      </View>
      <ScrollView style={styles.announcement}>
        <View style={styles.announcementTitleCont}>
          <Text style={styles.announcementTitle}>Announcements</Text>
        </View>
        <AnnouncementList
          announcements={announcements}
          loading={loading}
          getCategoryColor={getCategoryColor}
          formatDate={formatDate}
        />
      </ScrollView>
      <View>
        <Text>Calendar</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  moodHistory: {
    width: '95%',
    height: '15%',
    borderRadius: 15,
    backgroundColor: '#b7e3cc',
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: '5%',
    marginBottom: '5%',
  },
  announcement: {
    width: '95%',
    minHeight: '20%',
    maxHeight: '50%',
    backgroundColor: 'white',
    marginLeft: 'auto',
    marginRight: 'auto',
    borderRadius: 15,
    padding: 10,
  },
  announcementTitle: {
    fontSize: 35,
    fontWeight: '900',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  announcementTitleCont: {
    alignItems: 'center',
    marginBottom: 10,
  },
});
