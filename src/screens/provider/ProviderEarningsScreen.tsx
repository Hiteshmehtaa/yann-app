import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useResponsive } from '../../hooks/useResponsive';

import { COLORS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

type Period = 'week' | 'month' | 'year';

interface EarningsData {
  totalEarnings: number;
  completedBookings: number;
  averagePerBooking: number;
  transactions: {
    id: string;
    service: string;
    customer: string;
    amount: number;
    date: string;
    status: string;
  }[];
}

export const ProviderEarningsScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const { width: screenWidth, isTablet } = useResponsive();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('month');
  const [earningsData, setEarningsData] = useState<EarningsData>({
    totalEarnings: 0,
    completedBookings: 0,
    averagePerBooking: 0,
    transactions: [],
  });

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    fetchEarnings();
  }, [selectedPeriod]);

  const fetchEarnings = async () => {
    setIsLoading(true);
    try {
      // Fetch ALL completed bookings directly to ensure Driver bookings are included
      // The backend /provider/earning endpoint might be filtering them out
      const response = await apiService.getProviderBookings('completed');

      if (response.success && response.data) {
        const allCompletedBookings = response.data;

        // Filter by selected period
        const now = new Date();
        const startOfPeriod = new Date();

        switch (selectedPeriod) {
          case 'week':
            startOfPeriod.setDate(now.getDate() - 7);
            break;
          case 'month':
            startOfPeriod.setMonth(now.getMonth() - 1);
            break;
          case 'year':
            startOfPeriod.setFullYear(now.getFullYear() - 1);
            break;
        }

        const filteredBookings = allCompletedBookings.filter((b: any) => {
          const bookingDate = new Date(b.completedAt || b.bookingDate);
          return bookingDate >= startOfPeriod && bookingDate <= now;
        });

        // Calculate stats locally
        const totalEarnings = filteredBookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0);
        const completedCount = filteredBookings.length;
        const average = completedCount > 0 ? Math.round(totalEarnings / completedCount) : 0;

        setEarningsData({
          totalEarnings,
          completedBookings: completedCount,
          averagePerBooking: average,
          transactions: filteredBookings.map((b: any) => ({
            id: b._id || b.id,
            service: b.serviceName || 'Service',
            customer: b.customerName || 'Customer',
            amount: b.totalPrice || 0,
            date: new Date(b.completedAt || b.bookingDate).toLocaleDateString(),
            status: b.status || 'completed'
          })).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()), // Sort by date desc
        });
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
      setEarningsData({
        totalEarnings: 0,
        completedBookings: 0,
        averagePerBooking: 0,
        transactions: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const periods: { label: string; value: Period }[] = [
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
    { label: 'Year', value: 'year' },
  ];

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <LoadingSpinner visible={true} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Earnings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Period Selector */}
          <View style={styles.periodSelector}>
            {periods.map((period) => (
              <TouchableOpacity
                key={period.value}
                style={[
                  styles.periodButton,
                  selectedPeriod === period.value && styles.periodButtonActive,
                ]}
                onPress={() => setSelectedPeriod(period.value)}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    selectedPeriod === period.value && styles.periodButtonTextActive,
                  ]}
                >
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Total Earnings Card */}
          <View style={styles.earningsCard}>
            <Text style={styles.earningsLabel}>Total Earnings</Text>
            <Text style={styles.earningsValue}>
              ₹{(earningsData?.totalEarnings ?? 0).toLocaleString()}
            </Text>
            <View style={styles.earningsStats}>
              <View style={styles.earningsStat}>
                <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.success} />
                <Text style={styles.earningsStatText}>
                  {earningsData?.completedBookings ?? 0} completed
                </Text>
              </View>
              <View style={styles.earningsStat}>
                <Ionicons name="trending-up-outline" size={18} color={COLORS.primary} />
                <Text style={styles.earningsStatText}>
                  ₹{earningsData?.averagePerBooking ?? 0} avg
                </Text>
              </View>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: `${COLORS.success}15` }]}>
                <Ionicons name="wallet-outline" size={22} color={COLORS.success} />
              </View>
              <Text style={styles.statValue}>₹{(earningsData?.totalEarnings ?? 0).toLocaleString()}</Text>
              <Text style={styles.statLabel}>Received</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: `${COLORS.warning}15` }]}>
                <Ionicons name="time-outline" size={22} color={COLORS.warning} />
              </View>
              <Text style={styles.statValue}>₹0</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>

          {/* Recent Transactions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>

            {earningsData.transactions.length > 0 ? (
              <View style={styles.transactionList}>
                {earningsData.transactions.map((txn, index) => (
                  <View
                    key={txn.id}
                    style={[
                      styles.transactionCard,
                      index === earningsData.transactions.length - 1 && styles.transactionCardLast,
                    ]}
                  >
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionService}>{txn.service}</Text>
                      <Text style={styles.transactionCustomer}>{txn.customer}</Text>
                      <Text style={styles.transactionDate}>{txn.date}</Text>
                    </View>
                    <View style={styles.transactionRight}>
                      <Text style={styles.transactionAmount}>+₹{txn.amount}</Text>
                      <View style={styles.completedBadge}>
                        <Text style={styles.completedText}>PAID</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={48} color={COLORS.textTertiary} />
                <Text style={styles.emptyTitle}>No transactions yet</Text>
                <Text style={styles.emptySubtitle}>
                  Your earnings will appear here after completing bookings
                </Text>
              </View>
            )}
          </View>

          <View style={{ height: 100 }} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    padding: SPACING.lg,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.medium,
    padding: 4,
    marginBottom: SPACING.xl,
    ...SHADOWS.sm,
  },
  periodButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.small,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: COLORS.primary,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  earningsCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.large,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.xl,
    ...SHADOWS.sm,
  },
  earningsLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  earningsValue: {
    fontSize: 44,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -1,
  },
  earningsStats: {
    flexDirection: 'row',
    marginTop: SPACING.md,
    gap: SPACING.xl,
  },
  earningsStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  earningsStatText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
  },
  transactionList: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.medium,
    ...SHADOWS.sm,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  transactionCardLast: {
    borderBottomWidth: 0,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionService: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  transactionCustomer: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.success,
  },
  completedBadge: {
    backgroundColor: `${COLORS.success}15`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  completedText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.success,
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xxl,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.medium,
    ...SHADOWS.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
});
