import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    useWindowDimensions,
    Animated,
    BackHandler,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { io } from 'socket.io-client';
import axios from 'axios';
import { API, RootAPI } from '../../apiConfigs';
import VideoScreen from '../../Components/VideoScreen';
import Orientation from 'react-native-orientation-locker';
import Video from 'react-native-video';
import DrawerComponent from '../../Components/DrawerComponent';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

interface Resource {
  ID: number;
  title: string;
  banner: string;
  category: string;
  description: string;
  resourceType: string;
  filepath: string;
  modified_at: string;
  status: string;
}

export const categoryColors = {
  'Emotional/Mental': '#A78BCF',
  'Social': '#5DADEC',
  'Financial/Occupation': '#F4A261',
  'Physical': '#E97451',
  'Spiritual': '#4B946A',
  'Intellectual': '#4682B4',
  'Environmental': '#8FBC8F',
};

export default function VideoList() {
    const navigation = useNavigation();
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('');
    const [showArticleDetail, setShowArticleDetail] = useState(false);
    const [selectedResourceId, setSelectedResourceId] = useState<number | null>(null);
    const [fullScreen, setFullScreen] = useState(false);
    const [slideAnim] = useState(new Animated.Value(1000)); // Start off-screen

    const { width, height } = useWindowDimensions();

    const handleSearch = (text: string) => {
      setQuery(text);
    };

    const handleResourceSelect = async (id: number) => {
      try {
        // 1️⃣ Increment view count
        await axios.post(`${API}/resources/increment-view/${id}`);
      } catch (err) {
        console.error('Error incrementing resource view:', err);
      }

      try {
        // Log student activity for the Resource module
        await axios.post(`${API}/student-activities/insert`, { module: 'Resource' });
      } catch (err) {
        console.error('Error logging student activity:', err);
      }

      setSelectedResourceId(id);
      setShowArticleDetail(true);

      // 3️⃣ Animate the slide-in
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
                setShowArticleDetail(false);
                setSelectedResourceId(null);
                setFullScreen(false); // Ensure fullscreen is reset when modal closes
                Orientation.lockToPortrait(); // Ensure app returns to portrait when closing modal
            });
        };

    useEffect(() => {
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

        const socket = io(RootAPI, {
          transports: ['websocket'],
          reconnectionAttempts: 5,
        });

        socket.on('connect', () => {
          console.log('✅ WebSocket connected:', socket.id);
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
        };
      }, []);
      useEffect(() => {
              // Handle Android back button press
              const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
                if (showArticleDetail) {
                  closeArticleDetail();
                  return true; // Prevent default behavior (app exit)
                }
                return false; // Let default behavior happen (navigate back)
              });
              return () => {
                backHandler.remove(); // Clean up back handler on unmount
              };
            });

    const filteredResource = resources.filter(
      (resource) =>
        resource.resourceType === 'Video' &&
        resource.title.toLowerCase().includes(query.toLowerCase()) &&
        resource.category.toLowerCase().includes(category.toLowerCase()) &&
        resource.status === 'Posted'
    );

    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      };

    const article = resources.find((resource) => resource.ID === selectedResourceId);

    const handleFullScreen = (isFullScreen: boolean) => {
        setFullScreen(isFullScreen);

        if (isFullScreen) {
            Orientation.lockToLandscape(); // Lock to landscape when entering fullscreen
        } else {
            Orientation.lockToPortrait(); // Lock back to portrait when exiting fullscreen
        }
    };

    return (
      <View style={styles.container}>
        <DrawerComponent Initial={'Resource Library'} />
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={25} color="#000" />
        </TouchableOpacity>
        <VideoScreen
          query={query}
          category={category}
          handleSearch={handleSearch}
          setCategory={setCategory}
          filteredResource={filteredResource}
          loading={loading}
          RootAPI={RootAPI}
          onSelectResource={handleResourceSelect}
          categoryColors={categoryColors}
        />

        {/*Modal*/}
        {showArticleDetail && (
          <Animated.View
            style={[
              styles.articleDetailContainer,
              { transform: [{ translateX: slideAnim }] },
            ]}
          >
            <ScrollView style={styles.scrollView}>
              {article ? (
                <React.Fragment key={article.ID}>
                  <View style={styles.header}>
                    <View
                      style={[
                        styles.titleBox,
                        { backgroundColor: categoryColors[article.category as keyof typeof categoryColors] || '#fff59d' },
                      ]}
                    >
                      <Text style={styles.title}>{article.category}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={[styles.backButton, styles.lefted]} onPress={() => setShowArticleDetail(false)}>
                    <Ionicons name="arrow-back" size={25} color="#000" />
                  </TouchableOpacity>
                  <View style={styles.VideoView}>
                      <Video
                          source={{ uri: `${RootAPI}${article.filepath}` }}
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
                      />
                  </View>
                  <View style={styles.VideoText}>
                      <Text style={styles.articleTitle}>{article.title}</Text>
                      <Text style={styles.articleDate}>{new Date(article.modified_at).toLocaleString('en-US', options)}</Text>
                      <Text style={styles.articleDesc}>{article.description}</Text>
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
        backgroundColor: '#fff59d',
        paddingVertical: 10,
        paddingHorizontal: 50,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        marginBottom: 20,
      },
      title: {
        fontSize: 15,
        letterSpacing: 2,
        fontFamily: 'Poppins-ExtraBold',
        color: 'black',
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
});
