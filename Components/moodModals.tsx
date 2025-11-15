import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');
const dotAreaWidth = width - 160;

const screens = [...Array(7).keys()]; // [0..6]

const screenList = [
  {
    lightColor: '#fff9c4',
    darkColor: '#ffcc4d',
    emoji: '😁',
    emotion: 'Happy',
  },
  {
    lightColor: '#d9b7e3',
    darkColor: '#7b1fa2',
    emoji: '🤩',
    emotion: 'Motivated',
  },
  {
    lightColor: '#c8e6c9',
    darkColor: '#388e3c',
    emoji: '😌',
    emotion: 'Calm',
  },
  {
    lightColor: '#ffe0b2',
    darkColor: '#f57c00',
    emoji: '😰',
    emotion: 'Anxious',
  },
  {
    lightColor: '#bbdefb',
    darkColor: '#4682b4',
    emoji: '😢',
    emotion: 'Sad',
  },
  {
    lightColor: '#cfd8dc',
    darkColor: '#455a64',
    emoji: '😴',
    emotion: 'Tired',
  },
  {
    lightColor: '#d9534f',
    darkColor: '#b91c1c',
    emoji: '😡',
    emotion: 'Angry',
  },
];

// To create infinite loop, we create a big list by repeating the screens many times:
const loopedScreens = Array(100).fill(screens).flat();

type InfiniteSwipeModalProps = {
  visible: boolean;
  handlePressMoodToday: (Mood : string) => void;
  onClose: () => void;
};


export default function InfiniteSwipeModal({ visible, handlePressMoodToday, onClose }: InfiniteSwipeModalProps) {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Initial index roughly at the middle of loopedScreens, so you can scroll both ways infinitely
  const initialIndex = loopedScreens.length / 2;

  // Scroll to initial index on mount
  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: initialIndex, animated: false });
        setCurrentIndex(initialIndex);
      }, 50);
    }
  }, [initialIndex, visible]);

  // When user scrolls, update currentIndex normalized to 0..6
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index ?? 0;
      setCurrentIndex(index);
    }
  }).current;

  // Compute current page normalized 0..6
  const currentPage = currentIndex % 7;

  const selectedEmotion = screenList[currentPage].emotion;
  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.flex1}>
        <FlatList
          ref={flatListRef}
          data={loopedScreens}
          horizontal
          pagingEnabled
          keyExtractor={(_, i) => i.toString()}
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
          renderItem={({ item }) => (
            <View style={[{ backgroundColor: screenList[item].lightColor }, { width, height }]}>
                <View style={styles.backButton}>
                  <TouchableOpacity onPress={onClose}>
                    <Ionicons name="arrow-back" size={25} color="#000" />
                  </TouchableOpacity>
                </View>
                <View style={styles.topPart}>
                    <Text style={[styles.fancy, {color: screenList[item].darkColor}]}>How are you</Text>
                    <Text style={[styles.fancy, {color: screenList[item].darkColor}]}>feeling</Text>
                    <Text style={[styles.Hard, {color: screenList[item].darkColor}]}>TODAY?</Text>
                    <Text style={styles.Emoji}>{screenList[item].emoji}</Text>
                </View>
            </View>
          )}
        />

        {/* Timeline bar with dots */}
        <View style={[styles.horizontalBar, {backgroundColor: screenList[currentPage].darkColor}]}><></></View>
        <View style={styles.timelineContainer}>
          {screens.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => {
                const targetIndex = currentIndex - (currentIndex % 7) + i;
                flatListRef.current?.scrollToIndex({ index: targetIndex, animated: true });
                setCurrentIndex(targetIndex);
              }}
            >
              <View style={[{backgroundColor: screenList[currentPage].darkColor}, styles.dot]} />
            </TouchableOpacity>
          ))}
          {/* Highlight dot */}
          <View
            style={[
              {backgroundColor: screenList[currentPage].lightColor},
              styles.highlightDot,
              { left: (dotAreaWidth / 7) * currentPage + (dotAreaWidth / 14) + 80 - 7 },
            ]}
          />
        </View>

        <TouchableOpacity
            style={ styles.button }
            onPress={() => handlePressMoodToday(selectedEmotion)}
        >
            <Text
                style={[
                    styles.strict,
                    {
                        backgroundColor: screenList[currentPage].darkColor,
                        color: screenList[currentPage].lightColor,
                    }]}
            >Are you {screenList[currentPage].emotion} today?</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  screen: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: moderateScale(36),
    fontWeight: 'bold',
  },
  timelineContainer: {
    position: 'absolute',
    bottom: verticalScale(180),
    width,
    height: verticalScale(20),
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: scale(80),
    zIndex: 1,
  },
  dot: {
    width: scale(20),
    height: verticalScale(20),
    borderRadius: moderateScale(9999),
  },
  highlightDot: {
    position: 'absolute',
    width: scale(14),
    height: verticalScale(14),
    borderRadius: moderateScale(7),
    bottom: verticalScale(3),
  },
  horizontalBar: {
    position: 'absolute',
    bottom: verticalScale(187.5),
    width,
    height: verticalScale(5),
  },
  fancy: {fontFamily: 'DancingScript-Regular', fontSize: moderateScale(70), marginBottom: -25, textAlign: 'center'},
  Hard: {fontFamily: 'Poppins-ExtraBold', fontSize: moderateScale(60), marginBottom: -15, textAlign: 'center'},
  Emoji: {fontSize: moderateScale(200), textAlign: 'center'},
  topPart: {marginHorizontal: 'auto', marginTop: verticalScale(30)},
  strict: {fontFamily: 'Lora-Regular', fontSize: moderateScale(30), textAlign: 'center', borderRadius: 20, padding: moderateScale(10)},
  button: {
    width: '75%',
    position: 'absolute',
    bottom: verticalScale(30),
    left: width / 2,
    transform: [{ translateX: -((width * 0.75) / 2) }],
  },
  backButton: {position: 'absolute', top: 20, left: 20, zIndex: 10},
});
