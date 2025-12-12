import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { apiService } from '../../services/api';
import { STATUS_COLORS } from '../../utils/constants';
import type { Booking } from '../../types';
import { format } from 'date-fns';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, RADIUS, SHADOWS, ICON_SIZES, TYPOGRAPHY } from '../../utils/theme';
import { useResponsive } from '../../hooks/useResponsive';
import { EmptyStateAnimation } from '../../components/animations';
import { EmptyState } from '../../components/EmptyState';
import { AnimatedButton } from '../../components/AnimatedButton';
import { TabBar } from '../../components/ui/TabBar';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

const TABS = [
  { key: 'ongoing', label: 'Ongoing' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export const BookingsListScreen: React.FC<Props> = ({ navigation }) => {
  const { isTablet } = useResponsive();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('ongoing');

  /**
   * Fetch bookings from backend (like website - GET /api/bookings)
   * This returns all bookings for the authenticated homeowner
   */
  const fetchBookings = async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const response = await apiService.getMyBookings();
      
      if (response.success && response.data) {
        // Map response to ensure consistent format
        const mappedBookings = response.data.map((booking: any) => ({
          ...booking,
          _id: booking._id || booking.id,
          id: booking.id || booking._id,
        }));
        setBookings(mappedBookings);
      } else {
        setBookings([]);
      }
    } catch (error: any) {
      setBookings([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Refresh bookings whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchBookings(false);
  }, []);

  const getStatusStyle = (status: string) => {
    return {
      backgroundColor: STATUS_COLORS[status as keyof typeof STATUS_COLORS] + '15',
    };
  };

  const getStatusTextStyle = (status: string) => {
    return {
      color: STATUS_COLORS[status as keyof typeof STATUS_COLORS],
    };
  };

  const renderBookingCard = ({ item }: { item: Booking }) => {
    const formattedDate = item.bookingDate
      ? format(new Date(item.bookingDate), 'MMM dd, yyyy')
      : 'N/A';

    // Get provider name from booking data
    const providerName = (item as any).provider?.name || (item as any).providerName || 'Service Provider';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('BookingDetail', { booking: item })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.serviceName}>{item.serviceName}</Text>
            <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
              <Text style={[styles.statusText, getStatusTextStyle(item.status)]}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={ICON_SIZES.medium} color={COLORS.textTertiary} />
        </View>

        <View style={styles.cardBody}>
          {/* Provider Info */}
          <View style={styles.providerRow}>
            <Ionicons name="person-outline" size={ICON_SIZES.medium} color={COLORS.primary} />
            <Text style={styles.providerName}>{providerName}</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={ICON_SIZES.medium} color={COLORS.textSecondary} />
              <Text style={styles.infoValue}>{formattedDate}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={ICON_SIZES.medium} color={COLORS.textSecondary} />
              <Text style={styles.infoValue}>{item.bookingTime}</Text>
            </View>
          </View>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Total</Text>
            <Text style={styles.priceValue}>₹{item.totalPrice}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <EmptyState
        title="No bookings yet"
        subtitle="Your bookings will appear here once you book a service"
      />
      <AnimatedButton
        style={styles.browseButton}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.browseButtonText}>Browse services</Text>
        <Ionicons name="arrow-forward" size={ICON_SIZES.medium} color={COLORS.white} />
      </AnimatedButton>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LoadingSpinner visible={true} />
      </SafeAreaView>
    );
  }

  // Filter bookings based on active tab
  const filteredBookings = bookings.filter((booking) => {
    const status = booking.status.toLowerCase();
    if (activeTab === 'ongoing') {
      return status === 'pending' || status === 'confirmed' || status === 'active';
    } else if (activeTab === 'completed') {
      return status === 'completed';
    } else if (activeTab === 'cancelled') {
      return status === 'cancelled';
    }
    return true;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bookings</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Tab Bar */}
      <TabBar 
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <LoadingSpinner visible={isLoading} />
      
      {!isLoading && (
        <FlatList
          data={filteredBookings}
          renderItem={renderBookingCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: isTablet ? 140 : 120 }
          ]}
          bounces={true}
          alwaysBounceVertical={true}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerRight: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: 120, // Extra padding for floating tab bar
    flexGrow: 1,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.large,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    ...SHADOWS.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  cardHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  serviceName: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.small,
  },
  statusText: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardBody: {},
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  providerName: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  infoRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  priceLabel: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  priceValue: {
    fontSize: TYPOGRAPHY.size.xxl,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxxl,
    paddingBottom: 80,
  },
  emptyIconContainer: {
    width: 88,
    height: 88,
    borderRadius: RADIUS.xlarge,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.size.xxl,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    letterSpacing: -0.5,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
    lineHeight: 22,
  },
  debugText: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
    fontStyle: 'italic',
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.medium,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  browseButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
