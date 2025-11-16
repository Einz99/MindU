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
        animatedHeight: Animated.Value;
    };
export default function MoodScreen() {
    const [name, setName] = useState('');
    const [today, setToday] = useState('');
    const [moodData, setMoodData] = useState<MoodDataItem[]>([]);
    const [studentID, setStudentID] = useState(0);
    const [moodHistory, setMoodHistory] = useState(
        Array(7).fill({ emoji: '', label: '', dayName: '', dateStr: '' })
    );
    const [monthlyMoodCounts, setMonthlyMoodCounts] = useState<number[]>([]);
    const [modalVisible, setModalVisible] = useState(false);

    const todayCalendar = new Date();
    const [currentMonth, setCurrentMonth] = useState((todayCalendar.getMonth() - 1));
    const [currentYear, setCurrentYear] = useState(todayCalendar.getFullYear());
    const [reloadKey, setReloadKey] = useState(0);

    const resetPage = () => {
      setReloadKey(prev => prev + 1);
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

    // Helper function to get last 7 days including today
    const getLast7Days = () => {
      const days = [];
      const currentday = new Date();
      currentday.setHours(0, 0, 0, 0);

      for (let i = 6; i >= 0; i--) {
        const date = new Date(currentday);
        date.setDate(currentday.getDate() - i);
        days.push(date);
      }
      return days;
    };

    // // Helper function to get current week (Sun-Sat)
    // const getCurrentWeek = () => {
    //   const days = [];
    //   const today = new Date();
    //   today.setHours(0, 0, 0, 0);

    //   // Get Sunday of current week
    //   const sunday = new Date(today);
    //   sunday.setDate(today.getDate() - today.getDay());

    //   // Get all 7 days from Sunday to Saturday
    //   for (let i = 0; i < 7; i++) {
    //     const date = new Date(sunday);
    //     date.setDate(sunday.getDate() + i);
    //     days.push(date);
    //   }
    //   return days;
    // };

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

          // Get last 7 days for mood history (including today)
          const last7Days = getLast7Days();

          // Map mood data to last 7 days
          const moodMap = last7Days.map((date) => {
            const moodForDay = moodDatas.find((item: any) => {
              const moodDate = new Date(item.emotion_dated);
              moodDate.setHours(0, 0, 0, 0);
              return moodDate.getTime() === date.getTime();
            });

            if (moodForDay) {
              return {
                emoji: getEmoji(moodForDay.emotion),
                label: moodForDay.emotion,
                dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
                dateStr: `${date.getMonth() + 1}/${date.getDate()}`,
              };
            }

            // Return empty data if no mood for that day
            return {
              emoji: '',
              label: '',
              dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
              dateStr: `${date.getMonth() + 1}/${date.getDate()}`,
            };
          });

          // Get current week (Mon-Sun) for graph
          const currentDay = new Date();
          currentDay.setHours(0, 0, 0, 0);

          // Get Monday of current week
          const monday = new Date(currentDay);
          const dayOfWeek = currentDay.getDay();
          const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday, go back 6 days
          monday.setDate(currentDay.getDate() - daysFromMonday);
          monday.setHours(0, 0, 0, 0);

          // Create array of 7 days starting from Monday
          const currentWeek = [];
          for (let i = 0; i < 7; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            currentWeek.push(date);
          }

          // Map mood data for graph - only show up to today
          const transformedData: MoodDataItem[] = currentWeek.map((date) => {
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

            // If date is in the future, return empty data
            if (date > currentDay) {
              return {
                date,
                dayName,
                mood: null,
                moodIndex: null,
                barHeight: 0,
                animatedHeight: new Animated.Value(0),
              };
            }

            // Find mood for this date
            const moodForDay = moodDatas.find((item: any) => {
              const moodDate = new Date(item.emotion_dated);
              moodDate.setHours(0, 0, 0, 0);
              return moodDate.getTime() === date.getTime();
            });

            if (moodForDay) {
              const moodIndex = moods.findIndex(m => m.label === moodForDay.emotion);
              const barHeight = calculateBarHeight(moodIndex);
              const animatedHeight = new Animated.Value(0);

              return {
                date,
                dayName,
                mood: moodForDay.emotion,
                moodIndex,
                barHeight,
                animatedHeight,
              };
            }

            // Return empty data for past days with no mood
            return {
              date,
              dayName,
              mood: null,
              moodIndex: null,
              barHeight: 0,
              animatedHeight: new Animated.Value(0),
            };
          });

          setMoodHistory(moodMap);
          setMoodData(transformedData);

          // Start animations after a short delay
          setTimeout(() => {
            startBarAnimations(transformedData);
          }, 300);
        } catch (error) {
          console.error('Failed to fetch mood data:', error);
        }
      };

      fetchMood();
    }, [getEmoji, moods, studentID, reloadKey]);

    const startBarAnimations = (data: MoodDataItem[]) => {
      data.forEach((item, index) => {
        if (item.barHeight > 0) {
          Animated.timing(item.animatedHeight, {
            toValue: item.barHeight,
            duration: 3000,
            delay: index * 100,
            useNativeDriver: false,
          }).start();
        }
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
      if (moodIndex === null) {return 0;}
      return verticalScale(39.5 * (6 - moodIndex) + 10 + (1.5 * moodIndex));
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

      for (let i = daysInPrevMonth - daysFromPrevMonth + 1; i <= daysInPrevMonth; i++) {
        calendarDays.push({
          day: i,
          month: prevMonth,
          year: prevYear,
          isCurrentMonth: false,
        });
      }

      for (let i = 1; i <= daysInMonth; i++) {
        calendarDays.push({
          day: i,
          month: currentMonth,
          year: currentYear,
          isCurrentMonth: true,
        });
      }

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
          await axios.post(`${API}/student-activities/${studentID}/insert`, { module: 'Mood' });
        } catch (err) {
          console.error('Error logging student activity:', err);
        }

        console.log('Success:', response.data.message);
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
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
                      {moodHistory.map((item, index) => (
                        <View key={index} style={styles.Mood}>
                          {item?.emoji ? (
                            <Text style={styles.MoodText}>{item.emoji}</Text>
                          ) : (
                            <View style={styles.MoodEmpty} />
                          )}
                          <Text style={styles.moodDays}>{item?.dayName || ''}</Text>
                          <Text style={styles.MoodLabel}>{item?.label || ''}</Text>
                        </View>
                      ))}
                    </View>
                    <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.buttonContainer}><Text style={styles.todayButton}>Enter your mood for today</Text></TouchableOpacity>
                </View>
                <View style={styles.MoodContainers}>
                    <View style={styles.MoodHistoryTitleContainer}>
                      <Text style={styles.GraphTitle}>Weekly Mood Graph</Text>
                    </View>
                    <View style={styles.graphContainer}>
                      <View style={styles.moodLabels}>
                        {moods.map((mood, index) => (
                          <View key={index} style={styles.moodRow}>
                            <Text style={styles.emoji}>{mood.emoji}</Text>
                          </View>
                        ))}
                      </View>
                      <View style={styles.gridContainer}>
                        {moods.map((_, index) => (
                          <View key={index} style={styles.gridLine} />
                        ))}

                        <View style={styles.horizontalAxis} />
                        <View style={styles.verticalAxis} />

                        <View style={styles.daysAndBars}>
                          {moodData.map((day, index) => (
                            <View key={index} style={styles.dayColumn}>
                              {day.mood && (
                                <Animated.View
                                  key={((day.moodIndex || 0 ) + reloadKey)}
                                  style={[
                                    styles.moodBar,
                                    // eslint-disable-next-line react-native/no-inline-styles
                                    {
                                      backgroundColor: day.moodIndex !== null ? moods[day.moodIndex].color : '#fff',
                                      height: day.animatedHeight,
                                    },
                                  ]}
                                />
                              )}
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

            <InfiniteSwipeModal
              visible={modalVisible}
              handlePressMoodToday={handlePressMoodToday}
              onClose={() => setModalVisible(false)}
            />
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
        fontSize: moderateScale(11),
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
        width: scale(25),
        height: verticalScale(25),
        borderRadius: moderateScale(22),
        backgroundColor: '#b7e3cc',
        marginBottom: verticalScale(4),
        borderWidth: moderateScale(2),
        borderColor: '#4b946a',
        borderStyle: 'dashed',
        marginVertical: verticalScale(10),
        marginLeft: scale(7),
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
      width: '106%',
      marginBottom: verticalScale(17),
      left: scale(-10),
    },
    horizontalAxis: {
      height: verticalScale(2),
      backgroundColor: '#000',
      width: '125%',
      position: 'absolute',
      bottom: verticalScale(30),
      left: scale(-50),
    },
    verticalAxis: {
      width: scale(2),
      backgroundColor: '#000',
      height: '100%',
      position: 'absolute',
      left: scale(-10),
    },
    daysAndBars: {
      flexDirection: 'row',
      position: 'absolute',
      bottom: verticalScale(2.5),
      left: scale(-15),
      right: scale(0),
      height: '100%',
      paddingLeft: scale(5),
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
      bottom: verticalScale(30),
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
      backgroundColor: '#fff',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalBG: { position: 'absolute', top: verticalScale(0), width: width, height: height },
});
