import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { io } from 'socket.io-client';
import axios from 'axios';
import { API, RootAPI } from '../apiConfigs';

interface Resource {
  ID: number;
  title: string;
  description: string;
  filepath: string;
  created_at: string;
}

export default function HomepageScreen() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch resources initially
    const fetchResources = async () => {
      try {
        const response = await axios.get(`${API}/resources`);
        setResources(response.data);
      } catch (error) {
        console.error('Error fetching resources:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchResources();

    // Establish WebSocket connection
    const socket = io(RootAPI, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('✅ WebSocket connected:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.error('❌ WebSocket Connection Error:', err);
    });

    socket.on('updateResources', (updatedResources: Resource[]) => {
      console.log('📡 Resources Updated:', updatedResources);
      setResources(updatedResources);
    });

    socket.on('deleteResource', ({ id }) => {
      setResources((prev) => prev.filter((r) => r.ID !== id));
    });

    socket.on('deleteResources', ({ ids }) => {
      setResources((prev) => prev.filter((r) => !ids.includes(r.ID)));
    });

    return () => {
      console.log('🛑 Cleaning up WebSocket...');
      socket.disconnect();
      socket.off('updateResources');
      socket.off('deleteResource');
      socket.off('deleteResources');
    };
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.resourcesContainer}>
        <Text style={styles.resourcesTitle}>Resources</Text>
        {!loading ? (
          <Text>Loading resources...</Text>
        ) : (
          resources.map((resource) => (
            <View key={resource.ID} style={styles.resourceItem}>
              <Text style={styles.resourceTitle}>{resource.title}</Text>
              <Text>{resource.description}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: moderateScale(24), marginBottom: verticalScale(20) },
  resourcesContainer: {
    width: '90%',
    backgroundColor: '#f9f9f9',
    padding: moderateScale(10),
    borderRadius: moderateScale(10),
    maxHeight: '50%',
  },
  resourcesTitle: { fontSize: moderateScale(20), fontWeight: 'bold', marginBottom: verticalScale(10) },
  resourceItem: { marginBottom: verticalScale(10), padding: moderateScale(10), backgroundColor: '#fff', borderRadius: moderateScale(5) },
  resourceTitle: { fontWeight: 'bold' },
  button: {
    backgroundColor: 'red',
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(20),
    borderRadius: moderateScale(5),
    marginTop: verticalScale(20),
  },
  buttonText: { color: '#fff', fontSize: moderateScale(16) },
});
