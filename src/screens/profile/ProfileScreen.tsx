import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
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
import { ComingSoonModal } from '../../components/ComingSoonModal';
import { LogoutConfirmModal } from '../../components/LogoutConfirmModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { useDialog } from '../../components/CustomDialog';

const { width, height } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

type MenuItemType = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showBadge?: boolean;
  badgeColor?: string;
};

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

export const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user, logout, updateUser, isGuest } = useAuth();
  const { DialogComponent, showError, showSuccess, showConfirm } = useDialog();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Entrances
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;

  // Large Background Blobs
  const blob1X = useRef(new Animated.Value(0)).current;
  const blob1Y = useRef(new Animated.Value(0)).current;
  
  const blob2X = useRef(new Animated.Value(0)).current;
  const blob2Y = useRef(new Animated.Value(0)).current;
  
  const blob3X = useRef(new Animated.Value(0)).current;
  const blob3Y = useRef(new Animated.Value(0)).current;

  // Small Elements (Particles)
  const particle1X = useRef(new Animated.Value(0)).current;
  const particle1Y = useRef(new Animated.Value(0)).current;
  const particle1Scale = useRef(new Animated.Value(1)).current;

  const particle2X = useRef(new Animated.Value(0)).current;
  const particle2Y = useRef(new Animated.Value(0)).current;

  const particle3X = useRef(new Animated.Value(0)).current;
  const particle3Y = useRef(new Animated.Value(0)).current;
  
  const particle4X = useRef(new Animated.Value(0)).current;
  const particle4Y = useRef(new Animated.Value(0)).current;
  const particle4Rotate = useRef(new Animated.Value(0)).current;

  // Medium Elements (New Shapes)
  const particle5X = useRef(new Animated.Value(0)).current;
  const particle5Y = useRef(new Animated.Value(0)).current;
  const particle5Rotate = useRef(new Animated.Value(0)).current;

  const particle6X = useRef(new Animated.Value(0)).current;
  const particle6Y = useRef(new Animated.Value(0)).current;

  const isIdentityVerified = !!(user?.isVerified || user?.aadhaarVerified || user?.identityVerificationStatus === 'approved');

  const getVerificationStatus = () => {
    if (user?.identityVerificationStatus === 'pending') {
      return { text: 'Pending Confirmation', color: DESIGN.warning };
    } else if (isIdentityVerified) {
      return { text: 'Verified Identity', color: DESIGN.success };
    }
    return { text: 'Verify your ID', color: DESIGN.textTertiary };
  };

  const fetchProfile = useCallback(async () => {
    if (isGuest) return;
    try {
      const resp = await apiService.getProfile('homeowner');
      if (resp.user) updateUser(resp.user);
    } catch (e) { console.warn(e); }
  }, [isGuest, updateUser]);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  useEffect(() => {
    // Entrance
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();

    // Aggressive Random Wandering Algorithm (for large blobs)
    const generateRandomPos = () => ({
      x: (Math.random() * width * 2) - width * 0.5,
      y: (Math.random() * height * 2) - height * 0.5,
    });

    // Subtler Wandering Algorithm (for small elements to drift across screen)
    const generateParticlePos = () => ({
      x: Math.random() * width,
      y: Math.random() * height,
    });

    const startWander = (animX: Animated.Value, animY: Animated.Value, durationRange: [number, number], generator = generateRandomPos) => {
      const nextPos = generator();
      const duration = Math.random() * (durationRange[1] - durationRange[0]) + durationRange[0];
      
      Animated.parallel([
        Animated.timing(animX, { toValue: nextPos.x, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(animY, { toValue: nextPos.y, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ]).start(({ finished }) => {
        if (finished) startWander(animX, animY, durationRange, generator);
      });
    };

    const spinParticle = () => {
    };
    
    // Scale Animation for dots
    const pulseParticle = () => {
      Animated.sequence([
        Animated.timing(particle1Scale, { toValue: 1.5, duration: 3000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(particle1Scale, { toValue: 1, duration: 3000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) })
      ]).start(({ finished }) => {
        if (finished) pulseParticle();
      });
    };

    // Fire large blobs
    startWander(blob1X, blob1Y, [5000, 9000]);
    startWander(blob2X, blob2Y, [6000, 11000]);
    startWander(blob3X, blob3Y, [4000, 8000]);
    
    // Fire small & medium particles (all circles now)
    startWander(particle1X, particle1Y, [10000, 15000], generateParticlePos);
    startWander(particle2X, particle2Y, [12000, 18000], generateParticlePos);
    startWander(particle3X, particle3Y, [15000, 22000], generateParticlePos);
    startWander(particle4X, particle4Y, [18000, 25000], generateRandomPos); 
    startWander(particle5X, particle5Y, [14000, 20000], generateRandomPos); 
    startWander(particle6X, particle6Y, [16000, 24000], generateParticlePos); 
    
    pulseParticle();

    return () => {
      blob1X.stopAnimation(); blob1Y.stopAnimation();
      blob2X.stopAnimation(); blob2Y.stopAnimation();
      blob3X.stopAnimation(); blob3Y.stopAnimation();
      particle1X.stopAnimation(); particle1Y.stopAnimation(); particle1Scale.stopAnimation();
      particle2X.stopAnimation(); particle2Y.stopAnimation();
      particle3X.stopAnimation(); particle3Y.stopAnimation();
      particle4X.stopAnimation(); particle4Y.stopAnimation(); 
      particle5X.stopAnimation(); particle5Y.stopAnimation(); 
      particle6X.stopAnimation(); particle6Y.stopAnimation();
    };
  }, []);

  const handleLogout = () => setShowLogoutConfirm(true);
  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
  };

  const handleImagePick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      setIsUploadingAvatar(true);
      try {
        const mime = result.assets[0].uri.endsWith('png') ? 'image/png' : 'image/jpeg';
        await apiService.uploadAvatar(`data:${mime};base64,${result.assets[0].base64}`);
        fetchProfile();
      } finally { setIsUploadingAvatar(false); }
    }
  };

  const menuItems: MenuItemType[] = [
    { icon: 'calendar-outline', title: 'My Bookings', onPress: () => navigation.navigate('BookingsList') },
    { icon: 'location-outline', title: 'Saved Addresses', onPress: () => navigation.navigate('SavedAddresses') },
    { icon: 'notifications-outline', title: 'Notifications', onPress: () => navigation.navigate('Notifications') },
    { icon: 'shield-checkmark-outline', title: 'Identity Status', subtitle: getVerificationStatus().text, onPress: () => !isIdentityVerified && navigation.navigate('IdentityTypeSelection'), badgeColor: getVerificationStatus().color },
    { icon: 'wallet-outline', title: 'Wallet Balance', onPress: () => navigation.navigate('Wallet') },
    { icon: 'language-outline', title: 'Language', onPress: () => navigation.navigate('LanguageSettings') },
    { icon: 'help-circle-outline', title: 'Help & Support', onPress: () => navigation.navigate('HelpSupport') },
  ];

  const primaryAddress = useMemo(() => {
    if (!user?.addressBook || user.addressBook.length === 0) return 'No address set';
    const primary = user.addressBook.find(addr => addr.isPrimary);
    return primary?.fullAddress || user.addressBook[0].fullAddress || user.addressBook[0].city || 'Update address';
  }, [user?.addressBook]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* 🌊 DYNAMIC RANDOM BACKGROUND MESH + PARTICLES */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.bgBase} />
        
        {/* Large Blobs (Macro-fluidity) */}
        <Animated.View style={[styles.fluidBlob, { 
          backgroundColor: 'rgba(59, 130, 246, 0.15)', width: width * 1.2, height: width * 1.2,
          transform: [{ translateX: blob1X }, { translateY: blob1Y }] 
        }]} />
        <Animated.View style={[styles.fluidBlob, { 
          backgroundColor: 'rgba(139, 92, 246, 0.1)', width: width * 1.5, height: width * 1.5,
          transform: [{ translateX: blob2X }, { translateY: blob2Y }] 
        }]} />
        <Animated.View style={[styles.fluidBlob, { 
          backgroundColor: 'rgba(59, 130, 246, 0.12)', width: width * 0.8, height: width * 0.8,
          transform: [{ translateX: blob3X }, { translateY: blob3Y }] 
        }]} />

        {/* Small Elements (Micro-fluidity & Aesthetic Pop) */}
        
        {/* Particle 1 */}
        <Animated.View style={[styles.smallParticle, { 
          width: 8, height: 8, borderRadius: 4, backgroundColor: DESIGN.primary, opacity: 0.3,
          transform: [{ translateX: particle1X }, { translateY: particle1Y }, { scale: particle1Scale }]
        }]} />
        
        {/* Particle 2 */}
        <Animated.View style={[styles.smallParticle, { 
          width: 12, height: 12, borderRadius: 6, backgroundColor: 'rgba(139, 92, 246, 0.4)',
          transform: [{ translateX: particle2X }, { translateY: particle2Y }]
        }]} />
        
        {/* Particle 3 */}
        <Animated.View style={[styles.smallParticle, { 
          width: 6, height: 6, borderRadius: 3, backgroundColor: DESIGN.primary, opacity: 0.2,
          transform: [{ translateX: particle3X }, { translateY: particle3Y }]
        }]} />
        
        {/* Particle 4 */}
        <Animated.View style={[styles.smallParticle, { 
          width: 14, height: 14, borderRadius: 7, backgroundColor: 'rgba(59, 130, 246, 0.25)',
          transform: [{ translateX: particle4X }, { translateY: particle4Y }]
        }]} />

        {/* Particle 5 */}
        <Animated.View style={[styles.smallParticle, { 
          width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(139, 92, 246, 0.3)',
          transform: [{ translateX: particle5X }, { translateY: particle5Y }]
        }]} />
        
        {/* Particle 6 */}
        <Animated.View style={[styles.smallParticle, { 
          width: 8, height: 8, borderRadius: 4, backgroundColor: DESIGN.primary, opacity: 0.35,
          transform: [{ translateX: particle6X }, { translateY: particle6Y }]
        }]} />

      </View>

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={DESIGN.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('EditProfile')}>
            <Ionicons name="pencil-outline" size={20} color={DESIGN.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          style={{ backgroundColor: 'transparent' }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); Promise.all([fetchProfile()]).finally(() => setRefreshing(false)); }} />}
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            
            {/* 🧑 HERO SECTION */}
            <View style={styles.heroArea}>
              <TouchableOpacity onPress={handleImagePick} style={styles.avatarContainer}>
                <View style={[styles.avatarBorder, { borderColor: isUploadingAvatar ? DESIGN.primary : 'rgba(255,255,255,0.6)' }]}>
                  {isUploadingAvatar ? <ActivityIndicator size="small" color={DESIGN.primary} /> : (
                    user?.avatar || user?.profileImage ? (
                      <Image 
                        source={{ uri: user.avatar || user.profileImage }} 
                        style={styles.avatarImg} 
                      />
                    ) : ( 
                      <View style={styles.initialsContainer}>
                        <Text style={styles.avatarInitials}>{user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
                      </View>
                    )
                  )}
                </View>
                <View style={styles.cameraBadge}>
                  <Ionicons name="camera" size={12} color="#fff" />
                </View>
              </TouchableOpacity>

              <View style={styles.nameRow}>
                <Text style={styles.userName}>{user?.name || 'User'}</Text>
              </View>
              <View style={styles.subHeroRow}>
                <Text style={styles.userEmail}>{user?.email || 'member@yann.com'}</Text>
              </View>
            </View>

            {/* 📝 PERSONAL INFO (Transparent Wireframe Card) */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitleText}>INFO</Text>
            </View>
            <View style={styles.transparentPanel}>
              <View style={styles.infoRowLiquid}>
                <View style={styles.liquidIconContainer}>
                  <Ionicons name="call-outline" size={18} color={DESIGN.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>{user?.phone || 'Not provided'}</Text>
                </View>
              </View>
              <View style={styles.panelDivider} />
              <View style={styles.infoRowLiquid}>
                <View style={styles.liquidIconContainer}>
                  <Ionicons name="location-outline" size={18} color={DESIGN.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Address</Text>
                  <Text style={styles.infoValue} numberOfLines={2}>{primaryAddress}</Text>
                </View>
              </View>
            </View>

            {/* ⚙️ OPTIONS LIST (Transparent Wireframe Card) */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitleText}>ACCOUNT</Text>
            </View>
            <View style={styles.transparentPanel}>
              {menuItems.map((item, idx) => (
                <View key={idx} style={styles.glassRowWrapper}>
                  <TouchableOpacity style={styles.menuRowLiquid} onPress={item.onPress} activeOpacity={0.6}>
                    <View style={styles.liquidIconContainer}>
                      <Ionicons name={item.icon} size={20} color={DESIGN.primary} />
                    </View>
                    <View style={styles.menuTextContainer}>
                      <Text style={styles.menuTitle}>{item.title}</Text>
                      {item.subtitle && <Text style={[styles.menuSubtitle, { color: item.badgeColor || DESIGN.textTertiary }]}>{item.subtitle}</Text>}
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={'rgba(148, 163, 184, 0.4)'} />
                  </TouchableOpacity>
                  {idx < menuItems.length - 1 && <View style={styles.panelDivider} />}
                </View>
              ))}
            </View>

            {/* 🚪 ACTIONS (Transparent) */}
            <TouchableOpacity style={styles.transparentActionBtn} onPress={handleLogout} activeOpacity={0.7}>
              <Ionicons name="log-out-outline" size={20} color={DESIGN.error} />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.deleteLink} 
              onPress={() => showConfirm('Delete Account', 'This action is permanent.', () => apiService.deleteAccount().then(logout))}
            >
              <Text style={styles.deleteLinkText}>Delete Account</Text>
            </TouchableOpacity>

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
  fluidBlob: {
    position: 'absolute',
    borderRadius: 9999, // Make them perfect circles
    opacity: 0.8, 
  },
  smallParticle: {
    position: 'absolute',
    // Position driven entirely by animation translation
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  headerBtn: {
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
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '500',
    color: DESIGN.textTertiary,
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
  infoRowLiquid: {
    flexDirection: 'row',
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 16,
    paddingRight: 16,
    alignItems: 'center',
    width: '100%',
  },
  infoContent: {
    flex: 1,
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: DESIGN.textTertiary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: DESIGN.text,
    lineHeight: 20,
  },

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
    marginTop: 2,
  },

  // 🚪 ACTIONS
  transparentActionBtn: {
    backgroundColor: 'transparent', 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)', 
    marginBottom: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '800',
    color: DESIGN.error,
  },
  deleteLink: {
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 20,
  },
  deleteLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: DESIGN.textTertiary,
  },
});
