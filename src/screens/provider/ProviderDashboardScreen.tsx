import React, { useEffect, useRef, useState } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

// ============================================
// 💎 LUMINARY GRAPH CARD AESTHETIC
// Theme-Consistent, Interactive, Data-Viz
// ============================================
const THEME = {
  colors: {
    background: '#F8FAFC', // Slate 50
    surface: '#FFFFFF',
    textPrimary: '#0F172A', // Slate 900
    textSecondary: '#64748B', // Slate 500
    primary: '#6366F1', // Indigo 500
    primaryGradient: ['#0F172A', '#1E1B4B', '#4338CA', '#6366F1'], // Deep Black to Indigo (4-stop for depth)
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  spacing: {
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    md: 12,
    lg: 20,
    xl: 28,
  }
};

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

type GraphType = 'earnings' | 'ratings' | 'bookings';

export const ProviderDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [selectedGraph, setSelectedGraph] = useState<GraphType>('earnings');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const tabAnim = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(1)).current;

  const handleGraphChange = (type: GraphType, index: number) => {
    setSelectedGraph(type);
    Animated.parallel([
      Animated.spring(tabAnim, {
        toValue: index,
        useNativeDriver: true,
        damping: 20,
        stiffness: 150,
      }),
      Animated.sequence([
        Animated.timing(contentFade, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(contentFade, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ])
    ]).start();
  };

  // Mock data for graphs since API only returns totals
  // Graph Data
  // Checks dashboardData first (automatic updates), otherwise defaults to flat/plane.
  const defaultLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const defaultData = [0, 0, 0, 0, 0, 0, 0];

  const CHART_DATA = {
    earnings: {
      labels: dashboardData?.stats?.earningsHistory?.labels || defaultLabels,
      datasets: [{ data: dashboardData?.stats?.earningsHistory?.data || defaultData }]
    },
    ratings: {
      labels: dashboardData?.stats?.ratingsHistory?.labels || defaultLabels,
      datasets: [{ data: dashboardData?.stats?.ratingsHistory?.data || defaultData }]
    },
    bookings: {
      labels: dashboardData?.stats?.bookingsHistory?.labels || defaultLabels,
      datasets: [{ data: dashboardData?.stats?.bookingsHistory?.data || defaultData }]
    }
  };

  useEffect(() => {
    if (!isLoading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  }, [isLoading]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Extract provider ID with fallback
      const providerId = user?.id || user?._id;
      const email = user?.email;

      if (!providerId && !email) {
        console.warn('⚠️ No provider ID or email available');
        setDashboardData({
          provider: { name: user?.name || 'Provider', rating: 0, totalReviews: 0 },
          stats: { totalEarnings: 0, pendingRequests: 0, completedBookings: 0, acceptedBookings: 0 },
          pendingRequests: [],
          acceptedBookings: [],
        });
        setIsLoading(false);
        return;
      }

      const response = await apiService.getProviderRequests(providerId, email) as any;
      if (response.success) {
        setDashboardData({
          provider: response.provider || response.data?.provider,
          stats: response.stats || response.data?.stats,
          pendingRequests: response.pendingRequests || response.data?.pendingRequests || [],
          acceptedBookings: response.acceptedBookings || response.data?.acceptedBookings || [],
        });
      }
    } catch (err: any) {
      console.error('❌ Error fetching dashboard:', err);
      setDashboardData({
        provider: { name: user?.name, rating: 0, totalReviews: 0 },
        stats: { totalEarnings: 0, pendingRequests: 0, completedBookings: 0, acceptedBookings: 0 },
        pendingRequests: [],
        acceptedBookings: [],
      });
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const getGraphValue = () => {
    if (selectedGraph === 'earnings') return `₹${(dashboardData?.stats?.totalEarnings ?? 0).toLocaleString()}`;
    if (selectedGraph === 'ratings') return (dashboardData?.provider?.rating ?? 0).toFixed(1);
    if (selectedGraph === 'bookings') return dashboardData?.stats?.completedBookings ?? 0;
    return '0';
  };

  const getGraphLabel = () => {
    if (selectedGraph === 'earnings') return 'Total Profit';
    if (selectedGraph === 'ratings') return 'Average Rating';
    if (selectedGraph === 'bookings') return 'Jobs Completed';
    return '';
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" />
        <LoadingSpinner visible={true} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* 1. Clean White Header */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.navigate('ProviderProfile')}>
            <Image
              source={{ uri: user?.avatar || 'https://ui-avatars.com/api/?name=User&background=random' }}
              style={styles.avatar}
            />
          </TouchableOpacity>
          <View>
            <Text style={styles.welcomeSub}>Welcome Back!</Text>
            <Text style={styles.welcomeName}>{user?.name?.split(' ')[0] || 'Partner'}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.notifBtn}
          onPress={() => navigation.navigate('NotificationsList')}
        >
          <Ionicons name="notifications-outline" size={24} color={THEME.colors.textPrimary} />
          {unreadCount > 0 && <View style={styles.redDot} />}
        </TouchableOpacity>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.content}
      >
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* 2. The Graph Card (Brand Colors) */}
          <LinearGradient
            colors={THEME.colors.primaryGradient} // Midnight -> Indigo
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.graphCard}
          >
            {/* Card Header: Value & Selector */}
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardLabel}>{getGraphLabel()}</Text>
                <Text style={styles.cardValue}>{getGraphValue()}</Text>
                <View style={styles.growthBadge}>
                  <Ionicons name="trending-up" size={12} color="#FFFFFF" />
                  <Text style={styles.growthText}>+15% from last week</Text>
                </View>
              </View>

              {/* Visual Tab Indicator (Dots) */}
              <View style={styles.tabDots}>
                {(['earnings', 'ratings', 'bookings'] as GraphType[]).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.dotBtn,
                      selectedGraph === type && styles.dotActive
                    ]}
                    onPress={() => handleGraphChange(type, ['earnings', 'ratings', 'bookings'].indexOf(type))}
                  />
                ))}
              </View>
            </View>

            {/* Chart with Sliding Animation */}
            <Animated.View
              style={{
                opacity: contentFade,
                alignItems: 'center',
                transform: [{
                  translateX: tabAnim.interpolate({
                    inputRange: [0, 1, 2],
                    outputRange: [0, 0, 0], // Keep centered, just fade
                  })
                }]
              }}
            >
              <LineChart
                data={CHART_DATA[selectedGraph]}
                width={width - 80}
                height={160}
                yAxisLabel=""
                yAxisSuffix=""
                withInnerLines={false}
                withOuterLines={false}
                withVerticalLabels={false}
                withHorizontalLabels={false}
                withDots={true}
                withShadow={true}
                fromZero={true}
                chartConfig={{
                  backgroundColor: 'transparent',
                  backgroundGradientFrom: 'transparent',
                  backgroundGradientTo: 'transparent',
                  backgroundGradientFromOpacity: 0,
                  backgroundGradientToOpacity: 0,
                  fillShadowGradientFrom: '#FFFFFF',
                  fillShadowGradientTo: '#FFFFFF',
                  fillShadowGradientFromOpacity: 0.6,
                  fillShadowGradientToOpacity: 0.05,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.8})`,
                  style: { borderRadius: 20 },
                  propsForDots: {
                    r: "6",
                    strokeWidth: "3",
                    stroke: "#1E1B4B",
                    fill: "#FFFFFF"
                  },
                  propsForBackgroundLines: {
                    strokeWidth: 0,
                  }
                }}
                bezier
                style={styles.chart}
              />
            </Animated.View>

            {/* Tab Buttons (Text) at bottom of card */}
            <View style={styles.textTabs}>
              {(['earnings', 'ratings', 'bookings'] as GraphType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => handleGraphChange(type, ['earnings', 'ratings', 'bookings'].indexOf(type))}
                  style={[styles.textTabBtn, selectedGraph === type && styles.textTabActive]}
                >
                  <Text style={[styles.textTabLabel, selectedGraph === type && styles.textTabLabelActive]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </LinearGradient>


          {/* 3. Recent Bookings List */}
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Recent Bookings</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ProviderBookings')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bookingsList}>
            {(dashboardData?.acceptedBookings?.slice(0, 5) || []).length > 0 ? (
              (dashboardData?.acceptedBookings?.slice(0, 5) || []).map((item: any, index: number) => {
                const colors = [
                  { bg: '#EEF2FF', icon: '#6366F1' }, // Indigo
                  { bg: '#ECFDF5', icon: '#10B981' }, // Emerald
                  { bg: '#FFF7ED', icon: '#F97316' }, // Orange
                  { bg: '#FDF4FF', icon: '#D946EF' }, // Fuchsia
                  { bg: '#F0F9FF', icon: '#0EA5E9' }, // Sky
                ];
                const colorTheme = colors[index % colors.length];

                return (
                  <TouchableOpacity
                    key={item.id || item._id}
                    style={[styles.bookingRow, { borderLeftColor: colorTheme.icon, borderLeftWidth: 4 }]}
                    onPress={() => navigation.navigate('ProviderBookings')}
                  >
                    <View style={[styles.bookingIconCircle, { backgroundColor: colorTheme.bg }]}>
                      <Ionicons name="calendar-outline" size={20} color={colorTheme.icon} />
                    </View>
                    <View style={styles.bookingDetails}>
                      <Text style={styles.bookingService}>{item.serviceName || 'Service'}</Text>
                      <Text style={styles.bookingCustomer}>{item.customerName || 'Customer'}</Text>
                    </View>
                    <View style={styles.bookingMeta}>
                      <Text style={styles.bookingPrice}>₹{item.totalPrice || 0}</Text>
                      <Text style={styles.bookingTime}>
                        {new Date(item.bookingDate || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No recent bookings</Text>
              </View>
            )}
          </View>

          <View style={{ height: 40 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: THEME.spacing.md,
    backgroundColor: THEME.colors.background,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  welcomeSub: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginBottom: 2,
  },
  welcomeName: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  redDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.error,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  content: {
    padding: THEME.spacing.lg,
  },

  // Graph Card
  graphCard: {
    borderRadius: THEME.radius.xl,
    padding: THEME.spacing.lg,
    minHeight: 300,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: THEME.spacing.xl,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: THEME.spacing.md,
  },
  cardLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  cardValue: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 4,
  },
  growthText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  tabDots: {
    flexDirection: 'row',
    gap: 6,
    paddingTop: 8,
  },
  dotBtn: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    backgroundColor: '#FFF',
    width: 20, // expanding dot
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    paddingRight: 0,
    paddingLeft: 0,
  },
  textTabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  textTabBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  textTabActive: {
    backgroundColor: '#FFF',
  },
  textTabLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  textTabLabelActive: {
    color: '#312E81',
  },

  // Grid
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: THEME.spacing.xl,
  },
  gridItem: {
    width: (width - 48 - 16) / 2, // 2 columns
    backgroundColor: '#FFF',
    borderRadius: THEME.radius.lg,
    padding: 16,
    height: 140,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridLabel: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    marginBottom: 4,
  },
  gridValue: {
    fontSize: 22,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 4,
  },
  gridDate: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
  },

  // Recent Btn
  recentBtn: {
    backgroundColor: THEME.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: THEME.radius.lg,
    gap: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  recentBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },

  // List Styles
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16, // More breathing room
    marginTop: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20, // Larger
    fontWeight: '800', // Bolder
    color: '#0F172A', // Darkest Slate
    letterSpacing: -0.5,
  },
  seeAll: {
    color: THEME.colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  bookingsList: {
    gap: 16, // More spacing between cards
    marginBottom: THEME.spacing.xl,
  },
  bookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18, // More internal padding
    backgroundColor: '#FFFFFF',
    borderRadius: 20, // Softer corners
    // No Border - Modern Shadow Only
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  bookingIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  bookingDetails: {
    flex: 1,
  },
  bookingService: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 2,
  },
  bookingCustomer: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
  },
  bookingMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  bookingPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  bookingTime: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
  },
  emptyBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  emptyText: {
    color: THEME.colors.textSecondary,
    fontSize: 14,
  },
});
