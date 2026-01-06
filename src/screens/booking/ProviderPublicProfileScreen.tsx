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
  Share,
  Platform,
  Linking,
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { apiService } from '../../services/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { COLORS, SHADOWS, SPACING } from '../../utils/theme';
import { Service, ServiceProvider } from '../../types';

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT_EXPANDED = height * 0.45; // 45% of screen for parallax
const HEADER_HEIGHT_COLLAPSED = 100;

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{ params: { provider: ServiceProvider; service?: Service } }, 'params'>;
};

// FadeIn Component reused from BookingForm
const FadeInView = ({ children, delay = 0, style }: any) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);
  return <Animated.View style={[{ opacity: fadeAnim }, style]}>{children}</Animated.View>;
};

export const ProviderPublicProfileScreen: React.FC<Props> = ({ navigation, route }) => {
  const { provider: initialProvider } = route.params;
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const [provider, setProvider] = useState<ServiceProvider>(initialProvider);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewStats, setReviewStats] = useState<any>(null);

  useEffect(() => {
    const fetchProviderDetails = async () => {
      try {
        const id = (initialProvider as any).id || initialProvider._id;

        // Fetch provider details
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

        // Fetch real reviews from API
        try {
          const reviewsResponse = await apiService.getProviderReviews(id);
          if (reviewsResponse.success && reviewsResponse.data) {
            setReviews(reviewsResponse.data.reviews || []);
            setReviewStats(reviewsResponse.data.stats || null);
          }
        } catch (reviewError) {
          console.log('No reviews found for provider:', reviewError);
          setReviews([]);
        }
      } catch (error) {
        console.log('Error fetching provider details:', error);
      }
    };
    fetchProviderDetails();
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
    try {
      await Share.share({
        message: `Check out ${provider.name} on Yann! Professional ${provider.services?.[0] || 'service provider'}.`,
      });
    } catch (error) { }
  };

  const handleCall = () => {
    if (provider.phone) Linking.openURL(`tel:${provider.phone}`);
  };

  // Stats Calculations - Start from actual data (0 if no bookings)
  const totalBookings = provider.totalReviews || 0;
  const estimatedHours = totalBookings > 0 ? Math.floor(totalBookings * 2.5) : 0; // Estimate 2.5 hrs per booking
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
          colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.4)']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Ambient Background Elements (Decorative) */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Top Right Blob */}
        <View style={{
          position: 'absolute',
          top: -100, right: -100,
          width: 300, height: 300,
          borderRadius: 150,
          backgroundColor: COLORS.primary,
          opacity: 0.05,
        }} />
        {/* Center Left Blob */}
        <View style={{
          position: 'absolute',
          top: height * 0.4, left: -50,
          width: 200, height: 200,
          borderRadius: 100,
          backgroundColor: COLORS.accentOrange || '#F97316',
          opacity: 0.05,
        }} />
        {/* Bottom Right Blob */}
        <View style={{
          position: 'absolute',
          bottom: 0, right: -50,
          width: 250, height: 250,
          borderRadius: 125,
          backgroundColor: COLORS.primary,
          opacity: 0.03,
        }} />
      </View>

      {/* 2. Navigation Bar (Matches BookingForm) */}
      <View style={[styles.navBar, { paddingTop: insets.top, height: HEADER_HEIGHT_COLLAPSED }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#fff', opacity: headerBgOpacity, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }]} />

        <View style={styles.navContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>

          <Animated.Text style={[styles.navTitle, { opacity: titleOpacity }]}>
            {provider.name}
          </Animated.Text>

          <View style={styles.navActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={22} color="#1E293B" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => setIsBookmarked(!isBookmarked)}>
              <Ionicons name={isBookmarked ? "heart" : "heart-outline"} size={22} color={isBookmarked ? "#EF4444" : "#1E293B"} />
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

          {/* Profile Main Info - Updated with Avatar */}
          <FadeInView delay={100} style={styles.profileHeader}>
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
                  <TouchableOpacity
                    onPress={() => Alert.alert('Verified Provider', 'This provider has been verified by YANN', [{ text: 'OK' }])}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  </TouchableOpacity>
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

          {/* Stats Grid - 3 Stats Horizontal */}
          <FadeInView delay={200} style={styles.section}>
            <View style={styles.statsCard}>
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
            </View>
          </FadeInView>

          {/* About Section */}
          <FadeInView delay={300} style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.aboutText}>
              {provider.bio || (provider as any).about || 'I am a dedicated professional committed to delivering high-quality work. Customer satisfaction is my top priority.'}
            </Text>
          </FadeInView>

          {/* Service Rate Card */}
          <FadeInView delay={400} style={styles.section}>
            <Text style={styles.sectionTitle}>Service Details</Text>
            <View style={styles.rateCard}>
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
            </View>
          </FadeInView>

          {/* Reviews Section */}
          <FadeInView delay={500} style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                Client Reviews ({reviewStats?.totalReviews || reviews.length})
              </Text>
              {reviews.length > 3 && (
                <TouchableOpacity>
                  <Text style={styles.seeAllLink}>See All</Text>
                </TouchableOpacity>
              )}
            </View>
            {reviews.length > 0 ? (
              <ScrollView
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 24 }}
                style={{ marginHorizontal: -24, paddingLeft: 24 }}
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps="handled"
              >
                {reviews.map((review, i) => (
                  <View key={review.id || i} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewerAvatar}>
                        <Text style={styles.reviewerInitials}>
                          {(review.reviewerName || review.name || 'U').charAt(0)}
                        </Text>
                      </View>
                      <View style={{ marginLeft: 10, flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Text style={styles.reviewerName}>
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
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.noReviewsText}>No reviews yet. Be the first to review!</Text>
            )}
          </FadeInView>
        </View>
      </ScrollView>

      {/* Floating Bottom Bar (BookingForm Style) - Position Fixed */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.bottomContent}>
          <TouchableOpacity style={styles.chatButton} onPress={() => (navigation as any).navigate('MainTabs', { screen: 'Chat' })}>
            <Ionicons name="chatbubble-ellipses-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.callButton} onPress={handleCall}>
            <Ionicons name="call-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => {
              if (route.params.service) {
                navigation.navigate('BookingForm', {
                  service: route.params.service,
                  selectedProvider: provider
                });
              } else {
                navigation.goBack();
              }
            }}
          >
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.bookButtonText}>Book Now</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

    </View>
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
    borderColor: '#F1F5F9', // Matching BookingForm
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
    paddingTop: 0, // Removed padding top to let avatar overlap
    marginTop: -40, // Pull up to overlap with header slightly more (visual trick)
    ...SHADOWS.md,
    shadowColor: '#1E293B',
    shadowOpacity: 0.1,
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
    marginTop: -80, // Moved up to perfectly center on the card edge (counteracting handleBar)
    alignItems: 'center', // Center content
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

  // ... (Keep existing badge styles)
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
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
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
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

  // ... (Keep other styles)

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
  rateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  rateIconContainer: {
    width: 48, height: 48,
    borderRadius: 16,
    backgroundColor: '#DBEAFE', // Tinted blue
    alignItems: 'center', justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#E0E7FF',
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
  reviewsList: {
    paddingHorizontal: 0, // Parent container has padding
  },
  reviewCard: {
    width: 280,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginRight: 16,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: '#F1F5F9',
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

  // Bottom Bar - Fixed to bottom with enhanced styling
  bottomBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 20,
    zIndex: 999,
    ...SHADOWS.lg,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  bottomContent: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  chatButton: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
    shadowColor: '#64748B',
    shadowOpacity: 0.1,
  },
  callButton: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
    shadowColor: '#64748B',
    shadowOpacity: 0.1,
  },
  bookButton: {
    flex: 1,
    height: 56,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    overflow: 'hidden',
    ...SHADOWS.md,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  bookButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
});
