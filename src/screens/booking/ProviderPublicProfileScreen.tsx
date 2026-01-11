import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Image,
  Dimensions,
  Linking,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '../../services/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { COLORS, SHADOWS, SPACING } from '../../utils/theme';
import { Service, ServiceProvider } from '../../types';
import { shareProviderProfile } from '../../utils/shareUtils';
import { toggleFavorite, isFavorited } from '../../utils/favoritesStorage';
import { haptics } from '../../utils/haptics';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../../components/Toast';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { DepthCard } from '../../components/ui/DepthCard';
import { Button } from '../../components/ui/Button';

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT_EXPANDED = height * 0.45;
const HEADER_HEIGHT_COLLAPSED = 100;

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{ params: { provider: ServiceProvider; service?: Service } }, 'params'>;
};

const FadeInView = ({ children, delay = 0, style }: any) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current; // Start 20px down

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 100,
        friction: 8,
        delay,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        },
        style
      ]}
    >
      {children}
    </Animated.View>
  );
};

export const ProviderPublicProfileScreen: React.FC<Props> = ({ navigation, route }) => {
  const { provider: initialProvider } = route.params;
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const [provider, setProvider] = useState<ServiceProvider>(initialProvider);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewStats, setReviewStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const heartScale = useRef(new Animated.Value(1)).current;
  const [showVerifiedTooltip, setShowVerifiedTooltip] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const { toast, showSuccess, showInfo, hideToast } = useToast();

  const handleBookService = (service: any) => {
    haptics.selection();
    setShowServiceModal(false);
    navigation.navigate('BookingForm', {
      service: service, // { title: '...' }
      selectedProvider: provider
    });
  };

  const handleBookPress = () => {
    haptics.heavy();
    if (route.params.service) {
      navigation.navigate('BookingForm', {
        service: route.params.service,
        selectedProvider: provider
      });
    } else {
      setShowServiceModal(true);
    }
  };

  useEffect(() => {
    const fetchProviderDetails = async () => {
      try {
        const id = (initialProvider as any).id || initialProvider._id;
        const response = await apiService.getProviderById(id);
        if (response.success && response.data) {
          const newData = response.data;
          setProvider(prev => ({
            ...prev,
            ...newData,
            serviceRates: newData.serviceRates || prev.serviceRates,
            profileImage: newData.profileImage || newData.avatar || prev.profileImage,
            bio: newData.bio || newData.about || prev.bio,
          }));
        }

        try {
          const reviewsResponse = await apiService.getProviderReviews(id);
          if (reviewsResponse.success && reviewsResponse.data) {
            setReviews(reviewsResponse.data.reviews || []);
            setReviewStats(reviewsResponse.data.stats || null);
          }
        } catch (reviewError) {
          setReviews([]);
        }
      } catch (error) {
        console.log('Error fetching provider details:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProviderDetails();

    const checkFavoriteStatus = async () => {
      const providerId = (initialProvider as any).id || initialProvider._id;
      const favorited = await isFavorited(providerId);
      setIsBookmarked(favorited);
    };
    checkFavoriteStatus();
  }, [initialProvider]);

  // -- Animations --
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT_EXPANDED],
    outputRange: [0, -HEADER_HEIGHT_EXPANDED / 2],
    extrapolate: 'clamp',
  });

  const imageOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT_EXPANDED - 100],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const headerBgOpacity = scrollY.interpolate({
    inputRange: [HEADER_HEIGHT_EXPANDED - 150, HEADER_HEIGHT_EXPANDED - 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const titleOpacity = scrollY.interpolate({
    inputRange: [HEADER_HEIGHT_EXPANDED - 100, HEADER_HEIGHT_EXPANDED - 60],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Price Logic
  const getPriceDisplay = () => {
    let price = 0;
    if (route.params.service && provider.serviceRates) {
      if (Array.isArray(provider.serviceRates)) {
        const rate = provider.serviceRates.find(r => r.serviceName === route.params.service?.title);
        if (rate) price = rate.price;
      } else {
        price = (provider.serviceRates as any)[route.params.service.title] || 0;
      }
    }
    if (!price && provider.serviceRates) {
      if (Array.isArray(provider.serviceRates)) {
        price = provider.serviceRates[0]?.price || 0;
      } else {
        price = (Object.values(provider.serviceRates)[0] as number) || 0;
      }
    }
    if (!price && (provider as any).priceForService) price = (provider as any).priceForService;
    return price > 0 ? `₹${price}/hr` : 'Contact for price';
  };

  const handleShare = async () => {
    haptics.medium();
    try {
      const providerId = (provider as any).id || provider._id || '';
      const success = await shareProviderProfile({
        providerId,
        providerName: provider.name,
        rating: provider.rating,
        services: provider.services || [],
      });
      if (success) showSuccess('Profile shared successfully!');
    } catch (error) {
      // ignore
    }
  };

  const handleCall = () => {
    haptics.medium();
    if (provider.phone) Linking.openURL(`tel:${provider.phone}`);
  };

  const handleToggleFavorite = async () => {
    const success = await toggleFavorite(provider);
    if (success) {
      if (!isBookmarked) {
        haptics.success();
      } else {
        haptics.light();
      }
      setIsBookmarked(!isBookmarked);
      if (!isBookmarked) {
        showSuccess(`${provider.name} added to Favorites`);
        Animated.sequence([
          Animated.spring(heartScale, { toValue: 1.3, useNativeDriver: true, speed: 50, bounciness: 4 }),
          Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 })
        ]).start();
      } else {
        showInfo('Removed from Favorites');
      }
    }
  };

  // Stats Calculations
  const totalBookings = provider.totalReviews || 0;
  const estimatedHours = totalBookings > 0 ? Math.floor(totalBookings * 2.5) : 0;
  const responseTime = (provider as any).averageResponseTime || '< 1 hr';
  const experience = provider.experience || 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* 1. Parallax Header Background (Hero) */}
      <Animated.View style={[styles.headerBackground, { height: HEADER_HEIGHT_EXPANDED, transform: [{ translateY: headerTranslateY }] }]}>
        {provider.profileImage ? (
          <Animated.Image
            source={{ uri: provider.profileImage }}
            style={[styles.headerImage, { opacity: imageOpacity }]}
          />
        ) : (
          <Animated.View style={[styles.headerImage, { opacity: imageOpacity }]}>
            <LinearGradient
              colors={['#3B82F6', '#1E293B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        )}
        <LinearGradient
          colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.6)']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* 2. Navigation Bar */}
      <View style={[styles.navBar, { paddingTop: insets.top, height: HEADER_HEIGHT_COLLAPSED }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#fff', opacity: headerBgOpacity, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }]} />

        <View style={styles.navContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => {
            haptics.light();
            navigation.goBack();
          }}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>

          <Animated.Text style={[styles.navTitle, { opacity: titleOpacity }]}>
            {provider.name}
          </Animated.Text>

          <View style={styles.navActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={22} color="#1E293B" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleToggleFavorite}>
              <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                <Ionicons name={isBookmarked ? "heart" : "heart-outline"} size={22} color={isBookmarked ? "#EF4444" : "#1E293B"} />
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 3. Main Scroll Content */}
      <ScrollView
        contentContainerStyle={{ paddingTop: HEADER_HEIGHT_EXPANDED - 40, paddingBottom: 140 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.contentContainer}>
          <View style={styles.handleBar} />

          {/* Profile Main Info */}
          <FadeInView delay={50} style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {provider.profileImage ? (
                <Image source={{ uri: provider.profileImage }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarImage, { backgroundColor: '#E0E7FF', alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ fontSize: 32, fontWeight: '700', color: COLORS.primary }}>
                    {provider.name ? provider.name.charAt(0) : 'P'}
                  </Text>
                </View>
              )}
            </View>

            <View style={{ flex: 1, marginTop: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Text style={styles.providerName}>{provider.name}</Text>
                {(provider as any).isVerified && (
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                )}
              </View>
              <Text style={styles.providerService}>
                {route.params.service?.title || provider.services?.[0] || 'Service Provider'}
              </Text>

              <View style={styles.verificationRow}>
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <Text style={styles.ratingText}>{provider.rating ? provider.rating.toFixed(1) : 'New'}</Text>
                </View>
                <View style={styles.experienceBadge}>
                  <Ionicons name="briefcase" size={12} color="#10B981" />
                  <Text style={styles.experienceText}>{experience > 0 ? `${experience} yr${experience !== 1 ? 's' : ''}` : 'New'}</Text>
                </View>
              </View>
            </View>
          </FadeInView>

          {/* Stats Grid - Using DepthCard */}
          <FadeInView delay={100} style={styles.section}>
            {isLoading ? (
              <DepthCard variant="flat" style={styles.statsCardInner}>
                <SkeletonLoader variant="rect" height={60} width="100%" />
              </DepthCard>
            ) : (
              <DepthCard variant="floating" style={styles.statsCardInner} padding={SPACING.lg}>
                <View style={styles.statItem}>
                  <View style={styles.statIconBg}>
                    <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                  </View>
                  <Text style={styles.statValue}>{totalBookings}</Text>
                  <Text style={styles.statLabel}>Bookings</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <View style={styles.statIconBg}>
                    <Ionicons name="time-outline" size={20} color={COLORS.primary} />
                  </View>
                  <Text style={styles.statValue}>{estimatedHours > 0 ? `${estimatedHours}+` : '0'}</Text>
                  <Text style={styles.statLabel}>Hours</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <View style={styles.statIconBg}>
                    <Ionicons name="flash-outline" size={20} color={COLORS.primary} />
                  </View>
                  <Text style={styles.statValue}>{responseTime}</Text>
                  <Text style={styles.statLabel}>Response</Text>
                </View>
              </DepthCard>
            )}
          </FadeInView>

          {/* About Section */}
          <FadeInView delay={150} style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            {isLoading ? (
              <View>
                <SkeletonLoader variant="text" width="100%" style={{ marginBottom: 6 }} />
                <SkeletonLoader variant="text" width="80%" style={{ marginBottom: 6 }} />
                <SkeletonLoader variant="text" width="60%" />
              </View>
            ) : (
              <Text style={styles.aboutText}>
                {provider.bio || (provider as any).about || 'I am a dedicated professional committed to delivering high-quality work. Customer satisfaction is my top priority.'}
              </Text>
            )}
          </FadeInView>

          {/* Service Rate Card - using DepthCard */}
          <FadeInView delay={200} style={styles.section}>
            <Text style={styles.sectionTitle}>Service Details</Text>
            {isLoading ? (
              <SkeletonLoader variant="rect" height={80} width="100%" style={{ borderRadius: 16 }} />
            ) : (
              <DepthCard variant="elevated" style={styles.rateCardInner} padding={SPACING.lg}>
                <View style={styles.rateIconContainer}>
                  <Ionicons name="pricetags-outline" size={24} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rateTitle}>
                    {route.params.service?.title || provider.services?.[0] || 'Standard Service'}
                  </Text>
                  <Text style={styles.rateSubtitle}>Hourly Rate</Text>
                </View>
                <View style={styles.priceTag}>
                  <Text style={styles.priceText}>{getPriceDisplay()}</Text>
                </View>
              </DepthCard>
            )}
          </FadeInView>

          {/* Reviews Section - using DepthCard for list items */}
          <FadeInView delay={250} style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                Client Reviews ({isLoading ? '...' : (reviewStats?.totalReviews || reviews.length)})
              </Text>
              {reviews.length > 3 && (
                <TouchableOpacity>
                  <Text style={styles.seeAllLink}>See All</Text>
                </TouchableOpacity>
              )}
            </View>
            {isLoading ? (
              <View style={{ flexDirection: 'row', gap: 16 }}>
                <SkeletonLoader variant="rect" width={280} height={150} style={{ borderRadius: 16 }} />
                <SkeletonLoader variant="rect" width={280} height={150} style={{ borderRadius: 16 }} />
              </View>
            ) : reviews.length > 0 ? (
              <ScrollView
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 24 }}
                style={{ marginHorizontal: -24, paddingLeft: 24 }}
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps="handled"
              >
                {reviews.map((review, i) => (
                  <DepthCard key={review.id || i} variant="elevated" style={styles.reviewCard} padding={SPACING.md}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewerAvatar}>
                        <Text style={styles.reviewerInitials}>
                          {(review.reviewerName || review.name || 'U').charAt(0)}
                        </Text>
                      </View>
                      <View style={{ marginLeft: 10, flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Text style={styles.reviewerName} numberOfLines={1}>
                            {review.reviewerName || review.name || 'User'}
                          </Text>
                          {review.isVerifiedPurchase && (
                            <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                          )}
                        </View>
                        <View style={{ flexDirection: 'row' }}>
                          {[...Array(5)].map((_, j) => (
                            <Ionicons
                              key={j}
                              name={j < (review.rating || 5) ? "star" : "star-outline"}
                              size={10}
                              color="#FBBF24"
                            />
                          ))}
                        </View>
                      </View>
                    </View>
                    <Text style={styles.reviewComment} numberOfLines={3}>
                      {review.comment || 'Great service!'}
                    </Text>
                  </DepthCard>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.noReviewsText}>No reviews yet. Be the first to review!</Text>
            )}
          </FadeInView>
        </View>
      </ScrollView>

      {/* Floating Bottom Bar - Corrected Visibility */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.bottomContent}>
          <Button
            variant="outline"
            size="medium"
            title=""
            icon={<Ionicons name="chatbubble-ellipses-outline" size={22} color={COLORS.primary} />}
            onPress={() => {
              haptics.medium();
              (navigation as any).navigate('MainTabs', { screen: 'Chat' });
            }}
            style={{ width: 56, aspectRatio: 1, paddingHorizontal: 0, minWidth: 0, backgroundColor: 'transparent' }}
          />
          <Button
            variant="outline"
            size="medium"
            title=""
            icon={<Ionicons name="call-outline" size={22} color={COLORS.primary} />}
            onPress={handleCall}
            style={{ width: 56, aspectRatio: 1, paddingHorizontal: 0, minWidth: 0, backgroundColor: 'transparent' }}
          />

          <View style={{ flex: 1 }}>
            <Button
              variant="primary"
              size="large"
              title="Book Now"
              icon={<Ionicons name="arrow-forward" size={18} color="#fff" />}
              onPress={handleBookPress}
              style={{ width: '100%' }}
            />
          </View>
        </View>
      </View>


      {/* Service Selection Modal */}
      {showServiceModal && (
        <View style={StyleSheet.absoluteFill}>
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
            activeOpacity={1}
            onPress={() => setShowServiceModal(false)}
          />
          <DepthCard variant="floating" style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]} padding={SPACING.lg}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Service</Text>
              <TouchableOpacity onPress={() => setShowServiceModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Choose a service to book with {provider.name}</Text>

            <ScrollView style={{ maxHeight: 300 }} contentContainerStyle={{ paddingVertical: 10 }}>
              {provider.services?.map((service, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.serviceOption}
                  onPress={() => handleBookService({ title: service })}
                >
                  <View style={styles.serviceIcon}>
                    <Ionicons name="briefcase-outline" size={20} color={COLORS.primary} />
                  </View>
                  <Text style={styles.serviceOptionText}>{service}</Text>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
                </TouchableOpacity>
              ))}
              {(!provider.services || provider.services.length === 0) && (
                <TouchableOpacity
                  style={styles.serviceOption}
                  onPress={() => handleBookService({ title: 'General Service' })}
                >
                  <Text style={styles.serviceOptionText}>General Request</Text>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
                </TouchableOpacity>
              )}
            </ScrollView>
          </DepthCard>
        </View>
      )
      }

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </View >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Parallax Header
  headerBackground: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 0,
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  // Navbar
  navBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    justifyContent: 'center',
    zIndex: 100,
  },
  navContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 50,
  },
  backButton: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: '#F1F5F9', // Subtle border
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  navActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },

  // Content Container
  contentContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    minHeight: height * 0.7,
    paddingHorizontal: 24,
    paddingTop: 0,
    marginTop: -40,
    ...SHADOWS.md,
  },
  handleBar: {
    width: 40, height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 12,
  },

  // Profile Header & Avatar
  profileHeader: {
    marginBottom: 24,
    marginTop: -80,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 100, height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#fff',
    backgroundColor: '#fff',
    marginBottom: 12,
    ...SHADOWS.md,
  },
  avatarImage: {
    width: '100%', height: '100%',
    borderRadius: 50,
    resizeMode: 'cover',
  },
  providerName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
    textAlign: 'center',
  },
  providerService: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
  },
  verificationRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '700',
  },
  experienceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  experienceText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },

  // Stats Card
  statsCardInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E2E8F0',
  },

  // Sections
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#475569',
  },

  // Rate Card
  rateCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rateIconContainer: {
    width: 48, height: 48,
    borderRadius: 16,
    backgroundColor: '#DBEAFE',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 16,
  },
  rateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  rateSubtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  priceTag: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },

  // Reviews
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  reviewCard: {
    width: 280,
    marginRight: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewerAvatar: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
  },
  reviewerInitials: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 22,
    color: '#475569',
  },
  noReviewsText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 20,
    fontStyle: 'italic',
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF', // Solid white background
    paddingHorizontal: 20,
    paddingTop: 20,
    zIndex: 999,
    shadowColor: '#000', // Standard shadow props as fallback to theme
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  bottomContent: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },

  // Modal Styles
  modalContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  serviceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.gray100,
    borderRadius: 16,
    marginBottom: 12,
  },
  serviceIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceOptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
});
