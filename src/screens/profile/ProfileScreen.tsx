import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { ComingSoonModal } from '../../components/ComingSoonModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, RADIUS, SHADOWS, ICON_SIZES, TYPOGRAPHY, ANIMATIONS } from '../../utils/theme';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useResponsive } from '../../hooks/useResponsive';
import { StatsCard } from '../../components/ui/StatsCard';
import { Badge } from '../../components/ui/Badge';

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
  const { user, logout, updateUser } = useAuth();
  const { colors, toggleTheme, isDark } = useTheme();
  const { isTablet } = useResponsive();
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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
    return user?.role === 'provider' ? colors.primary : colors.warning;
  };

  // Get membership tier based on bookings
  const getMembershipTier = () => {
    const count = stats.bookingsCount;
    if (count >= 20) return { tier: 'Gold', color: colors.warning, icon: '👑' };
    if (count >= 10) return { tier: 'Silver', color: colors.textSecondary, icon: '⭐' };
    return { tier: 'Bronze', color: '#CD7F32', icon: '🥉' };
  };

  // Fetch user stats from API
  const fetchUserStats = useCallback(async () => {
    try {
      if (user?.role === 'homeowner') {
        const response = await apiService.getMyBookings();
        if (response.success && response.data) {
          const bookings = response.data;
          const totalSpent = bookings.reduce((sum: number, booking: any) => {
            return sum + (booking.totalPrice || booking.price || 0);
          }, 0);
          
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
        const response = await apiService.getProviderBookings();
        if (response.success && response.data) {
          const bookings = response.data;
          const totalEarned = bookings.reduce((sum: number, booking: any) => {
            return sum + (booking.totalPrice || booking.price || 0);
          }, 0);
          
          const ratedBookings = bookings.filter((b: any) => b.rating && b.rating > 0);
          const avgRating = ratedBookings.length > 0 
            ? ratedBookings.reduce((sum: number, b: any) => sum + b.rating, 0) / ratedBookings.length
            : 0;

          setStats({
            bookingsCount: bookings.length,
            rating: Number(avgRating.toFixed(1)),
            totalSpent: totalEarned,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  }, [user?.role]);

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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserStats().then(() => setRefreshing(false));
  }, [fetchUserStats]);

  const handleLogout = () => {
    logout().catch((error) => console.error('Logout error:', error));
  };

  const handleImagePick = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setIsUploadingAvatar(true);
        const mimeType = result.assets[0].uri.endsWith('png') ? 'image/png' : 'image/jpeg';
        const base64Image = `data:${mimeType};base64,${result.assets[0].base64}`;
        
        const response = await apiService.uploadAvatar(base64Image);
        
        if (response.success && response.data) {
          const newAvatar = response.data.avatar || response.data.profileImage;
          updateUser({ avatar: newAvatar, profileImage: newAvatar });
          Alert.alert('Success', 'Profile picture updated successfully!');
        } else {
          throw new Error(response.message);
        }
      }
    } catch (error: any) {
      Alert.alert('Upload Failed', error.message || 'Failed to upload profile picture.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const menuItems: MenuItemType[] = [
    {
      icon: 'create-outline',
      title: 'Edit Profile',
      subtitle: '',
      onPress: () => {
        if (user?.role === 'provider') navigation.navigate('ProviderEditProfile');
        else navigation.navigate('EditProfile');
      },
    },
    {
      icon: 'location-outline',
      title: 'Manage Address',
      subtitle: '',
      onPress: () => navigation.navigate('SavedAddresses'),
    },
    {
      icon: 'wallet-outline',
      title: 'Yann Wallet',
      subtitle: '',
      onPress: () => navigation.navigate('Wallet'),
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
    {
      icon: 'moon-outline',
      title: 'Dark Mode',
      subtitle: '',
      onPress: () => setShowComingSoon(true),
    }
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBg, borderBottomColor: colors.divider, borderBottomWidth: 1 }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        contentContainerStyle={[
          styles.content,
          { paddingBottom: isTablet ? 140 : 120 }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Profile Card */}
          <View style={[styles.profileCard, { backgroundColor: colors.cardBg }]}>
            <TouchableOpacity 
              style={[styles.avatarContainer, { backgroundColor: colors.primary }]}
              onPress={handleImagePick}
              disabled={isUploadingAvatar}
            >
              {isUploadingAvatar ? (
                <ActivityIndicator size="large" color={colors.white} />
              ) : user?.avatar || user?.profileImage ? (
                <Image 
                  source={{ uri: user.avatar || user.profileImage }} 
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={[styles.avatarText, { color: colors.white }]}>
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              )}
              <View style={[styles.cameraIconContainer, { borderColor: colors.cardBg, backgroundColor: colors.primary }]}>
                <Ionicons name="camera" size={16} color={colors.white} />
              </View>
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              <Text style={[styles.name, { color: colors.text }]}>{user?.name || 'User'}</Text>
              <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email || 'No email'}</Text>
            </View>
          </View>

          {/* Membership Tier Badge */}
          {user?.role === 'homeowner' && (
            <View style={[styles.membershipCard, { backgroundColor: colors.cardBg }]}>
              <View style={styles.membershipBadge}>
                <Text style={styles.membershipIcon}>{getMembershipTier().icon}</Text>
                <View>
                  <Text style={[styles.membershipTier, { color: colors.text }]}>{getMembershipTier().tier} Member</Text>
                  <Text style={[styles.membershipSubtext, { color: colors.textSecondary }]}>
                    {stats.bookingsCount} bookings completed
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Menu Items */}
          <View style={[styles.menuContainer, { backgroundColor: colors.cardBg }]}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.title}
                style={[
                  styles.menuItem,
                  { borderBottomColor: colors.divider },
                  index === menuItems.length - 1 && styles.menuItemLast,
                ]}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: colors.gray100 }]}>
                    <Ionicons name={item.icon} size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.menuTitle, { color: colors.text }]}>{item.title}</Text>
                  {item.subtitle ? <Text style={{marginLeft: 10, color: colors.textSecondary}}>{item.subtitle}</Text> : null}
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.cardBg }]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={[styles.logoutButtonText, { color: colors.error }]}>Logout</Text>
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
    position: 'relative',
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.white,
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
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
  membershipCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  membershipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  membershipIcon: {
    fontSize: 32,
  },
  membershipTier: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text,
  },
  membershipSubtext: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
