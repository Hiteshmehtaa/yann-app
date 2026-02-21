import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SmartHero } from '../../components/home/SmartHero';
import { FloatingDock } from '../../components/home/FloatingDock';
import { ServiceMatrix } from '../../components/home/ServiceMatrix';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { apiService } from '../../services/api';
import { SERVICES } from '../../utils/constants';
import type { Service, Address } from '../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SearchBar } from '../../components/ui/SearchBar';
import { ServiceCard } from '../../components/ui/ServiceCard';
import { RotatingLottieBanner } from '../../components/ui/RotatingLottieBanner';
import { SkeletonServiceCard } from '../../components/ui/SkeletonLoader';
import { UpdateNotificationBanner } from '../../components/ui/UpdateNotificationBanner';
import { ErrorDisplay } from '../../components/ui/ErrorDisplay';
import { EmptyState } from '../../components/EmptyState';
import { LottieAnimations } from '../../utils/lottieAnimations';
import { COLORS, SHADOWS } from '../../utils/theme';
import { useResponsive } from '../../hooks/useResponsive';
import { useWalletBalance } from '../../hooks/useWalletBalance';
import { checkForAppUpdate, VersionInfo } from '../../utils/versionCheck';
import { getLocationWithAddress } from '../../utils/locationService';
import { getServiceIconImage } from '../../utils/serviceImages';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

// Map service titles to appropriate Ionicons
const SERVICE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Drivers': 'car-sport',
  'Full-Day Personal Driver': 'car-sport',
  'Pujari': 'flame',
  'Pujari Services': 'flame',
  'Maids': 'home',
  'Cleaners': 'sparkles',
  'Toilet Cleaning Experts': 'water',
  'Office Boys': 'briefcase',
  'Chaprasi': 'people',
  'Baby Sitters': 'heart',
  'Nurses': 'medkit',
  'Attendants': 'accessibility',
  'Heena Artists': 'color-palette',
  'AC Service Technicians': 'snow',
  'RO Service Technicians': 'water',
  'Refrigerator Service Technicians': 'cube',
  'Air Purifier Service Technicians': 'leaf',
  'Chimney Service Technicians': 'flame',
  'Repairs & Maintenance': 'construct',
  'Security Guards': 'shield-checkmark',
  'House Cleaning': 'sparkles',
  'Delivery Services': 'bicycle',
  'Pet Care': 'paw',
  'Personal Assistant': 'briefcase',
  'Garden & Landscaping': 'leaf',
};

// Empty State Component — uses shared Lottie-powered EmptyState
const SearchEmptyState = () => {
  return (
    <View style={styles.emptyState}>
      <EmptyState
        title="No services found"
        subtitle="Try a different search term"
        animationSource={LottieAnimations.emptyCart}
      />
    </View>
  );
};

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { unreadCount } = useNotifications();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [services, setServices] = useState<Service[]>(SERVICES);
  const [filteredServices, setFilteredServices] = useState<Service[]>(SERVICES);
  const [partnerCounts, setPartnerCounts] = useState<{ [serviceTitle: string]: number }>({});
  const [totalUniqueProviders, setTotalUniqueProviders] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasFetchedInitial, setHasFetchedInitial] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState<string[]>(['all']);

  // Feature states
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [currentLocationAddress, setCurrentLocationAddress] = useState<string>('');
  const [matchedAddress, setMatchedAddress] = useState<Address | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Error states
  const [error, setError] = useState<Error | null>(null);
  const [isNetworkError, setIsNetworkError] = useState(false);

  useWalletBalance(); // usage to init if needed, though mostly for global state

  // Header Animation
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1], // Fade IN the glass background
    extrapolate: 'clamp',
  });

  const getServiceIcon = (categoryOrName: string): string => {
    return '✨';
  };

  const fetchServices = async () => {
    try {
      setError(null);
      setIsNetworkError(false);
      const response = await apiService.getAllServices();
      const fetchedServices = response.data || [];

      // Map fetched services to our app structure
      const mappedFetchedServices: Service[] = fetchedServices.map((s: any, index: number) => {
        const isNew = s.createdAt
          ? (Date.now() - new Date(s.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000
          : false;

        // Try to resolve a local image icon based on the title
        const resolvedIcon = getServiceIconImage(s.title || s.name);

        return {
          id: s._id || s.id || `service-${index + 1}`,
          title: s.title || s.name,
          description: s.description || '',
          category: s.category || 'other',
          price: s.price || (s.basePrice ? `₹${s.basePrice}` : 'View prices'),
          icon: resolvedIcon || '✨', // Use resolved image or default emoji
          popular: s.popular || false,
          features: s.features || [],
          isNew,
        };
      });

      // MERGE LOGIC: Combine fetched services with local SERVICES constant
      // Priority: Fetched Service > Local Service (based on matching title)
      const mergedServices: Service[] = [...SERVICES];

      mappedFetchedServices.forEach(fetchedService => {
        const index = mergedServices.findIndex(
          local => local.title.toLowerCase() === fetchedService.title.toLowerCase()
        );

        if (index !== -1) {
          // Update existing local service with backend data (id, price, etc)
          // PRESERVE LOCAL ICON if fetched icon is just the default emoji
          const fetchedIcon = fetchedService.icon;
          const localIcon = mergedServices[index].icon;

          mergedServices[index] = {
            ...mergedServices[index],
            ...fetchedService,
            // Restore local icon if backend didn't provide a real one (URL or non-default)
            icon: (fetchedIcon === '✨' && localIcon) ? localIcon : fetchedIcon
          };
        } else {
          // Optional: Add entirely new services from backend that aren't in local constants
          // distinct from "Coming Soon" ones.
          mergedServices.push(fetchedService);
        }
      });

      setServices(mergedServices);
      setFilteredServices(mergedServices);

      // Update categories based on the merged list
      const uniqueCategories = ['all', ...Array.from(new Set(mergedServices.map(s => s.category).filter(Boolean)))];
      setCategories(uniqueCategories);

    } catch (err: any) {
      console.error('Error fetching services:', err);
      // Fallback is already handled by initial state, but explicit reset is safe
      // If network error, we stick with initialized SERVICES (which are already set)

      const isNetwork =
        err.message?.toLowerCase().includes('network') ||
        err.message?.toLowerCase().includes('connection') ||
        err.message?.toLowerCase().includes('internet') ||
        err.code === 'NETWORK_ERROR' ||
        !navigator.onLine;

      setError(err);
      setIsNetworkError(isNetwork);
      // Keep showing SERVICES if fetch fails
      setFilteredServices(SERVICES);
    }
  };

  const fetchPartnerCounts = async () => {
    try {
      // Parallel fetch: Service counts (for cards) AND All Providers (for unique total)
      const [countsResponse, providersResponse] = await Promise.all([
        apiService.getServicePartnerCounts(),
        apiService.getAllProviders({ limit: 1 }) // We just need the meta.total ideally, or fetch all if small
      ]);

      // 1. Process Service Counts
      if (countsResponse.success && countsResponse.data && Array.isArray(countsResponse.data)) {
        console.log('📊 Raw Partner Counts:', JSON.stringify(countsResponse.data, null, 2));
        const countsObject: { [key: string]: number } = {};
        for (const item of countsResponse.data) {
          if (item?.service && typeof item?.providerCount === 'number') {
            countsObject[item.service] = item.providerCount;
          }
        }
        console.log('✅ Processed Partner Counts:', JSON.stringify(countsObject, null, 2));
        setPartnerCounts(countsObject);
      }

      // 2. Process Unique Total Providers
      if (providersResponse.success && providersResponse.meta) {
        // Use the server-provided total count from metadata if available
        setTotalUniqueProviders(providersResponse.meta.total || 0);
      } else if (providersResponse.success && Array.isArray(providersResponse.data)) {
        // Fallback: count the array length
        setTotalUniqueProviders(providersResponse.data.length);
      }

    } catch (err) {
      console.error('❌ Error fetching partner data:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Check for app updates
  const checkVersion = async () => {
    try {
      const info = await checkForAppUpdate();
      setVersionInfo(info);
      setShowUpdateBanner(info.shouldShowNotification);
    } catch (error) {
      console.error('Error checking version:', error);
    }
  };

  // Fetch location and match with saved addresses
  const fetchLocationAndAddress = async () => {
    try {
      setIsLoadingLocation(true);
      const result = await getLocationWithAddress(user?.addressBook || []);

      if (result.matchedAddress) {
        setMatchedAddress(result.matchedAddress);
        setCurrentLocationAddress('');
      } else if (result.currentAddress) {
        setCurrentLocationAddress(result.currentAddress.fullAddress);
        setMatchedAddress(null);
      }
    } catch (error) {
      console.error('Error fetching location:', error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  useEffect(() => {
    if (hasFetchedInitial) return;
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    Promise.all([
      fetchServices(),
      fetchPartnerCounts(),
      checkVersion(),
      fetchLocationAndAddress()
    ]).then(() => setHasFetchedInitial(true));
  }, [hasFetchedInitial]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchServices();
    fetchPartnerCounts();
    checkVersion();
    fetchLocationAndAddress();
  }, []);

  // Sort services
  useEffect(() => {
    if (Object.keys(partnerCounts).length === 0 && services.length > 0) return;

    const sorted = [...filteredServices].sort((a, b) => {
      const countA = partnerCounts[a.title] || 0;
      const countB = partnerCounts[b.title] || 0;
      const providersA = typeof countA === 'number' ? countA : (countA as any)?.providerCount || 0;
      const providersB = typeof countB === 'number' ? countB : (countB as any)?.providerCount || 0;

      if (providersA > 0 && providersB === 0) return -1;
      if (providersA === 0 && providersB > 0) return 1;
      if (a.popular && !b.popular) return -1;
      if (!a.popular && b.popular) return 1;
      return a.title.localeCompare(b.title);
    });

    const currentIds = filteredServices.map(s => s.id).join(',');
    const newIds = sorted.map(s => s.id).join(',');

    if (currentIds !== newIds) {
      setFilteredServices(sorted);
    }
  }, [partnerCounts, services]);



  // Search filtering & Dynamic "Coming Soon" Update
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      let filtered = services.map(s => {
        // Dynamic Coming Soon Logic
        const count = partnerCounts[s.title] || 0;
        const providerCount = typeof count === 'number' ? count : (count as any)?.providerCount || 0;

        // Correct Logic: If we have fetched initial data, trust the providerCount (even if 0)
        // This ensures services are marked 'Coming Soon' if DB returns 0 providers
        const isNowComingSoon = hasFetchedInitial && providerCount === 0;

        return {
          ...s,
          isComingSoon: isNowComingSoon,
          partnerCount: providerCount
        };
      });

      if (selectedCategory !== 'all') {
        filtered = filtered.filter(s => s.category?.toLowerCase() === selectedCategory.toLowerCase());
      }
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(s => s.title.toLowerCase().includes(query) || s.description.toLowerCase().includes(query));
      }

      const sorted = filtered.sort((a, b) => {
        // Sort by availability first
        if (!a.isComingSoon && b.isComingSoon) return -1;
        if (a.isComingSoon && !b.isComingSoon) return 1;

        // Then by popularity
        if (a.popular && !b.popular) return -1;
        if (!a.popular && b.popular) return 1;

        return a.title.localeCompare(b.title);
      });

      setFilteredServices(sorted);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, services, selectedCategory, partnerCounts, hasFetchedInitial]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      {/* Hero Background Gradient (Subtle) */}
      <View style={styles.heroGradient}>
        <LinearGradient
          colors={isDark
            ? [COLORS.primary + '20', COLORS.background]
            : [COLORS.primary + '10', COLORS.background]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.6 }}
        />
      </View>

      {showUpdateBanner && versionInfo && (
        <UpdateNotificationBanner
          currentVersion={versionInfo.currentVersion}
          latestVersion={versionInfo.latestVersion || ''}
          onDismiss={() => setShowUpdateBanner(false)}
        />
      )}

      {/* Main Content */}
      <Animated.ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 60 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            progressViewOffset={insets.top + 100}
          />
        }
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
      >
        {/* Smart Hero Section */}
        <SmartHero
          userName={user?.name}
          activeServices={Object.keys(partnerCounts).length || 0}
          activeProviders={totalUniqueProviders || 0}
        />

        {/* Floating Control Dock */}
        <FloatingDock
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {error ? (
          <ErrorDisplay
            error={error}
            isNetworkError={isNetworkError}
            onRetry={() => {
              setError(null);
              setIsNetworkError(false);
              fetchServices();
              fetchPartnerCounts();
            }}
          />
        ) : (
          <View style={styles.contentSection}>
            {/* Banner */}
            <RotatingLottieBanner />

            {/* Service Matrix (Bento Grid) */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Services</Text>
            </View>

            {hasFetchedInitial ? (
              <ServiceMatrix
                services={filteredServices}
                onPressService={(service) => {
                  // Direct navigation for Driver services
                  if (service.title.toLowerCase().includes('driver')) {
                    navigation.navigate('DriverBooking', { service });
                  } else {
                    navigation.navigate('ServiceDetail', { service });
                  }
                }}
              />
            ) : (
              <View style={styles.loadingContainer}>
                {[1, 2, 3, 4].map(i => <SkeletonServiceCard key={i} />)}
              </View>
            )}

            {filteredServices.length === 0 && hasFetchedInitial && <SearchEmptyState />}
          </View>
        )}
      </Animated.ScrollView>

      {/* Ultra-Header (Floating Transparent Bar) */}
      <View style={[styles.fixedHeaderContainer, { paddingTop: insets.top }]}>
        <Animated.View style={[styles.glassBackground, { opacity: headerOpacity }]}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={80} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(0,0,0,0.95)' : 'rgba(255,255,255,0.95)', borderBottomWidth: 1, borderColor: COLORS.border }]} />
          )}
        </Animated.View>

        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.locationButton}
            onPress={() => navigation.navigate('SavedAddresses')}
            activeOpacity={0.7}
          >
            {/* Logo replaces Location Icon */}
            <Image
              source={require('../../../assets/Logo.jpg')}
              style={{ width: 40, height: 40, borderRadius: 20 }}
              resizeMode="contain"
            />

            <View style={styles.locationInfo}>
              <Text style={[styles.locationLabel, { color: colors.textSecondary }]}>Current Location</Text>
              <Text style={[styles.locationAddress, { color: colors.text }]} numberOfLines={1}>
                {isLoadingLocation ? 'Loading...' :
                  matchedAddress ? matchedAddress.label :
                    currentLocationAddress ? currentLocationAddress :
                      'Set Location'}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.cardBg }]}
              onPress={() => navigation.navigate('NotificationsList')}
            >
              <Ionicons name="notifications-outline" size={22} color={colors.text} />
              {(versionInfo?.updateAvailable || unreadCount > 0) && <View style={styles.notificationBadge} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.cardBg }]}
              onPress={() => navigation.navigate('Profile')}
            >
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                  <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 400,
    zIndex: 0,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  contentSection: {
    marginTop: 0,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  // Header Styles
  fixedHeaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  glassBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 16,
  },
  locationIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  locationAddress: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
  },
});
