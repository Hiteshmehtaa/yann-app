import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  StatusBar,
  Animated,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { apiService } from '../../services/api';
import { SERVICES } from '../../utils/constants';
import type { Service, Address } from '../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TopBar } from '../../components/ui/TopBar';
import { SearchBar } from '../../components/ui/SearchBar';
import { ServiceCard } from '../../components/ui/ServiceCard';
import { SpecialOfferBanner } from '../../components/ui/SpecialOfferBanner';
import { AnimatedCard } from '../../components/AnimatedCard';
import { SkeletonServiceCard } from '../../components/ui/SkeletonLoader';
import { UpdateNotificationBanner } from '../../components/ui/UpdateNotificationBanner';
import { ErrorDisplay } from '../../components/ui/ErrorDisplay';
import { COLORS, SPACING, LAYOUT, ANIMATIONS, RADIUS, SHADOWS } from '../../utils/theme';
import { useResponsive } from '../../hooks/useResponsive';
import { useWalletBalance } from '../../hooks/useWalletBalance';
import { checkForAppUpdate, VersionInfo } from '../../utils/versionCheck';
import { getLocationWithAddress } from '../../utils/locationService';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

import { getServiceIconImage } from '../../utils/serviceImages';

// Map service titles to appropriate Ionicons
const SERVICE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  // Transportation
  'Drivers': 'car-sport',
  'Full-Day Personal Driver': 'car-sport',
  
  // Religious/Spiritual
  'Pujari': 'flame',
  'Pujari Services': 'flame',
  
  // Household Staff
  'Maids': 'home',
  'Cleaners': 'sparkles',
  'Toilet Cleaning Experts': 'water',
  'Office Boys': 'briefcase',
  'Chaprasi': 'people',
  
  // Childcare
  'Baby Sitters': 'heart',
  
  // Healthcare
  'Nurses': 'medkit',
  'Attendants': 'accessibility',
  
  // Specialty Services
  'Heena Artists': 'color-palette',
  
  // Technicians/Maintenance
  'AC Service Technicians': 'snow',
  'RO Service Technicians': 'water',
  'Refrigerator Service Technicians': 'cube',
  'Air Purifier Service Technicians': 'leaf',
  'Chimney Service Technicians': 'flame',
  'Repairs & Maintenance': 'construct',
  
  // Security
  'Security Guards': 'shield-checkmark',
  
  // Other common services
  'House Cleaning': 'sparkles',
  'Delivery Services': 'bicycle',
  'Pet Care': 'paw',
  'Personal Assistant': 'briefcase',
  'Garden & Landscaping': 'leaf',
};

// Empty State Component
const EmptyState = () => {
  const { colors } = useTheme();
  return (
    <View style={styles.emptyState}>
      <Ionicons name="search-outline" size={48} color={colors.textTertiary} />
      <Text style={[styles.emptyText, { color: colors.text }]}>No services found</Text>
      <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Try a different search term</Text>
    </View>
  );
};

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { unreadCount } = useNotifications();
  const { width, isTablet } = useResponsive();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  // ... (keep state variables SAME) ...
  const [searchQuery, setSearchQuery] = useState('');
  const [services, setServices] = useState<Service[]>(SERVICES);
  const [filteredServices, setFilteredServices] = useState<Service[]>(SERVICES);
  const [partnerCounts, setPartnerCounts] = useState<{ [serviceTitle: string]: number }>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasFetchedInitial, setHasFetchedInitial] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState<string[]>(['all']);
  
  // New feature states
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [currentLocationAddress, setCurrentLocationAddress] = useState<string>('');
  const [matchedAddress, setMatchedAddress] = useState<Address | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  
  // Error states
  const [error, setError] = useState<Error | null>(null);
  const [isNetworkError, setIsNetworkError] = useState(false);
  
  // Wallet balance hook
  const { balance: walletBalance, isLoading: isLoadingWallet } = useWalletBalance();
  
  // Header Animation
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, -10],
    extrapolate: 'clamp',
  });
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });

  // Fetch services and data
  // ... (keep fetch functions SAME) ...
  const fetchServices = async () => {
    try {
      setError(null);
      setIsNetworkError(false);
      const response = await apiService.getAllServices();
      const servicesList = response.data || [];
      if (servicesList.length > 0) {
        const mappedServices: Service[] = servicesList.map((s: any, index: number) => {
          // Check if service is new (added in last 7 days)
          const isNew = s.createdAt 
            ? (Date.now() - new Date(s.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000
            : false;
          
          return {
            id: s._id || s.id || `service-${index + 1}`,
            title: s.title || s.name,
            description: s.description || '',
            category: s.category || 'other',
            price: s.price || (s.basePrice ? `₹${s.basePrice}` : 'View prices'),
            icon: s.icon || getServiceIcon(s.category || s.title),
            popular: s.popular || false,
            features: s.features || [],
            isNew,
          };
        });
        setServices(mappedServices);
        setFilteredServices(mappedServices);
        const uniqueCategories = ['all', ...Array.from(new Set(servicesList.map((s: any) => s.category).filter(Boolean)))];
        setCategories(uniqueCategories);
      } else {
        setServices(SERVICES);
        setFilteredServices(SERVICES);
      }
    } catch (err: any) {
      console.error('Error fetching services:', err);
      
      // Check if it's a network error
      const isNetwork = 
        err.message?.toLowerCase().includes('network') ||
        err.message?.toLowerCase().includes('connection') ||
        err.message?.toLowerCase().includes('internet') ||
        err.code === 'NETWORK_ERROR' ||
        !navigator.onLine;
      
      setError(err);
      setIsNetworkError(isNetwork);
      // Don't show any services when there's an error
      setServices([]);
      setFilteredServices([]);
    }
  };

  const getServiceIcon = (categoryOrName: string): string => {
    return '✨';
  };

  const fetchPartnerCounts = async () => {
    try {
        const response = await apiService.getServicePartnerCounts();
        if (response.success && response.data && Array.isArray(response.data)) {
            const countsObject: { [key: string]: number } = {};
            for (const item of response.data) {
                if (item?.service && typeof item?.providerCount === 'number') {
                    countsObject[item.service] = item.providerCount;
                }
            }
            setPartnerCounts(countsObject);
        }
    } catch (err) {
        console.error(err);
    } finally {
        setIsRefreshing(false);
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

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchServices();
    fetchPartnerCounts();
    checkVersion();
    fetchLocationAndAddress();
  }, []);

  // Sort services: Active (has providers) -> Popular -> Others
  useEffect(() => {
    if (Object.keys(partnerCounts).length === 0 && services.length > 0) return;

    const sorted = [...filteredServices].sort((a, b) => {
      const countA = partnerCounts[a.title] || 0;
      const countB = partnerCounts[b.title] || 0;
      const providersA = typeof countA === 'number' ? countA : (countA as any)?.providerCount || 0;
      const providersB = typeof countB === 'number' ? countB : (countB as any)?.providerCount || 0;

      // 1. Availability Priority (Has Providers vs No Providers)
      if (providersA > 0 && providersB === 0) return -1;
      if (providersA === 0 && providersB > 0) return 1;

      // 2. Popularity Priority
      if (a.popular && !b.popular) return -1;
      if (!a.popular && b.popular) return 1;

      // 3. Alphabetical Fallback
      return a.title.localeCompare(b.title);
    });

    // Only update if order actually changed to avoid loop
    const currentIds = filteredServices.map(s => s.id).join(',');
    const newIds = sorted.map(s => s.id).join(',');
    
    if (currentIds !== newIds) {
      setFilteredServices(sorted);
    }
  }, [partnerCounts, services]); // Depend on main list, filtered list is derived

  // Search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      let filtered = services;
      if (selectedCategory !== 'all') {
        filtered = filtered.filter(s => s.category?.toLowerCase() === selectedCategory.toLowerCase());
      }
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(s => s.title.toLowerCase().includes(query) || s.description.toLowerCase().includes(query));
      }

      // Apply Sorting to result
      const sorted = filtered.sort((a, b) => {
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

      setFilteredServices(sorted);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, services, selectedCategory, partnerCounts]);

  const getMinPrice = (serviceTitle: string) => {
    const countData = partnerCounts[serviceTitle];
    if (typeof countData === 'object' && countData !== null && 'minPrice' in countData) {
        const min = (countData as any).minPrice;
        return min ? `From ₹${min}` : 'View prices'; 
    }
    return (typeof countData === 'number' && countData === 0) ? 'No providers' : 'View prices';
  };

  // Animated Item Component for Staggered Effect
  const AnimatedServiceItem = ({ index, children }: { index: number; children: React.ReactNode }) => {
    const itemAnim = useRef(new Animated.Value(0)).current;
    const itemSlide = useRef(new Animated.Value(20)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(itemAnim, {
          toValue: 1,
          duration: 600,
          delay: index * 50, // Stagger effect
          useNativeDriver: true,
        }),
        Animated.spring(itemSlide, {
          toValue: 0,
          tension: 50,
          friction: 7,
          delay: index * 50,
          useNativeDriver: true,
        }),
      ]).start();
    }, []);

    return (
      <Animated.View
        style={{
          flex: 1,
          opacity: itemAnim,
          transform: [{ translateY: itemSlide }],
          // Ensure it takes up the full space of the grid column
          maxWidth: '100%', 
        }}
      >
        {children}
      </Animated.View>
    );
  };

  const renderGridItem = ({ item, index }: { item: any; index: number }) => {
    const iconName = SERVICE_ICONS[item.title] || 'grid-outline';
    const iconImage = getServiceIconImage(item.title);
    const countData = partnerCounts[item.title];
    const count = typeof countData === 'number' ? countData : (countData as any)?.providerCount || 0;

    return (
      <View style={styles.cardWrapper}>
        <AnimatedServiceItem index={index}>
          <ServiceCard
            title={item.title}
            price={getMinPrice(item.title)}
            icon={iconName}
            iconImage={iconImage}
            popular={item.popular}
            isNew={item.isNew}
            partnerCount={count}
            isComingSoon={count === 0}
            onPress={() => navigation.navigate('ServiceDetail', { service: item })}
          />
        </AnimatedServiceItem>
      </View>
    );
  };

  // Skeleton loader for initial load
  const renderSkeletonGrid = () => (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <View key={`skeleton-${index}`} style={styles.cardWrapper}>
          <SkeletonServiceCard />
        </View>
      ))}
    </>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Translucent Status Bar for Content to flow under */}
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      
      {/* Update Notification Banner - Only this stays fixed */}
      {showUpdateBanner && versionInfo && (
        <UpdateNotificationBanner
          currentVersion={versionInfo.currentVersion}
          latestVersion={versionInfo.latestVersion || ''}
          onDismiss={() => setShowUpdateBanner(false)}
        />
      )}

      {/* Show error state with only header + animation */}
      {error ? (
        <View style={{ flex: 1 }}>
          {/* Top Bar */}
          <View style={{ paddingTop: insets.top }}>
            <View style={styles.topBar}>
              {/* Left - Location */}
              <TouchableOpacity 
                style={styles.locationButton}
                onPress={() => navigation.navigate('SavedAddresses')}
                activeOpacity={0.7}
              >
                <Ionicons name="home" size={20} color={colors.text} />
                <View style={styles.locationInfo}>
                  <View style={styles.locationRow}>
                    <Text style={[styles.locationLabel, { color: colors.text }]}>
                      {matchedAddress ? matchedAddress.label : currentLocationAddress ? 'Current Location' : 
                       (user?.addressBook?.find(addr => addr.isPrimary) || user?.addressBook?.[0])?.label || 'Home'}
                    </Text>
                    <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
                  </View>
                  <Text style={[styles.locationAddress, { color: colors.textSecondary }]} numberOfLines={1}>
                    {isLoadingLocation ? 'Loading...' : 
                     matchedAddress ? matchedAddress.fullAddress :
                     currentLocationAddress ? currentLocationAddress :
                     (user?.addressBook?.find(addr => addr.isPrimary) || user?.addressBook?.[0])?.fullAddress || 'Add your delivery address'}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Right - Actions */}
              <View style={styles.actionsContainer}>
                {/* Wallet */}
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: colors.cardBg }]}
                  onPress={() => navigation.navigate('Wallet')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="wallet-outline" size={22} color={colors.text} />
                  {!isLoadingWallet && walletBalance > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {walletBalance >= 1000 ? `${(walletBalance/1000).toFixed(1)}k` : Math.floor(walletBalance)}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Notification Bell */}
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: colors.cardBg }]}
                  onPress={() => navigation.navigate('NotificationsList')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="notifications-outline" size={22} color={colors.text} />
                  {(versionInfo?.updateAvailable || unreadCount > 0) && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : '!'}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Profile */}
                <TouchableOpacity 
                  onPress={() => navigation.navigate('Profile')}
                  activeOpacity={0.7}
                >
                  {user?.avatar ? (
                    <Image source={{ uri: user.avatar }} style={[styles.avatar, { borderColor: colors.border }]} />
                  ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: colors.cardBg }]}>
                      <Text style={[styles.avatarText, { color: colors.primary }]}>
                        {user?.name?.charAt(0) || 'U'}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Divider Line */}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
          </View>

          {/* Error Animation */}
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
        </View>
      ) : (
        /* Normal content with FlatList */
        <Animated.FlatList
        data={!hasFetchedInitial ? [] : filteredServices}
        renderItem={renderGridItem}
        keyExtractor={item => item.id.toString()}
        numColumns={3}
        contentContainerStyle={[styles.listContent, { paddingTop: insets.top }]}
        columnWrapperStyle={!hasFetchedInitial ? undefined : styles.gridRow}
        showsVerticalScrollIndicator={false}
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={9}
        updateCellsBatchingPeriod={50}
        initialNumToRender={9}
        windowSize={5}
        ListHeaderComponent={
          <>
            {/* Top Bar - Location, Wallet, Notifications, Profile (no background) */}
            <View style={styles.topBar}>
              {/* Left - Location */}
              <TouchableOpacity 
                style={styles.locationButton}
                onPress={() => navigation.navigate('SavedAddresses')}
                activeOpacity={0.7}
              >
                <Ionicons name="home" size={20} color={colors.text} />
                <View style={styles.locationInfo}>
                  <View style={styles.locationRow}>
                    <Text style={[styles.locationLabel, { color: colors.text }]}>
                      {matchedAddress ? matchedAddress.label : currentLocationAddress ? 'Current Location' : 
                       (user?.addressBook?.find(addr => addr.isPrimary) || user?.addressBook?.[0])?.label || 'Home'}
                    </Text>
                    <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
                  </View>
                  <Text style={[styles.locationAddress, { color: colors.textSecondary }]} numberOfLines={1}>
                    {isLoadingLocation ? 'Loading...' : 
                     matchedAddress ? matchedAddress.fullAddress :
                     currentLocationAddress ? currentLocationAddress :
                     (user?.addressBook?.find(addr => addr.isPrimary) || user?.addressBook?.[0])?.fullAddress || 'Add your delivery address'}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Right - Actions */}
              <View style={styles.actionsContainer}>
                {/* Wallet */}
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: colors.cardBg }]}
                  onPress={() => navigation.navigate('Wallet')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="wallet-outline" size={22} color={colors.text} />
                  {!isLoadingWallet && walletBalance > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {walletBalance >= 1000 ? `${(walletBalance/1000).toFixed(1)}k` : Math.floor(walletBalance)}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Notification Bell */}
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: colors.cardBg }]}
                  onPress={() => navigation.navigate('NotificationsList')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="notifications-outline" size={22} color={colors.text} />
                  {(versionInfo?.updateAvailable || unreadCount > 0) && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : '!'}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Profile */}
                <TouchableOpacity 
                  onPress={() => navigation.navigate('Profile')}
                  activeOpacity={0.7}
                >
                  {user?.avatar ? (
                    <Image source={{ uri: user.avatar }} style={[styles.avatar, { borderColor: colors.border }]} />
                  ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: colors.cardBg }]}>
                      <Text style={[styles.avatarText, { color: colors.primary }]}>
                        {user?.name?.charAt(0) || 'U'}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Divider Line */}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            
            
            {/* Search Section */}
            <View style={styles.searchSection}>
                <Text style={[styles.headlineText, { color: colors.text }]}>What are you looking for?</Text>
                <SearchBar
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search 'AC Repair', 'Cleaning'..."
                  style={styles.searchBar}
                />
            </View>

            {/* Categories */}
            <View style={styles.categorySection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                    {categories.map((cat, index) => (
                        <TouchableOpacity 
                            key={cat} 
                            style={[
                              styles.categoryPill, 
                              { backgroundColor: colors.cardBg, borderColor: colors.border },
                              selectedCategory === cat && { backgroundColor: colors.primary, borderColor: colors.primary }
                            ]}
                            onPress={() => setSelectedCategory(cat)}
                            activeOpacity={0.7}
                        >
                            <Text style={[
                              styles.categoryText, 
                              { color: colors.text },
                              selectedCategory === cat && { color: '#FFFFFF', fontWeight: '700' }
                            ]}>
                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Banners */}
            <SpecialOfferBanner
              discount="40%"
              title="Special Offer!"
              description="Get 40% off your first order! Valid for today only."
              onPress={() => {}}
            />
            
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Recommended Services</Text>
            </View>
            
            {/* Show skeleton loaders during initial fetch */}
            {!hasFetchedInitial && (
              <View style={styles.gridRow}>
                {renderSkeletonGrid()}
              </View>
            )}
          </>
        }
        ListEmptyComponent={hasFetchedInitial ? EmptyState : null}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={onRefresh} 
            tintColor={colors.primary} 
            progressViewOffset={insets.top + 60} // Push loader down below header
          />
        }
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
      />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // Top Bar Styles (no background)
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: LAYOUT.screenPadding,
    paddingVertical: SPACING.md,
    gap: 12,
  },
  // Location (left side)
  locationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locationInfo: {
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  locationLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  locationAddress: {
    fontSize: 11,
    lineHeight: 14,
  },
  // Actions (right side)
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  // Wallet badge (green)
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  // Notification badge (red dot)
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  // Profile avatar
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
  },
  // Divider line
  divider: {
    height: 1,
    marginHorizontal: LAYOUT.screenPadding,
    marginBottom: SPACING.md,
  },
  listContent: {
    paddingBottom: 100,
  },
  searchSection: {
    paddingHorizontal: LAYOUT.screenPadding,
    marginBottom: SPACING.lg,
    marginTop: SPACING.md,
  },
  headlineText: {
    fontSize: 28, // Massive Headline
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.lg,
    letterSpacing: -1, // Tight tracking
    lineHeight: 34,
  },
  searchBar: {
    // Custom overrides if needed for the component
  },
  categorySection: {
    marginBottom: SPACING.xl,
  },
  categoryScroll: {
    paddingHorizontal: LAYOUT.screenPadding,
    gap: 10,
  },
  categoryPill: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  categoryPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  sectionHeader: {
    paddingHorizontal: LAYOUT.screenPadding,
    marginBottom: SPACING.md,
    marginTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  // Grid Styles
  servicesGrid: {
    paddingHorizontal: LAYOUT.screenPadding,
  },
  gridRow: {
    justifyContent: 'flex-start',
    marginBottom: SPACING.md,
    gap: 12, // Gap between columns
    paddingHorizontal: LAYOUT.screenPadding, // Ensure padding for row wrapper
  },
  cardWrapper: {
    flex: 1,
    maxWidth: '31.5%', // Ensure 3 columns fit (100% / 3 - gaps)
  },
  // Empty State Styles
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    fontSize: 13,
    color: COLORS.textTertiary,
    marginTop: 4,
  },
});
