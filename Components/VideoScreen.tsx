import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface Resource {
    ID: number;
    title: string;
    banner: string;
    category: string;
    description: string;
    resourceType: string;
    filepath: string;
    modified_at: string;
  }



interface ArticleScreenProps {
    query: string;
    category: string;
    handleSearch: (text: string) => void;
    setCategory: (category: string) => void;
    filteredResource: Resource[];
    loading: boolean;
    RootAPI: string;
    onSelectResource: (id: number) => void;
    categoryColors: { [key: string]: string };
  }

export default function VideoScreen({
    query,
    category,
    handleSearch,
    setCategory,
    filteredResource,
    loading,
    RootAPI,
    onSelectResource,
    categoryColors,
  }: ArticleScreenProps) {
    return(
        <>
            <View style={styles.titleBox}>
                <Text style={styles.title}>
                    Resource Library
                </Text>
            </View>
            <View style={styles.SearchContainer}>
                <TextInput
                style={styles.input}
                placeholder="Search..."
                placeholderTextColor="#999"
                value={query}
                onChangeText={handleSearch}
                />
                <TouchableOpacity style={styles.iconContainer}>
                  <Ionicons name="search" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Add the horizontal categories component */}
            <View style={styles.categoriesContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.contentContainerStyle}
              style={styles.horizontalScroll}
            >
              {Object.entries(categoryColors).map(([categoryName, color]) => (
                <TouchableOpacity
                  key={categoryName}
                  onPress={() => {
                    // If the category is already selected, clear it
                    if (category === categoryName) {
                      setCategory('');
                    } else {
                      setCategory(categoryName);
                    }
                  }}
                  style={[styles.categoryButton, getCategoryButtonStyle(category, categoryName, color) ]}
                >
                  <Text style={styles.categoryButtonText}>
                    {categoryName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            </View>

            <View style={styles.articleBox}>
                <Image source={require('../assets/images/Video.png')} style={[styles.Image, styles.imageRight]}/>
                <Text style={styles.leftAlignTitle}>Videos</Text>
            </View>
            <ScrollView style={styles.list}>
                {loading ? (
                  <Text style={styles.loading}>Loading resources...</Text>
                ) : (filteredResource.map((resource) => (
                    <TouchableOpacity key={resource.ID}
                      onPress={() => onSelectResource(resource.ID)}
                      style={[
                        styles.boxColor,
                        { backgroundColor: categoryColors[resource.category as keyof typeof categoryColors] || '#fff59d' },// Default color fallback
                      ]}>
                      <View style={styles.box}>
                        <View style={styles.VideoBanner}>
                            <Image
                                source={{
                                    uri: resource.banner ? `${RootAPI}${resource.banner}` : '../../assets/images/MUIcon.png',
                                  }}
                                style={styles.VideoImage}
                                resizeMode="stretch"
                            />
                            <Ionicons name="play-circle" size={40} color="gray" style={styles.playIcon}/>
                        </View>
                        <View style={styles.VideoTitle}>
                            <Text style={styles.resoureTitle}>{resource.title}</Text>
                            <Text style={styles.resoureDate}>{new Date(resource.modified_at).toLocaleDateString()}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  )))}
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    titleBox: {
      backgroundColor: '#d6c9f3',
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
    SearchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '90%',
      borderWidth: 1,
      borderColor: '#d6c9f3',
      borderRadius: 25,
      backgroundColor: '#fff',
      overflow: 'hidden',
    },
    categoriesContainer: {
      width: '90%',
      marginBottom: 20,
    },
    input: {
      flex: 1,
      height: 40,
      fontSize: 16,
      color: '#333',
      paddingHorizontal: 10,
    },
    iconContainer: {
      backgroundColor: '#d6c9f3',
      padding: 5,
      marginRight: 5,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
    },
    articleBox: {
        borderWidth: 4, // Border thickness
        borderColor: '#d6c9f3', // Border color
        borderRadius: 25, // Optional: Rounded corners
        backgroundColor: '#fff', // Keep background transparent if needed
        width: '80%',
        height: '10%',
        justifyContent: 'center',
        marginBottom: 20,
        marginRight: 40,
    },
    leftAlignTitle: {
        textAlign: 'left',
        paddingLeft: 20,
        fontSize: 25,
        fontFamily: 'Lora-SemiBold',
        color: 'black',
    },
    list: {
      width: '90%',
      backgroundColor: 'transparent',
    },
    boxColor: {
      backgroundColor: '#fff59d',
      borderRadius: 25,
      position: 'relative',
      marginBottom: 25,
      height: 200,
    },
    categoryText: {
      fontSize: 14,
      color: '#666',
      marginBottom: 4,
    },
    separator: {
      height: 1,
      backgroundColor: '#EEEEEE',
      marginVertical: 8,
    },
    contentContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      flex: 1,
    },
    box: {
      width: '100%',
      height: '100%',
      backgroundColor: 'transparent',
      borderRadius: 25,
    },
    VideoBanner: {
      width: '100%',
      height: '70%',
      backgroundColor: 'white',
      position: 'relative',
      borderTopRightRadius: 25,
      borderTopLeftRadius: 25,
    },
    VideoImage: {
      width: '100%',
      height: '100%',
      borderTopRightRadius: 25,
      borderTopLeftRadius: 25,
    },
    playIcon: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: [{ translateX: -12.5 }, { translateY: -12.5}],
    },
    VideoTitle: {
      paddingHorizontal: 15,
    },
    resoureTitle: {
      fontSize: 20,
      fontFamily: 'Poppins-SemiBold',
      color: 'black',
    },
    resoureDate: {
        color: 'gray',
        fontFamily: 'Lora-Regular',
    },
    contentContainerStyle: { paddingHorizontal: 10, paddingVertical: 10 },
    horizontalScroll: { width: '100%', marginBottom: 20 },
    categoryButton: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
      marginRight: 10,
      minWidth: 100,
      alignItems: 'center',
      justifyContent: 'center',
      borderColor: '#fff59d',
    },
    categoryButtonText: { fontSize: 14, fontWeight: '600', color: '#333', fontFamily: 'Lora-Regular' },
    Image: {
        width: '60%',
        height: '180%',
        position: 'absolute',
    },
    imageRight: {
        top: -40,
        right: '-25%',
    },
    loading: {color: 'black', fontFamily: 'Lora-Regular', textAlign: 'center'},
  });

const getCategoryButtonStyle = (category: string, categoryName: string, color: string) => ({
      backgroundColor: color,
      borderWidth: category === categoryName ? 3 : 0,
    });
