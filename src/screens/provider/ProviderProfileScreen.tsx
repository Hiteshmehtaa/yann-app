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
  ActivityIndicator,
  RefreshControl,
  Platform,
  Dimensions,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LogoutConfirmModal } from '../../components/LogoutConfirmModal';
import { useDialog } from '../../components/CustomDialog';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { convertToWebP } from '../../utils/imageCompression';
import * as WebBrowser from 'expo-web-browser';
import { useFocusEffect } from '@react-navigation/native';
import { shareProviderProfile } from '../../utils/shareUtils';
import * as Linking from 'expo-linking';

const { width, height } = Dimensions.get('window');

// DYNAMIC TRANSPARENT UI TOKENS
const DESIGN = {
  primary: '#3B82F6',           
  bg: '#FFFFFF', 
  glassBg: 'transparent', 
  glassBorder: 'rgba(148, 163, 184, 0.4)', // Subtle gray for better separation
  text: '#0F172A',              
  textSecondary: '#334155',     
  textTertiary: '#64748B',      
  divider: 'rgba(0, 0, 0, 0.04)', 
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
};

const SPACING = { md: 16, lg: 24, xl: 32 };
const RADIUS = { large: 20 };

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

type MenuItemType = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  subtitleStyle?: object;
  onPress: () => void;
};

export const ProviderProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user, logout, updateUser } = useAuth();
  const { DialogComponent, showError, showSuccess, showWarning, showInfo, showConfirm } = useDialog();
  // TODO: Remove this mock after verification
  // useEffect(() => {
  //   if (user && !user.hasLateStarts) {
  //     updateUser({ ...user, hasLateStarts: true });
  //   }
  // }, [user]);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Entrances
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;



  const hasFetchedRef = useRef(false);
  const isIdentityVerified = !!(user?.isVerified || user?.aadhaarVerified);
  
  // Get verification status for display
  const getVerificationStatus = () => {
    if (user?.identityVerificationStatus === 'pending') {
      return { text: 'Pending Approval', color: DESIGN.warning };
    } else if (user?.identityVerificationStatus === 'rejected') {
      return { text: 'Rejected - Retry', color: DESIGN.error };
    } else if (isIdentityVerified) {
      return { text: 'Verified Partner', color: DESIGN.success };
    }
    return { text: 'Complete KYC Verification', color: DESIGN.textTertiary };
  };

  // Refresh profile data
  const fetchProfile = useCallback(async () => {
    try {
      // Only fetch if we have a valid user with ID
      if (!user?.id && !user?._id && !user?.email) {
        console.warn('⚠️ Cannot fetch profile without user ID');
        return;
      }

      // Prevent repeated fetches
      if (hasFetchedRef.current) {
        return;
      }
      hasFetchedRef.current = true;

      const response = await apiService.getProfile('provider');
      if (response.user) {
        // Validate response has critical fields
        const hasValidData = response.user.id || response.user._id || response.user.email || response.user.name;
        if (hasValidData) {
          updateUser(response.user);
        } else {
          console.warn('⚠️ Received invalid profile data from server');
        }
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  }, [updateUser]);

  useFocusEffect(
    useCallback(() => {
      // Reset fetch flag when screen gains focus
      hasFetchedRef.current = false;
      // Only fetch if we have valid user data
      if (user?.id || user?._id || user?.email) {
        fetchProfile();
      }
    }, [fetchProfile])
  );

  useEffect(() => {
    // Entrance
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();

    return () => {
    };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfile().then(() => setRefreshing(false));
  }, [fetchProfile]);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout().catch((error) => console.error('Logout error:', error));
  };

  const handleImagePick = async () => {
    try {
      console.log('📸 Starting image pick...');
      // Alert.alert('Debug', 'Starting image pick flow'); // Uncomment if needed to verify tap

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showError('Permission Required', 'Please allow access to your photos to update your profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log('📸 Image picker result:', {
        canceled: result.canceled,
        hasAssets: !!result.assets,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUploadingAvatar(true);
        const base64Image = await convertToWebP(result.assets[0].uri, { maxWidth: 800 });

        console.log('📸 Image details:', {
          sizeKB: Math.round(base64Image.length / 1024),
          uri: result.assets[0].uri
        });

        console.log('🔐 Calling uploadProviderAvatar...');
        const response = await apiService.uploadProviderAvatar(base64Image);
        console.log('✅ Upload response success:', response.success);

        if (response.success && response.data) {
          const avatarLen = response.data.avatar ? response.data.avatar.length : 0;
          console.log(`✅ Upload returned avatar length: ${avatarLen}`);

          // Update local state IMMEDIATELY with the uploaded data
          // This ensures the UI reflects the change even if the profile fetch fails or is cached
          const newAvatar = response.data.avatar || response.data.profileImage;
          if (newAvatar) {
            console.log('🔄 Updating local user state immediately with new avatar');
            updateUser({ ...user, avatar: newAvatar, profileImage: newAvatar });
          }

          console.log('🔄 Fetching fresh profile to sync...');
          // Fetch fresh profile data from server to ensure avatar is persisted
          const profileResponse = await apiService.getProfile('provider');
          console.log('✅ Profile response:', {
            hasUser: !!profileResponse.user,
            avatarLen: profileResponse.user?.avatar ? profileResponse.user.avatar.length : 0,
            profileImageLen: profileResponse.user?.profileImage ? profileResponse.user.profileImage.length : 0
          });

          if (profileResponse.user) {
            updateUser(profileResponse.user);
            showSuccess('Profile Updated', 'Your profile picture has been updated successfully.');
          } else {
            // Fallback to response data if profile fetch fails
            const newAvatar = response.data.avatar || response.data.profileImage;
            updateUser({ ...user, avatar: newAvatar, profileImage: newAvatar });
            showSuccess('Profile Updated', 'Your profile picture has been updated successfully.');
          }
        } else {
          console.error('❌ Upload failed:', response.message);
          throw new Error(response.message);
        }
      }
    } catch (error: any) {
      console.error('❌ Image pick error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      showError('Upload Failed', error.message || 'Failed to upload profile picture. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleVerification = async () => {
    // If already verified, just show message
    if (isIdentityVerified) {
      showSuccess('Verified Partner', 'Your identity is already verified securely on the platform.');
      return;
    }
    
    // If pending, show status
    if (user?.identityVerificationStatus === 'pending') {
      showInfo(
        'Verification Pending',
        'Your documents are under review. You will be notified once the verification is complete.'
      );
      return;
    }
    
    // If rejected, show reason and allow retry
    if (user?.identityVerificationStatus === 'rejected') {
      showConfirm(
        'Verification Rejected',
        user?.identityRejectionReason || 'Your verification was rejected. Please submit valid documents.',
        () => navigation.navigate('IdentityTypeSelection'),
        { confirmText: 'Try Again', type: 'error' }
      );
      return;
    }
    
    navigation.navigate('IdentityTypeSelection');
  };

  const menuItems: MenuItemType[] = [
    {
      icon: 'create-outline',
      title: 'Edit Profile',
      subtitle: 'Update your bio, rates & personal info',
      onPress: () => navigation.navigate('ProviderEditProfile'),
    },
    {
      icon: 'briefcase-outline',
      title: 'Manage Services',
      subtitle: 'Add, update rates & remove services',
      onPress: () => navigation.navigate('ProviderServices'),
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'Verify Yourself',
      subtitle: getVerificationStatus().text,
      subtitleStyle: { color: getVerificationStatus().color, fontWeight: '600' as const },
      onPress: handleVerification,
    },
    {
      icon: 'card-outline',
      title: 'Bank Details',
      subtitle: 'Manage your bank account for withdrawals',
      onPress: () => navigation.navigate('BankDetails'),
    },
    {
      icon: 'settings-outline',
      title: 'Settings',
      subtitle: 'Notifications, Password, etc.',
      onPress: () => navigation.navigate('Notifications'), // Redirecting to Notifs as placeholder or actual settings
    },
    {
      icon: 'wallet-outline',
      title: 'Yann Wallet',
      subtitle: 'Manage your earnings & payments',
      onPress: () => navigation.navigate('Wallet'),
    },
    {
      icon: 'help-circle-outline',
      title: 'Help Center',
      subtitle: 'FAQs & Support',
      onPress: () => navigation.navigate('HelpSupport'),
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Background */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.bgBase} />
      </View>

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={24} color={DESIGN.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Partner Profile</Text>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={async () => {
              const success = await shareProviderProfile({
                providerId: user?.id || user?._id || '',
                providerName: user?.name || 'Provider',
                rating: user?.rating,
                services: user?.services || [],
              });
              if (success) showSuccess('Profile Shared', 'Your public profile link has been shared successfully!');
            }}
          >
            <Ionicons name="share-outline" size={24} color={DESIGN.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          style={{ backgroundColor: 'transparent' }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

            {/* 🧑 HERO SECTION */}
            <View style={styles.heroArea}>
              <TouchableOpacity onPress={handleImagePick} disabled={isUploadingAvatar} style={styles.avatarContainer}>
                <View style={[styles.avatarBorder, { borderColor: isUploadingAvatar ? DESIGN.primary : 'rgba(255,255,255,0.6)' }]}>
                  {isUploadingAvatar ? (
                    <ActivityIndicator size="small" color={DESIGN.primary} />
                  ) : user?.avatar || user?.profileImage ? (
                    <Image source={{ uri: user.avatar || user.profileImage }} style={styles.avatarImg} />
                  ) : (
                    <View style={styles.initialsContainer}>
                      <Text style={styles.avatarInitials}>{user?.name?.charAt(0).toUpperCase() || 'P'}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.cameraBadge}>
                  <Ionicons name="camera" size={12} color="#fff" />
                </View>
              </TouchableOpacity>

              <View style={styles.nameRow}>
                <Text style={styles.userName}>{user?.name || 'Partner Name'}</Text>
              </View>
              <View style={styles.subHeroRow}>
                <Text style={styles.userEmail}>{user?.email || 'email@example.com'}</Text>
              </View>

              <View style={styles.badgeRow}>
                <View style={styles.heroBadge}>
                  <Ionicons name="briefcase" size={12} color="#FFF" />
                  <Text style={styles.heroBadgeText}>PARTNER</Text>
                </View>
                {isIdentityVerified && (
                  <View style={[styles.heroBadge, { backgroundColor: DESIGN.success }]}>
                    <Ionicons name="shield-checkmark" size={12} color="#FFF" />
                    <Text style={styles.heroBadgeText}>VERIFIED</Text>
                  </View>
                )}
                {user?.hasLateStarts && (
                  <TouchableOpacity
                    style={[styles.heroBadge, { backgroundColor: DESIGN.error }]}
                    onPress={() => showWarning('Late Start History', 'You have a history of not starting bookings on time. Please ensure you start jobs within the 2-hour buffer to remove this badge.')}
                  >
                    <Ionicons name="warning" size={12} color="#FFF" />
                    <Text style={styles.heroBadgeText}>LATE STARTS</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* ⚙️ OPTIONS LIST (Transparent Wireframe Card) */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitleText}>MENU</Text>
            </View>
            <View style={styles.transparentPanel}>
              {menuItems.map((item, index) => (
                <View key={index} style={styles.glassRowWrapper}>
                  <TouchableOpacity style={styles.menuRowLiquid} onPress={item.onPress} activeOpacity={0.6}>
                    <View style={styles.liquidIconContainer}>
                      <Ionicons name={item.icon} size={20} color={DESIGN.primary} />
                    </View>
                    <View style={styles.menuTextContainer}>
                      <Text style={styles.menuTitle}>{item.title}</Text>
                      <Text style={[styles.menuSubtitle, item.subtitleStyle]}>{item.subtitle}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={DESIGN.glassBorder} />
                  </TouchableOpacity>
                  {index < menuItems.length - 1 && <View style={styles.panelDivider} />}
                </View>
              ))}
            </View>

            {/* 🚪 ACTIONS (Transparent) */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitleText}>ACCOUNT</Text>
            </View>
            <View style={styles.transparentPanel}>
              <View style={styles.glassRowWrapper}>
                <TouchableOpacity style={styles.menuRowLiquid} onPress={handleLogout} activeOpacity={0.6}>
                  <View style={[styles.liquidIconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                    <Ionicons name="log-out-outline" size={20} color={DESIGN.error} />
                  </View>
                  <View style={styles.menuTextContainer}>
                    <Text style={[styles.menuTitle, { color: DESIGN.error }]}>Sign Out</Text>
                  </View>
                </TouchableOpacity>
              </View>
              <View style={styles.panelDivider} />
              <View style={styles.glassRowWrapper}>
                <TouchableOpacity 
                  style={styles.menuRowLiquid} 
                  activeOpacity={0.6}
                  onPress={() => showConfirm('Delete Account', 'Are you sure you want to delete your account? This action is irreversible.', async () => {
                    try {
                      await apiService.deleteAccount();
                      await logout();
                    } catch (e: any) {
                      showError('Error', e.message || 'Failed to delete account. Please try again.');
                    }
                  })}
                >
                  <View style={[styles.liquidIconContainer, { backgroundColor: 'transparent', borderWidth: 1, borderColor: DESIGN.error }]}>
                    <Ionicons name="trash-outline" size={18} color={DESIGN.error} />
                  </View>
                  <View style={styles.menuTextContainer}>
                    <Text style={[styles.menuTitle, { color: DESIGN.error, fontSize: 14 }]}>Delete Account</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.versionText}>Version 1.0.0 • Yann App</Text>

          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      <LogoutConfirmModal visible={showLogoutConfirm} onConfirm={confirmLogout} onCancel={() => setShowLogoutConfirm(false)} />
      {DialogComponent}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN.bg,
  },
  bgBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: DESIGN.bg,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: DESIGN.text,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 100,
  },
  heroArea: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 36, 
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarBorder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2, 
    backgroundColor: 'transparent',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  initialsContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: '800',
    color: DESIGN.primary,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: DESIGN.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: '800',
    color: DESIGN.text,
    letterSpacing: -0.5,
  },
  subHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '500',
    color: DESIGN.textTertiary,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  heroBadge: {
    backgroundColor: DESIGN.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },

  // 📝 GLASS PANELS (Transparent Wireframes)
  sectionHeader: {
    marginBottom: 6,
    paddingLeft: 4,
  },
  sectionTitleText: {
    fontSize: 11, 
    fontWeight: '700',
    color: DESIGN.textTertiary,
    letterSpacing: 2, 
  },
  transparentPanel: {
    backgroundColor: DESIGN.glassBg, // 'transparent'
    borderRadius: 20, 
    borderWidth: 1,
    borderColor: DESIGN.glassBorder, // Subtle white border holds the shape
    marginBottom: 24, 
    overflow: 'hidden',
  },
  glassRowWrapper: {
    backgroundColor: 'transparent',
  },
  panelDivider: {
    height: 1,
    backgroundColor: DESIGN.divider, 
    marginHorizontal: 16, 
  },
  liquidIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.8)', 
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  // 💧 LIQUID ROWS
  menuRowLiquid: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 16,
    paddingRight: 16, 
    width: '100%',
  },
  menuTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: DESIGN.text,
  },
  menuSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: DESIGN.textSecondary,
    marginTop: 2,
  },

  versionText: {
    textAlign: 'center',
    marginTop: 12,
    color: DESIGN.textTertiary,
    fontSize: 12,
  },
});
