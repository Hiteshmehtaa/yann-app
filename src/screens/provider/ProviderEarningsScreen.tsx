import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { LoadingSpinner } from '../../components/LoadingSpinner';
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

type Period = 'week' | 'month' | 'year';

interface EarningsResponse {
  totalEarnings: number;
  bookingsCount: number;
  averageEarning: number;
  earningsByDate: { date: string; total: number }[];
  recentTransactions: {
    id: string;
    serviceName: string;
    customerName: string;
    amount: number;
    date: string;
  }[];
}

export const ProviderEarningsScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('month');
  const [earnings, setEarnings] = useState<EarningsResponse | null>(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    
    fetchEarnings();
  }, []);

  const fetchEarnings = async (period: Period = selectedPeriod) => {
    if (!refreshing) setIsLoading(true);
    try {
      const response = await apiService.getProviderEarnings(period);
      if (response.success && response.earnings) {
        setEarnings(response.earnings);
        
        // Trigger content entrance animation
        contentAnim.setValue(0);
        Animated.spring(contentAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }).start();
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchEarnings(selectedPeriod);
  };

  const handlePeriodChange = (period: Period) => {
    if (period === selectedPeriod) return;
    setSelectedPeriod(period);
    fetchEarnings(period);
  };

  const chartData = useMemo(() => {
    if (!earnings || !earnings.earningsByDate || earnings.earningsByDate.length === 0) {
      return {
        labels: ["-"],
        datasets: [{ data: [0] }]
      };
    }

    const data = earnings.earningsByDate;
    // Limit labels to prevent crowding
    const labels = data.map((item, index) => {
      if (data.length <= 7) return format(parseISO(item.date), 'EEE');
      // Show fewer labels for month/year
      if (index === 0 || index === data.length - 1 || index === Math.floor(data.length / 2)) {
         return format(parseISO(item.date), 'MMM d');
      }
      return "";
    });

    return {
      labels,
      datasets: [{
        data: data.map(item => item.total),
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`, // Blue 500
        strokeWidth: 3
      }]
    };
  }, [earnings]);

  const periods: { label: string; value: Period }[] = [
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
    { label: 'Year', value: 'year' },
  ];

  if (isLoading && !earnings) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner visible={true} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Analytics</Text>
          <TouchableOpacity style={styles.infoButton}>
            <Ionicons name="information-circle-outline" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            
            {/* Minimalist Top Card */}
            <Animated.View style={[styles.topCard, { transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
              <View style={styles.topCardContent}>
                <View>
                  <Text style={styles.totalLabel}>Total Profit</Text>
                  <Text style={styles.totalValue}>
                    ₹{(earnings?.totalEarnings ?? 0).toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={[styles.growthBadge, { backgroundColor: addAlpha(COLORS.success, 0.1) }]}>
                  <Ionicons name="trending-up" size={14} color={COLORS.success} />
                  <Text style={styles.growthText}>+12.5%</Text>
                </View>
              </View>
              <Text style={styles.totalSubtext}>vs. last {selectedPeriod}</Text>
            </Animated.View>

            {/* Period Selector Tabs */}
            <View style={styles.tabsContainer}>
              {periods.map((p) => (
                <TouchableOpacity
                  key={p.value}
                  style={[styles.tab, selectedPeriod === p.value && styles.activeTab]}
                  onPress={() => handlePeriodChange(p.value)}
                >
                  <Text style={[styles.tabText, selectedPeriod === p.value && styles.activeTabText]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Chart Section */}
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>Earnings Trend</Text>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
                  <Text style={styles.legendText}>Revenue</Text>
                </View>
              </View>
              
              <LineChart
                data={chartData}
                width={width - SPACING.lg * 3} // Adjust for padding
                height={220}
                chartConfig={{
                  backgroundColor: COLORS.cardBg,
                  backgroundGradientFrom: COLORS.cardBg,
                  backgroundGradientTo: COLORS.cardBg,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                  labelColor: (opacity = 1) => COLORS.textTertiary,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: "4",
                    strokeWidth: "2",
                    stroke: "#fff"
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: "", // solid background lines
                    stroke: COLORS.gray100,
                  }
                }}
                bezier
                style={styles.chart}
                withInnerLines={true}
                withOuterLines={false}
                withVerticalLines={false}
                withDots={true}
                fromZero={true}
              />
            </View>

            {/* Recent Activity */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Jobs</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ProviderBookings')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.transactionList}>
              {earnings?.recentTransactions && earnings.recentTransactions.length > 0 ? (
                earnings.recentTransactions.map((txn, index) => (
                  <TouchableOpacity 
                    key={txn.id} 
                    style={styles.transactionCard}
                    onPress={() => navigation.navigate('BookingDetail', { bookingId: txn.id })}
                  >
                    <View style={[styles.txnIconCircle, { backgroundColor: addAlpha(COLORS.primary, 0.1) }]}>
                      <MaterialCommunityIcons name="briefcase-outline" size={22} color={COLORS.primary} />
                    </View>
                    
                    <View style={styles.txnDetails}>
                      <Text style={styles.txnService}>{txn.serviceName}</Text>
                      <Text style={styles.txnCustomer}>{txn.customerName}</Text>
                      <Text style={styles.txnDate}>{format(parseISO(txn.date), 'MMM d, h:mm a')}</Text>
                    </View>
                    
                    <View style={styles.txnAmountContainer}>
                      <Text style={styles.txnAmount}>+₹{txn.amount}</Text>
                      <View style={styles.txnBadge}>
                        <Text style={styles.txnBadgeText}>PAID</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <LottieView
                    source={LottieAnimations.emptyCart}
                    autoPlay
                    loop
                    style={{ width: 120, height: 120 }}
                  />
                  <Text style={styles.emptyText}>No transactions found for this period</Text>
                </View>
              )}
            </View>

            <View style={{ height: 40 }} />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background, // F6F8FC
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text, // 0F172A
  },
  infoButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  topCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.xl,
    ...SHADOWS.lg,
    marginBottom: SPACING.xl,
  },
  topCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
    gap: 4,
  },
  growthText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.success,
  },
  totalSubtext: {
    fontSize: 13,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0', // Light slate background for the "pill"
    borderRadius: 14,
    padding: 4,
    marginBottom: SPACING.xl,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 11,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.primary,
  },
  chartCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.md,
    ...SHADOWS.md,
    marginBottom: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
    marginBottom: SPACING.md,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    marginLeft: -10, // Adjust for chart kit padding
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  transactionList: {
    gap: SPACING.md,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  txnIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  txnDetails: {
    flex: 1,
  },
  txnService: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  txnCustomer: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  txnDate: {
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  txnAmountContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  txnAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.success,
  },
  txnBadge: {
    backgroundColor: addAlpha(COLORS.success, 0.1),
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  txnBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.success,
    letterSpacing: 0.5,
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
    textAlign: 'center',
    marginTop: SPACING.md,
  },
});
