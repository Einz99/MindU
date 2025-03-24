// AnnouncementList.tsx
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface Announcement {
  ID: number;
  title: string;
  category: string;
  announcementContent: string;
  created_at: string;
}

interface AnnouncementListProps {
  announcements: Announcement[];
  loading: boolean;
  getCategoryColor: (category: string) => string;
  formatDate: (dateString: string) => string;
}

const AnnouncementList: React.FC<AnnouncementListProps> = ({
  announcements,
  loading,
  getCategoryColor,
  formatDate,
}) => {
  if (loading) {
    return <ActivityIndicator size="large" color="blue" />;
  }

  return (
    <>
      {announcements.map((announcement) => (
        <View key={announcement.ID} style={styles.announcementItem}>
          <Text
            style={[
              styles.announcementTitleText,
              { color: getCategoryColor(announcement.category) },
            ]}>
            {announcement.title}
          </Text>
          <Text style={styles.announcementCategory}>{announcement.category}</Text>
          <Text style={styles.announcementContent}>{announcement.announcementContent}</Text>
          <Text style={styles.announcementDate}>{formatDate(announcement.created_at)}</Text>
        </View>
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  announcementItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginBottom: 5,
  },
  announcementTitleText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  announcementCategory: {
    fontSize: 12,
    fontStyle: 'italic',
    color: 'gray',
    marginTop: 2,
  },
  announcementContent: {
    fontSize: 16,
    marginTop: 5,
  },
  announcementDate: {
    fontSize: 10,
    color: 'gray',
    textAlign: 'right',
    marginTop: 5,
  },
});

export default AnnouncementList;
