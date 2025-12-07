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
  Alert,
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
import { getServiceIcon } from '../../components/icons/ServiceIcons';
import { COLORS, SPACING, LAYOUT, ANIMATIONS } from '../../utils/theme';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

// SVG icons are now imported from ServiceIcons.tsx

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
  const [isLoading, setIsLoading] = useState(true);
  const [hasFetchedInitial, setHasFetchedInitial] = useState(false); // Prevent duplicate initial fetches
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState<string[]>(['all']);

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
          icon: s.icon || '✨', // Fallback icon (not used - SVG icons used instead)
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
      // Use static services as fallback silently
      setServices(SERVICES);
      setFilteredServices(SERVICES);
    } finally {
      setIsLoading(false);
    }
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

  // Render service card using new ServiceCard component
  const renderServiceCard = ({ item }: { item: Service }) => {
    const IconComponent = getServiceIcon(item.title); // This now returns the SVG component from ServiceIcons.tsx
    const countData = partnerCounts[item.title];
    const count = typeof countData === 'number' ? countData : (countData as any)?.providerCount || 0;
    const displayPrice = getMinPrice(item.title);
    const isComingSoon = count === 0;

    const handlePress = () => {
      if (isComingSoon) {
        Alert.alert(
          'Coming Soon',
          `${item.title} will be available soon! We're currently onboarding partners for this service.`,
          [{ text: 'OK' }]
        );
      } else {
        navigation.navigate('ServiceDetail', { service: item });
      }
    };

    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        <ServiceCard
          title={item.title}
          price={displayPrice}
          IconComponent={IconComponent}
          popular={item.popular}
          partnerCount={count}
          isComingSoon={isComingSoon}
          onPress={handlePress}
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

        {/* Status Metrics Card */}
        <View style={styles.metricsCard}>
          <View style={styles.metricItem}>
            <View style={[styles.statusBadge, { backgroundColor: `${COLORS.success}15` }]}>
              <View style={[styles.statusDot, { backgroundColor: COLORS.success }]} />
              <Text style={[styles.statusText, { color: COLORS.success }]}>Active</Text>
            </View>
            <Text style={styles.metricNumber}>02</Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <View style={[styles.statusBadge, { backgroundColor: `${COLORS.info}15` }]}>
              <View style={[styles.statusDot, { backgroundColor: COLORS.info }]} />
              <Text style={[styles.statusText, { color: COLORS.info }]}>Done</Text>
            </View>
            <Text style={styles.metricNumber}>12</Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <View style={[styles.statusBadge, { backgroundColor: `${COLORS.warning}15` }]}>
              <Ionicons name="star" size={12} color={COLORS.warning} />
              <Text style={[styles.statusText, { color: COLORS.warning }]}>Rating</Text>
            </View>
            <Text style={styles.metricNumber}>4.9</Text>
          </View>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.accentBar} />
            <Text style={styles.sectionTitle}>SERVICES</Text>
          </View>
        </View>
      </Animated.View>

      {/* Services Grid - Responsive 2-Column */}
      <FlatList
        data={filteredServices}
        renderItem={renderServiceCard}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
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
    paddingBottom: 120, // Extra padding for floating tab bar
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
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
