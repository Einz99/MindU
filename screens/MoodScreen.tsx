import React, { useEffect, useState, useMemo } from 'react';
import { Text, ScrollView, View, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import DrawerComponent from '../Components/DrawerComponent';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API } from '../apiConfigs';
import apiClient from '../APIClient';
import axios from 'axios';
import InfiniteSwipeModal from '../Components/moodModals';

type MoodDataItem = {
        date: Date;
        dayName: string;
        mood: string | null;
        moodIndex: number | null;
        barHeight: number;
        animatedHeight: Animated.Value; // Add this new property for animation
    };
export default function MoodScreen() {
    const [name, setName] = useState('');
    const [today, setToday] = useState('');
    const [moodData, setMoodData] = useState<MoodDataItem[]>([]);
    const [studentID, setStudentID] = useState(0);
    const [moodHistory, setMoodHistory] = useState(
        Array(7).fill({ emoji: '', label: '' }) // initialize 7 days
    );
    const [monthlyMoodCounts, setMonthlyMoodCounts] = useState<number[]>([]);
    const [modalVisible, setModalVisible] = useState(false);

    const todayCalendar = new Date();
    const [currentMonth, setCurrentMonth] = useState((todayCalendar.getMonth() - 1));
    const [currentYear, setCurrentYear] = useState(todayCalendar.getFullYear());
    const [reloadKey, setReloadKey] = useState(0);

    const resetPage = () => {
      setReloadKey(prev => prev + 1); // Change reloadKey to trigger useEffect
    };

    const months = [
      'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
      'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
    ];
    const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    const moods = useMemo(() => [
      { emoji: '😁', label: 'Happy', color: '#fff9c4' },
      { emoji: '🤩', label: 'Motivated', color: '#d9b7e3' },
      { emoji: '😌', label: 'Calm', color: '#c8e6c9' },
      { emoji: '😰', label: 'Anxious', color: '#ffe0b2' },
      { emoji: '😢', label: 'Sad', color: '#bbdefb' },
      { emoji: '😴', label: 'Tired', color: '#cfd8dc' },
      { emoji: '😡', label: 'Angry', color: '#d9534f' },
    ], []);

    const getEmoji = React.useCallback((label: string) => {
      const mood = moods.find((m) => m.label === label);
      return mood ? mood.emoji : '';
    }, [moods]);

    useEffect(() => {
        const currentDate = new Date();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        const dayName = days[currentDate.getDay()];
        const day = String(currentDate.getDate()).padStart(2, '0');
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const year = currentDate.getFullYear();

        const formattedDate = `${dayName}, ${month}/${day}/${year}`;
        setToday(formattedDate);

        const fetchUserName = async () => {
            const token = await AsyncStorage.getItem('userToken');
            if (token) {
                const response = await apiClient.get(`${API}/user`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (response.data && response.data.user) {
                    setName(response.data.user.firstName);
                    setStudentID(response.data.user.id);
                } else {
                    console.error('Failed to fetch user details.');
                }
            }
        };
        fetchUserName();

    }, [studentID, reloadKey]);

    useEffect(() => {
      if (!studentID) {
          return;
      }
      const fetchMood = async () => {
        try {
          const response = await axios.get(`${API}/moods/${studentID}`);
          if (!response || !response.data) {
              console.log('no Data');
              return;
          }

          const moodDatas = response.data;

          const sortedMoodData = [...moodDatas].sort((a: any, b: any) => {
            return new Date(b.emotion_dated).getTime() - new Date(a.emotion_dated).getTime();
          });

          const latest7 = sortedMoodData.slice(0, 7).reverse();

          const Today = new Date();
          const startOfWeek = new Date(Today);
          startOfWeek.setDate(Today.getDate() - Today.getDay());
          startOfWeek.setHours(0, 0, 0, 0);

          // Updated moodMap to always show day name and date
          const moodMap = latest7.map((item: any) => {
            const date = new Date(item.emotion_dated);

            return {
              emoji: getEmoji(item.emotion),
              label: item.emotion,
              dayName: date.toLocaleDateString('en-US', { weekday: 'short' }), // Always show day name
              dateStr: `${date.getMonth() + 1}/${date.getDate()}`, // Always show date
            };
          });

          const transformedData: MoodDataItem[] = response.data.map((item: any) => {
            const moodIndex = moods.findIndex(m => m.label === item.emotion);
            const dateObj = new Date(item.emotion_dated);
            let dayName: string;
            if (dateObj >= startOfWeek && dateObj <= Today) {
              dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' }); // e.g., "Tue"
            } else {
              dayName = dateObj.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }); // e.g., "05/14"
            }

          const barHeight = calculateBarHeight(moodIndex);

          // Initialize with 0 height for animation
          const animatedHeight = new Animated.Value(0);
            return {
              date: dateObj,
              dayName,
              mood: item.emotion,
              moodIndex,
              barHeight,
              animatedHeight,
            };
          });

          setMoodHistory(moodMap);
          setMoodData(transformedData);
          // Start animations after a short delay to ensure components are mounted
          setTimeout(() => {
            startBarAnimations(transformedData);
          }, 300);
        } catch (error) {
          console.error('Failed to fetch mood data:', error);
        }
      };

      fetchMood();
    }, [getEmoji, moods, studentID, reloadKey]);

    // Function to start bar animations
    const startBarAnimations = (data: MoodDataItem[]) => {
      // Create animation sequence with staggered starts
      data.forEach((item, index) => {
        Animated.timing(item.animatedHeight, {
          toValue: item.barHeight,
          duration: 3000, // 5 seconds animation
          delay: index * 100, // Stagger start for visual appeal
          useNativeDriver: false, // height animations cannot use native driver
        }).start();
      });
    };

    useEffect(() => {
      const counts = moods.map((_, index) => {
        return moodData.filter(item =>
          item.moodIndex === index &&
          item.date.getMonth() === currentMonth &&
          item.date.getFullYear() === currentYear
        ).length;
      });

      setMonthlyMoodCounts(counts);
    }, [moodData, currentMonth, currentYear, moods, reloadKey]);

    const calculateBarHeight = (moodIndex : number) => {
      // In our example, the moods are in reverse order (Happy at top, Angry at bottom)
      // So we need to calculate the height accordingly
      if (moodIndex === null) {return 0;}

      // Calculate the height based on which mood row the bar belongs to
      // Each mood row is 40px height
      return verticalScale(39.5 * (6 - moodIndex) + 10 + (1.5 * moodIndex)); // 6 is the max index (7 moods - 1)
    };

    const generateCalendarDays = () => {
      const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
      const daysInMonth = lastDayOfMonth.getDate();
      const firstDayOfWeek = firstDayOfMonth.getDay();
      const daysFromPrevMonth = firstDayOfWeek;
      const lastDayOfWeek = lastDayOfMonth.getDay();
      const daysFromNextMonth = 6 - lastDayOfWeek;

      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();

      const calendarDays = [];

      // Previous month's days
      for (let i = daysInPrevMonth - daysFromPrevMonth + 1; i <= daysInPrevMonth; i++) {
        calendarDays.push({
          day: i,
          month: prevMonth,
          year: prevYear,
          isCurrentMonth: false,
        });
      }

      // Current month's days
      for (let i = 1; i <= daysInMonth; i++) {
        calendarDays.push({
          day: i,
          month: currentMonth,
          year: currentYear,
          isCurrentMonth: true,
        });
      }

      // Next month's days
      for (let i = 1; i <= daysFromNextMonth; i++) {
        calendarDays.push({
          day: i,
          month: nextMonth,
          year: nextYear,
          isCurrentMonth: false,
        });
      }

      return calendarDays;
    };

    const calendarDays = generateCalendarDays();
    const weeks = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      weeks.push(calendarDays.slice(i, i + 7));
    }

    const navigateMonth = (direction: string) => {
      if (direction === 'prev') {
        if (currentMonth === 0) {
          setCurrentMonth(11);
          setCurrentYear(currentYear - 1);
        } else {
          setCurrentMonth(currentMonth - 1);
        }
      } else {
        if (currentMonth === 11) {
          setCurrentMonth(0);
          setCurrentYear(currentYear + 1);
        } else {
          setCurrentMonth(currentMonth + 1);
        }
      }
    };

    useEffect(() => {
      const timer = setTimeout(() => {
        setCurrentMonth((todayCalendar.getMonth() - 1));
        navigateMonth('next');
      }, 500);
      return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleMoodToday = async (Mood : string) => {
      try {
        const response = await axios.post(`${API}/moods/upsert`, {
          student_id: studentID,
          mood: Mood,
        });

        try {
          // Log student activity for the Wellness module
          await axios.post(`${API}/student-activities/insert`, { module: 'Mood' });
        } catch (err) {
          console.error('Error logging student activity:', err);
        }

        console.log('Success:', response.data.message);
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          // error is an AxiosError, safe to access response and message
          console.warn('Failed:', error.response?.data?.message ?? error.message);
        } else if (error instanceof Error) {
          console.error('Error sending mood:', error.message);
        } else {
          console.error('Unknown error', error);
        }
      }
    };

    const handlePressMoodToday = (Mood : string) => {
      handleMoodToday(Mood);
      setModalVisible(false);
      resetPage();
    };

    useEffect(() => {
      const interval = setInterval(() => {
        resetPage();
      }, 15000);
      return () => clearInterval(interval);
    }, []);

    return (
        <View style={styles.screen}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
              bounces={true}
              nestedScrollEnabled={true}
            >
            <DrawerComponent Initial={'Mood tracker'} />
                <View style={styles.container}>
                    <View style={styles.titleBox}>
                        <Text style={styles.title}>Mood Tracker</Text>
                    </View>
                </View>
                <View style={styles.greetingContainer}>
                    <Text style={styles.greetingsName}>
                        Hi, {name}!
                    </Text>
                    <Text style={styles.greetingsSubtitle}>
                        How are you feeling today?
                    </Text>
                </View>
                <View style={styles.MoodContainers}>
                    <View style={styles.MoodHistoryTitleContainer}>
                        <Text style={styles.MoodHistoryTitle}>Mood History</Text>
                        <View style={styles.MoodHistoryTitleVerticalLine}><></></View>
                        <Text style={styles.MoodHistoryDate}>{today}</Text>
                    </View>
                    <View style={styles.Moods}>
                      {[
                        ...Array(7 - moodHistory.slice(-7).length).fill(null),  // fillers first
                        ...moodHistory.slice(-7),                               // moods last
                      ].map((item, index) => (
                        <View key={index} style={styles.Mood}>
                          {item?.emoji ? (
                            <Text style={styles.MoodText}>{item.emoji}</Text>
                          ) : (
                            <View style={styles.MoodEmpty} />
                          )}
                          <Text style={styles.moodDays}>{item?.dayName || 'none'}</Text>
                          <Text style={styles.moodDates}>{item?.dateStr || 'none'}</Text>
                          <Text style={styles.MoodLabel}>{item?.label || 'none'}</Text>
                        </View>
                      ))}
                    </View>
                    <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.buttonContainer}><Text style={styles.todayButton}>Enter your mood for today</Text></TouchableOpacity>
                </View>
                <View style={styles.MoodContainers}>
                    <Text style={styles.GraphTitle}>Weekly Mood Graph</Text>
                    <View style={styles.graphContainer}>
                      {/* Mood emojis on the left side */}
                      <View style={styles.moodLabels}>
                        {moods.map((mood, index) => (
                          <View key={index} style={styles.moodRow}>
                            <Text style={styles.emoji}>{mood.emoji}</Text>
                          </View>
                        ))}
                      </View>
                      {/* Horizontal grid lines */}
                      <View style={styles.gridContainer}>
                        {moods.map((_, index) => (
                          <View key={index} style={styles.gridLine} />
                        ))}

                        {/* Vertical and horizontal axes */}
                        <View style={styles.horizontalAxis} />
                        <View style={styles.verticalAxis} />

                        {/* Days and mood bars */}
                        <View style={styles.daysAndBars}>
                          {moodData.slice(-7).map((day, index) => (
                            <View key={index} style={styles.dayColumn}>
                              {/* Bar for the mood if exists */}
                              {day.mood && (
                                <Animated.View
                                  key={((day.moodIndex || 0 ) + reloadKey)}
                                  style={[
                                    styles.moodBar,
                                    // eslint-disable-next-line react-native/no-inline-styles
                                    {
                                      backgroundColor: day.moodIndex !== null ? moods[day.moodIndex].color : '#fff',
                                      height: day.animatedHeight, // Use animated value instead
                                    },
                                  ]}
                                />
                              )}
                              {/* Day label */}
                              <Text style={styles.dayLabel}>{day.dayName}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    </View>
                </View>
                <View style={styles.calendarContainer}>
                    <View style={styles.MonthNavigatorBG}>
                          <Text style={styles.yearText}>{currentYear}</Text>
                        <View style={styles.monthNavigator}>
                          <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.navButton}>
                            <Text style={styles.navButtonText}>◀</Text>
                          </TouchableOpacity>
                          <Text style={styles.monthText}>{months[currentMonth]}</Text>
                          <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.navButton}>
                            <Text style={styles.navButtonText}>▶</Text>
                          </TouchableOpacity>
                        </View>
                    </View>
                    <View key={`${currentYear}-${currentMonth}`} style={styles.calendar}>
                      <View style={styles.daysHeader}>
                        {daysOfWeek.map((day, index) => (
                          <Text key={index} style={styles.dayName}>
                            {day}
                          </Text>
                        ))}
                      </View>
                      <View>
                          {weeks.map((week, index) => (
                            <View key={index} style={styles.week}>
                              {week.map((day, i) => {
                                // Construct full date string for comparison
                                const thisDate = new Date(day.year, day.month, day.day);
                                const moodForDay = moodData.find(
                                  (m) =>
                                    m.date.getFullYear() === thisDate.getFullYear() &&
                                    m.date.getMonth() === thisDate.getMonth() &&
                                    m.date.getDate() === thisDate.getDate()
                                );

                                return (
                                  <View key={i} style={styles.day}>
                                    <View
                                      style={[
                                        styles.dayBGSettings,
                                        !moodForDay ? styles.dayBGNoEmoji :
                                        day.isCurrentMonth ? styles.dayBGCurrent : styles.dayBGNotCurrent,
                                      ]}
                                    >
                                      <Text
                                        style={[
                                          styles.dayText,
                                          !day.isCurrentMonth && styles.otherMonthDayText,
                                          day.isCurrentMonth &&
                                            day.day === todayCalendar.getDate() &&
                                            currentMonth === todayCalendar.getMonth() &&
                                            currentYear === todayCalendar.getFullYear() &&
                                            styles.todayText,
                                        ]}
                                      >
                                        {day.day}
                                      </Text>

                                      {/* Show emoji if matched mood exists, else show empty */}
                                      {moodForDay ? (
                                        <Text style={styles.calendarEmoji}>
                                          {moodForDay.moodIndex !== null && moodForDay.moodIndex >= 0 && moodForDay.moodIndex < moods.length
                                            && moods[moodForDay.moodIndex].emoji}
                                        </Text>
                                      ) : (
                                        <View style={styles.emptyEmoji}><></></View>
                                      )}
                                    </View>
                                  </View>
                                );
                              })}
                            </View>
                          ))}
                        </View>
                    </View>
                </View>
                <View style={styles.SummaryContainer}>
                    <Text style={styles.SummaryTitle}>Mood Monthly Summary</Text>
                     <View style={styles.SummaryMoodContainer}>
                        <View style={styles.BeforeSummarized}>
                          <View style={[{ backgroundColor: moods[0].color }, styles.SummarizedContainer]}>
                            <Text style={styles.SummarizedText}>😁 {monthlyMoodCounts[0] || 0} {monthlyMoodCounts[0] <= 1 ? 'DAY' : 'DAYS'}</Text>
                          </View>
                          <View style={[{ backgroundColor: moods[2].color }, styles.SummarizedContainer]}>
                            <Text style={styles.SummarizedText}>😌 {monthlyMoodCounts[2] || 0} {monthlyMoodCounts[2] <= 1 ? 'DAY' : 'DAYS'}</Text>
                          </View>
                          <View style={[{ backgroundColor: moods[4].color }, styles.SummarizedContainer]}>
                            <Text style={styles.SummarizedText}>😢 {monthlyMoodCounts[4] || 0} {monthlyMoodCounts[4] <= 1 ? 'DAY' : 'DAYS'}</Text>
                          </View>
                          <View style={[{ backgroundColor: moods[6].color }, styles.SummarizedContainer]}>
                            <Text style={styles.SummarizedText}>😡 {monthlyMoodCounts[6] || 0} {monthlyMoodCounts[6] <= 1 ? 'DAY' : 'DAYS'}</Text>
                          </View>
                        </View>

                        <View style={styles.BeforeSummarized}>
                          <View style={[{ backgroundColor: moods[1].color }, styles.SummarizedContainer]}>
                            <Text style={styles.SummarizedText}>🤩 {monthlyMoodCounts[1] || 0} {monthlyMoodCounts[1] <= 1 ? 'DAY' : 'DAYS'}</Text>
                          </View>
                          <View style={[{ backgroundColor: moods[3].color }, styles.SummarizedContainer]}>
                            <Text style={styles.SummarizedText}>😰 {monthlyMoodCounts[3] || 0} {monthlyMoodCounts[3] <= 1 ? 'DAY' : 'DAYS'}</Text>
                          </View>
                          <View style={[{ backgroundColor: moods[5].color }, styles.SummarizedContainer]}>
                            <Text style={styles.SummarizedText}>😴 {monthlyMoodCounts[5] || 0} {monthlyMoodCounts[5] <= 1 ? 'DAY' : 'DAYS'}</Text>
                          </View>
                        </View>
                    </View>
                    <Text style={styles.MostDays}>
                        Most days, this {todayCalendar.toLocaleString('default', { month: 'long' })} you felt {moods[monthlyMoodCounts.reduce(
                              (maxIdx, currentValue, currentIndex, array) =>
                                currentValue > array[maxIdx] ? currentIndex : maxIdx,
                              0
                            )].label}.</Text>
                </View>
            </ScrollView>

            <InfiniteSwipeModal visible={modalVisible} handlePressMoodToday={handlePressMoodToday}/>
        </View>
    );
}

const { height, width } = Dimensions.get('window');

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: verticalScale(120),
    },
    container: {
        width: '100%',
        alignItems: 'center',
    },
    titleBox: {
        backgroundColor: '#b7e3cc',
        paddingVertical: verticalScale(5),
        paddingHorizontal: scale(50),
        borderRadius: moderateScale(25),
        marginTop: verticalScale(10),
        marginBottom: verticalScale(10),
    },
    title: {
        fontSize: moderateScale(15),
        letterSpacing: moderateScale(2),
        fontFamily: 'Poppins-Bold',
        color: 'black',
    },
    greetingContainer: {
        alignItems: 'flex-start',
        justifyContent: 'center',
        marginTop: verticalScale(20),
        paddingHorizontal: scale(20),
    },
    greetingsName: {
        fontFamily: 'Poppins-Bold',
        fontSize: moderateScale(25),
        color: '#317873',
        marginBottom: -10,
    },
    greetingsSubtitle: {
        fontFamily: 'Lora-Regular',
        fontSize: moderateScale(15),
        color: 'black',
    },
    MoodContainers: {
        backgroundColor: '#b7e3cc',
        borderRadius: moderateScale(15),
        paddingHorizontal: scale(20),
        paddingVertical: verticalScale(10),
        marginTop: verticalScale(20),
        marginHorizontal: scale(20),
    },
    MoodHistoryTitleContainer: {
        flexDirection: 'row',
        gap: moderateScale(10),
        marginBottom: -5,
    },
    MoodHistoryTitle: {
        fontFamily: 'Poppins-Bold',
        fontSize: moderateScale(18),
        color: 'black',
        textTransform: 'uppercase',
        width: '50%',
        textAlignVertical: 'center',
    },
    MoodHistoryTitleVerticalLine: { width: scale(1.5), backgroundColor: 'gray', height: verticalScale(25)},
    MoodHistoryDate: {
        fontFamily: 'Lora-Regular',
        fontSize: moderateScale(12),
        color: 'black',
        marginLeft: scale(5),
        top: verticalScale(5),
    },
    Moods: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: moderateScale(1),
        paddingBottom: verticalScale(10),
        borderBottomColor: '#666',
    },
    Mood: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    MoodText: {
        fontSize: moderateScale(30),
        width: scale(40),
        height: verticalScale(40),
        textAlign: 'center',
        borderRadius: moderateScale(22),
        overflow: 'hidden',
        marginTop: verticalScale(5),
        marginBottom: verticalScale(-3),
    },
    MoodEmpty: {
        width: scale(35),
        height: verticalScale(35),
        borderRadius: moderateScale(22),
        backgroundColor: '#b7e3cc',
        marginBottom: verticalScale(4),
        borderWidth: moderateScale(2),
        borderColor: '#4b946a',
        borderStyle: 'dashed',
        marginVertical: verticalScale(7),
    },
    moodDays: {
        color: '#666',
        fontSize: moderateScale(12),
        fontFamily: 'Lora-Regular',
    },
    moodDates: {
        color: '#666',
        fontSize: moderateScale(10),
        fontFamily: 'Lora-Regular',
    },
    MoodLabel: {
        fontSize: moderateScale(8),
        color: '#444',
        fontFamily: 'Lora-Bold',
    },
    buttonContainer: {
        alignItems: 'center',
        marginTop: verticalScale(10),
    },
    todayButton: {
        color: 'white',
        fontFamily: 'Poppins-Bold',
        textAlign: 'center',
        padding: moderateScale(8),
        backgroundColor: '#4b946a',
        width: '80%',
        borderRadius: moderateScale(25),
    },
    GraphTitle: {
        fontFamily: 'Poppins-Bold',
        fontSize: moderateScale(18),
        color: 'black',
        textTransform: 'uppercase',
        textAlignVertical: 'center',
    },
    graphContainer: {
      flexDirection: 'row',
      height: verticalScale(300),
      marginBottom: verticalScale(10),
    },
    moodLabels: {
      width: scale(40),
      marginRight: scale(10),
    },
    moodRow: {
      height: verticalScale(37.5),
      alignItems: 'center',
      flexDirection: 'row',
    },
    emoji: {
      fontSize: moderateScale(24),
    },
    gridContainer: {
      flex: 1,
      position: 'relative',
    },
    gridLine: {
      marginTop: verticalScale(20),
      height: verticalScale(1),
      backgroundColor: '#555',
      width: '100%',
      marginBottom: verticalScale(17), // 40px total height per row
    },
    horizontalAxis: {
      height: verticalScale(2),
      backgroundColor: '#000',
      width: '123%',
      position: 'absolute',
      bottom: verticalScale(30), // Space for day labels
      left: -55,
    },
    verticalAxis: {
      width: scale(2),
      backgroundColor: '#000',
      height: '100%',
      position: 'absolute',
      left: scale(0),
    },
    daysAndBars: {
      flexDirection: 'row',
      position: 'absolute',
      bottom: verticalScale(2.5),
      left: scale(0),
      right: scale(0),
      height: '100%',
      paddingLeft: scale(5), // Space from vertical axis
    },
    dayColumn: {
      width: scale(32.5),
      alignItems: 'center',
      position: 'relative',
      height: '100%',
      marginLeft: scale(1),
    },
    moodBar: {
      width: scale(30),
      position: 'absolute',
      bottom: verticalScale(30), // Above day labels
      backgroundColor: '#fff9c4',
      borderWidth: moderateScale(0.5),
      borderColor: '#333',
      borderBottomWidth: moderateScale(0),
    },
    dayLabel: {
      position: 'absolute',
      bottom: verticalScale(5),
      fontSize: moderateScale(10),
      textAlign: 'center',
      fontFamily: 'Lora-Bold',
      color: 'black',
    },
    calendarContainer: {
      padding: moderateScale(20),
      alignItems: 'center',
    },
    yearText: {
      fontSize: moderateScale(25),
      fontFamily: 'Lora-Bold',
      marginBottom: verticalScale(10),
      color: 'white',
    },
    MonthNavigatorBG: {
      width: '100%',
      paddingHorizontal: '10%',
      backgroundColor: '#4b946a',
      borderTopLeftRadius: moderateScale(10),
      borderTopRightRadius: moderateScale(10),
      alignItems: 'center',
    },
    monthNavigator: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: verticalScale(10),
    },
    navButton: {
      textAlignVertical: 'center',
      marginBottom: verticalScale(10),
    },
    navButtonText: {
      fontSize: moderateScale(18),
    },
    monthText: {
      fontSize: moderateScale(22),
      fontFamily: 'Poppins-ExtraBold',
      marginHorizontal: scale(20),
      color: 'black',
    },
    calendar: {
      backgroundColor: '#cfe8d5',
      padding: moderateScale(10),
      borderRadius: moderateScale(10),
      width: '100%',
    },
    daysHeader: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: verticalScale(8),
    },
    dayName: {
      fontSize: moderateScale(12),
      fontFamily: 'Poppins-Bold',
      color: 'black',
      width: scale(30),
      textAlign: 'center',
    },
    week: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginVertical: verticalScale(4),
    },
    day: {
      width: scale(30),
      height: verticalScale(50),
      justifyContent: 'center',
      alignItems: 'center',
    },
    dayText: {
      fontSize: moderateScale(14),
      color: 'black',
      fontFamily: 'Lora-Regular',
      textAlign: 'center',
    },
    otherMonthDayText: {
      color: '#aaa',
    },
    todayText: {
      color: 'white',
    },
    dayBGCurrent: {
      backgroundColor: '#317873',
    },
    dayBGNotCurrent: {
      backgroundColor: '#bfbdbc',
    },
    dayBGNoEmoji: {
      backgroundColor: 'transparent',
    },
    dayBGSettings: {
      width: scale(25),
      borderRadius: moderateScale(9999),
      padding: moderateScale(3),
    },
    calendarEmoji: {
        textAlign: 'center',
        fontSize: moderateScale(16),
        color: 'black',
    },
    emptyEmoji: {
        backgroundColor: 'transparent',
        width: scale(20),
        height: verticalScale(20),
    },
    SummaryContainer: {
        flex: 1,
        alignItems: 'center',
        padding: moderateScale(20),
    },
    SummaryTitle: {
        fontFamily: 'Poppins-Bold',
        fontSize: moderateScale(25),
        color: '#317873',
    },
    SummaryMoodContainer: {
        flex: 1,
        flexDirection: 'row',
        gap: moderateScale(20),
    },
    BeforeSummarized: {
        flexDirection: 'column',
        gap: moderateScale(10),
        justifyContent: 'center',
    },
    SummarizedContainer:{
        height: verticalScale(35),
        width: scale(100),
        borderRadius: moderateScale(9999),
        paddingVertical: verticalScale(7.5),
    },
    SummarizedText: {
        fontFamily: 'Poppins-Bold',
        fontSize: moderateScale(15),
        color: 'black',
        textAlignVertical: 'center',
        textAlign: 'center',
    },
    MostDays: {
        margin: 20,
        width: '100%',
        height: verticalScale(80),
        borderRadius: moderateScale(22),
        borderColor: '#317873',
        color: 'black',
        fontFamily: 'Lora-Regular',
        fontSize: moderateScale(20),
        textAlign: 'center',
        textAlignVertical: 'center',
        borderWidth: moderateScale(2),
        paddingHorizontal: scale(5),
    },
    modalContainer: {
      flex: 1,
      backgroundColor: '#fff', // Change to rgba() for semi-transparency
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalBG: { position: 'absolute', top: verticalScale(0), width: width, height: height },
});

