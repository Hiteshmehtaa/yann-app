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
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ComingSoonModal } from '../../components/ComingSoonModal';
import { LogoutConfirmModal } from '../../components/LogoutConfirmModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, RADIUS, SHADOWS, ICON_SIZES, TYPOGRAPHY, ANIMATIONS } from '../../utils/theme';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useResponsive } from '../../hooks/useResponsive';
import { StatsCard } from '../../components/ui/StatsCard';
import { Badge } from '../../components/ui/Badge';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const { user, logout, updateUser, isGuest } = useAuth();
  const { colors, toggleTheme, isDark } = useTheme();
  const { isTablet } = useResponsive();
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    bookingsCount: 0,
    rating: 0,
    totalSpent: 0,
  });
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const isIdentityVerified = !!(user?.isVerified || user?.aadhaarVerified);

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
    if (isGuest) return;
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

  const fetchProfile = useCallback(async () => {
    if (isGuest) return;
    try {
      if (!user?.id && !user?._id && !user?.email) {
        return;
      }

      const role = user?.role || 'homeowner';
      const response = await apiService.getProfile(role);
      if (response.user) {
        const hasValidData = response.user.id || response.user._id || response.user.email || response.user.name;
        if (hasValidData) {
          updateUser(response.user);
        }
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  }, [user?.id, user?._id, user?.email, user?.role, updateUser]);

  useFocusEffect(
    useCallback(() => {
      fetchUserStats();
      fetchProfile();
    }, [fetchUserStats, fetchProfile])
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
    Promise.all([fetchUserStats(), fetchProfile()]).finally(() => setRefreshing(false));
  }, [fetchUserStats, fetchProfile]);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
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
          // Fetch fresh profile data from server to ensure avatar is persisted
          const role = user?.role || 'homeowner';
          const profileResponse = await apiService.getProfile(role);
          if (profileResponse.user) {
            updateUser(profileResponse.user);
            Alert.alert('Success', 'Profile picture updated successfully!');
          } else {
            // Fallback to response data if profile fetch fails
            const newAvatar = response.data.avatar || response.data.profileImage;
            updateUser({ avatar: newAvatar, profileImage: newAvatar });
            Alert.alert('Success', 'Profile picture updated successfully!');
          }
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

  const handleVerification = async () => {
    console.log('Verify button pressed');
    if (isIdentityVerified) {
      console.log('User already verified');
      Alert.alert('Verified', 'Your identity is already verified.');
      return;
    }

    try {
      const userId = user?.id || user?._id;
      console.log('Initiating verification for user:', userId);
      if (!userId) {
        console.error('User ID missing');
        return;
      }

      const redirectUrl = Linking.createURL('verification-success');
      const response = await apiService.verifyIdentity(userId, user.role || 'homeowner', redirectUrl);
      console.log('Verification response:', response);

      if (response.success && response.url) {
        console.log('Opening browser:', response.url);
        try {
          const result = await WebBrowser.openAuthSessionAsync(response.url, redirectUrl, {
            presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
          });

          if (result.type === 'success') {
            const role = user?.role || 'homeowner';
            const profileResponse = await apiService.getProfile(role);
            if (profileResponse.user) {
              updateUser(profileResponse.user);
            }
            Alert.alert('Verified', 'Aadhaar verification completed successfully.');
          }
        } catch (authError) {
          await WebBrowser.openBrowserAsync(response.url);
        }
      } else {
        console.error('Verification failed:', response.message);
        Alert.alert('Error', response.message || 'Failed to initiate verification');
      }
    } catch (error: any) {
      console.error('Verification error details:', error.response?.data || error.message);
      // Fallback to show the raw message if available, instead of generic mask
      const serverMsg = error.response?.data?.message || error.message;
      Alert.alert('Error', serverMsg || 'Verification failed');
    }
  };

  const menuItems: MenuItemType[] = [
    {
      icon: 'create-outline',
      title: t('profile.editProfile'),
      subtitle: '',
      onPress: () => {
        if (user?.role === 'provider') navigation.navigate('ProviderEditProfile');
        else navigation.navigate('EditProfile');
      },
    },
    {
      icon: 'location-outline',
      title: t('profile.manageAddress'),
      subtitle: '',
      onPress: () => navigation.navigate('SavedAddresses'),
    },
    {
      icon: 'shield-checkmark-outline',
      title: t('profile.verifyAadhaar'),
      subtitle: isIdentityVerified ? t('profile.verified') : t('profile.notVerified'),
      onPress: () => handleVerification(),
    },
    {
      icon: 'wallet-outline',
      title: t('profile.wallet'),
      subtitle: '',
      onPress: () => navigation.navigate('Wallet'),
    },
    {
      icon: 'card-outline',
      title: t('profile.paymentMethods'),
      subtitle: '',
      onPress: () => setShowComingSoon(true),
    },
    {
      icon: 'calendar-outline',
      title: t('bookings.myBookings'),
      subtitle: '',
      onPress: () => navigation.navigate('BookingsList'),
    },
    {
      icon: 'settings-outline',
      title: t('profile.settings'),
      subtitle: '',
      onPress: () => navigation.navigate('Notifications'),
    },
    {
      icon: 'language-outline',
      title: t('profile.language'),
      subtitle: '',
      onPress: () => navigation.navigate('LanguageSettings'),
    },
    {
      icon: 'help-circle-outline',
      title: t('profile.helpCenter'),
      subtitle: '',
      onPress: () => navigation.navigate('HelpSupport'),
    },
    // Dark Mode removed - app locked to light mode
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      {/* Clean Professional Header */}
      <View style={[styles.cleanHeader, { backgroundColor: colors.cardBg, borderBottomColor: colors.divider }]}>
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.cleanHeaderTitle, { color: colors.text }]}>{t('profile.profile')}</Text>
        <TouchableOpacity style={styles.headerIconButton}>
          <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: isTablet ? 140 : 120 }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={isGuest ? undefined : <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {isGuest ? (
          <View style={styles.guestContainer}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.guestHero}
            >
              <View style={styles.guestIconCircle}>
                <Ionicons name="person" size={40} color={COLORS.primary} />
              </View>
              <Text style={styles.guestTitle}>Welcome Guest</Text>
              <Text style={styles.guestSubtitle}>
                Sign in to manage bookings, view profile details, and access exclusive features.
              </Text>
            </LinearGradient>

            <View style={styles.guestActions}>
              <TouchableOpacity
                style={[styles.guestButton, { backgroundColor: COLORS.primary }]}
                onPress={() => logout()}
              >
                <Text style={styles.guestButtonText}>Sign In</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.guestButton, { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border }]}
                onPress={() => logout()}
              >
                <Text style={[styles.guestButtonText, { color: COLORS.text }]}>Create Account</Text>
              </TouchableOpacity>
            </View>

            {/* Menu Items for Guest (Settings, Help only) */}
            <View style={[styles.menuContainer, { backgroundColor: colors.cardBg, marginTop: 24 }]}>
              <TouchableOpacity
                style={[styles.menuItem, { borderBottomColor: colors.divider }]}
                onPress={() => navigation.navigate('LanguageSettings')}
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: colors.gray100 }]}>
                    <Ionicons name="language-outline" size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.menuTitle, { color: colors.text }]}>{t('profile.language')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuItem, { borderBottomColor: colors.divider, borderBottomWidth: 0 }]}
                onPress={() => navigation.navigate('HelpSupport')}
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: colors.gray100 }]}>
                    <Ionicons name="help-circle-outline" size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.menuTitle, { color: colors.text }]}>{t('profile.helpCenter')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

            {/* Premium Profile Card */}
            <View style={[styles.profileCard, { backgroundColor: colors.cardBg }]}>
              {/* Avatar with Gradient Ring */}
              <TouchableOpacity
                onPress={handleImagePick}
                disabled={isUploadingAvatar}
                style={styles.avatarWrapper}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2', '#667eea']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatarGradientRing}
                >
                  <View style={[styles.avatarInner, { backgroundColor: colors.cardBg }]}>
                    {isUploadingAvatar ? (
                      <ActivityIndicator size="large" color={colors.primary} />
                    ) : user?.avatar || user?.profileImage ? (
                      <Image
                        source={{ uri: user.avatar || user.profileImage }}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <LinearGradient
                        colors={['#667eea', '#764ba2']}
                        style={styles.avatarPlaceholder}
                      >
                        <Text style={styles.avatarText}>
                          {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </Text>
                      </LinearGradient>
                    )}
                  </View>
                </LinearGradient>
                <View style={styles.cameraIconContainer}>
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.cameraIconGradient}
                  >
                    <Ionicons name="camera" size={14} color="#FFF" />
                  </LinearGradient>
                </View>
              </TouchableOpacity>

              {/* User Info */}
              <View style={styles.profileInfo}>
                <Text style={[styles.name, { color: colors.text }]}>{user?.name || 'User'}</Text>
                <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email || 'No email'}</Text>
                <View style={styles.roleBadge}>
                  <Ionicons name={getRoleBadgeIcon()} size={12} color="#FFF" />
                  <Text style={styles.roleText}>{getRoleDisplay()}</Text>
                </View>
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
                    {item.subtitle ? <Text style={{ marginLeft: 10, color: colors.textSecondary }}>{item.subtitle}</Text> : null}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Logout Button */}
            <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.cardBg }]} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color={colors.error} />
              <Text style={[styles.logoutButtonText, { color: colors.error }]}>{t('profile.logout')}</Text>
            </TouchableOpacity>

            {/* Delete Account Button */}
            <TouchableOpacity
              style={[styles.logoutButton, { backgroundColor: colors.cardBg, marginTop: 12 }]}
              onPress={() => Alert.alert(
                'Delete Account',
                'Are you sure you want to delete your account? This action is irreversible.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        // Call API to delete account
                        await apiService.deleteAccount();
                        await logout();
                      } catch (e: any) {
                        Alert.alert('Error', e.message || 'Failed to delete account');
                      }
                    }
                  }
                ]
              )}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
              <Text style={[styles.logoutButtonText, { color: colors.error }]}>Delete Account</Text>
            </TouchableOpacity>

          </Animated.View>
        )}
      </ScrollView>

      <ComingSoonModal
        visible={showComingSoon}
        title="Coming Soon!"
        message="This feature is under development and will be available soon. Stay tuned!"
        onClose={() => setShowComingSoon(false)}
      />

      <LogoutConfirmModal
        visible={showLogoutConfirm}
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
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
  // New gradient header styles
  gradientHeader: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButtonWhite: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitleWhite: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  settingsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  // Avatar gradient ring styles
  avatarWrapper: {
    position: 'relative',
  },
  avatarGradientRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconGradient: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Role badge styles
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
    gap: 4,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  // Clean professional header styles
  cleanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  cleanHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  guestContainer: {
    alignItems: 'center',
    paddingTop: SPACING.xl,
  },
  guestHero: {
    width: '100%',
    padding: SPACING.xl,
    borderRadius: RADIUS.large,
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  guestIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  guestSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 20,
  },
  guestActions: {
    width: '100%',
    gap: SPACING.md,
  },
  guestButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: RADIUS.medium,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
});
