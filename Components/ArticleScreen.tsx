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
                              {resource.banner && (
                                <Image
                                source={{ uri: `${RootAPI}${resource.banner}` }}
                                  style={styles.bannerImage}
                                  resizeMode="cover"
                                />
                              ) }
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
      paddingVertical: 10,
      paddingHorizontal: 50,
      borderBottomLeftRadius: 25,
      borderBottomRightRadius: 25,
      marginBottom: 20,
    },
    title: {
      fontSize: 15,
      letterSpacing: 2,
      fontFamily: 'Poppins-Bold',
      color: 'black',
    },
    SearchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '90%',
      borderWidth: 1,
      borderColor: '#fff59d',
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
      backgroundColor: '#fff59d',
      padding: 5,
      marginRight: 5,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
    },
    articleBox: {
        borderWidth: 4, // Border thickness
        borderColor: '#fff59d', // Border color
        borderRadius: 25, // Optional: Rounded corners
        backgroundColor: '#fff', // Keep background transparent if needed
        width: '80%',
        height: '10%',
        justifyContent: 'center',
        marginBottom: 20,
        position: 'relative',
        marginLeft: 40,
    },
    rightAlignTitle: {
        textAlign: 'right',
        paddingRight: 20,
        fontSize: 25,
        fontFamily: 'Lora-Bold',
        color: 'black',
    },
    list: {
      width: '90%',
      backgroundColor: 'transparent',
      height: '90%',
      marginBottom: 100,
    },
    boxColor: {
      backgroundColor: '#fff59d',
      borderRadius: 25,
      position: 'relative',
      marginBottom: 25,
      height: 150,
    },
    categoryText: {
      fontSize: 15,
      color: '#666',
      marginBottom: 4,
      fontFamily: 'Lora-Regular',
    },
    separator: {
      height: 2,
      marginVertical: 8,
    },
    contentContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      flex: 1,
    },
    titleArea: {
      flex: 1,
      paddingRight: 10,
      justifyContent: 'flex-start',
    },
    resourceTitle: {
      marginTop: 3,
      fontSize: 22.5,
      fontFamily: 'Poppins-ExtraBold',
      color: '#000',
      lineHeight: 24,
      letterSpacing: 3,
    },
    rightContent: {
      width: 100,
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    },
    bannerContainer: {
      width: 100,
      height: 70,
      borderRadius: 8,
      overflow: 'hidden',
      backgroundColor: '#f0f0f0',
    },
    bannerImage: {
      width: '100%',
      height: '100%',
      borderRadius: 15,
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
      top: 10,
      left: 10,
      width: 20,
      height: 10,
      backgroundColor: 'white',
      borderRadius: 10,
    },
    groundSection: {
      flex: 1,
      backgroundColor: '#90d67f',
    },
    dateText: {
      fontSize: 12,
      color: '#999',
      marginTop: 4,
      fontFamily: 'Lora-Regular',
    },
    box: {
      width: '99%',
      height: '99%',
      backgroundColor: 'white',
      borderRadius: 25,
      padding: 16, // Increased padding for better spacing
      position: 'absolute',
      top: -5,
      left: -5,
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
    categoryButtonText: { fontSize: 14, fontFamily: 'Lora-Regular', color: '#333' },
    Image: {
        width: '60%',
        height: '180%',
        position: 'absolute',
    },
    imageLeft: {
        top: -40,
        left: '-25%',
    },
    loading: {color: 'black', fontFamily: 'Lora-Regular', textAlign: 'center'},
  });

const getCategoryButtonStyle = (category: string, categoryName: string, color: string) => ({
      backgroundColor: color,
      borderWidth: category === categoryName ? 3 : 0,
    });
