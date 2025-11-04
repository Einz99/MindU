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
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

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
                            <Text style={styles.resoureTitle}>
                              {resource.title.length > 20 ? `${resource.title.substring(0, 20)}...` : resource.title}
                            </Text>
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
      paddingVertical: verticalScale(10),
      paddingHorizontal: scale(50),
      borderBottomLeftRadius: moderateScale(25),
      borderBottomRightRadius: moderateScale(25),
      marginBottom: verticalScale(20),
    },
    title: {
      fontSize: moderateScale(15),
      letterSpacing: moderateScale(2),
      fontFamily: 'Poppins-ExtraBold',
      color: 'black',
    },
    SearchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '90%',
      borderWidth: moderateScale(1),
      borderColor: '#d6c9f3',
      borderRadius: moderateScale(25),
      backgroundColor: '#fff',
      overflow: 'hidden',
    },
    categoriesContainer: {
      width: '90%',
      marginBottom: verticalScale(20),
    },
    input: {
      flex: 1,
      height: verticalScale(40),
      fontSize: moderateScale(16),
      color: '#333',
      paddingHorizontal: scale(10),
    },
    iconContainer: {
      backgroundColor: '#d6c9f3',
      padding: moderateScale(5),
      marginRight: scale(5),
      borderRadius: moderateScale(25),
      justifyContent: 'center',
      alignItems: 'center',
    },
    articleBox: {
        borderWidth: moderateScale(4), // Border thickness
        borderColor: '#d6c9f3', // Border color
        borderRadius: moderateScale(25), // Optional: Rounded corners
        backgroundColor: '#fff', // Keep background transparent if needed
        width: '80%',
        height: '12%',
        justifyContent: 'center',
        marginBottom: verticalScale(20),
        marginRight: scale(40),
    },
    leftAlignTitle: {
        textAlign: 'left',
        paddingLeft: scale(20),
        fontSize: moderateScale(25),
        fontFamily: 'Lora-SemiBold',
        color: 'black',
    },
    list: {
      width: '90%',
      backgroundColor: 'transparent',
      height: '90%',
      marginBottom: verticalScale(60),
    },
    boxColor: {
      backgroundColor: '#fff59d',
      borderRadius: moderateScale(25),
      position: 'relative',
      marginBottom: verticalScale(25),
      height: verticalScale(200),
    },
    categoryText: {
      fontSize: moderateScale(14),
      color: '#666',
      marginBottom: verticalScale(4),
    },
    separator: {
      height: verticalScale(1),
      backgroundColor: '#EEEEEE',
      marginVertical: verticalScale(8),
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
      borderRadius: moderateScale(25),
    },
    VideoBanner: {
      width: '100%',
      height: '70%',
      backgroundColor: 'white',
      position: 'relative',
      borderTopRightRadius: moderateScale(25),
      borderTopLeftRadius: moderateScale(25),
    },
    VideoImage: {
      width: '100%',
      height: '100%',
      borderTopRightRadius: moderateScale(25),
      borderTopLeftRadius: moderateScale(25),
    },
    playIcon: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: [{ translateX: -12.5 }, { translateY: -12.5}],
    },
    VideoTitle: {
      paddingHorizontal: scale(15),
    },
    resoureTitle: {
      fontSize: moderateScale(20),
      fontFamily: 'Poppins-SemiBold',
      color: 'black',
    },
    resoureDate: {
        color: 'gray',
        fontFamily: 'Lora-Regular',
    },
    contentContainerStyle: { paddingHorizontal: scale(10), paddingVertical: verticalScale(10) },
    horizontalScroll: { width: '100%', marginBottom: verticalScale(20) },
    categoryButton: {
      paddingHorizontal: scale(20),
      paddingVertical: verticalScale(10),
      borderRadius: moderateScale(20),
      marginRight: scale(10),
      minWidth: scale(100),
      alignItems: 'center',
      justifyContent: 'center',
      borderColor: '#fff59d',
    },
    categoryButtonText: { fontSize: moderateScale(14), fontWeight: '600', color: '#333', fontFamily: 'Lora-Regular' },
    Image: {
        width: '60%',
        height: '180%',
        position: 'absolute',
    },
    imageRight: {
        top: verticalScale(-40),
        right: '-25%',
    },
    loading: {color: 'black', fontFamily: 'Lora-Regular', textAlign: 'center'},
  });

const getCategoryButtonStyle = (category: string, categoryName: string, color: string) => ({
      backgroundColor: color,
      borderWidth: category === categoryName ? 3 : 0,
    });
