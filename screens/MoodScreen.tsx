import React, { useEffect, useState, useMemo } from 'react';
import { Text, ScrollView, View, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
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

          const moodMap = latest7.map((item: any) => {
            const date = new Date(item.emotion_dated);
            const isThisWeek = date >= startOfWeek;

            return {
              emoji: getEmoji(item.emotion),
              label: item.emotion,
              dayName: isThisWeek
                ? date.toLocaleDateString('en-US', { weekday: 'short' })
                : `${date.getMonth() + 1}/${date.getDate()}`,
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
      return 39.5 * (6 - moodIndex) + 10 + (1.5 * moodIndex); // 6 is the max index (7 moods - 1)
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
        paddingBottom: 120,
    },
    container: {
        width: '100%',
        alignItems: 'center',
    },
    titleBox: {
        backgroundColor: '#b7e3cc',
        paddingVertical: 5,
        paddingHorizontal: 50,
        borderRadius: 25,
        marginTop: 10,
        marginBottom: 10,
    },
    title: {
        fontSize: 15,
        letterSpacing: 2,
        fontFamily: 'Poppins-Bold',
        color: 'black',
    },
    greetingContainer: {
        alignItems: 'flex-start',
        justifyContent: 'center',
        marginTop: 20,
        paddingHorizontal: 20,
    },
    greetingsName: {
        fontFamily: 'Poppins-Bold',
        fontSize: 25,
        color: '#317873',
        marginBottom: -10,
    },
    greetingsSubtitle: {
        fontFamily: 'Lora-Regular',
        fontSize: 15,
        color: 'black',
    },
    MoodContainers: {
        backgroundColor: '#b7e3cc',
        borderRadius: 15,
        paddingHorizontal: 20,
        paddingVertical: 10,
        marginTop: 20,
        marginHorizontal: 20,
    },
    MoodHistoryTitleContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: -5,
    },
    MoodHistoryTitle: {
        fontFamily: 'Poppins-Bold',
        fontSize: 18,
        color: 'black',
        textTransform: 'uppercase',
        width: '50%',
        textAlignVertical: 'center',
    },
    MoodHistoryTitleVerticalLine: { width: 1.5, backgroundColor: 'gray', height: 25},
    MoodHistoryDate: {
        fontFamily: 'Lora-Regular',
        fontSize: 12,
        color: 'black',
        marginLeft: 5,
        top: 5,
    },
    Moods: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        paddingBottom: 10,
        borderBottomColor: '#666',
    },
    Mood: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    MoodText: {
        fontSize: 30,
        width: 40,
        height: 40,
        textAlign: 'center',
        borderRadius: 22,
        overflow: 'hidden',
        marginBottom: 4,
    },
    MoodEmpty: {
        width: 35,
        height: 35,
        borderRadius: 22,
        backgroundColor: '#b7e3cc',
        marginBottom: 4,
        borderWidth: 2,
        borderColor: '#4b946a',
        borderStyle: 'dashed',
        marginVertical: 7,
    },
    moodDays: {
        color: '#666',
        fontSize: 12,
        fontFamily: 'Lora-Regular',
    },
    MoodLabel: {
        fontSize: 8,
        color: '#444',
        fontFamily: 'Lora-Bold',
    },
    buttonContainer: {
        alignItems: 'center',
        marginTop: 10,
    },
    todayButton: {
        color: 'white',
        fontFamily: 'Poppins-Bold',
        textAlign: 'center',
        padding: 8,
        backgroundColor: '#4b946a',
        width: '80%',
        borderRadius: 25,
    },
    GraphTitle: {
        fontFamily: 'Poppins-Bold',
        fontSize: 18,
        color: 'black',
        textTransform: 'uppercase',
        textAlignVertical: 'center',
    },
    graphContainer: {
      flexDirection: 'row',
      height: 300,
      marginBottom: 10,
    },
    moodLabels: {
      width: 40,
      marginRight: 10,
    },
    moodRow: {
      height: 37.5,
      alignItems: 'center',
      flexDirection: 'row',
    },
    emoji: {
      fontSize: 24,
    },
    gridContainer: {
      flex: 1,
      position: 'relative',
    },
    gridLine: {
      marginTop: 20,
      height: 1,
      backgroundColor: '#555',
      width: '100%',
      marginBottom: 17, // 40px total height per row
    },
    horizontalAxis: {
      height: 2,
      backgroundColor: '#000',
      width: '123%',
      position: 'absolute',
      bottom: 30, // Space for day labels
      left: -55,
    },
    verticalAxis: {
      width: 2,
      backgroundColor: '#000',
      height: '100%',
      position: 'absolute',
      left: 0,
    },
    daysAndBars: {
      flexDirection: 'row',
      position: 'absolute',
      bottom: 2.5,
      left: 0,
      right: 0,
      height: '100%',
      paddingLeft: 5, // Space from vertical axis
    },
    dayColumn: {
      width: 32.5,
      alignItems: 'center',
      position: 'relative',
      height: '100%',
      marginLeft: 1,
    },
    moodBar: {
      width: 30,
      position: 'absolute',
      bottom: 30, // Above day labels
      backgroundColor: '#fff9c4',
      borderWidth: 0.5,
      borderColor: '#333',
      borderBottomWidth: 0,
    },
    dayLabel: {
      position: 'absolute',
      bottom: 5,
      fontSize: 10,
      textAlign: 'center',
      fontFamily: 'Lora-Bold',
      color: 'black',
    },
    calendarContainer: {
      padding: 20,
      alignItems: 'center',
    },
    yearText: {
      fontSize: 25,
      fontFamily: 'Lora-Bold',
      marginBottom: 10,
      color: 'white',
    },
    MonthNavigatorBG: {
      width: '100%',
      paddingHorizontal: '10%',
      backgroundColor: '#4b946a',
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
      alignItems: 'center',
    },
    monthNavigator: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    navButton: {
      textAlignVertical: 'center',
      marginBottom: 10,
    },
    navButtonText: {
      fontSize: 18,
    },
    monthText: {
      fontSize: 22,
      fontFamily: 'Poppins-ExtraBold',
      marginHorizontal: 20,
      color: 'black',
    },
    calendar: {
      backgroundColor: '#cfe8d5',
      padding: 10,
      borderRadius: 10,
      width: '100%',
    },
    daysHeader: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 8,
    },
    dayName: {
      fontSize: 12,
      fontFamily: 'Poppins-Bold',
      color: 'black',
      width: 30,
      textAlign: 'center',
    },
    week: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginVertical: 4,
    },
    day: {
      width: 30,
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
    },
    dayText: {
      fontSize: 14,
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
      width: 25,
      borderRadius: 9999,
      padding: 3,
    },
    calendarEmoji: {
        textAlign: 'center',
        fontSize: 16,
        color: 'black',
    },
    emptyEmoji: {
        backgroundColor: 'transparent',
        width: 20,
        height: 20,
    },
    SummaryContainer: {
        flex: 1,
        alignItems: 'center',
        padding: 20,
    },
    SummaryTitle: {
        fontFamily: 'Poppins-Bold',
        fontSize: 25,
        color: '#317873',
    },
    SummaryMoodContainer: {
        flex: 1,
        flexDirection: 'row',
        gap: 20,
    },
    BeforeSummarized: {
        flexDirection: 'column',
        gap: 10,
        justifyContent: 'center',
    },
    SummarizedContainer:{
        height: 35,
        width: 100,
        borderRadius: 9999,
        paddingVertical: 7.5,
    },
    SummarizedText: {
        fontFamily: 'Poppins-Bold',
        fontSize: 15,
        color: 'black',
        textAlignVertical: 'center',
        textAlign: 'center',
    },
    MostDays: {
        margin: 20,
        width: '100%',
        height: 80,
        borderRadius: 22,
        borderColor: '#317873',
        color: 'black',
        fontFamily: 'Lora-Regular',
        fontSize: 20,
        textAlign: 'center',
        textAlignVertical: 'center',
        borderWidth: 2,
        paddingHorizontal: 5,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: '#fff', // Change to rgba() for semi-transparency
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalBG: { position: 'absolute', top: 0, width: width, height: height },
});

