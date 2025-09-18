import React, { FC } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
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
      <View style={styles.outerAnnounceItem} key={index}>
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
      <ScrollView contentContainerStyle={styles.listContent}>
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
  outerAnnounceItem: { backgroundColor: 'orange', borderRadius: 20, marginBottom: 20 },
  announcementItem: {
    height: 140,  // Fixed height for all items
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    position: 'relative',
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
