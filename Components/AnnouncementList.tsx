/* eslint-disable react-native/no-inline-styles */
import React, { FC, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TextStyle,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import Ionicons from 'react-native-vector-icons/Ionicons';

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
  onScrollStart: () => void;
  onScrollEnd: () => void;
}

const AnnouncementList: FC<AnnouncementListProps> = ({
  announcements,
  loading,
  getCategoryColor,
  formatDate,
  onScrollStart,
  onScrollEnd,
}) => {
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

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

  const truncateContent = (content: string) => {
    if (content.length <= 60) {return content;}
    return content.substring(0, 60) + '... ';
  };

  const handleAnnouncementPress = (item: Announcement) => {
    setSelectedAnnouncement(item);
    setModalVisible(true);
  };

  // Define the renderItem function
  const renderItem = (item: Announcement, index: number) => {
    const categoryStyle: TextStyle = {
      color: getCategoryColor(item.category),
      padding: moderateScale(4),
      borderRadius: moderateScale(4),
      alignSelf: 'flex-start',
      opacity: 0.7,
      marginBottom: verticalScale(5),
      textShadowColor: 'gray',
      textShadowOffset: { height: 1, width: 1 },
      textShadowRadius: moderateScale(0.2),
      position: 'absolute',
      top: -15,
      right: scale(0),
      fontFamily: 'Poppins-Regular',
      fontSize: moderateScale(10),
    };

    const isTruncated = item.announcementContent.length > 60;

    return (
      <TouchableOpacity
        key={index}
        onPress={() => handleAnnouncementPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.outerAnnounceItem, { backgroundColor: getCategoryColor(item.category)}]}>
          <View style={styles.announcementItem}>
            <View style={styles.categoryContainer}>
              <View>
                <Text style={categoryStyle}>{item.category}{'\u25CF'}</Text>
              </View>
            </View>
            <Text style={styles.announcementTitleText}>{item.title}</Text>
            <Text numberOfLines={3} style={styles.announcementContent}>
              {truncateContent(item.announcementContent)}
              {isTruncated && (
                <Text style={styles.clickMoreText}>Click more to see</Text>
              )}
            </Text>
            <Text style={styles.announcementDate}>{formatDate(item.modified_at)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <ScrollView
        nestedScrollEnabled={true}
        onTouchStart={onScrollStart}
        onTouchEnd={onScrollEnd}
        contentContainerStyle={[
          styles.listContent,
          announcements.length <= 2 && styles.shortList,
        ]}
      >
        {announcements.map((item, index) => renderItem(item, index))}
      </ScrollView>

      {/* Announcement Detail Modal */}
      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.overlay}>
          <View style={styles.announcementModal}>
            <View style={[styles.modalHeader, { backgroundColor: selectedAnnouncement ? getCategoryColor(selectedAnnouncement.category) : '#b7e3cc' }]}>
              <Text style={styles.modalTitleStyled}>Announcement</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color="#333" />
              </TouchableOpacity>
            </View>

            {selectedAnnouncement && (
              <ScrollView style={styles.modalContent}>
                <View style={styles.categoryContainerModal}>
                  <Text style={[styles.categoryDot, { color: getCategoryColor(selectedAnnouncement.category) }]}>
                    {'\u25CF'} {selectedAnnouncement.category}
                  </Text>
                </View>

                <Text style={styles.modalAnnouncementTitle}>{selectedAnnouncement.title}</Text>

                <Text style={styles.modalAnnouncementContent}>
                  {selectedAnnouncement.announcementContent}
                </Text>

                <Text style={styles.modalAnnouncementDate}>
                  {formatDate(selectedAnnouncement.modified_at)}
                </Text>
              </ScrollView>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.backBtn, { backgroundColor: selectedAnnouncement ? getCategoryColor(selectedAnnouncement.category) : '#b7e3cc' }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
  outerAnnounceItem: {
    backgroundColor: 'orange',
    borderRadius: moderateScale(20),
    marginBottom: verticalScale(20),
  },
  announcementItem: {
    height: 140,
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
    marginTop: verticalScale(-5),
  },
  announcementDate: {
    fontSize: moderateScale(8),
    color: 'gray',
    position: 'absolute',
    bottom: verticalScale(5),
    right: scale(15),
    fontFamily: 'Lora-Regular',
  },
  shortList: {
    paddingVertical: verticalScale(10),
    flexGrow: 0,
  },
  // Modal Styles
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(49, 120, 115, 0.8)',
  },
  announcementModal: {
    width: '85%',
    maxHeight: '80%',
    borderRadius: moderateScale(15),
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: scale(0), height: verticalScale(3) },
    elevation: 5,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#b7e3cc',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(10),
    borderTopLeftRadius: moderateScale(15),
    borderTopRightRadius: moderateScale(15),
  },
  modalTitleStyled: {
    fontSize: moderateScale(18),
    color: '#333',
    fontFamily: 'Poppins-Bold',
  },
  modalContent: {
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(15),
    maxHeight: verticalScale(400),
  },
  categoryContainerModal: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: verticalScale(10),
  },
  categoryDot: {
    fontSize: moderateScale(14),
    fontFamily: 'Poppins-Regular',
    opacity: 0.8,
  },
  modalAnnouncementTitle: {
    fontSize: moderateScale(24),
    fontFamily: 'Poppins-Bold',
    color: '#333',
    marginBottom: verticalScale(10),
  },
  modalAnnouncementContent: {
    fontSize: moderateScale(15),
    fontFamily: 'Lora-Regular',
    color: '#555',
    textAlign: 'justify',
    marginBottom: verticalScale(15),
    lineHeight: moderateScale(22),
  },
  modalAnnouncementDate: {
    fontSize: moderateScale(12),
    fontFamily: 'Lora-Regular',
    color: 'gray',
    textAlign: 'right',
    marginBottom: verticalScale(10),
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(15),
  },
  backBtn: {
    backgroundColor: '#b7e3cc',
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(30),
    borderRadius: moderateScale(10),
  },
  backBtnText: {
    color: 'white',
    fontFamily: 'Poppins-ExtraBold',
    fontSize: moderateScale(15),
    shadowRadius: moderateScale(3),
    shadowOffset: { width: scale(1), height: verticalScale(1) },
    shadowColor: 'gray',
  },
  clickMoreText: {
    fontFamily: 'Lora-BoldItalic',
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#555',
  },
});
