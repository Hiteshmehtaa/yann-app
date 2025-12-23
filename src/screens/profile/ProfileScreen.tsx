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
import { useResponsive } from '../../hooks/useResponsive';

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
  const { isTablet } = useResponsive();
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
        const response = await apiService.getMyBookings();
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
      icon: 'create-outline',
      title: 'Edit Profile',
      subtitle: '',
      onPress: () => {
        if (user?.role === 'provider') {
          navigation.navigate('ProviderEditProfile');
        } else {
          navigation.navigate('EditProfile');
        }
      },
    },
    {
      icon: 'location-outline',
      title: 'Manage Address',
      subtitle: '',
      onPress: () => navigation.navigate('SavedAddresses'),
    },
    {
      icon: 'card-outline',
      title: 'Payment Methods',
      subtitle: '',
      onPress: () => setShowComingSoon(true),
    },
    {
      icon: 'calendar-outline',
      title: 'My Booking',
      subtitle: '',
      onPress: () => navigation.navigate('BookingsList'),
    },
    {
      icon: 'settings-outline',
      title: 'Settings',
      subtitle: '',
      onPress: () => navigation.navigate('Notifications'),
    },
    {
      icon: 'help-circle-outline',
      title: 'Help Center',
      subtitle: '',
      onPress: () => navigation.navigate('HelpSupport'),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        contentContainerStyle={[
          styles.content,
          { paddingBottom: isTablet ? 140 : 120 }
        ]}
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
            </View>
          </View>

          {/* Menu Items */}
          <View style={styles.menuContainer}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.title}
                style={[
                  styles.menuItem,
                  index === menuItems.length - 1 && styles.menuItemLast,
                ]}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.iconCircle}>
                    <Ionicons name={item.icon} size={20} color={COLORS.primary} />
                  </View>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
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
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: 120,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    ...SHADOWS.sm,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.white,
  },
  profileInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  name: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text,
    marginBottom: 4,
  },
  email: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
  },
  menuContainer: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    marginBottom: SPACING.xl,
    ...SHADOWS.sm,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  menuTitle: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: TYPOGRAPHY.weight.medium,
    color: COLORS.text,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  logoutButtonText: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: COLORS.error,
  },
});
