import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import axios from 'axios';
import { API, RootAPI } from '../apiConfigs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
    proposal?: string | null;
  }

export default function CalendarComponent() {
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
    // Early exit for missing required fields
    if (!backlog.sched_date || !selectedDay || backlog.status !== 'Scheduled') {
        return false;
    }

    // Date matching logic
    const date = new Date(backlog.sched_date);
    const dateMatches = (
        date.getDate() === selectedDay.day &&
        date.getMonth() === selectedDay.month &&
        date.getFullYear() === selectedDay.year
    );

    if (!dateMatches) {return false;}

    // Event: has proposal but no student_id (show to everyone)
    const isEvent = backlog.proposal && !backlog.student_id;

    // Appointment: has student_id but no proposal (show only if it's the user's appointment)
    const isUserAppointment = backlog.student_id === userId && !backlog.proposal;

    return isEvent || isUserAppointment;
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

  const hasEvent = (day: number, month: number, year: number) => {
    return backlogs.some((backlog) => {
      if (!backlog.sched_date || backlog.status !== 'Scheduled') {
        return false;
      }
      const sched = new Date(backlog.sched_date);
      const dateMatches = (
        sched.getDate() === day &&
        sched.getMonth() === month &&
        sched.getFullYear() === year
      );

      // Event: has proposal AND no student_id (public events)
      return dateMatches && backlog.proposal && !backlog.student_id;
    });
  };

  const hasAppointment = (day: number, month: number, year: number) => {
    return backlogs.some((backlog) => {
      if (!backlog.sched_date || backlog.status !== 'Scheduled') {
        return false;
      }
      const sched = new Date(backlog.sched_date);
      const dateMatches = (
        sched.getDate() === day &&
        sched.getMonth() === month &&
        sched.getFullYear() === year
      );

      // Appointment: has student_id matching current user AND no proposal
      return dateMatches && backlog.student_id === userId && !backlog.proposal;
    });
  };

    return (
        <View style={styles.container}>
            <View style={styles.calendarContainer}>
                <View style={styles.header}>
                    <Text style={styles.yearText}>S.Y. {currentYear}</Text>
                    <View style={styles.monthNavigator}>
                        <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.navButton}>
                          <Text style={styles.navButtonText}>◀</Text>
                        </TouchableOpacity>
                        <View style={styles.monthContainer}>
                          <Text
                            style={[
                              styles.monthText,
                              // eslint-disable-next-line react-native/no-inline-styles
                              { fontSize: months[currentMonth].length > 7 ? 26 : 28},
                            ]}
                          >
                            {months[currentMonth]}
                          </Text>
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
                                  {week.map((day, dayIndex) => {
                                    const hasEventDot = hasEvent(day.day, day.month, day.year);
                                    const hasAppointmentDot = hasAppointment(day.day, day.month, day.year);
                                    const hasBothDots = hasEventDot && hasAppointmentDot;

                                    return (
                                      <TouchableOpacity
                                        key={dayIndex}
                                        style={[
                                          styles.day,
                                          day.isCurrentMonth && selectedDay && day.day === selectedDay.day && day.month === selectedDay.month && day.year === selectedDay.year
                                            ? styles.selectedDay
                                            : null,
                                        ]}
                                        disabled={dayIndex === 0 || dayIndex === 6}
                                        onPress={() => handleDayPress(day)}
                                      >
                                        {/* Two dots container */}
                                        {(hasEventDot || hasAppointmentDot) && (
                                          <View style={[styles.dotContainer, !hasBothDots && styles.dotContainerCenter]}>
                                            {hasEventDot && (
                                              <View style={[styles.dotIndicator, styles.blueDot]} />
                                            )}
                                            {hasAppointmentDot && (
                                              <View style={[styles.dotIndicator, styles.orangeDot]} />
                                            )}
                                          </View>
                                        )}

                                        <Text
                                          style={[
                                            styles.dayText,
                                            (dayIndex === 0 || dayIndex === 6) ? styles.sundayText : null,
                                            !day.isCurrentMonth ? styles.otherMonthDayText : null,
                                          ]}
                                        >
                                          {day.day}
                                        </Text>
                                      </TouchableOpacity>
                                    );
                                  })}
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
                                                    {item.title === 'Guidance Related Events' ? (
                                                        <Text style={styles.appointTag}>Event {'\u25CF'}</Text>
                                                    ) : (
                                                        <Text style={styles.eventTag}>Appointment {'\u25CF'}</Text>
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
    calendarContainer: {
        width: '95%',
        overflow: 'hidden',
    },
    header: {
        padding: moderateScale(12),
        alignItems: 'center',
        position: 'relative',
    },
    yearText: {
      fontSize: moderateScale(25),
      fontFamily: 'Lora-Bold',
      color: '#444',
      marginBottom: verticalScale(8),
    },
    monthNavigator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      paddingHorizontal: '10%',
      backgroundColor: '#4b946a',
      borderTopLeftRadius: moderateScale(10),
      borderTopRightRadius: moderateScale(10),
    },
    navButton: {
      padding: moderateScale(8),
      textAlignVertical: 'center',
      marginBottom: verticalScale(10),
    },
    navButtonText: {
      fontSize: moderateScale(18),
      color: '#333',
    },
    monthContainer: {
      paddingVertical: verticalScale(8),
      paddingHorizontal: scale(16),
      borderRadius: moderateScale(4),
      width: '70%',
    },
    monthText: {
      color: 'black',
      fontFamily: 'Poppins-Bold',
      textAlign: 'center',
    },
    calendar: {
      backgroundColor: '#cfe8d5',
      padding: moderateScale(12),
      borderBottomRightRadius: moderateScale(10),
      borderBottomLeftRadius: moderateScale(10),
      width: '100%',
      margin: -5,
      shadowColor: 'grey',
      shadowOffset: {width: scale(0), height: -2},
      shadowRadius: moderateScale(2),
    },
    daysHeader: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: verticalScale(8),
      paddingBottom: verticalScale(8),
    },
    dayName: {
      width: moderateScale(30),
      textAlign: 'center',
      fontFamily: 'Poppins-Bold',
      color: '#333',
      fontSize: moderateScale(11.5),
    },
    daysGrid: {},
    week: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginVertical: verticalScale(6),
    },
    day: {
      width: moderateScale(30),
      height: moderateScale(30),
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: moderateScale(15),
    },
    highlightedDay: {
      backgroundColor: '#2c8059',
    },
    dayText: {
      fontSize: moderateScale(14),
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
      marginTop: verticalScale(10),
      width: '100%',
      alignItems: 'center',
      overflow: 'scroll',
    },
    ScheduleList: {
        width: '90%',
        backgroundColor: '#cfe8d5',
        borderRadius: moderateScale(10),
        maxHeight: moderateScale(180),
    },
    NoSchedule: { flexDirection: 'row', alignItems: 'center', padding: moderateScale(25) },
    marginRight: { marginRight: scale(15), color: 'black' },
    NoScheduleTitle: { fontSize: moderateScale(30), fontFamily: 'Poppins-Bold', color: 'black' },
    NoScheduleDate: { fontSize: moderateScale(14), color: 'gray', fontFamily: 'Lora-Regular' },
    padding10: { padding: moderateScale(10) },
    Scheduled: {flexDirection: 'row', alignItems: 'center', marginBottom: verticalScale(20)},
    LeftSection: {paddingHorizontal: scale(10), borderRightWidth: moderateScale(2), borderColor: 'gray', marginRight: scale(10)},
    ScheduledTitle: {fontFamily: 'Poppins-Bold', fontSize: moderateScale(25), letterSpacing: moderateScale(5), color: 'black'},
    ScheduledSubtitle: {fontSize: moderateScale(12), fontFamily: 'Lora-Regular', color: 'black'},
    dotIndicator: {
        width: moderateScale(7),
        height: moderateScale(7),
        borderRadius: moderateScale(3.5),
      },
      backlogScroll: {
        height: verticalScale(125),
      },
      backlogWrapper: {
        alignItems: 'center',
        paddingBottom: verticalScale(40),
      },
      backlogItem: {
        backgroundColor: 'white',
        width: '95%',
        borderRadius: moderateScale(10),
        padding: moderateScale(10),
        flexDirection: 'row',
        marginBottom: verticalScale(5),
      },
      backlogTime: {
        width: '20%',
        borderRightWidth: moderateScale(2),
        borderRightColor: 'gray',
        paddingRight: scale(5),
      },
      backlogTimeText: {
        fontFamily: 'Poppins-Bold',
        fontSize: moderateScale(20),
        textAlign: 'center',
        color: 'black',
      },
      backlogContent: {
        width: '80%',
        position: 'relative',
        paddingLeft: scale(10),
        justifyContent: 'center',
      },
      eventTag: {
        position: 'absolute',
        top: -10,
        right: 0,
        color: '#ffb028',
      },
      appointTag: {
        position: 'absolute',
        top: -10,
        right: 0,
        color: '#60a5fa',
      },
      backlogName: {
        fontFamily: 'Poppins-ExtraBold',
        fontSize: moderateScale(20),
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
    marginBottom: verticalScale(20),
    backgroundColor: '#b7e3cc',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(10),
    borderTopLeftRadius: moderateScale(15),
    borderTopRightRadius: moderateScale(15),
  },
  redHeader: {
    backgroundColor: '#e3b7b7',
  },
  marginB: {
    marginBottom: verticalScale(10),
  },
  modalTitleStyled: {
    fontSize: moderateScale(18),
    color: '#333',
    fontFamily: 'Poppins-Bold',
  },
  instructions: {
    fontFamily: 'Lora-Bold',
    color: '#4a4a4a',
    paddingHorizontal: scale(40),
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(10),
    justifyContent: 'flex-end',
  },
  sendBtn: {
    backgroundColor: '#b7e3cc',
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(20),
    borderRadius: moderateScale(10),
  },
  sendText: {
    color: 'white',
    fontFamily: 'Poppins-ExtraBold',
    shadowRadius: moderateScale(3),
    shadowOffset: {width: scale(1), height: verticalScale(1)},
    shadowColor: 'gray',
    fontSize: moderateScale(15),
  },
  dotContainer: {
    position: 'absolute',
    top: verticalScale(-2),
    flexDirection: 'row',
    gap: moderateScale(2),
  },
  dotContainerCenter: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  blueDot: {
    backgroundColor: '#60a5fa', // Blue for events
  },
  orangeDot: {
    backgroundColor: '#ffb028', // Orange for appointments
  },
});
