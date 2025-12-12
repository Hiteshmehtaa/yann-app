import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { Service, ServiceProvider } from '../../types';
import { ServiceHero } from '../../components/ui/ServiceHero';
import { ServiceOverviewCard } from '../../components/ui/ServiceOverviewCard';
import { IncludedFeatures } from '../../components/ui/IncludedFeatures';
import { ProviderListCard } from '../../components/ui/ProviderListCard';
import { FloatingCTA } from '../../components/ui/FloatingCTA';
import { ProviderReviewsSection } from '../../components/ui/ProviderReviewsSection';
import { apiService } from '../../services/api';
import { COLORS, RADIUS, SHADOWS, ANIMATIONS } from '../../utils/theme';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{ params: { service: Service } }, 'params'>;
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

// Mock data for service details
const SERVICE_DETAILS = {
  whatsIncluded: [
    'Professional equipment and supplies',
    'Experienced and verified service providers',
    'Quality guarantee on all services',
    'Flexible scheduling options',
  ],
  aboutService:
    'Our premium service ensures top-quality results with attention to every detail. We work with verified professionals who are trained to deliver exceptional service every time.',
  whyChooseUs: [
    'Over 5 years of experience in the industry',
    'Thousands of satisfied customers',
    '24/7 customer support',
    'Money-back guarantee',
    'Fully insured and licensed professionals',
  ],
  estimatedTime: '2-3 hours',
  requirements: 'Basic access to the service area',
  reviews: [
    { name: 'Sarah M.', rating: 5, comment: 'Excellent service! Very professional.' },
    { name: 'John D.', rating: 5, comment: 'Highly recommend. Will book again.' },
    { name: 'Emma L.', rating: 4, comment: 'Great work, on time and efficient.' },
  ],
};

export const ServiceDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { service: initialService } = route.params;
  const service = initialService;
  const [serviceDetails] = useState(SERVICE_DETAILS);
  const [availableProviders, setAvailableProviders] = useState<ServiceProvider[]>([]);
  
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const contentFadeAnim = useRef(new Animated.Value(0)).current;

  /**
   * Fetch available providers for this service
   * Uses same endpoint as website: GET /api/provider/by-service?service=X
   */
  const fetchAvailableProviders = useCallback(async (isRefresh = false) => {
    // Prevent duplicate fetches (React Strict Mode in dev can cause double calls)
    if (!isRefresh && hasFetched) return;
    
    try {
      setIsLoadingProviders(true);
      if (!isRefresh) setIsLoading(true);
      
      console.log(`🔵 Fetching providers for "${service.title}"`);
      
      // Only call the provider endpoint - skip service details/reviews as they don't exist
      const response = await apiService.getProvidersByService(service.title);
      
      if (response.success && response.data) {
        const mappedProviders: ServiceProvider[] = response.data.map((p: any) => ({
          _id: p.id || p._id,
          name: p.name,
          email: p.email || '',
          phone: p.phone || '',
          experience: p.experience || 0,
          rating: p.rating || 0,
          totalReviews: p.totalReviews || 0,
          services: p.services || [service.title],
          serviceRates: p.serviceRates || [{ serviceName: service.title, price: p.price || 0 }],
          workingHours: p.workingHours || null,
          profileImage: p.profileImage || '',
          status: p.status || 'active',
          // Store the price for this specific service (from by-service endpoint)
          priceForService: p.price,
        }));
        
        setAvailableProviders(mappedProviders);
        
        // Auto-select first provider if only one available
        if (mappedProviders.length === 1) {
          setSelectedProvider(mappedProviders[0]);
        }
        console.log(`✅ Found ${mappedProviders.length} providers for "${service.title}"`);
      } else {
        setAvailableProviders([]);
      }
      
      setHasFetched(true);
    } catch (err: any) {
      console.error('Error fetching providers:', err);
      // No providers available for this service
      setAvailableProviders([]);
      setHasFetched(true);
    } finally {
      setIsLoadingProviders(false);
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [service.title, hasFetched]);

  // Fade-in animation and initial fetch
  useEffect(() => {
    Animated.timing(contentFadeAnim, {
      toValue: 1,
      duration: ANIMATIONS.slow,
      useNativeDriver: true,
    }).start();

    // Fetch providers on mount
    fetchAvailableProviders(false);
  }, [fetchAvailableProviders]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchAvailableProviders(true);
  };

  const handleBookNow = () => {
    // Only allow booking if provider is selected (or no providers available for now)
    if (availableProviders.length > 1 && !selectedProvider) {
      alert('Please select a provider to continue');
      return;
    }
    navigation.navigate('BookingForm', { 
      service,
      selectedProvider: selectedProvider || undefined,
    });
  };

  // Calculate lowest price from available providers
  const getLowestPrice = () => {
    if (availableProviders.length === 0) return service.price;
    const prices = availableProviders
      .map((p) => (p as any).priceForService)
      .filter((price) => price > 0);
    if (prices.length === 0) return service.price;
    return `₹${Math.min(...prices)}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Animated Floating Header */}
      <Animated.View
        style={[
          styles.floatingHeader,
          {
            opacity: scrollY.interpolate({
              inputRange: [0, 120],
              outputRange: [0, 1],
              extrapolate: 'clamp',
            }),
          },
        ]}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {service.title}
            </Text>
            <View style={styles.headerSpacer} />
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* Fixed Back Button */}
      <SafeAreaView edges={['top']} style={styles.fixedBackButton}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Loading Overlay */}
      <LoadingSpinner visible={isLoading} />

      {/* Scrollable Content */}
      <Animated.ScrollView
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
            progressViewOffset={80}
          />
        }
      >
        {/* Hero Section */}
        <ServiceHero
          title={service.title}
          category={service.category || ''}
          rating={4.8}
          reviewCount={256}
        />

        {/* Main Content */}
        <Animated.View style={[styles.content, { opacity: contentFadeAnim }]}>
          {/* Service Overview Card */}
          <ServiceOverviewCard
            description={serviceDetails.aboutService}
            startingPrice={service.price}
            providerCount={availableProviders.length}
          />

          {/* What's Included Section */}
          <IncludedFeatures features={serviceDetails.whatsIncluded} />

          {/* Available Professionals Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconBadge}>
                <Ionicons name="people" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.sectionTitle}>Available Professionals</Text>
            </View>
            
            {isLoadingProviders && (
              <View style={styles.loadingState}>
                <LottieView
                  source={require('../../../assets/lottie/loading.json')}
                  autoPlay
                  loop
                  style={{ width: 60, height: 60 }}
                />
                <Text style={styles.loadingText}>Finding professionals...</Text>
              </View>
            )}
            
            {!isLoadingProviders && availableProviders.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={40} color={COLORS.textTertiary} />
                <Text style={styles.emptyTitle}>No professionals available</Text>
                <Text style={styles.emptySubtitle}>Check back soon or try another service</Text>
              </View>
            )}
            
            {!isLoadingProviders && availableProviders.length > 0 && (
              <>
                {availableProviders.length > 1 && (
                  <Text style={styles.selectHint}>
                    Tap to select your preferred professional
                  </Text>
                )}
                {availableProviders.map((provider) => (
                  <ProviderListCard
                    key={provider._id}
                    provider={provider}
                    isSelected={selectedProvider?._id === provider._id}
                    onSelect={() => setSelectedProvider(provider)}
                  />
                ))}
              </>
            )}
          </View>

          {/* Why Choose Us Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconBadge}>
                <Ionicons name="shield-checkmark" size={20} color={COLORS.success} />
              </View>
              <Text style={styles.sectionTitle}>Why Choose Us</Text>
            </View>
            <View style={styles.whyChooseList}>
              {serviceDetails.whyChooseUs.map((item) => (
                <View key={item} style={styles.whyChooseItem}>
                  <View style={styles.checkCircle}>
                    <Ionicons name="checkmark" size={12} color={COLORS.white} />
                  </View>
                  <Text style={styles.whyChooseText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Service Details Grid */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailCard}>
              <View style={styles.detailIconBadge}>
                <Ionicons name="time-outline" size={22} color={COLORS.primary} />
              </View>
              <Text style={styles.detailLabel}>Duration</Text>
              <Text style={styles.detailValue}>{serviceDetails.estimatedTime}</Text>
            </View>
            <View style={styles.detailCard}>
              <View style={styles.detailIconBadge}>
                <Ionicons name="clipboard-outline" size={22} color={COLORS.warning} />
              </View>
              <Text style={styles.detailLabel}>Requirements</Text>
              <Text style={styles.detailValue}>{serviceDetails.requirements}</Text>
            </View>
          </View>

          {/* Provider Reviews Section - Shows when provider is selected */}
          {selectedProvider && (selectedProvider as any).reviews && (selectedProvider as any).reviews.length > 0 && (
            <ProviderReviewsSection
              reviews={(selectedProvider as any).reviews}
              providerName={selectedProvider.name}
            />
          )}

          {/* Bottom Spacer */}
          <View style={{ height: 140 }} />
        </Animated.View>
      </Animated.ScrollView>

      {/* Floating Bottom CTA */}
      <FloatingCTA
        providerName={selectedProvider?.name}
        price={getLowestPrice()}
        selectedProviderPrice={(selectedProvider as any)?.priceForService}
        onPress={handleBookNow}
        disabled={availableProviders.length > 1 && !selectedProvider}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // Floating Header
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: COLORS.white,
    ...SHADOWS.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  headerSpacer: {
    width: 40,
  },
  // Fixed Back Button
  fixedBackButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 99,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  // Scroll Content
  scrollContent: {
    flexGrow: 1,
  },
  // Content
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  // Section Styles
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  // Provider List States
  loadingState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textTertiary,
    marginTop: 6,
    textAlign: 'center',
  },
  selectHint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  // Why Choose Us
  whyChooseList: {
    gap: 10,
  },
  whyChooseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.medium,
    padding: 14,
    gap: 12,
    ...SHADOWS.sm,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  whyChooseText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text,
  },
  // Details Grid
  detailsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  detailCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.medium,
    padding: 16,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  detailIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  // Loading States
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
