import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Image,
    ScrollView,
    Animated,
    BackHandler,
    TouchableOpacity,
} from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { io } from 'socket.io-client';
import axios from 'axios';
import { API, RootAPI } from '../../apiConfigs';
import ArticleScreen from '../../Components/ArticleScreen';
import { WebView } from 'react-native-webview';
import DrawerComponent from '../../Components/DrawerComponent';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../APIClient';

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

export default function ArticleList() {
    const navigation = useNavigation();
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('');
    const [showArticleDetail, setShowArticleDetail] = useState(false);
    const [selectedResourceId, setSelectedResourceId] = useState<number | null>(null);
    const [slideAnim] = useState(new Animated.Value(1000)); // Start off-screen
    const [webViewHeight, setWebViewHeight] = useState(0);

    const [studentID, setStudentID] = useState<number>(0);

    const handleSearch = (text: string) => {
      setQuery(text);
    };

    const handleResourceSelect = async (id: number) => {
      try {
        // Increment view count
        await axios.post(`${API}/resources/increment-view/${id}`);
      } catch (err) {
        console.error('Error incrementing resource view:', err);
      }

      try {
        // Log student activity for the Resource module
        await axios.post(`${API}/student-activities/${studentID}/insert`, { module: 'Resource' });
      } catch (err) {
        console.error('Error logging student activity:', err);
      }


      // Update local state to show the article
      setSelectedResourceId(id);
      setShowArticleDetail(true);

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
            setShowArticleDetail(false);
            setSelectedResourceId(null);
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
        resource.resourceType === 'Document' &&
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

    useEffect(() => {
      const fetchUserData = async () => {
        try {
          const token = await AsyncStorage.getItem('userToken');
          const response = await apiClient.get(`${API}/user`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.data?.user) {
            setStudentID(response.data.user.id);
          } else {
            setStudentID(0);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setStudentID(0);
        }
      };
      fetchUserData();
    }, []);

    const article = resources.find((resource) => resource.ID === selectedResourceId);

    return (
      <View style={styles.container}>
        <DrawerComponent Initial={'Articles'} />
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={25} color="#000" />
        </TouchableOpacity>
        <ArticleScreen
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

        {/* Custom Article Detail View (replaces Modal) */}
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
                  <View style={styles.article}>
                    <Text style={styles.articleTitle}>
                      {article.title}
                      {'\n'}
                    </Text>
                    <Text style={styles.articleTime}>
                      {new Date(article.modified_at).toLocaleString('en-US', options)}
                      {'\n'}
                    </Text>
                    <Text style={styles.articleAuthor}>By Guidance Office</Text>
                    <Image
                      source={{
                        uri: article.banner ? `${RootAPI}${article.banner}` : require('../../assets/images/MUIcon.png'), // Default image if banner is unavailable
                      }}
                      resizeMode="contain"
                      style={styles.articleImage}
                    />
                    <View style={styles.webView}>
                      {article.filepath && (
                        <WebView
                          originWhitelist={['*']}
                          source={{ uri: `${RootAPI}${article.filepath}` }}
                          javaScriptEnabled
                          domStorageEnabled
                          injectedJavaScript={`
                            setTimeout(() => {
                              window.ReactNativeWebView.postMessage(
                                Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)
                              );
                            }, 300);
                            true;
                          `}
                          onMessage={(event) => {
                            setWebViewHeight(Number(event.nativeEvent.data));
                          }}
                          // eslint-disable-next-line react-native/no-inline-styles
                          style={{ width: '100%', height: webViewHeight || 300 }}
                        />
                        )}
                    </View>
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
    articleDetailContainer: {
        position: 'absolute',
        top: verticalScale(0),
        left: scale(0),
        right: scale(0),
        bottom: verticalScale(0), // Allows bottom tab bar to remain visible
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
    titleBox: {
        backgroundColor: '#fff59d',
        paddingVertical: verticalScale(10),
        paddingHorizontal: scale(40),
        borderBottomLeftRadius: moderateScale(25),
        borderBottomRightRadius: moderateScale(25),
        marginBottom: verticalScale(20),
    },
    title: {
        fontSize: moderateScale(15),
        letterSpacing: moderateScale(2),
        fontFamily: 'Poppins-ExtraBold',
    },
    article: {
        width: '100%',
        padding: moderateScale(20),
    },
    articleTitle: {
        fontSize: moderateScale(40),
        paddingLeft: scale(6),
        fontFamily: 'Poppins-SemiBold',
        color: 'black',
    },
    articleTime: {
        color: 'grey',
        fontSize: moderateScale(15),
        paddingLeft: scale(6),
        fontFamily: 'Lora-Regular',
    },
    articleAuthor: {
        fontSize: moderateScale(15),
        paddingLeft: scale(6),
        fontFamily: 'Poppins-SemiBold',
        color: 'black',
    },
    articleImage: {
        width: '95%',
        height: verticalScale(200),
        alignSelf: 'center',
    },
    webView: {
        height: verticalScale(300),
        marginTop: verticalScale(10),
        width: '100%',
    },
    backButton: {position: 'absolute', zIndex: 10, top: verticalScale(20), right: scale(10)},
    lefted: {left: scale(10), right: scale(0)},
});
