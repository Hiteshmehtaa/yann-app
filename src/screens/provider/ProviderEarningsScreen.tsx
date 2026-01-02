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

const THEME = {
  colors: {
    background: '#F7F8FA',
    card: '#FFFFFF',
    primary: '#2E59F3',
    text: '#1A1C1E',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    border: '#E5E7EB',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  radius: {
    sm: 12,
    md: 16,
    lg: 20,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
};

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
      const response = await apiService.getProviderEarnings(selectedPeriod);
      console.log('Earnings response:', response);
      
      if (response.success && response.earnings) {
        const data = response.earnings;
        setEarningsData({
          totalEarnings: data.totalEarnings || 0,
          completedBookings: data.bookingsCount || data.completedBookings || 0,
          averagePerBooking: data.averageEarning || 0,
          transactions: (data.recentTransactions || []).map((t: any) => ({
            id: t.id || Math.random().toString(),
            service: t.serviceName || 'Service',
            customer: t.customerName || 'Customer',
            amount: t.amount || 0,
            date: t.date ? new Date(t.date).toLocaleDateString() : 'Recent',
            status: t.status || 'completed'
          })),
        });
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
      // Fallback only if error
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
      <StatusBar barStyle="dark-content" backgroundColor={THEME.colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={THEME.colors.text} />
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
                <Ionicons name="checkmark-circle-outline" size={18} color={THEME.colors.success} />
                <Text style={styles.earningsStatText}>
                  {earningsData?.completedBookings ?? 0} completed
                </Text>
              </View>
              <View style={styles.earningsStat}>
                <Ionicons name="trending-up-outline" size={18} color={THEME.colors.primary} />
                <Text style={styles.earningsStatText}>
                  ₹{earningsData?.averagePerBooking ?? 0} avg
                </Text>
              </View>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: `${THEME.colors.success}15` }]}>
                <Ionicons name="wallet-outline" size={22} color={THEME.colors.success} />
              </View>
              <Text style={styles.statValue}>₹{(earningsData?.totalEarnings ?? 0).toLocaleString()}</Text>
              <Text style={styles.statLabel}>Received</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: `${THEME.colors.warning}15` }]}>
                <Ionicons name="time-outline" size={22} color={THEME.colors.warning} />
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
                <Ionicons name="receipt-outline" size={48} color={THEME.colors.textTertiary} />
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
    backgroundColor: THEME.colors.background,
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
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    backgroundColor: THEME.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...THEME.shadow,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    padding: THEME.spacing.lg,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.md,
    padding: 4,
    marginBottom: THEME.spacing.xl,
    ...THEME.shadow,
  },
  periodButton: {
    flex: 1,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.radius.sm,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: THEME.colors.primary,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  earningsCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.xl,
    alignItems: 'center',
    marginBottom: THEME.spacing.xl,
    ...THEME.shadow,
  },
  earningsLabel: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.xs,
  },
  earningsValue: {
    fontSize: 44,
    fontWeight: '800',
    color: THEME.colors.text,
    letterSpacing: -1,
  },
  earningsStats: {
    flexDirection: 'row',
    marginTop: THEME.spacing.md,
    gap: THEME.spacing.xl,
  },
  earningsStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
  },
  earningsStatText: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: THEME.spacing.md,
    marginBottom: THEME.spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.md,
    padding: THEME.spacing.md,
    alignItems: 'center',
    ...THEME.shadow,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  section: {
    marginBottom: THEME.spacing.xl,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: THEME.spacing.md,
    textTransform: 'uppercase',
  },
  transactionList: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.md,
    ...THEME.shadow,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
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
    color: THEME.colors.text,
  },
  transactionCustomer: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: THEME.colors.textTertiary,
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.success,
  },
  completedBadge: {
    backgroundColor: `${THEME.colors.success}15`,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  completedText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.success,
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    padding: THEME.spacing.xxl,
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.md,
    ...THEME.shadow,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.colors.text,
    marginTop: THEME.spacing.md,
  },
  emptySubtitle: {
    fontSize: 13,
    color: THEME.colors.textTertiary,
    textAlign: 'center',
    marginTop: THEME.spacing.xs,
  },
});
