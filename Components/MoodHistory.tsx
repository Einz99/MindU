import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { BottomTabParamList } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../APIClient';
import { API } from '../apiConfigs';
import axios from 'axios';

type MoodDataItem = {
  dayName: string;
  mood: string | null;
  emoji: string | null;
};

export default function MoodHistory() {
  const navigation = useNavigation<NavigationProp<BottomTabParamList>>();
  const [moodData, setMoodData] = useState<MoodDataItem[]>([]);
  const [studentID, setStudentID] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  const moods = useMemo(() => [
        { emoji: '😁', label: 'Happy'},
        { emoji: '🤩', label: 'Motivated'},
        { emoji: '😌', label: 'Calm'},
        { emoji: '😰', label: 'Anxious'},
        { emoji: '😢', label: 'Sad'},
        { emoji: '😴', label: 'Tired'},
        { emoji: '😡', label: 'Angry'},
      ], []);

  useEffect(() => {
    const fetchUserID = async () => {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
          const response = await apiClient.get(`${API}/user`, {
              headers: { Authorization: `Bearer ${token}` },
          });
          if (response.data && response.data.user) {
              setStudentID(response.data.user.id);
          } else {
              console.error('Failed to fetch user details.');
          }
      }
    };
    fetchUserID();
  }, []);

  const getEmoji = useCallback((label: string) => {
    const mood = moods.find((m) => m.label === label);
    return mood ? mood.emoji : '';
  }, [moods]);

  useEffect(() => {
    const fetchMoodData = async () => {
      const response = await axios.get(`${API}/moods/${studentID}`);
      if (!response) {return;}
      const moodDatas = response.data.map((item: any) => ({
        ...item,
        parsedDate: new Date(item.emotion_dated).toDateString(), // Normalize date
      }));
      // Get last 7 days (today included)
      const last7Days = Array.from({ length: 7 }).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date;
      });
      // Build mood map
      const moodMap: MoodDataItem[] = last7Days.map((date) => {
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dateKey = date.toDateString();
        const matched = moodDatas.find((item: any) => item.parsedDate === dateKey);
        return {
          dayName,
          mood: matched ? matched.emotion : null,
          emoji: matched ? getEmoji(matched.emotion) : null,
        };
      });
      setMoodData(moodMap.reverse()); // optional: make Monday–Sunday
    };
    if (studentID) {
      fetchMoodData();
    }
  }, [studentID, getEmoji, reloadKey]);

  useEffect(() => {
    const Interval = setInterval(() => {
      setReloadKey(prev => prev + 1);
    }, 15000);

    return () => clearInterval(Interval);
  });

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.heading}>MOOD HISTORY</Text>
        <Text style={styles.viewBtn} onPress={() => navigation.navigate('Mood')}>View</Text>
      </View>

      <View style={styles.moodRow}>
        {moodData.map((item, index) => (
          <View key={index} style={styles.moodItem}>
            {/* eslint-disable-next-line react-native/no-inline-styles */}
            <Text style={[styles.emoji, !item.emoji && {paddingTop: 9}]}>
              {!item.emoji ?
              <View style={styles.emptyEmoji}><></></View>
              : item.emoji}
            </Text>
            <Text style={styles.day}>{item.dayName}</Text>
            <Text style={styles.label}>
              {!item.mood ? 'Missed' : item.mood}
              </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

  const styles = StyleSheet.create({
    wrapper: {
      backgroundColor: '#C6F1DE',
      borderRadius: 12,
      padding: 12,
      margin: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    heading: {
      fontFamily: 'Poppins-ExtraBold',
      fontSize: 16,
      color: 'black',
    },
    viewBtn: {
      backgroundColor: '#fff',
      color: '#444',
      paddingHorizontal: 12,
      paddingVertical: 2,
      borderRadius: 10,
      fontSize: 12,
      fontWeight: '600',
      textAlignVertical: 'center',
      fontFamily: 'Poppins-Light',
    },
    moodRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    moodItem: {
      alignItems: 'center',
      flex: 1,
    },
    emoji: {
      fontSize: 30,
      width: 40,
      height: 40,
      textAlign: 'center',
      borderRadius: 22,
      overflow: 'hidden',
      marginBottom: 4,
    },
    day: {
      color: 'black',
      fontSize: 12,
      fontFamily: 'Lora-Regular',
    },
    label: {
      fontSize: 8,
      color: '#444',
      fontFamily: 'Lora-Bold',
    },
    emptyEmoji: {borderWidth: 2, borderColor: '#4b946a', width: 30, height: 30, borderRadius: 9999, borderStyle: 'dotted'},
  });
