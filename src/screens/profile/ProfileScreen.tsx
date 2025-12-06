import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
} from 'react-native';
import { ComingSoonModal } from '../../components/ComingSoonModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, RADIUS, SHADOWS, ICON_SIZES, TYPOGRAPHY, ANIMATIONS } from '../../utils/theme';
import { useFocusEffect } from '@react-navigation/native';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

type MenuItemType = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
};

export const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [stats, setStats] = useState({
    bookingsCount: 0,
    rating: 0,
    totalSpent: 0,
  });
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Get correct role display based on user.role
  const getRoleDisplay = () => {
    const role = user?.role;
    if (role === 'provider') return 'PARTNER';
    if (role === 'homeowner') return 'MEMBER';
    return 'MEMBER'; // Default
  };

  const getRoleBadgeIcon = () => {
    return user?.role === 'provider' ? 'shield-checkmark' : 'star';
  };

  const getRoleBadgeColor = () => {
    return user?.role === 'provider' ? COLORS.primary : COLORS.warning;
  };

  // Fetch user stats from API
  const fetchUserStats = useCallback(async () => {
    try {
      if (user?.role === 'homeowner') {
        // Fetch homeowner bookings to calculate stats
        const response = await apiService.getHomeownerBookings();
        if (response.success && response.data) {
          const bookings = response.data;
          const totalSpent = bookings.reduce((sum: number, booking: any) => {
            return sum + (booking.totalPrice || booking.price || 0);
          }, 0);
          
          // Calculate average rating from completed bookings that have ratings
          const ratedBookings = bookings.filter((b: any) => b.rating && b.rating > 0);
          const avgRating = ratedBookings.length > 0 
            ? ratedBookings.reduce((sum: number, b: any) => sum + b.rating, 0) / ratedBookings.length
            : 0;

          setStats({
            bookingsCount: bookings.length,
            rating: Number(avgRating.toFixed(1)),
            totalSpent,
          });
        }
      } else if (user?.role === 'provider') {
        // Fetch provider bookings/earnings
        const response = await apiService.getProviderBookings();
        if (response.success && response.data) {
          const bookings = response.data;
          const totalEarned = bookings.reduce((sum: number, booking: any) => {
            return sum + (booking.totalPrice || booking.price || 0);
          }, 0);
          
          // Get provider's average rating
          const ratedBookings = bookings.filter((b: any) => b.rating && b.rating > 0);
          const avgRating = ratedBookings.length > 0 
            ? ratedBookings.reduce((sum: number, b: any) => sum + b.rating, 0) / ratedBookings.length
            : 0;

          setStats({
            bookingsCount: bookings.length,
            rating: Number(avgRating.toFixed(1)),
            totalSpent: totalEarned, // For providers, this is earnings
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  }, [user?.role]);

  // Fetch stats when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchUserStats();
    }, [fetchUserStats])
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: ANIMATIONS.slow,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: ANIMATIONS.slow,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogout = () => {
    // Directly logout without confirmation for better UX
    logout().catch((error) => {
      console.error('Logout error:', error);
    });
  };

  const menuItems: MenuItemType[] = [
    {
      icon: 'person-outline',
      title: 'Edit Profile',
      subtitle: 'Update your personal information',
      onPress: () => navigation.navigate('EditProfile'),
    },
    {
      icon: 'location-outline',
      title: 'Saved Addresses',
      subtitle: 'Manage your service addresses',
      onPress: () => navigation.navigate('SavedAddresses'),
    },
    {
      icon: 'card-outline',
      title: 'Payment Methods',
      subtitle: 'Manage payment options',
      onPress: () => setShowComingSoon(true), // Payment integration coming later
    },
    {
      icon: 'notifications-outline',
      title: 'Notifications',
      subtitle: 'Manage notification preferences',
      onPress: () => navigation.navigate('Notifications'),
    },
    {
      icon: 'help-circle-outline',
      title: 'Help & Support',
      subtitle: 'Get help with your bookings',
      onPress: () => navigation.navigate('HelpSupport'),
    },
    {
      icon: 'information-circle-outline',
      title: 'About',
      subtitle: 'Version 1.0.0',
      onPress: () => setShowComingSoon(true), // About page can be simple modal
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={true}
        alwaysBounceVertical={true}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Profile Card */}
          <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{user?.name || 'User'}</Text>
            <Text style={styles.email}>{user?.email || 'No email'}</Text>
            <View style={[styles.memberBadge, { backgroundColor: `${getRoleBadgeColor()}15` }]}>
              <Ionicons name={getRoleBadgeIcon()} size={ICON_SIZES.small} color={getRoleBadgeColor()} />
              <Text style={[styles.memberText, { color: getRoleBadgeColor() }]}>{getRoleDisplay()}</Text>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.bookingsCount}</Text>
            <Text style={styles.statLabel}>BOOKINGS</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={styles.ratingRow}>
              <Text style={styles.statNumber}>{stats.rating > 0 ? stats.rating : '-'}</Text>
              <Ionicons name="star" size={ICON_SIZES.small} color={COLORS.warning} />
            </View>
            <Text style={styles.statLabel}>RATING</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {stats.totalSpent >= 1000 
                ? `₹${(stats.totalSpent / 1000).toFixed(1)}K` 
                : `₹${stats.totalSpent}`}
            </Text>
            <Text style={styles.statLabel}>{user?.role === 'provider' ? 'EARNED' : 'SPENT'}</Text>
          </View>
        </View>

        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <View style={styles.accentBar} />
          <Text style={styles.sectionTitle}>SETTINGS</Text>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.title}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.menuItemLast
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconContainer}>
                  <Ionicons name={item.icon} size={ICON_SIZES.medium} color={COLORS.primary} />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={ICON_SIZES.medium} color={COLORS.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={ICON_SIZES.medium} color={COLORS.error} />
          <Text style={styles.logoutButtonText}>LOGOUT</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>YANN • v1.0.0</Text>
        </View>
        </Animated.View>
      </ScrollView>

      <ComingSoonModal
        visible={showComingSoon}
        title="Coming Soon!"
        message="This feature is under development and will be available soon. Stay tuned!"
        onClose={() => setShowComingSoon(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
    paddingTop: SPACING.xs, // Start content immediately after safe area
    paddingBottom: 120, // Extra padding for floating tab bar
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.large,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  avatarContainer: {
    width: 68,
    height: 68,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: TYPOGRAPHY.size.xxxl,
    fontWeight: '800',
    color: COLORS.white,
  },
  profileInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  name: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
    marginBottom: SPACING.xs,
  },
  email: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  memberText: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '700',
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.large,
    padding: SPACING.lg,
    marginBottom: SPACING.xxl,
    ...SHADOWS.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statNumber: {
    fontSize: TYPOGRAPHY.size.xxl,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1.5,
    marginTop: SPACING.xs,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.divider,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  accentBar: {
    width: 3,
    height: 18,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.small,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 2,
  },
  menuContainer: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.large,
    marginBottom: SPACING.xl,
    ...SHADOWS.md,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
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
    borderRadius: RADIUS.small,
    backgroundColor: COLORS.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  menuSubtitle: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textSecondary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: RADIUS.medium,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: `${COLORS.error}50`,
  },
  logoutButtonText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '700',
    color: COLORS.error,
    letterSpacing: 1,
  },
  footer: {
    alignItems: 'center',
    marginTop: SPACING.xxxl,
  },
  footerText: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textTertiary,
    letterSpacing: 2,
  },
});
