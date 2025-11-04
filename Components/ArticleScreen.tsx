import React, { useState } from 'react';
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

export default function ArticleScreen({
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
    const [fallbackImage, setFallbackImage] = useState(false);
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
                <Image source={require('../assets/images/Article.png')} style={[styles.Image, styles.imageLeft]}/>
                <Text style={styles.rightAlignTitle}>Articles</Text>
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
                        <View style={styles.contentContainer}>
                          {/* Title area */}
                          <View style={styles.titleArea}>
                            {/* Category with separator line */}
                            <Text style={styles.categoryText}>{resource.category}</Text>
                            <View style={[styles.separator, { backgroundColor: categoryColors[resource.category as keyof typeof categoryColors] || '#fff59d' }]} />

                          {/* Content container */}
                            <Text
                              style={[styles.resourceTitle]}
                              numberOfLines={3}
                              ellipsizeMode="tail"
                            >{resource.title}</Text>
                          </View>

                          {/* Right side with image and date */}
                          <View style={styles.rightContent}>
                            <View style={styles.bannerContainer}>
                              <View style={styles.bannerContainer}>
                                <Image
                                  source={{
                                    uri: `${RootAPI}${resource.banner}`,
                                  }}
                                  style={styles.bannerImage}
                                  resizeMode="cover"
                                  onError={() => {
                                    // Handle error (e.g., image file is missing or corrupted)
                                    setFallbackImage(true); // Switch to fallback image
                                  }}
                                />
                                {/* Fallback image if there is an error */}
                                {fallbackImage && (
                                  <Image
                                    source={require('../assets/images/MUIcon.png')}
                                    style={styles.bannerImage}
                                    resizeMode="cover"
                                  />
                                )}
                              </View>
                            </View>
                            <Text style={styles.dateText}>
                              {new Date(resource.modified_at).toLocaleDateString()}
                            </Text>
                          </View>
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
      backgroundColor: '#fff59d',
      paddingVertical: verticalScale(10),
      paddingHorizontal: scale(50),
      borderBottomLeftRadius: moderateScale(25),
      borderBottomRightRadius: moderateScale(25),
      marginBottom: verticalScale(20),
    },
    title: {
      fontSize: moderateScale(15),
      letterSpacing: moderateScale(2),
      fontFamily: 'Poppins-Bold',
      color: 'black',
    },
    SearchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '90%',
      borderWidth: moderateScale(1),
      borderColor: '#fff59d',
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
      backgroundColor: '#fff59d',
      padding: moderateScale(5),
      marginRight: scale(5),
      borderRadius: moderateScale(25),
      justifyContent: 'center',
      alignItems: 'center',
    },
    articleBox: {
        borderWidth: moderateScale(4), // Border thickness
        borderColor: '#fff59d', // Border color
        borderRadius: moderateScale(25), // Optional: Rounded corners
        backgroundColor: '#fff', // Keep background transparent if needed
        width: '80%',
        height: '12%',
        justifyContent: 'center',
        marginBottom: verticalScale(20),
        position: 'relative',
        marginLeft: scale(40),
    },
    rightAlignTitle: {
        textAlign: 'right',
        paddingRight: scale(20),
        fontSize: moderateScale(25),
        fontFamily: 'Lora-Bold',
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
      height: verticalScale(150),
    },
    categoryText: {
      fontSize: moderateScale(15),
      color: '#666',
      marginBottom: verticalScale(4),
      fontFamily: 'Lora-Regular',
    },
    separator: {
      height: verticalScale(2),
      marginVertical: verticalScale(8),
    },
    contentContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      flex: 1,
    },
    titleArea: {
      flex: 1,
      paddingRight: scale(10),
      justifyContent: 'flex-start',
    },
    resourceTitle: {
      marginTop: verticalScale(3),
      fontSize: moderateScale(22.5),
      fontFamily: 'Poppins-ExtraBold',
      color: '#000',
      lineHeight: verticalScale(24),
      letterSpacing: moderateScale(3),
    },
    rightContent: {
      width: scale(100),
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    },
    bannerContainer: {
      width: scale(100),
      height: verticalScale(70),
      borderRadius: moderateScale(8),
      overflow: 'hidden',
      backgroundColor: '#f0f0f0',
    },
    bannerImage: {
      width: '100%',
      height: '100%',
      borderRadius: moderateScale(15),
    },
    placeholderImage: {
      width: '100%',
      height: '100%',
    },
    skySection: {
      flex: 2,
      backgroundColor: '#a5d8ff',
      position: 'relative',
    },
    cloud: {
      position: 'absolute',
      top: verticalScale(10),
      left: scale(10),
      width: scale(20),
      height: verticalScale(10),
      backgroundColor: 'white',
      borderRadius: moderateScale(10),
    },
    groundSection: {
      flex: 1,
      backgroundColor: '#90d67f',
    },
    dateText: {
      fontSize: moderateScale(12),
      color: '#999',
      marginTop: verticalScale(4),
      fontFamily: 'Lora-Regular',
    },
    box: {
      width: '99%',
      height: '99%',
      backgroundColor: 'white',
      borderRadius: moderateScale(25),
      padding: moderateScale(16), // Increased padding for better spacing
      position: 'absolute',
      top: -5,
      left: -5,
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
    categoryButtonText: { fontSize: moderateScale(14), fontFamily: 'Lora-Regular', color: '#333' },
    Image: {
        width: '60%',
        height: '180%',
        position: 'absolute',
    },
    imageLeft: {
        top: verticalScale(-40),
        left: '-25%',
    },
    loading: {color: 'black', fontFamily: 'Lora-Regular', textAlign: 'center'},
  });

const getCategoryButtonStyle = (category: string, categoryName: string, color: string) => ({
      backgroundColor: color,
      borderWidth: category === categoryName ? 3 : 0,
    });
