import React, { FC } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TextStyle,
} from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

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
  onScrollStart: () => void;   // Start scrolling handler
  onScrollEnd: () => void;     // End scrolling handler
}

const AnnouncementList: FC<AnnouncementListProps> = ({
  announcements,
  loading,
  getCategoryColor,
  formatDate,
  onScrollStart,
  onScrollEnd,
}) => {
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

  // Define the renderItem function
  const renderItem = (item: Announcement, index: number) => {
    // Define category style with proper TypeScript typing
    const categoryStyle: TextStyle = {
      color: getCategoryColor(item.category),
      padding: moderateScale(4),
      borderRadius: moderateScale(4),
      alignSelf: 'flex-start',
      opacity: 0.7,
      marginBottom: verticalScale(5),
      textShadowColor: 'gray', // Shadow color
      textShadowOffset: { height: 1, width: 1 }, // Increased the shadow offset
      textShadowRadius: moderateScale(0.2), // Added a shadow radius for better blur effect
      position: 'absolute',
      top: -15,
      right: scale(0),
      fontFamily: 'Poppins-Regular',
      fontSize: moderateScale(10),
    };

    return (
      <View style={[styles.outerAnnounceItem, { backgroundColor: getCategoryColor(item.category)}]} key={index}>
        <View style={styles.announcementItem}>
          <View style={styles.categoryContainer}>
            <View>
              <Text style={categoryStyle}>{item.category}{'\u25CF'}</Text>
            </View>
          </View>
          <Text style={styles.announcementTitleText}>{item.title}</Text>
          <Text numberOfLines={3} style={styles.announcementContent}>
            {item.announcementContent}
          </Text>
          <Text style={styles.announcementDate}>{formatDate(item.modified_at)}</Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      onTouchStart={onScrollStart}  // Disable parent ScrollView when starting to scroll
      onTouchEnd={onScrollEnd}   // Reset scroll tracking after scrolling ends
      contentContainerStyle={[
        styles.listContent,
        announcements.length <= 2 && styles.shortList,
      ]}
    >
      {announcements.map((item, index) => renderItem(item, index))}
    </ScrollView>
  );
};

export default AnnouncementList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingVertical: verticalScale(30),
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
    fontSize: moderateScale(16),
    color: 'gray',
  },
  outerAnnounceItem: { backgroundColor: 'orange', borderRadius: moderateScale(20), marginBottom: verticalScale(20) },
  announcementItem: {
    height: 140,  // Fixed height for all items
    backgroundColor: 'white',
    borderRadius: moderateScale(15),
    padding: moderateScale(16),
    marginVertical: verticalScale(8),
    shadowColor: '#000',
    shadowOffset: { width: moderateScale(0), height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: moderateScale(8),
    elevation: 5,
    position: 'relative',
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  categoryText: {
    color: 'white',
    fontSize: moderateScale(12),
    fontWeight: 'bold',
  },
  announcementTitleText: {
    fontSize: moderateScale(22),
    fontFamily: 'Poppins-Bold',
    marginBottom: verticalScale(0),
    color: '#333',
  },
  announcementContent: {
    fontSize: moderateScale(14),
    color: '#555',
    flex: 1,
    fontFamily: 'Lora-Regular',
  },
  announcementDate: {
    fontSize: moderateScale(8),
    color: 'gray',
    position: 'absolute',
    bottom: verticalScale(10),
    right: scale(15),
    fontFamily: 'Lora-Regular',
  },
  shortList: {
    paddingVertical: verticalScale(10), // ✅ Less padding for short lists
    flexGrow: 0, // ✅ Don't expand to fill space
  },
});
