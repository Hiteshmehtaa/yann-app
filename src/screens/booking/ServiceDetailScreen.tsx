import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { Service, ServiceProvider } from '../../types';
import { Button } from '../../components/ui/Button';
import { ServiceHeroHeader } from '../../components/ui/ServiceHeroHeader';
import { apiService } from '../../services/api';
import { COLORS, SPACING, RADIUS, ICON_SIZES, SHADOWS, TYPOGRAPHY, LAYOUT, ANIMATIONS } from '../../utils/theme';

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
  const [service, setService] = useState<Service>(initialService);
  const [serviceDetails] = useState(SERVICE_DETAILS); // Static data, no API for this yet
  const [availableProviders, setAvailableProviders] = useState<ServiceProvider[]>([]);
  
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false); // Prevent duplicate fetches
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
    Animated.timing(fadeAnim, {
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Animated Header */}
      <Animated.View
        style={[
          styles.floatingHeader,
          {
            opacity: scrollY.interpolate({
              inputRange: [0, 100],
              outputRange: [0, 1],
              extrapolate: 'clamp',
            }),
          },
        ]}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={ICON_SIZES.large} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {service.title}
            </Text>
            <View style={styles.headerSpacer} />
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* Fixed Back Button (visible when header is hidden) */}
      <SafeAreaView edges={['top']} style={styles.fixedBackButton}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={ICON_SIZES.large} color={COLORS.text} />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading details...</Text>
        </View>
      )}

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
            progressViewOffset={100}
          />
        }
      >
        {/* Dynamic Service Hero Header */}
        <ServiceHeroHeader
          serviceTitle={service.title}
          rating={4.8}
          reviewCount={256}
          height={320}
        />

        {/* Main Content */}
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Error Banner */}
          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={18} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Price Card */}
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <View>
                <Text style={styles.priceLabel}>Starting from</Text>
                <Text style={styles.priceValue}>{service.price}</Text>
              </View>
              {service.popular && (
                <View style={styles.popularBadge}>
                  <Ionicons name="star" size={14} color={COLORS.warning} />
                  <Text style={styles.popularText}>POPULAR</Text>
                </View>
              )}
            </View>
          </View>

          {/* Available Providers Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="people" size={ICON_SIZES.large} color={COLORS.primary} />
              </View>
              <Text style={styles.sectionTitle}>Available Partners</Text>
            </View>
            
            {isLoadingProviders && (
              <View style={styles.loadingProviders}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingProvidersText}>Loading partners...</Text>
              </View>
            )}
            
            {!isLoadingProviders && availableProviders.length === 0 && (
              <View style={styles.noProvidersCard}>
                <Ionicons name="alert-circle-outline" size={32} color={COLORS.textTertiary} />
                <Text style={styles.noProvidersText}>No partners available for this service yet</Text>
                <Text style={styles.noProvidersSubtext}>Check back soon or try another service</Text>
              </View>
            )}
            
            {!isLoadingProviders && availableProviders.length === 1 && (
              <View style={styles.singleProviderCard}>
                <View style={styles.providerAvatar}>
                  <Text style={styles.providerAvatarText}>
                    {availableProviders[0].name?.charAt(0) || 'P'}
                  </Text>
                </View>
                <View style={styles.providerInfo}>
                  <Text style={styles.providerName}>{availableProviders[0].name}</Text>
                  <View style={styles.providerMeta}>
                    <Ionicons name="star" size={14} color={COLORS.warning} />
                    <Text style={styles.providerRating}>
                      {availableProviders[0].rating?.toFixed(1) || '0.0'} ({availableProviders[0].totalReviews || 0} reviews)
                    </Text>
                  </View>
                  <Text style={styles.providerExperience}>
                    {availableProviders[0].experience || 0} years experience
                  </Text>
                  {/* Show price from API */}
                  {(availableProviders[0] as any).priceForService && (
                    <Text style={styles.providerPrice}>
                      ₹{(availableProviders[0] as any).priceForService}
                    </Text>
                  )}
                </View>
                <Ionicons name="checkmark-circle" size={28} color={COLORS.success} />
              </View>
            )}
            
            {!isLoadingProviders && availableProviders.length > 1 && (
              <>
                <Text style={styles.selectProviderHint}>
                  Select a partner to continue booking
                </Text>
                {availableProviders.map((provider) => (
                  <TouchableOpacity
                    key={provider._id}
                    style={[
                      styles.providerCard,
                      selectedProvider?._id === provider._id && styles.providerCardSelected,
                    ]}
                    onPress={() => setSelectedProvider(provider)}
                  >
                    <View style={styles.providerAvatar}>
                      <Text style={styles.providerAvatarText}>
                        {provider.name?.charAt(0) || 'P'}
                      </Text>
                    </View>
                    <View style={styles.providerInfo}>
                      <Text style={styles.providerName}>{provider.name}</Text>
                      <View style={styles.providerMeta}>
                        <Ionicons name="star" size={14} color={COLORS.warning} />
                        <Text style={styles.providerRating}>
                          {provider.rating?.toFixed(1) || '0.0'} ({provider.totalReviews || 0} reviews)
                        </Text>
                      </View>
                      <Text style={styles.providerExperience}>
                        {provider.experience || 0} years experience
                      </Text>
                      {/* Show price from API */}
                      {(provider as any).priceForService && (
                        <Text style={styles.providerPrice}>
                          ₹{(provider as any).priceForService}
                        </Text>
                      )}
                    </View>
                    {selectedProvider?._id === provider._id && (
                      <Ionicons name="checkmark-circle" size={28} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>

          {/* What's Included Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="checkmark-circle" size={ICON_SIZES.large} color={COLORS.success} />
              </View>
              <Text style={styles.sectionTitle}>What's Included</Text>
            </View>
            {serviceDetails.whatsIncluded.map((item) => (
              <View key={item} style={styles.listItem}>
                <View style={styles.bulletPoint} />
                <Text style={styles.listItemText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* About This Service Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="information-circle" size={ICON_SIZES.large} color={COLORS.info} />
              </View>
              <Text style={styles.sectionTitle}>About This Service</Text>
            </View>
            <Text style={styles.descriptionText}>{serviceDetails.aboutService}</Text>
          </View>

          {/* Why Choose Us Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="shield-checkmark" size={ICON_SIZES.large} color={COLORS.primary} />
              </View>
              <Text style={styles.sectionTitle}>Why Choose Us</Text>
            </View>
            {serviceDetails.whyChooseUs.map((item) => (
              <View key={item} style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Ionicons name="checkmark" size={16} color={COLORS.primary} />
                </View>
                <Text style={styles.featureText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Service Info Grid */}
          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Ionicons name="time-outline" size={ICON_SIZES.large} color={COLORS.accentOrange} />
              <Text style={styles.infoCardLabel}>Est. Time</Text>
              <Text style={styles.infoCardValue}>{serviceDetails.estimatedTime}</Text>
            </View>
            <View style={styles.infoCard}>
              <Ionicons name="clipboard-outline" size={ICON_SIZES.large} color={COLORS.warning} />
              <Text style={styles.infoCardLabel}>Requirements</Text>
              <Text style={styles.infoCardValue}>{serviceDetails.requirements}</Text>
            </View>
          </View>

          {/* Reviews Preview Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="chatbubbles" size={ICON_SIZES.large} color={COLORS.warning} />
              </View>
              <Text style={styles.sectionTitle}>Customer Reviews</Text>
            </View>
            {SERVICE_DETAILS.reviews.slice(0, 2).map((review, idx) => (
              <View key={`${review.name}-${idx}`} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewAvatar}>
                    <Text style={styles.reviewAvatarText}>{review.name.charAt(0)}</Text>
                  </View>
                  <View style={styles.reviewHeaderContent}>
                    <Text style={styles.reviewName}>{review.name}</Text>
                    <View style={styles.reviewStars}>
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Ionicons key={`star-${review.name}-${i}`} name="star" size={14} color={COLORS.warning} />
                      ))}
                    </View>
                  </View>
                </View>
                <Text style={styles.reviewComment}>{review.comment}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.seeAllReviews}>
              <Text style={styles.seeAllText}>See all reviews</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {/* Bottom Spacer for sticky CTA */}
          <View style={{ height: 100 }} />
        </Animated.View>
      </Animated.ScrollView>

      {/* Sticky Bottom CTA */}
      <SafeAreaView edges={['bottom']} style={styles.ctaContainer}>
        <LinearGradient
          colors={['rgba(248, 248, 248, 0)', COLORS.background]}
          style={styles.ctaGradient}
        >
          <View style={styles.ctaContent}>
            <View>
              <Text style={styles.ctaPrice}>{service.price}</Text>
              <Text style={styles.ctaPriceLabel}>per service</Text>
            </View>
            <Button title="Book Now" onPress={handleBookNow} size="large" style={styles.bookButton} />
          </View>
        </LinearGradient>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // Floating Header (appears on scroll)
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: COLORS.cardBg,
    ...SHADOWS.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: LAYOUT.screenPadding,
    paddingVertical: SPACING.md,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.small,
    backgroundColor: COLORS.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginHorizontal: SPACING.md,
  },
  headerSpacer: {
    width: 44,
  },
  // Fixed Back Button
  fixedBackButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 99,
    paddingHorizontal: LAYOUT.screenPadding,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
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
    padding: LAYOUT.screenPadding,
  },
  // Price Card
  priceCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.large,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    ...SHADOWS.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: TYPOGRAPHY.size.xxxl,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.warning}15`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.small,
    gap: 4,
  },
  popularText: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '700',
    color: COLORS.warning,
    letterSpacing: 0.5,
  },
  // Section Styles
  section: {
    marginBottom: SPACING.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.small,
    backgroundColor: COLORS.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  // List Items
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginTop: 8,
  },
  listItemText: {
    flex: 1,
    fontSize: TYPOGRAPHY.size.md,
    color: COLORS.text,
    lineHeight: 22,
  },
  // Description
  descriptionText: {
    fontSize: TYPOGRAPHY.size.md,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  // Feature Items
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  featureIcon: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.small,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
    fontSize: TYPOGRAPHY.size.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  // Info Grid
  infoGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xxl,
  },
  infoCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.large,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  infoCardLabel: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    marginBottom: 4,
  },
  infoCardValue: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  // Reviews
  reviewCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    gap: SPACING.sm,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewAvatarText: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: '700',
    color: COLORS.white,
  },
  reviewHeaderContent: {
    flex: 1,
  },
  reviewName: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  seeAllReviews: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
    gap: 4,
  },
  seeAllText: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '600',
    color: COLORS.primary,
  },
  // Sticky CTA
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  ctaGradient: {
    paddingTop: SPACING.xl,
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: LAYOUT.screenPadding,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: RADIUS.xlarge,
    borderTopRightRadius: RADIUS.xlarge,
    ...SHADOWS.lg,
  },
  ctaPrice: {
    fontSize: TYPOGRAPHY.size.xxl,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  ctaPriceLabel: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
  },
  bookButton: {
    minWidth: 160,
  },
  // Loading and Error States
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.size.md,
    color: COLORS.textSecondary,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: `${COLORS.error}15`,
    padding: SPACING.md,
    borderRadius: RADIUS.medium,
    marginBottom: SPACING.lg,
  },
  errorText: {
    flex: 1,
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.error,
  },
  // Provider Selection Styles
  loadingProviders: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.lg,
  },
  loadingProvidersText: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
  },
  noProvidersCard: {
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: `${COLORS.textTertiary}10`,
    borderRadius: RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  noProvidersText: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  noProvidersSubtext: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textTertiary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  selectProviderHint: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    fontStyle: 'italic',
  },
  singleProviderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: `${COLORS.success}10`,
    borderRadius: RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.success,
    gap: SPACING.md,
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.medium,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
    ...SHADOWS.sm,
  },
  providerCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}10`,
    ...SHADOWS.md,
  },
  providerAvatar: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerAvatarText: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: '700',
    color: COLORS.white,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  providerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  providerRating: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
  },
  providerExperience: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textTertiary,
  },
  providerPrice: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '700',
    color: COLORS.success,
    marginTop: 4,
  },
});
