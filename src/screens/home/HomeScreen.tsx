import React, { useEffect, useRef, useState } from 'react';
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
import { apiService } from '../../services/api';
import { SERVICES } from '../../utils/constants';
import type { Service } from '../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TopBar } from '../../components/ui/TopBar';
import { SearchBar } from '../../components/ui/SearchBar';
import { ServiceCard } from '../../components/ui/ServiceCard';
import { SpecialOfferBanner } from '../../components/ui/SpecialOfferBanner';
import { AnimatedCard } from '../../components/AnimatedCard';
import { COLORS, SPACING, LAYOUT, ANIMATIONS, RADIUS, SHADOWS } from '../../utils/theme';
import { useResponsive } from '../../hooks/useResponsive';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

import { getServiceIconImage } from '../../utils/serviceImages';

// Map service titles to appropriate Ionicons

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

// Empty State Component - Moved outside for performance
const EmptyState = () => (
  <View style={styles.emptyState}>
    <Ionicons name="search-outline" size={48} color={COLORS.textTertiary} />
    <Text style={styles.emptyText}>No services found</Text>
    <Text style={styles.emptySubtext}>Try a different search term</Text>
  </View>
);

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
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
      const response = await apiService.getAllServices();
      const servicesList = response.data || [];
      if (servicesList.length > 0) {
        const mappedServices: Service[] = servicesList.map((s: any, index: number) => ({
          id: s._id || s.id || `service-${index + 1}`,
          title: s.title || s.name,
          description: s.description || '',
          category: s.category || 'other',
          price: s.price || (s.basePrice ? `₹${s.basePrice}` : 'View prices'),
          icon: s.icon || getServiceIcon(s.category || s.title),
          popular: s.popular || false,
          features: s.features || [],
        }));
        setServices(mappedServices);
        setFilteredServices(mappedServices);
        const uniqueCategories = ['all', ...Array.from(new Set(servicesList.map((s: any) => s.category).filter(Boolean)))];
        setCategories(uniqueCategories);
      } else {
        setServices(SERVICES);
        setFilteredServices(SERVICES);
      }
    } catch (err) {
      console.error('Error fetching services:', err);
      setServices(SERVICES);
      setFilteredServices(SERVICES);
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
    Promise.all([fetchServices(), fetchPartnerCounts()]).then(() => setHasFetchedInitial(true));
  }, [hasFetchedInitial]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchServices();
    fetchPartnerCounts();
  };

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
            partnerCount={count}
            isComingSoon={count === 0}
            onPress={() => navigation.navigate('ServiceDetail', { service: item })}
          />
        </AnimatedServiceItem>
      </View>
    );
  };

  const Header = () => {
    // Get primary address or first available address
    const primaryAddress = user?.addressBook?.find(addr => addr.isPrimary) || user?.addressBook?.[0];
    
    // Format address string: "Home • Bangalore" or "Select Location"
    const locationText = primaryAddress 
      ? `${primaryAddress.label} • ${primaryAddress.city}` 
      : 'Add Location';

    return (
      <Animated.View 
        style={[
          styles.headerContainer, 
          { 
            paddingTop: insets.top + SPACING.sm, // Dynamic Safe Area Padding
            opacity: headerOpacity, 
            transform: [{ translateY: headerTranslateY }] 
          }
        ]}
      >
        <View style={styles.headerTop}>
          <View>
            <TouchableOpacity 
              style={styles.locationPill} 
              onPress={() => navigation.navigate('SavedAddresses')}
              activeOpacity={0.7}
            >
              <Ionicons name="location" size={16} color={COLORS.primary} />
              <Text style={styles.locationText} numberOfLines={1}>{locationText}</Text>
              <Ionicons name="chevron-down" size={14} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.greetingText}>Hello, {user?.name?.split(' ')[0] || 'Guest'} 👋</Text>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Profile')}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.profileImage} />
              ) : (
                <View style={styles.profileInitial}>
                    <Text style={styles.profileInitialText}>{user?.name?.charAt(0) || 'U'}</Text>
                </View>
              )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Translucent Status Bar for Content to flow under */}
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <Header />

      <Animated.FlatList
        data={filteredServices}
        renderItem={renderGridItem}
        keyExtractor={item => item.id.toString()}
        numColumns={3}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.searchSection}>
                <Text style={styles.headlineText}>What are you looking for?</Text>
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
                            style={[styles.categoryPill, selectedCategory === cat && styles.categoryPillActive]}
                            onPress={() => setSelectedCategory(cat)}
                        >
                            <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>
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
              <Text style={styles.sectionTitle}>Recommended Services</Text>
            </View>
          </>
        }
        ListEmptyComponent={EmptyState}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={onRefresh} 
            tintColor={COLORS.primary} 
            progressViewOffset={insets.top + 60} // Push loader down below header
          />
        }
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    paddingHorizontal: LAYOUT.screenPadding,
    // paddingTop handled inline with safe area
    paddingBottom: SPACING.lg,
    backgroundColor: COLORS.background, // Clean background
    zIndex: 10,
    // Border bottom removed for seamless feel
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    backgroundColor: '#FFFFFF', // White pill bg
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    ...SHADOWS.sm, // Soft shadow for pill
  },
  locationText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginHorizontal: 6,
  },
  greetingText: {
    fontSize: 18, // Larger greeting
    color: COLORS.text,
    fontWeight: '700', // Bold greeting
    marginTop: 2,
    paddingHorizontal: 4, // Align with pill text ish
  },
  profileButton: {
    padding: 4,
  },
  profileInitial: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitialText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    marginBottom: SPACING.lg,
  },
  categoryScroll: {
    paddingHorizontal: LAYOUT.screenPadding,
    gap: 12,
  },
  categoryPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryPillActive: {
    backgroundColor: COLORS.primary, // Changed to Primary Blue
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
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
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
