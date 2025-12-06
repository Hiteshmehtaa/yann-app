import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// ============================================
// 🎨 PREMIUM DESIGN SYSTEM (Urban Company/Airbnb Style)
// Clean, Minimal, No Gradients
// ============================================
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
    xl: 24,
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

interface MenuItem {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  badge?: number;
}

export const ProviderDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const getRoleDisplay = () => user?.role === 'provider' ? 'Partner' : 'Member';

  const getAccountStatus = () => {
    if (user?.status === 'active') return { text: 'Active', color: THEME.colors.success };
    if (user?.status === 'pending') return { text: 'Pending Approval', color: THEME.colors.warning };
    return { text: 'Inactive', color: THEME.colors.textTertiary };
  };

  useEffect(() => {
    fetchDashboardData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await apiService.getProviderRequests(undefined, user?.email) as any;
      if (response.success) {
        setDashboardData({
          provider: response.provider || response.data?.provider,
          stats: response.stats || response.data?.stats,
          pendingRequests: response.pendingRequests || response.data?.pendingRequests || [],
          acceptedBookings: response.acceptedBookings || response.data?.acceptedBookings || [],
        });
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
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

  const statsData = [
    { id: '1', label: 'Earnings', value: `₹${(dashboardData?.stats?.totalEarnings ?? 0).toLocaleString()}`, icon: 'wallet-outline' as const },
    { id: '2', label: 'Completed', value: `${dashboardData?.stats?.completedBookings ?? 0}`, icon: 'checkmark-circle-outline' as const },
    { id: '3', label: 'Active', value: `${dashboardData?.stats?.acceptedBookings ?? 0}`, icon: 'time-outline' as const },
    { id: '4', label: 'Rating', value: `${(dashboardData?.provider?.rating ?? 0).toFixed(1)}`, icon: 'star-outline' as const },
  ];

  const menuItems: MenuItem[] = [
    { id: 'services', title: 'My Services', subtitle: `${user?.services?.length || 0} active services`, icon: 'briefcase-outline', onPress: () => navigation.navigate('ProviderServices') },
    { id: 'bookings', title: 'Bookings', subtitle: 'Manage your bookings', icon: 'calendar-outline', onPress: () => navigation.navigate('ProviderBookings'), badge: dashboardData?.stats?.acceptedBookings || 0 },
    { id: 'earnings', title: 'Earnings', subtitle: 'View your earnings', icon: 'wallet-outline', onPress: () => navigation.navigate('ProviderEarnings') },
    { id: 'profile', title: 'Profile', subtitle: 'Edit your details', icon: 'person-outline', onPress: () => navigation.navigate('ProviderProfile') },
  ];

  const recentBookings = dashboardData?.acceptedBookings?.slice(0, 3).map((req: any) => ({
    id: req.id || req._id,
    service: req.serviceName,
    customer: req.customerName,
    date: req.formattedDate || new Date(req.bookingDate).toLocaleDateString(),
    amount: `₹${req.totalPrice}`,
    status: 'active',
  })) || [];

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={THEME.colors.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const accountStatus = getAccountStatus();

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.colors.background} />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[THEME.colors.primary]}
            tintColor={THEME.colors.primary}
          />
        }
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0).toUpperCase() || 'P'}
                </Text>
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.greeting}>Welcome back,</Text>
                <Text style={styles.userName}>{user?.name || 'Partner'}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.notificationBtn} activeOpacity={0.7}>
              <Ionicons name="notifications-outline" size={24} color={THEME.colors.text} />
              {(dashboardData?.stats?.acceptedBookings || 0) > 0 && (
                <View style={styles.notificationDot} />
              )}
            </TouchableOpacity>
          </View>

          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.profileRow}>
              <View style={styles.roleBadge}>
                <Ionicons name="shield-checkmark-outline" size={16} color={THEME.colors.primary} />
                <Text style={styles.roleText}>{getRoleDisplay()}</Text>
              </View>
              <View style={styles.statusBadge}>
                <View style={[styles.statusDot, { backgroundColor: accountStatus.color }]} />
                <Text style={styles.statusText}>{accountStatus.text}</Text>
              </View>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            {statsData.map((stat) => (
              <View key={stat.id} style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name={stat.icon} size={22} color={THEME.colors.primary} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.menuList}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuItem,
                    index === menuItems.length - 1 && styles.menuItemLast
                  ]}
                  activeOpacity={0.7}
                  onPress={item.onPress}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIconContainer}>
                      <Ionicons name={item.icon} size={22} color={THEME.colors.primary} />
                    </View>
                    <View style={styles.menuItemInfo}>
                      <Text style={styles.menuItemTitle}>{item.title}</Text>
                      <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                    </View>
                  </View>
                  <View style={styles.menuItemRight}>
                    {item.badge && item.badge > 0 ? (
                      <View style={styles.menuBadge}>
                        <Text style={styles.menuBadgeText}>{item.badge}</Text>
                      </View>
                    ) : null}
                    <Ionicons name="chevron-forward" size={20} color={THEME.colors.textTertiary} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Recent Bookings */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Bookings</Text>
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => navigation.navigate('ProviderBookings')}
              >
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            
            {recentBookings.length > 0 ? (
              <View style={styles.bookingsList}>
                {recentBookings.map((booking: any, index: number) => (
                  <TouchableOpacity
                    key={booking.id}
                    style={[
                      styles.bookingCard,
                      index === recentBookings.length - 1 && styles.bookingCardLast
                    ]}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('ProviderBookings')}
                  >
                    <View style={styles.bookingInfo}>
                      <Text style={styles.bookingService}>{booking.service}</Text>
                      <Text style={styles.bookingCustomer}>{booking.customer}</Text>
                      <View style={styles.bookingMeta}>
                        <Ionicons name="calendar-outline" size={14} color={THEME.colors.textTertiary} />
                        <Text style={styles.bookingDate}>{booking.date}</Text>
                      </View>
                    </View>
                    <View style={styles.bookingRight}>
                      <Text style={styles.bookingAmount}>{booking.amount}</Text>
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeText}>ACTIVE</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color={THEME.colors.textTertiary} />
                <Text style={styles.emptyTitle}>No pending bookings</Text>
                <Text style={styles.emptySubtitle}>New booking requests will appear here</Text>
              </View>
            )}
          </View>

          {/* Tips Card */}
          <View style={styles.tipsCard}>
            <View style={styles.tipsIcon}>
              <Ionicons name="bulb-outline" size={20} color={THEME.colors.warning} />
            </View>
            <View style={styles.tipsContent}>
              <Text style={styles.tipsTitle}>Pro Tip</Text>
              <Text style={styles.tipsText}>
                Complete your profile and add more services to attract more customers.
              </Text>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ============================================
// 📐 STYLES - Clean, Premium, Minimal (NO GRADIENTS)
// ============================================
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
  loadingText: {
    marginTop: THEME.spacing.md,
    fontSize: 15,
    color: THEME.colors.textSecondary,
  },
  content: {
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.md,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: THEME.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: THEME.spacing.sm,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerInfo: {
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    marginBottom: 2,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.colors.text,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...THEME.shadow,
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.error,
  },

  // Profile Card
  profileCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
    ...THEME.shadow,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${THEME.colors.primary}10`,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 6,
    borderRadius: THEME.radius.sm,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.primary,
    marginLeft: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.xl,
  },
  statCard: {
    width: '48%',
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.md,
    alignItems: 'center',
    ...THEME.shadow,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${THEME.colors.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
  },

  // Section
  section: {
    marginBottom: THEME.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: THEME.colors.text,
    marginBottom: THEME.spacing.md,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: THEME.colors.primary,
  },

  // Menu List
  menuList: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.lg,
    ...THEME.shadow,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: `${THEME.colors.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: THEME.spacing.sm,
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: THEME.colors.text,
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuBadge: {
    backgroundColor: THEME.colors.error,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
  },
  menuBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Bookings List
  bookingsList: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.lg,
    ...THEME.shadow,
  },
  bookingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  bookingCardLast: {
    borderBottomWidth: 0,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingService: {
    fontSize: 15,
    fontWeight: '500',
    color: THEME.colors.text,
    marginBottom: 2,
  },
  bookingCustomer: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    marginBottom: 4,
  },
  bookingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookingDate: {
    fontSize: 13,
    color: THEME.colors.textTertiary,
    marginLeft: 4,
  },
  bookingRight: {
    alignItems: 'flex-end',
  },
  bookingAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.colors.text,
    marginBottom: 4,
  },
  pendingBadge: {
    backgroundColor: `${THEME.colors.warning}15`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pendingText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.warning,
  },
  activeBadge: {
    backgroundColor: `${THEME.colors.success}15`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.success,
  },

  // Empty State
  emptyState: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.xxl,
    alignItems: 'center',
    ...THEME.shadow,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: THEME.colors.text,
    marginTop: THEME.spacing.md,
  },
  emptySubtitle: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },

  // Tips Card
  tipsCard: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: THEME.colors.warning,
    ...THEME.shadow,
  },
  tipsIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: `${THEME.colors.warning}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: THEME.spacing.sm,
  },
  tipsContent: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.text,
    marginBottom: 2,
  },
  tipsText: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    lineHeight: 18,
  },
});
