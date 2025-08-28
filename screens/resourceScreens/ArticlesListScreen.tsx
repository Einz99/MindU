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
import { io } from 'socket.io-client';
import axios from 'axios';
import { API, RootAPI } from '../../apiConfigs';
import ArticleScreen from '../../Components/ArticleScreen';
import { WebView } from 'react-native-webview';
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

export default function ArticleList() {
    const navigation = useNavigation();
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('');
    const [showArticleDetail, setShowArticleDetail] = useState(false);
    const [selectedResourceId, setSelectedResourceId] = useState<number | null>(null);
    const [slideAnim] = useState(new Animated.Value(1000)); // Start off-screen

    const handleSearch = (text: string) => {
      setQuery(text);
    };

    const handleResourceSelect = (id: number) => {
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

    const article = resources.find((resource) => resource.ID === selectedResourceId);

    return (
      <View style={styles.container}>
        <DrawerComponent Initial={'Resource Library'} />
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
                    <Text style={styles.articleAuthor}>By Writer/Author</Text>
                    <Image
                      source={{ uri: `${RootAPI}${article.banner}` }}
                      resizeMode="contain"
                      style={styles.articleImage}
                    />
                    <View style={styles.webView}>
                      {article.filepath && (
                        <WebView
                          originWhitelist={['*']}
                          source={{ uri: `${RootAPI}${article.filepath}` }}
                          javaScriptEnabled={true}
                          domStorageEnabled={true}
                          injectedJavaScript={`
                            const style = document.createElement('style');
                            style.innerHTML = \`
                              p, span, li, h1, h2, h3, h4, h5, h6 {
                                transform: scale(2);
                                transform-origin: left top;
                              }
                            \`;
                            document.head.appendChild(style);
                            true;
                          `}
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
    titleBox: {
        backgroundColor: '#fff59d',
        paddingVertical: 10,
        paddingHorizontal: 40,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        marginBottom: 20,
    },
    title: {
        fontSize: 15,
        letterSpacing: 2,
        fontFamily: 'Poppins-ExtraBold',
    },
    article: {
        width: '100%',
        padding: 20,
    },
    articleTitle: {
        fontSize: 40,
        paddingLeft: 6,
        fontFamily: 'Poppins-SemiBold',
        color: 'black',
    },
    articleTime: {
        color: 'grey',
        fontSize: 15,
        paddingLeft: 6,
        fontFamily: 'Lora-Regular',
    },
    articleAuthor: {
        fontSize: 15,
        paddingLeft: 6,
        fontFamily: 'Poppins-SemiBold',
        color: 'black',
    },
    articleImage: {
        width: '95%',
        height: 200,
        alignSelf: 'center',
    },
    webView: {
        height: 300,
        marginTop: 10,
        width: '100%',
    },
    backButton: {position: 'absolute', zIndex: 10, top: 20, right: 10},
    lefted: {left: 10, right: 0},
});
