import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
  StatusBar,
  Image,
  Dimensions,
  PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LineChart } from 'react-native-chart-kit';
import { format, parseISO } from 'date-fns';

import { COLORS, SPACING, RADIUS, SHADOWS, addAlpha } from '../../utils/theme';
import LottieView from 'lottie-react-native';
import { LottieAnimations } from '../../utils/lottieAnimations';

const { width } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

type GraphType = 'bookings' | 'ratings';

export const ProviderDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [selectedGraph, setSelectedGraph] = useState<GraphType>('bookings');
  const [chartKey, setChartKey] = useState(0);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const chartFade = useRef(new Animated.Value(1)).current;
  const graphTranslateX = useRef(new Animated.Value(0)).current;
  const tabSlideAnim = useRef(new Animated.Value(0)).current;

  // Swipe Gesture Handling
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      // Only capture if it's a clear horizontal swipe
      return Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx > 50) {
        // Swipe Right -> Switch to Bookings
        handleGraphChange('bookings');
      } else if (gestureState.dx < -50) {
        // Swipe Left -> Switch to Ratings
        handleGraphChange('ratings');
      }
    },
  }), [selectedGraph]); // Re-create if needed, though handleGraphChange is stable

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    } else {
      setIsLoading(false);
    }

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const providerId = user?.id || user?._id;
      const email = user?.email;

      const response = await apiService.getProviderRequests(providerId, email) as any;
      if (response.success) {
        setDashboardData({
          provider: response.provider || response.data?.provider,
          stats: response.stats || response.data?.stats,
          pendingRequests: response.pendingRequests || response.data?.pendingRequests || [],
          // Deduplicate accepted bookings
          acceptedBookings: Array.from(new Map((response.acceptedBookings || response.data?.acceptedBookings || []).map((b: any) => [b.id || b._id, b])).values()),
        });
        
        // Trigger content entrance animation
        contentAnim.setValue(0);
        Animated.spring(contentAnim, {
          toValue: 1,
          tension: 40,
          friction: 7,
          useNativeDriver: true,
        }).start();
      }
    } catch (err: any) {
      console.error('❌ Error fetching dashboard:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleGraphChange = (type: GraphType) => {
    if (type === selectedGraph) return;

    // 1. Animate out
    Animated.parallel([
      Animated.timing(chartFade, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(graphTranslateX, {
        toValue: type === 'ratings' ? -10 : 10,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(tabSlideAnim, {
        toValue: type === 'ratings' ? 1 : 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      })
    ]).start(() => {
      // 2. Switch data
      setSelectedGraph(type);
      setChartKey(prev => prev + 1);
      
      // 3. Reset position for slide in
      graphTranslateX.setValue(type === 'ratings' ? 10 : -10);

      // 4. Animate in
      Animated.parallel([
        Animated.spring(chartFade, {
          toValue: 1,
          tension: 40,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(graphTranslateX, {
          toValue: 0,
          tension: 40,
          friction: 7,
          useNativeDriver: true,
        })
      ]).start();
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // Chart Data preparation
  const chartData = useMemo(() => {
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const fallbackData = [0, 0, 0, 0, 0, 0, 0];
    
    let currentData = fallbackData;
    let color = COLORS.primary;

    if (selectedGraph === 'bookings') {
      currentData = dashboardData?.stats?.bookingsHistory?.data || [2, 5, 3, 8, 6, 4, 7];
      color = COLORS.primary;
    } else {
      currentData = dashboardData?.stats?.ratingsHistory?.data || [4.2, 4.5, 4.0, 4.8, 5.0, 4.7, 4.9];
      color = COLORS.success;
    }

    return {
      labels: dashboardData?.stats?.bookingsHistory?.labels || labels,
      datasets: [{
        data: currentData,
        color: (opacity = 1) => addAlpha(color, opacity),
        strokeWidth: 3
      }]
    };
  }, [dashboardData, selectedGraph]);

  if (isLoading && !dashboardData) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner visible={true} />
      </View>
    );
  }

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning,';
    if (hour < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* 1. Header Section */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Image
              source={require('../../../assets/Logo.jpg')}
              style={styles.logo}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.greetingText}>{greeting()}</Text>
              <Text style={styles.usernameText}>{user?.name?.split(' ')[0] || 'Partner'}</Text>
            </View>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.iconBtn}
              onPress={() => navigation.navigate('NotificationsList')}
            >
              <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
              {unreadCount > 0 && <View style={styles.redDot} />}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('ProviderProfile')}>
              <Image
                source={{ uri: user?.avatar || 'https://ui-avatars.com/api/?name=User&background=random' }}
                style={styles.avatar}
              />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          
          {/* 2. Performance Analytics Card */}
          <Animated.View style={[styles.analyticsCard, { transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
            <View style={styles.analyticsHeader}>
              <View>
                <Text style={styles.cardTitle}>Performance Analytics</Text>
                <Text style={styles.cardSubTitle}>Real-time activity tracking</Text>
              </View>
              <View style={styles.graphToggle}>
                {/* Animated Background for Toggle */}
                <Animated.View 
                  style={[
                    styles.toggleIndicator, 
                    { 
                      transform: [{ 
                        translateX: tabSlideAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 60] // Width of one button
                        }) 
                      }] 
                    }
                  ]} 
                />
                <TouchableOpacity 
                  onPress={() => handleGraphChange('bookings')}
                  style={styles.toggleBtn}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.toggleText, selectedGraph === 'bookings' && styles.toggleTextActive]}>Jobs</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => handleGraphChange('ratings')}
                  style={styles.toggleBtn}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.toggleText, selectedGraph === 'ratings' && styles.toggleTextActive]}>Rating</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Animated.View 
              {...panResponder.panHandlers}
              style={[
                styles.chartWrapper, 
                { 
                  opacity: chartFade,
                  transform: [{ translateX: graphTranslateX }]
                }
              ]}
            >
              <LineChart
                key={chartKey}
                data={chartData}
                width={width - SPACING.lg * 3}
                height={180}
                chartConfig={{
                  backgroundColor: COLORS.white,
                  backgroundGradientFrom: COLORS.white,
                  backgroundGradientTo: COLORS.white,
                  decimalPlaces: selectedGraph === 'ratings' ? 1 : 0,
                  color: (opacity = 1) => addAlpha(selectedGraph === 'bookings' ? COLORS.primary : COLORS.success, opacity),
                  labelColor: (opacity = 1) => COLORS.textTertiary,
                  propsForDots: {
                    r: "4",
                    strokeWidth: "2",
                    stroke: "#fff"
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: "",
                    stroke: COLORS.gray100,
                  }
                }}
                bezier
                style={styles.chart}
                withInnerLines={true}
                withOuterLines={false}
                withVerticalLines={false}
                fromZero={true}
              />
            </Animated.View>
          </Animated.View>

          {/* 3. Daily Insight Card */}
          <View style={styles.insightCard}>
            <View style={styles.insightIconCircle}>
              <Ionicons name="sparkles" size={18} color={COLORS.primary} />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightText}>
                You've completed <Text style={styles.boldText}>{dashboardData?.stats?.completedBookings || 0} jobs</Text> this week. Keep it up!
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
          </View>

          {/* 4. Today's Schedule Timeline */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Schedule</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ProviderBookings')}>
              <Text style={styles.seeAllText}>Manage</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.timelineContainer}>
            {dashboardData?.acceptedBookings && dashboardData.acceptedBookings.length > 0 ? (
              dashboardData.acceptedBookings.slice(0, 5).map((booking: any, index: number) => (
                <View key={booking.id || booking._id} style={styles.timelineItem}>
                  {/* Left Timeline Line */}
                  <View style={styles.timelineLeft}>
                    <View style={[styles.timelineDot, { backgroundColor: index === 0 ? COLORS.primary : COLORS.textTertiary }]} />
                    {index < 4 && <View style={styles.timelineLine} />}
                  </View>

                  {/* Right Job Card */}
                  <View style={styles.scheduleCard}>
                    <View style={styles.cardTop}>
                      <View style={styles.customerInfo}>
                        <Image
                          source={{ uri: booking.customerAvatar || `https://ui-avatars.com/api/?name=${booking.customerName || 'C'}&background=random` }}
                          style={styles.cardAvatar}
                        />
                        <View>
                          <Text style={styles.cardCustomerName}>{booking.customerName || 'Customer'}</Text>
                          <Text style={styles.cardServiceType}>{booking.serviceName || 'Service'}</Text>
                        </View>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: addAlpha(booking.status === 'completed' ? COLORS.success : COLORS.primary, 0.1) }]}>
                        <Text style={[styles.statusText, { color: booking.status === 'completed' ? COLORS.success : COLORS.primary }]}>
                          {booking.status?.toUpperCase() || 'CONFIRMED'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardBottom}>
                      <View style={styles.timeInfo}>
                        <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
                        <Text style={styles.timeText}>
                          {booking.bookingDate ? format(parseISO(booking.bookingDate), 'hh:mm a') : '09:00 AM'} - {' '}
                          {booking.bookingDate ? format(new Date(new Date(parseISO(booking.bookingDate)).getTime() + 2*60*60*1000), 'hh:mm a') : '11:00 AM'}
                        </Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.ghostBtn}
                        onPress={() => navigation.navigate('BookingDetail', { booking })}
                      >
                        <Text style={styles.ghostBtnText}>Directions</Text>
                        <Ionicons name="navigate-circle-outline" size={16} color={COLORS.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <LottieView
                  source={LottieAnimations.emptyCart}
                  autoPlay
                  loop
                  style={{ width: 120, height: 120 }}
                />
                <Text style={styles.emptyText}>No scheduled jobs for today</Text>
              </View>
            )}
          </View>

          <View style={{ height: 60 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 12,
  },
  greetingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  usernameText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBtn: {
    padding: 4,
    position: 'relative',
  },
  redDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray100,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  analyticsCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.lg,
    ...SHADOWS.md,
    marginBottom: SPACING.lg,
  },
  analyticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  cardSubTitle: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  graphToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray100,
    borderRadius: 8,
    padding: 3,
    position: 'relative',
    width: 126, // 60 * 2 + padding
  },
  toggleIndicator: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 60,
    height: 28, // Matches button height approximately
    backgroundColor: COLORS.white,
    borderRadius: 6,
    ...SHADOWS.sm,
  },
  toggleBtn: {
    width: 60,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  toggleTextActive: {
    color: COLORS.primary,
  },
  chartWrapper: {
    alignItems: 'center',
    marginLeft: -15,
  },
  chart: {
    borderRadius: 16,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: addAlpha(COLORS.primary, 0.05),
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: addAlpha(COLORS.primary, 0.1),
    marginBottom: SPACING.xl,
  },
  insightIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  timelineContainer: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  timelineLeft: {
    width: 20,
    alignItems: 'center',
    paddingTop: 10,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    zIndex: 2,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.gray200,
    marginVertical: 4,
  },
  scheduleCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.md,
    ...SHADOWS.sm,
    marginBottom: 20,
    marginLeft: 10,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.gray100,
  },
  cardCustomerName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  cardServiceType: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
    paddingTop: 12,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  ghostBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xxl,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    ...SHADOWS.sm,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textTertiary,
    marginTop: 12,
  },
});
