import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import axios from 'axios';
import { API, RootAPI } from '../apiConfigs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DrawerComponent from '../Components/DrawerComponent';
import { io } from 'socket.io-client';
import apiClient from '../APIClient';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types';

interface Backlog {
    id: number;
    title: string;
    student_id?: number | null;
    name: string | null;
    message?: string | null;
    sched_date?: string | null; // ISO string format (e.g., "2025-04-06T14:00:00")
    status: string;
    created_at: string; // ISO string from MySQL DATETIME
    modified_at: string;
    completed_at?: string | null;
  }

export default function CalendarScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // Make it 1-indexed
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [userId, setUserId] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<{ day: number; month: number; year: number }>({
    day: today.getDate(),
    month: today.getMonth(), // getMonth is 0-based
    year: today.getFullYear(),
  });

  const [backlogs, setBacklogs] = useState<Backlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageError, setMessageError] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [alertModal, setAlertModal] = useState(false);

  useEffect(() => {
    const fetchBacklogs = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API}/backlogs`);
        setBacklogs(response.data);
      } catch (error) {
        console.error('Failed to fetch backlogs:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
          setIsSuccessful(false);
          setMessageError('User not found. Please try logging in.');
          setAlertModal(true);
          setTimeout(() => {
            navigation.navigate('Login');
          }, 1000);
          return;
        }

        const response = await apiClient.get(`${API}/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data?.user) {
          setUserId(response.data.user.id);
        } else {
          setIsSuccessful(false);
          setMessageError('User not found. Please try logging in.');
          setAlertModal(true);
        }
      } catch (error: any) {
        setIsSuccessful(false);
        setMessageError('Server Error: Unable to connect. Please try again.');
        setAlertModal(true);
      }
    };

    fetchUserData();
    fetchBacklogs();

    const socket = io(RootAPI, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
    });

    // 🧠 Set up WebSocket listeners for real-time updates
    socket.on('connect', () => {
      console.log('✅ WebSocket connected:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.error('❌ WebSocket Connection Error:', err);
    });

    socket.on('updateBacklogs', (updatedBacklogs) => {
      console.log('📡 Received updated backlogs');
      setBacklogs(updatedBacklogs);
    });

    return () => {
      console.log('🧹 Cleaning up backlog WebSocket...');
      socket.disconnect();
      socket.off('updateBacklogs');
      socket.off('connect');
      socket.off('connect_error');
    };
  }, [navigation]);

  const filteredBacklogs = backlogs.filter((backlog) => {
    if (!backlog.sched_date ||
        !selectedDay ||
        backlog.status !== 'Scheduled')
        { return false; }

    const date = new Date(backlog.sched_date);
    const dateMatches = (
      date.getDate() === selectedDay.day &&
      date.getMonth() === selectedDay.month &&
      date.getFullYear() === selectedDay.year
    );

    // Date must match AND (student_id doesn't exist OR equals userId)
    return dateMatches && (!backlog.student_id || backlog.student_id === userId);
});

  const months = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
  ];
  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const selectedDate = new Date(selectedDay.year, selectedDay.month, selectedDay.day);
  const daysOfWeekFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayOfWeekSelected = daysOfWeekFull[selectedDate.getDay()];

  // Generate calendar days for the current month
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
    const daysInPrevMonth = new Date(prevYear, currentMonth, 0).getDate();

    const calendarDays = [];
    // Add days from previous month
    for (let i = daysInPrevMonth - daysFromPrevMonth + 1; i <= daysInPrevMonth; i++) {
      calendarDays.push({
        day: i,
        month: prevMonth,
        year: prevYear,
        isCurrentMonth: false,
      });
    }
    // Add days from current month
    for (let i = 1; i <= daysInMonth; i++) {
      calendarDays.push({
        day: i,
        month: currentMonth,
        year: currentYear,
        isCurrentMonth: true,
      });
    }
    // Add days from next month
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
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

  const handleDayPress = (dayObj: { day: any; month: any; year: any; isCurrentMonth?: boolean; }) => {
    if (dayObj.month === currentMonth && dayObj.year === currentYear) {
        setSelectedDay({ day: dayObj.day, month: dayObj.month, year: dayObj.year });
      }
  };

  const calendarDays = generateCalendarDays();
  const weeks = [];
  // Group days into weeks
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  const hasScheduledBacklog = (day: number, month: number, year: number) => {
    return backlogs.some((backlog) => {
      if (!backlog.sched_date || backlog.status !== 'Scheduled') {return false;}
      const sched = new Date(backlog.sched_date);
      return (
        sched.getDate() === day &&
        sched.getMonth() === month &&
        sched.getFullYear() === year &&
        (!backlog.student_id || backlog.student_id === userId)
      );
    });
  };

    return (
        <View style={styles.container}>
          <DrawerComponent Initial={'Calendar'} />
            <View style={styles.titleBox}>
                <Text style={styles.title}>
                    Calendar
                </Text>
            </View>
            <View style={styles.calendarContainer}>
                <View style={styles.header}>
                    <Text style={styles.yearText}>S.Y. {currentYear}</Text>
                    <View style={styles.monthNavigator}>
                        <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.navButton}>
                          <Text style={styles.navButtonText}>◀</Text>
                        </TouchableOpacity>
                        <View style={styles.monthContainer}>
                          <Text style={styles.monthText}>{months[currentMonth]}</Text>
                        </View>
                        <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.navButton}>
                          <Text style={styles.navButtonText}>▶</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.calendar}>
                        <View style={styles.daysHeader}>
                            {daysOfWeek.map((day, index) => (
                                <Text
                                    key={index}
                                    style={[
                                      styles.dayName,
                                      index === 0 ? styles.sundayText : null,
                                    ]}
                                >
                                    {day}
                                </Text>
                            ))}
                        </View>
                        <View style={styles.daysGrid}>
                            {weeks.map((week, weekIndex) => (
                                <View key={weekIndex} style={styles.week}>
                                    {week.map((day, dayIndex) => (
                                        <TouchableOpacity
                                        key={dayIndex}
                                        style={[
                                          styles.day,
                                          day.isCurrentMonth && selectedDay && day.day === selectedDay.day && day.month === selectedDay.month && day.year === selectedDay.year
                                            ? styles.selectedDay
                                            : null,
                                        ]}
                                        onPress={() => handleDayPress(day)}
                                      >
                                        {hasScheduledBacklog(day.day, day.month, day.year) && (
                                          <View style={styles.dotIndicator} />
                                        )}
                                        <Text
                                          style={[
                                            styles.dayText,
                                            dayIndex === 0 ? styles.sundayText : null,
                                            !day.isCurrentMonth ? styles.otherMonthDayText : null,
                                          ]}
                                        >
                                          {day.day}
                                        </Text>
                                      </TouchableOpacity>
                                    ))}
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </View>
            <View style={styles.ScheduleListContainer}>
                <View style={styles.ScheduleList}>
                    {loading ? (<Text>Loading schedule</Text>) : (
                        filteredBacklogs.length > 0 ? (
                            <View style={styles.padding10}>
                                <View style={styles.Scheduled}>
                                  {/* Left Section */}
                                  <View style={styles.LeftSection}>
                                    <Text style={styles.ScheduledTitle}>Scheduled</Text>
                                  </View>

                                  {/* Right Section */}
                                  <View>
                                    <Text style={styles.ScheduledSubtitle}>{dayOfWeekSelected}</Text>
                                    <Text style={styles.ScheduledSubtitle}>
                                      {`${String(selectedDay.month + 1).padStart(2, '0')}/${String(selectedDay.day).padStart(2, '0')}/${selectedDay.year}`}
                                    </Text>
                                  </View>
                                </View>
                                <ScrollView style={styles.backlogScroll}>
                                    <View style={styles.backlogWrapper}>
                                        {filteredBacklogs.map((item) => (
                                            <View key={item.id} style={styles.backlogItem}>
                                                <View style={styles.backlogTime}>
                                                    <Text style={styles.backlogTimeText}>
                                                        {item.sched_date && new Date(item.sched_date).toLocaleTimeString([], {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            hour12: true,
                                                        })}
                                                    </Text>
                                                </View>
                                                <View style={styles.backlogContent}>
                                                    {item.title === 'Guidance Related Events' && (
                                                        <Text style={styles.eventTag}>Event {'\u25CF'}</Text>
                                                    )}
                                                    <Text style={styles.backlogName}>{item.name}</Text>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                </ScrollView>
                            </View>
                        ) : (
                            <View style={styles.NoSchedule}>
                              <Ionicons name="calendar-clear-outline" size={70} style={styles.marginRight} />
                              <View>
                                <Text style={styles.NoScheduleTitle}>No Schedule</Text>
                                <Text style={styles.NoScheduleDate}>
                                  {`${String(selectedDay.month + 1).padStart(2, '0')}/${String(selectedDay.day).padStart(2, '0')}/${selectedDay.year}`}
                                </Text>
                              </View>
                            </View>
                        )
                    )}
                </View>
            </View>

            <Modal visible={alertModal} animationType="fade" transparent>
          <View style={styles.overlay}>
            <View style={styles.forgotModal}>
              <View style={[styles.modalHeader, !isSuccessful && styles.redHeader]}>
                <Text style={styles.modalTitleStyled}>{isSuccessful ? 'Successful' : 'Error'}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setAlertModal(false);
                    setMessageError('');
                    setIsSuccessful(false);
                  }}>
                  <Ionicons name="close" size={22} color="#333" />
                </TouchableOpacity>
              </View>
              <Text style={[styles.instructions, styles.marginB]}>{messageError}</Text>
              <View style={styles.actions}>
                <TouchableOpacity
                      style={[styles.sendBtn, !isSuccessful && styles.redHeader]}
                      onPress={() => {
                        setAlertModal(false);
                        setMessageError('');
                        setIsSuccessful(false);
                      }}
                    >
                      <Text style={styles.sendText}>OK</Text>
                    </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
    calendarContainer: {
        width: '95%',
        overflow: 'hidden',
    },
    header: {
        padding: 12,
        alignItems: 'center',
        position: 'relative',
    },
    yearText: {
      fontSize: 25,
      fontFamily: 'Lora-Bold',
      color: '#444',
      marginBottom: 8,
    },
    monthNavigator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      paddingHorizontal: '10%',
      backgroundColor: '#4b946a',
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
    },
    navButton: {
      padding: 8,
      textAlignVertical: 'center',
      marginBottom: 10,
    },
    navButtonText: {
      fontSize: 18,
      color: '#333',
    },
    monthContainer: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 4,
      width: '70%',
    },
    monthText: {
      fontSize: 28,
      color: 'black',
      fontFamily: 'Poppins-Bold',
      textAlign: 'center',
    },
    calendar: {
      backgroundColor: '#cfe8d5',
      padding: 12,
      borderBottomRightRadius: 10,
      borderBottomLeftRadius: 10,
      width: '100%',
      margin: -5,
      shadowColor: 'grey',
      shadowOffset: {width: 0, height: -2},
      shadowRadius: 2,
    },
    daysHeader: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 8,
      paddingBottom: 8,
    },
    dayName: {
      width: 30,
      textAlign: 'center',
      fontFamily: 'Poppins-Bold',
      color: '#333',
      fontSize: 12,
    },
    daysGrid: {},
    week: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginVertical: 6,
    },
    day: {
      width: 30,
      height: 30,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 15,
    },
    highlightedDay: {
      backgroundColor: '#2c8059',
    },
    dayText: {
      fontSize: 14,
      color: '#333',
      fontFamily: 'Lora-Regular',
    },
    sundayText: {
      color: '#e53935',
    },
    otherMonthDay: {
      color: '#aaa',
      fontFamily: 'Lora-Regular',
    },
    selectedDay: {
      backgroundColor: '#317873', // Highlight selected day
    },
    otherMonthDayText: {
      color: '#aaa',
    },
    ScheduleListContainer: {
      marginTop: 10,
      width: '100%',
      alignItems: 'center',
    },
    ScheduleList: {
        width: '90%',
        backgroundColor: '#cfe8d5',
        borderRadius: 10,
    },
    NoSchedule: { flexDirection: 'row', alignItems: 'center', padding: 25 },
    marginRight: { marginRight: 15, color: 'black' },
    NoScheduleTitle: { fontSize: 30, fontFamily: 'Poppins-Bold', color: 'black' },
    NoScheduleDate: { fontSize: 14, color: 'gray', fontFamily: 'Lora-Regular' },
    padding10: { padding: 10 },
    Scheduled: {flexDirection: 'row', alignItems: 'center', marginBottom: 20},
    LeftSection: {paddingHorizontal: 10, borderRightWidth: 2, borderColor: 'gray', marginRight: 10},
    ScheduledTitle: {fontFamily: 'Poppins-Bold', fontSize: 25, letterSpacing: 5, color: 'black'},
    ScheduledSubtitle: {fontSize: 12, fontFamily: 'Lora-Regular', color: 'black'},
    dotIndicator: {
        width: 7,
        height: 7,
        borderRadius: 3,
        backgroundColor: '#ffb028', // or any color you want
        position: 'absolute',
        top: 2,
      },
      backlogScroll: {
        height: 125,
      },
      backlogWrapper: {
        alignItems: 'center',
      },
      backlogItem: {
        backgroundColor: 'white',
        width: '95%',
        borderRadius: 10,
        padding: 10,
        flexDirection: 'row',
        marginBottom: 25,
      },
      backlogTime: {
        width: '20%',
        borderRightWidth: 2,
        borderRightColor: 'gray',
        paddingRight: 5,
      },
      backlogTimeText: {
        fontFamily: 'Poppins-Bold',
        fontSize: 18,
        textAlign: 'center',
        color: 'black',
      },
      backlogContent: {
        width: '80%',
        position: 'relative',
        paddingLeft: 10,
        justifyContent: 'center',
      },
      eventTag: {
        position: 'absolute',
        top: -10,
        right: 0,
        color: '#60a5fa',
      },
      backlogName: {
        fontFamily: 'Poppins-ExtraBold',
        fontSize: 20,
        textAlignVertical: 'center',
        color: 'black',
      },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(49, 120, 115, 0.8)',
  },
  forgotModal: {
    width: '85%',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#b7e3cc',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  redHeader: {
    backgroundColor: '#e3b7b7',
  },
  marginB: {
    marginBottom: 10,
  },
  modalTitleStyled: {
    fontSize: 18,
    color: '#333',
    fontFamily: 'Poppins-Bold',
  },
  instructions: {
    fontFamily: 'Lora-Bold',
    color: '#4a4a4a',
    paddingHorizontal: 40,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 10,
    justifyContent: 'flex-end',
  },
  sendBtn: {
    backgroundColor: '#b7e3cc',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  sendText: {
    color: 'white',
    fontFamily: 'Poppins-ExtraBold',
    shadowRadius: 3,
    shadowOffset: {width: 1, height: 1},
    shadowColor: 'gray',
    fontSize: 15,
  },
});
