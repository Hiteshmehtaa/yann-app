import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  StatusBar,
  Animated,
  RefreshControl,
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
import { COLORS, SPACING, LAYOUT, ANIMATIONS } from '../../utils/theme';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

const SERVICE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'House Cleaning': 'sparkles',
  'Repairs & Maintenance': 'construct',
  'Delivery Services': 'bicycle',
  'Pet Care': 'paw',
  'Personal Assistant': 'briefcase',
  'Garden & Landscaping': 'leaf',
  'Full-Day Personal Driver': 'car-sport',
  'Pujari Services': 'flower',
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
  const [isLoading, setIsLoading] = useState(true);

  // Fetch services from backend (like website)
  const fetchServices = async () => {
    try {
      const response = await apiService.getAllServices() as any;
      
      const servicesList = response.services || response.data || [];
      if (servicesList.length > 0) {
        // Map backend services to our Service type
        const mappedServices: Service[] = servicesList.map((s: any, index: number) => ({
          id: s._id || s.id || index + 1,
          title: s.name || s.title,
          description: s.description || '',
          category: s.category || 'other',
          price: s.basePrice ? `₹${s.basePrice}` : 'Login for details',
          icon: getServiceIcon(s.category || s.name),
          popular: s.popular || false,
          features: s.features || [],
          profileRequirements: ['Photo', 'Name', 'Aadhaar'],
          image: s.image,
          rating: s.rating,
          status: s.status,
        }));
        setServices(mappedServices);
        setFilteredServices(mappedServices);
        console.log(`✅ Loaded ${mappedServices.length} services from backend`);
      }
    } catch (err: any) {
      // Use static services as fallback
      console.log('ℹ️ Using static services as fallback:', err.message || 'Backend unavailable');
      setServices(SERVICES);
      setFilteredServices(SERVICES);
    } finally {
      setIsLoading(false);
    }
  };

  // Get service icon based on category or name
  const getServiceIcon = (categoryOrName: string): string => {
    const name = categoryOrName.toLowerCase();
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
    return '✨';
  };

  // Fetch partner counts from backend
  const fetchPartnerCounts = async () => {
    try {
      const response = await apiService.getServicePartnerCounts();
      
      if (response.success && response.data) {
        setPartnerCounts(response.data);
        console.log(`✅ Loaded partner counts for ${Object.keys(response.data).length} services`);
      }
    } catch (err: any) {
      // Expected to fail if endpoint not available - use empty counts
      console.log('ℹ️ Partner counts not available, showing 0 for all services:', err.message || 'Unknown error');
      setPartnerCounts({});
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fade-in animation on mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: ANIMATIONS.verySlow,
      useNativeDriver: true,
    }).start();
    
    // Fetch services and partner counts on mount
    fetchServices();
    fetchPartnerCounts();
  }, []);

  // Handle pull-to-refresh
  const onRefresh = () => {
    setIsRefreshing(true);
    fetchServices();
    fetchPartnerCounts();
  };

  // Live search with debounce (300ms)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim() === '') {
        setFilteredServices(services);
      } else {
        const filtered = services.filter(
          (service) =>
            service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            service.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredServices(filtered);
      }
    }, ANIMATIONS.normal); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, services]);

  // Render service card using new ServiceCard component
  const renderServiceCard = ({ item }: { item: Service }) => {
    const iconName = SERVICE_ICONS[item.title] || 'home-outline';
    const count = partnerCounts[item.title] || 0;

    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        <ServiceCard
          title={item.title}
          price={item.price}
          icon={iconName}
          popular={item.popular}
          partnerCount={count}
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
});
