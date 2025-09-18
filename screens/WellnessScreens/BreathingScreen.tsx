import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  ScrollView,
  Animated,
  BackHandler,
} from 'react-native';
import { io } from 'socket.io-client';
import axios from 'axios';
import { API, RootAPI } from '../../apiConfigs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Orientation from 'react-native-orientation-locker';
import Video from 'react-native-video';
import DrawerComponent from '../../Components/DrawerComponent';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

interface Wellness {
  ID: number;
  title: string;
  banner: string;
  category: string;
  description: string;
  resourceType: string;
  isResource: number;
  status: string;
  filepath: string;
  modified_at: string;
  isPlaceholder?: boolean;
}

export default function MeditationScreen() {
  const navigation = useNavigation();
  const [wellnesses, setWellnesses] = useState<Wellness[]>([]);
  const [loading, setLoading] = useState(true);
  const STORAGE_KEY = 'FinishedBreathing';
  const [finishedIndex, setFinishedIndexState] = useState(0);

  const [videoIndex, setVideoIndex] = useState(0);

  const [showWellnessDetail, setShowWellnessDetail] = useState(false);
  const [selectedWellnessId, setSelectedWellnessId] = useState<number | null>(null);
  const [fullScreen, setFullScreen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(1000));

  const { width, height } = useWindowDimensions();

  const getFinishedIndex = async (): Promise<number> => {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    return value ? parseInt(value, 10) : 0;
  };

  const setFinishedIndex = async (index: number) => {
    await AsyncStorage.setItem(STORAGE_KEY, index.toString());
  };

  const clearFinishedMeditation = async () => {
    try {
      await AsyncStorage.removeItem('FinishedBreathing');
      console.log('FinishedMeditation cleared');
    } catch (error) {
      console.error('Error clearing FinishedBreathing:', error);
    }
  };

  useEffect(() => {
    const loadProgress = async () => {
      const idx = await getFinishedIndex();
      setFinishedIndexState(idx);
    };
    loadProgress();
  }, []);

  const onVideoFinish = async (index: number) => {
    if (index + 1 > finishedIndex) {
      await setFinishedIndex(index + 1);
      setFinishedIndexState(index + 1);
    }
  };

  useEffect(() => {
    const fetchWellness = async () => {
      try {
        const response = await axios.get(`${API}/resources/wellness`);
        setWellnesses(response.data);
      } catch (error) {
        console.error('Error fetching resources:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchWellness();

    const socket = io(RootAPI, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('✅ WebSocket connected:', socket.id);
    });

    socket.on('updateResources', (updatedWellness: Wellness[]) => {
      setWellnesses(updatedWellness);
    });

    socket.on('deleteResource', ({ id }) => {
      setWellnesses((prev) => prev.filter((r) => r.ID !== id));
    });

    socket.on('deleteResources', ({ ids }) => {
      setWellnesses((prev) => prev.filter((r) => !ids.includes(r.ID)));
    });

    return () => {
      console.log('🛑 Cleaning up WebSocket...');
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
                // Handle Android back button press
                const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
                  if (showWellnessDetail) {
                    closeArticleDetail();
                    return true; // Prevent default behavior (app exit)
                  }
                  return false; // Let default behavior happen (navigate back)
                });
                return () => {
                  backHandler.remove(); // Clean up back handler on unmount
                };
              });

  const filteredWellness = wellnesses.filter(
    (wellness) => wellness.category === 'Breathing Exercises' && wellness.status === 'Posted'
  );

  const handleWellnessSelect = (id: number, index: number) => {
    setSelectedWellnessId(id);
    setShowWellnessDetail(true);
    setVideoIndex(index);
    // Animate the slide-in
    Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
    }).start();
  };
  const closeArticleDetail = () => {
      // Animate the slide-out
      Animated.timing(slideAnim, {
          toValue: 1000,
          duration: 300,
          useNativeDriver: true,
      }).start(() => {
        setShowWellnessDetail(false);
        setSelectedWellnessId(null);
          setFullScreen(false); // Ensure fullscreen is reset when modal closes
          Orientation.lockToPortrait(); // Ensure app returns to portrait when closing modal
      });
  };

  const handleFullScreen = (isFullScreen: boolean) => {
    setFullScreen(isFullScreen);

    if (isFullScreen) {
        Orientation.lockToLandscape(); // Lock to landscape when entering fullscreen
    } else {
        Orientation.lockToPortrait(); // Lock back to portrait when exiting fullscreen
    }
  };

  const wellness = wellnesses.find((item) => item.ID === selectedWellnessId);

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  return (
    <View style={styles.container}>
      <DrawerComponent Initial={'Breathing Exercises'} />
      <View style={styles.titleBox}>
        <Text style={styles.title}>Wellness Tools</Text>
      </View>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={25} color="#000" />
      </TouchableOpacity>
      <View style={styles.MeditationBox}>
        <Text style={styles.MeditationTitle} onPress={clearFinishedMeditation}>Breathing Exercises</Text>
      </View>

      {loading ? (
        <Text style={styles.loading}>Meditation Guide Loading</Text>
      ) : filteredWellness.length === 0 ? (
        <Text>No Meditation Guides Available</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.grid}>
            {filteredWellness.map((item, index) => {
              const isUnlocked = index <= finishedIndex;

              return (
                <TouchableOpacity
                  key={item.ID}
                  style={styles.item}
                  onPress={() => {
                    if (isUnlocked) {
                      handleWellnessSelect(item.ID, index);
                    }
                  }}
                  disabled={!isUnlocked}
                >
                  <Image
                    source={
                      isUnlocked
                        ? require('../../assets/images/BE.png')  // Unlocked Image
                        : require('../../assets/images/BELock.png')  // Locked Image
                    }
                    style={styles.image}
                    resizeMode="contain"
                  />
                  <Text style={[styles.itemText, !isUnlocked && styles.lockedText]}>
                    {item.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}

      {showWellnessDetail && (
        <Animated.View
          style={[
            styles.articleDetailContainer,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          <ScrollView style={styles.scrollView}>
            {wellness ? (
              <React.Fragment key={wellness.ID}>
                <View style={styles.header}>
                  <View
                    style={ styles.titleBox }
                  >
                    <Text style={styles.title}>Breathing Exercises</Text>
                  </View>
                </View>
                <TouchableOpacity style={[styles.backButton, styles.lefted]} onPress={() => setShowWellnessDetail(false)}>
                  <Ionicons name="arrow-back" size={25} color="#000" />
                </TouchableOpacity>
                <View style={styles.VideoView}>
                    <Video
                        source={{ uri: `${RootAPI}${wellness.filepath}` }}
                        controls
                        resizeMode="cover"
                        paused={false}
                        style={fullScreen ?
                            [styles.fullscreenVideo,{
                                width: height,
                                height: width,
                            }] : styles.Video}
                        onFullscreenPlayerWillPresent={() => handleFullScreen(true)}
                        onFullscreenPlayerWillDismiss={() => handleFullScreen(false)}
                        onEnd={() => onVideoFinish(videoIndex)}
                    />
                </View>
                <View style={styles.VideoText}>
                    <Text style={styles.articleTitle}>{wellness.title}</Text>
                    <Text style={styles.articleDate}>{new Date(wellness.modified_at).toLocaleString('en-US', options)}</Text>
                    <Text style={styles.articleDesc}>{wellness.description}</Text>
                </View>
              </React.Fragment>
            ) : (
              <Text>Article not found</Text>
            )}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  titleBox: {
    backgroundColor: '#87ceeb',
    paddingVertical: 10,
    paddingHorizontal: 50,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    marginBottom: 20,
    borderBottomEndRadius: 25,
    borderBottomStartRadius: 25,
  },
  title: {
    fontSize: 15,
    letterSpacing: 2,
    fontFamily: 'Poppins-ExtraBold',
    color: 'black',
  },
  MeditationBox: {
    width: '80%',
    marginBottom: 25,
    alignItems: 'center',
  },
  MeditationTitle: {
    fontSize: 55,
    fontFamily: 'Lora-Bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#87ceeb',
    textShadowColor: 'gray',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 2,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    width: '100%',
  },
  item: {
    width: '45%',
    marginVertical: 10,
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
  },
  image: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
  },
  itemText: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: 'bold',
  },
  lockedText: {
    color: '#999',
  },
  articleDetailContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0, // Allows bottom tab bar to remain visible
      backgroundColor: 'white',
      zIndex: 100,
  },
  header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
  },
  scrollView: {
      flex: 1,
  },
  VideoView: {
      width: '100%',
      height: 250,
  },
  Video: {
      width: '100%',
      height: '100%',
  },
  fullscreenVideo: {
    position: 'absolute',
    backgroundColor: 'black',
  },
  VideoText: {
    width: '100%',
    height: '100%',
    paddingHorizontal: 20,
  },
  articleTitle: {
    fontSize: 50,
    fontFamily: 'Poppins-Regular',
    color: 'black',
  },
  articleDate: {
    fontSize: 15,
    color: 'grey',
    marginBottom: 10,
    fontFamily: 'Lora-Regular',
  },
  articleDesc: {
    fontSize: 15,
    textAlign: 'justify',
    fontFamily: 'Lora-SemiBold',
    color: 'black',
  },
  backButton: {position: 'absolute', zIndex: 10, top: 20, right: 10},
  lefted: {left: 10, right: 0},
  loading: {color: 'black', fontFamily: 'Lora-Regular', textAlign: 'center'},
});
