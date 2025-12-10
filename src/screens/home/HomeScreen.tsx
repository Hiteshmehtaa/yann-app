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
} from 'react-native';
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
import { COLORS, SPACING, LAYOUT, ANIMATIONS, RADIUS } from '../../utils/theme';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

// Service icon images - Load all icons
const SERVICE_IMAGES = {
  repair: require('../../../assets/service-icons/repair.png'),
  baby: require('../../../assets/service-icons/baby.png'),
  cleaning: require('../../../assets/service-icons/cleaning.png'),
  food: require('../../../assets/service-icons/food.png'),
  driver: require('../../../assets/service-icons/driver.png'),
  puja1: require('../../../assets/service-icons/puja1.png'), // General puja items
  puja2: require('../../../assets/service-icons/puja2.png'), // Kalash
  puja3: require('../../../assets/service-icons/puja3.png'), // Shivling
  puja4: require('../../../assets/service-icons/puja4.png'), // Diya/Lamp
  puja5: require('../../../assets/service-icons/puja5.png'), // Ganesh
  puja6: require('../../../assets/service-icons/puja6.png'), // Lakshmi
};

// Function to get icon image based on service title or category
const getServiceIconImage = (serviceTitle: string): any => {
  const title = serviceTitle.toLowerCase();
  
  // Driver Services
  if (title.includes('driver') || title.includes('driving')) {
    return SERVICE_IMAGES.driver;
  }
  
  // Specific Puja Services with unique icons
  if (title.includes('ganesh')) {
    return SERVICE_IMAGES.puja5; // Ganesh image
  }
  if (title.includes('lakshmi') || title.includes('laxmi')) {
    return SERVICE_IMAGES.puja6; // Lakshmi image
  }
  if (title.includes('shiv') || title.includes('shiva') || title.includes('mahashivratri')) {
    return SERVICE_IMAGES.puja3; // Shivling image
  }
  if (title.includes('satyanarayan') || title.includes('katha')) {
    return SERVICE_IMAGES.puja4; // Diya/Lamp image
  }
  if (title.includes('griha pravesh') || title.includes('housewarming') || title.includes('grihapravesh')) {
    return SERVICE_IMAGES.puja2; // Kalash image
  }
  
  // General Puja Services
  if (title.includes('puja') || title.includes('pujari') || title.includes('pooja') || 
      title.includes('havan') || title.includes('ceremony') || title.includes('religious') ||
      title.includes('aarti') || title.includes('worship')) {
    return SERVICE_IMAGES.puja1; // General puja items
  }
  
  // Repairs & Maintenance
  if (title.includes('repair') || title.includes('maintenance') || 
      title.includes('ac service') || title.includes('ro service') || 
      title.includes('refrigerator') || title.includes('air purifier') || 
      title.includes('chimney') || title.includes('technician')) {
    return SERVICE_IMAGES.repair;
  }
  
  // Childcare
  if (title.includes('baby') || title.includes('sitter') || title.includes('childcare')) {
    return SERVICE_IMAGES.baby;
  }
  
  // Cleaning
  if (title.includes('maid') || title.includes('clean') || title.includes('toilet')) {
    return SERVICE_IMAGES.cleaning;
  }
  
  // Food Service
  if (title.includes('cook') || title.includes('catering') || title.includes('chef') || 
      title.includes('food') || title.includes('kitchen')) {
    return SERVICE_IMAGES.food;
  }
  
  return null;
};

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
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [searchQuery, setSearchQuery] = useState('');
  const [services, setServices] = useState<Service[]>(SERVICES); // Fallback to static services
  const [filteredServices, setFilteredServices] = useState<Service[]>(SERVICES);
  const [partnerCounts, setPartnerCounts] = useState<{ [serviceTitle: string]: number }>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasFetchedInitial, setHasFetchedInitial] = useState(false); // Prevent duplicate initial fetches
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState<string[]>(['all']);
  const [showAll, setShowAll] = useState(false);

  // Fetch services from backend (like website - GET /api/services)
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
        
        // Extract unique categories from services
        const uniqueCategories = ['all', ...Array.from(new Set(servicesList.map((s: any) => s.category).filter(Boolean)))];
        setCategories(uniqueCategories);
        
        console.log(`✅ Loaded ${mappedServices.length} services with ${uniqueCategories.length - 1} categories`);
      } else {
        setServices(SERVICES);
        setFilteredServices(SERVICES);
      }
    } catch (err) {
      console.error('Error fetching services:', err);
      // Use static services as fallback silently
      setServices(SERVICES);
      setFilteredServices(SERVICES);
    } finally {
      setIsLoading(false);
    }
  };

  // Get service icon based on category or name
  const getServiceIcon = (categoryOrName: string): string => {
    const name = (categoryOrName || '').toLowerCase();
    if (name.includes('clean')) return '🧹';
    if (name.includes('driver')) return '🚗';
    if (name.includes('puja') || name.includes('pujari')) return '🙏';
    if (name.includes('maid')) return '🧹';
    if (name.includes('baby') || name.includes('sitter')) return '👶';
    if (name.includes('nurse')) return '👩‍⚕️';
    if (name.includes('cook')) return '👨‍🍳';
    if (name.includes('garden')) return '🌿';
    if (name.includes('pet')) return '🐕';
    if (name.includes('repair')) return '🔧';
    if (name.includes('laundry')) return '👕';
    if (name.includes('attendant')) return '🤝';
    if (name.includes('office')) return '👔';
    if (name.includes('security')) return '🛡️';
    if (name.includes('heena') || name.includes('henna')) return '🎨';
    return '✨';
  };

  // Fetch partner counts from backend (like website - GET /api/provider/service-counts)
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
      } else {
        setPartnerCounts({});
      }
    } catch (err) {
      console.error('Error fetching partner counts:', err);
      // Silently handle - partner counts are optional
      setPartnerCounts({});
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fade-in animation on mount
  useEffect(() => {
    // Prevent duplicate fetches in React Strict Mode
    if (hasFetchedInitial) return;
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: ANIMATIONS.verySlow,
      useNativeDriver: true,
    }).start();
    
    // Fetch services and partner counts in parallel
    Promise.all([fetchServices(), fetchPartnerCounts()]).then(() => {
      setHasFetchedInitial(true);
    });
  }, [hasFetchedInitial]);

  // Handle pull-to-refresh
  const onRefresh = () => {
    setIsRefreshing(true);
    Promise.all([fetchServices(), fetchPartnerCounts()]);
  };

  // Live search with debounce (300ms) and category filter
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      let filtered = services;
      
      // Apply category filter
      if (selectedCategory !== 'all') {
        filtered = filtered.filter(
          (service) => service.category?.toLowerCase() === selectedCategory.toLowerCase()
        );
      }
      
      // Apply search filter
      if (searchQuery.trim() !== '') {
        filtered = filtered.filter(
          (service) =>
            service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            service.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      setFilteredServices(filtered);
    }, ANIMATIONS.normal); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, services, selectedCategory]);

  // Get minimum provider price for a service
  const getMinPrice = (serviceTitle: string): string => {
    // Check if we have partner count data for this service
    const countData = partnerCounts[serviceTitle];
    
    // If countData is object with minPrice, use it
    if (typeof countData === 'object' && countData !== null && 'minPrice' in countData) {
      const minPrice = (countData as any).minPrice;
      if (minPrice && minPrice > 0) {
        return `Starting from ₹${minPrice}`;
      }
    }
    
    // Otherwise check provider count
    const count = typeof countData === 'number' ? countData : (countData as any)?.providerCount || 0;
    if (count === 0) {
      return 'No providers available';
    }
    
    // Fallback to item price if available
    return 'View prices';
  };

  // Get displayed services (8 initially, or all when expanded)
  const hasMore = filteredServices.length > 8;
  const displayedServices = showAll 
    ? filteredServices 
    : filteredServices.slice(0, 8);
  
  // Add More button as a grid item if needed
  const gridData = (!showAll && hasMore) 
    ? [...displayedServices, { id: 'more-button', isMoreButton: true }] 
    : displayedServices;

  // Render service card or More button
  const renderGridItem = ({ item, index }: { item: any; index: number }) => {
    // Render More button
    if (item.isMoreButton) {
      return (
        <TouchableOpacity 
          style={styles.cardWrapper}
          onPress={() => setShowAll(true)}
        >
          <View style={styles.moreButton}>
            <View style={styles.moreIconContainer}>
              <Ionicons name="ellipsis-horizontal" size={24} color="#999" />
            </View>
            <Text style={styles.moreText}>More</Text>
          </View>
        </TouchableOpacity>
      );
    }

    // Render service card
    const iconName = SERVICE_ICONS[item.title] || 'grid-outline';
    const iconImage = getServiceIconImage(item.title);
    const countData = partnerCounts[item.title];
    const count = typeof countData === 'number' ? countData : (countData as any)?.providerCount || 0;
    const displayPrice = getMinPrice(item.title);
    const isComingSoon = count === 0;

    return (
      <Animated.View style={styles.cardWrapper}>
        <ServiceCard
          title={item.title}
          price={displayPrice}
          icon={iconName}
          iconImage={iconImage}
          popular={item.popular}
          partnerCount={count}
          isComingSoon={isComingSoon}
          onPress={() => navigation.navigate('ServiceDetail', { service: item })}
        />
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Top Bar with Logo, Welcome Text, and Profile */}
      <TopBar
        userName={user?.name}
        onProfilePress={() => navigation.navigate('Profile')}
      />

      {/* Animated Content */}
      <Animated.View style={{ opacity: fadeAnim }}>
        {/* Search Bar with Live Filtering */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search for services..."
        />

        {/* Special Offer Banner */}
        <SpecialOfferBanner
          discount="40%"
          title="Special Offer!"
          description="Get discount for every order, only valid for today"
          onPress={() => {
            // Navigate to offers/promotions screen if you have one
            console.log('Special offer pressed');
          }}
        />

        {/* Section Header - Popular Services */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Services</Text>
          <TouchableOpacity onPress={() => setShowAll(!showAll)}>
            <Text style={styles.seeAllText}>
              {showAll ? 'Show Less' : 'See All'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Category Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryTag,
                selectedCategory === category && styles.categoryTagActive
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.categoryTagText,
                  selectedCategory === category && styles.categoryTagTextActive
                ]}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Services Grid - 3 Columns */}
      <FlatList
        data={gridData}
        renderItem={renderGridItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={3}
        contentContainerStyle={styles.servicesGrid}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
        bounces={true}
        alwaysBounceVertical={true}
        ListEmptyComponent={EmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // Metrics Card Styles
  metricsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    marginHorizontal: LAYOUT.screenPadding,
    marginBottom: SPACING.xl,
    padding: SPACING.lg,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
    marginBottom: SPACING.xs,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  metricDivider: {
    width: 1,
    height: 60,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.xs,
  },
  // Section Header Styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: LAYOUT.screenPadding,
    marginBottom: SPACING.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  accentBar: {
    width: 4,
    height: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  // Services Grid Styles
  servicesGrid: {
    paddingHorizontal: LAYOUT.screenPadding,
    paddingBottom: 100,
  },
  gridRow: {
    justifyContent: 'flex-start',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  cardWrapper: {
    width: '31.5%',
  },
  moreButton: {
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.large,
  },
  moreIconContainer: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.medium,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  moreText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#000',
    textAlign: 'center',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: `${COLORS.warning}15`,
    marginHorizontal: LAYOUT.screenPadding,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: 12,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  // Category Filter Styles
  categoriesContainer: {
    marginHorizontal: LAYOUT.screenPadding,
    marginBottom: SPACING.md,
  },
  categoriesContent: {
    paddingRight: LAYOUT.screenPadding,
    gap: SPACING.sm,
  },
  categoryTag: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryTagActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  categoryTagTextActive: {
    color: '#FFFFFF',
  },
});
