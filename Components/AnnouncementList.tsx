import React, { useState, useRef, FC, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  TextStyle,
} from 'react-native';

interface Announcement {
  ID: number;
  title: string;
  category: string;
  announcementContent: string;
  modified_at: string;
  end_date: string;
  student_id: number;
}

interface AnnouncementListProps {
  announcements: Announcement[];
  loading: boolean;
  getCategoryColor: (category: string) => string;
  formatDate: (dateString: string) => string;
}

const AnnouncementList: FC<AnnouncementListProps> = ({
  announcements,
  loading,
  getCategoryColor,
  formatDate,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const ITEM_HEIGHT = 100; // Integer value for item height

  // Duplicate declaration removed

  const handleViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }, []);

  // We'll keep the implementation simple to avoid precision errors
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#b7e3cc" />
      </View>
    );
  }

  if (announcements.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No announcements available</Text>
      </View>
    );
  }

  // Calculate the effective array to display, repeated for infinite scrolling
  const effectiveItems = announcements.length > 0
    ? [...announcements, ...announcements, ...announcements]
    : [];

  const renderItem = ({ item, index }: { item: Announcement; index: number }) => {
    // Determine if this is the active item
    const isActive = index === activeIndex;

    // Define category style with proper TypeScript typing
    const categoryStyle: TextStyle = {
      color: getCategoryColor(item.category),
      padding: 4,
      borderRadius: 4,
      alignSelf: 'flex-start',
      opacity: 0.7,
      marginBottom: 5,
      textShadowColor: 'gray', // Shadow color
      textShadowOffset: { height: 1, width: 1 }, // Increased the shadow offset
      textShadowRadius: 0.2, // Added a shadow radius for better blur effect
      position: 'absolute',
      top: -15,
      right: 0,
      fontFamily: 'Poppins-Regular',
      fontSize: 10,
    };

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          flatListRef.current?.scrollToIndex({
            index,
            animated: true,
          });
          setActiveIndex(index);
        }}
      >
        <View
          style={[
            styles.announcementItem,
            isActive ? styles.activeItem : styles.inactiveItem,
          ]}
        >
          <View style={styles.categoryContainer}>
            <View>
              <Text style={categoryStyle}>{item.category}{'\u25CF'}</Text>
            </View>
          </View>
          <Text style={styles.announcementTitleText}>{item.title}</Text>
          <Text numberOfLines={isActive ? 3 : 2} style={styles.announcementContent}>
            {item.announcementContent}
          </Text>
          <Text style={styles.announcementDate}>{formatDate(item.modified_at)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={effectiveItems}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.ID}-${index}`}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        initialNumToRender={3}
        maxToRenderPerBatch={5}
        windowSize={5}
        initialScrollIndex={announcements.length} // Start in the middle set of items
        getItemLayout={(data, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        onEndReached={() => {
          // When reaching the end, jump back to the middle set
          const middleIndex = announcements.length;
          flatListRef.current?.scrollToIndex({
            index: middleIndex,
            animated: false,
          });
          setActiveIndex(middleIndex);
        }}
        onEndReachedThreshold={0.1}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 10,
  },
  listContent: {
    paddingVertical: 30,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: 'gray',
  },
  announcementItem: {
    height: 100,
    marginHorizontal: 10,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 16,
    marginVertical: 12.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    position: 'relative',
  },
  activeItem: {
    transform: [{ scale: 1 }],
    opacity: 1,
    height: 140,
  },
  inactiveItem: {
    transform: [{ scale: 0.9 }],
    opacity: 0.7,
    height: 80,
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  categoryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  announcementTitleText: {
    fontSize: 22,
    fontFamily: 'Poppins-Bold',
    marginBottom: 0,
    color: '#333',
  },
  announcementContent: {
    fontSize: 14,
    color: '#555',
    flex: 1,
    fontFamily: 'Lora-Regular',
  },
  announcementDate: {
    fontSize: 8,
    color: 'gray',
    position: 'absolute',
    bottom: 10,
    right: 15,
    fontFamily: 'Lora-Regular',
  },
});

export default AnnouncementList;
