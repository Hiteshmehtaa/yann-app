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
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import { useFocusEffect } from '@react-navigation/native';

// Reusing global theme constants or defining similar ones matching Member Profile
const COLORS = {
  primary: '#6366F1', // Indigo
  background: '#F8FAFC',
  cardBg: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  divider: '#E2E8F0',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  gray100: '#F1F5F9',
  white: '#FFFFFF',
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
  onPress: () => void;
};

export const ProviderProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user, logout, updateUser } = useAuth();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const hasFetchedRef = useRef(false);

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
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfile().then(() => setRefreshing(false));
  }, [fetchProfile]);

  const handleLogout = () => {
    logout().catch((error) => console.error('Logout error:', error));
  };

  const handleImagePick = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photos.');
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
          updateUser({ ...user, avatar: newAvatar, profileImage: newAvatar });
          Alert.alert('Success', 'Profile picture updated!');
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
    if (user?.isVerified) {
      Alert.alert('Verified', 'Your identity is already verified.');
      return;
    }
    try {
      const userId = user?.id || user?._id;
      if (!userId) return;

      const response = await apiService.verifyIdentity(userId, 'provider');

      if (response.success && response.url) {
        await WebBrowser.openBrowserAsync(response.url);
      } else {
        Alert.alert('Error', response.message || 'Failed to initiate verification');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Verification failed');
    }
  };

  const menuItems: MenuItemType[] = [
    {
      icon: 'create-outline',
      title: 'Edit Profile',
      subtitle: 'Update your bio, rates & personal info',
      onPress: () => navigation.navigate('ProviderEditProfile'),
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'Verify Identity',
      subtitle: user?.isVerified ? 'Verified Partner' : 'Complete KYC Verification',
      onPress: handleVerification,
    },
    {
      icon: 'settings-outline',
      title: 'Settings',
      subtitle: 'Notifications, Password, etc.',
      onPress: () => navigation.navigate('Notifications'), // Redirecting to Notifs as placeholder or actual settings
    },
    {
      icon: 'help-circle-outline',
      title: 'Help Center',
      subtitle: 'FAQs & Support',
      onPress: () => navigation.navigate('HelpSupport'),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Profile Card */}
          <View style={styles.profileCard}>
            <TouchableOpacity
              onPress={handleImagePick}
              disabled={isUploadingAvatar}
              style={styles.avatarContainer}
            >
              <LinearGradient
                colors={['#6366F1', '#818CF8']}
                style={styles.avatarGradient}
              >
                <View style={styles.avatarInner}>
                  {isUploadingAvatar ? (
                    <ActivityIndicator color={COLORS.primary} />
                  ) : user?.avatar || user?.profileImage ? (
                    <Image source={{ uri: user.avatar || user.profileImage }} style={styles.avatarImg} />
                  ) : (
                    <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'P'}</Text>
                  )}
                </View>
              </LinearGradient>
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={12} color="#FFF" />
              </View>
            </TouchableOpacity>

            <View style={styles.profileInfo}>
              <Text style={styles.name}>{user?.name || 'Partner Name'}</Text>
              <Text style={styles.email}>{user?.email || 'email@example.com'}</Text>
              <View style={styles.badgeRow}>
                <View style={styles.roleBadge}>
                  <Ionicons name="briefcase" size={12} color="#FFF" />
                  <Text style={styles.roleText}>PARTNER</Text>
                </View>
                {user?.isVerified && (
                  <View style={[styles.roleBadge, { backgroundColor: COLORS.success }]}>
                    <Ionicons name="shield-checkmark" size={12} color="#FFF" />
                    <Text style={styles.roleText}>VERIFIED</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Menu */}
          <View style={styles.menuContainer}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.menuItem, index === menuItems.length - 1 && styles.noBorder]}
                onPress={item.onPress}
              >
                <View style={styles.menuIconBox}>
                  <Ionicons name={item.icon} size={22} color={COLORS.primary} />
                </View>
                <View style={styles.menuText}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>

          <Text style={styles.versionText}>Version 1.0.0 • Yann App</Text>

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: COLORS.white,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: RADIUS.large,
    marginBottom: SPACING.xl,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: 66,
    height: 66,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roleText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  menuContainer: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    marginBottom: SPACING.xl,
    paddingVertical: 8,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: RADIUS.large,
    gap: 8,
  },
  logoutText: {
    color: COLORS.error,
    fontWeight: '700',
    fontSize: 16,
  },
  versionText: {
    textAlign: 'center',
    marginTop: 24,
    color: COLORS.textSecondary,
    fontSize: 12,
  },
});
