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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { Service, ServiceProvider } from '../../types';
import { apiService } from '../../services/api';
import { getServiceIconImage } from '../../utils/serviceImages';
import { COLORS, SPACING, SHADOWS } from '../../utils/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { DepthCard } from '../../components/ui/DepthCard';
import { TopBar } from '../../components/ui/TopBar';
import { Button } from '../../components/ui/Button';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{ params: { service: Service } }, 'params'>;
};

const { width, height } = Dimensions.get('window');
const HERO_HEIGHT = height * 0.45;

export const ServiceDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { service } = route.params;
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // State
  const [activeTab, setActiveTab] = useState('providers'); // providers | details | reviews
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Animations
  const scrollY = useRef(new Animated.Value(0)).current;
  const tabAnim = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(1)).current;

  // Tab Switch Handler
  const switchTab = (tab: string, index: number) => {
    setActiveTab(tab);
    Animated.parallel([
      Animated.spring(tabAnim, {
        toValue: index,
        useNativeDriver: true,
        damping: 20,
        stiffness: 150,
      }),
      Animated.sequence([
        Animated.timing(contentFade, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(contentFade, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ])
    ]).start();
  };

  // Fetch Logic
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await apiService.getProvidersByService(service.title);
        if (response.success && response.data) {
          const mapped = response.data.map((p: any) => ({
            _id: p.id || p._id,
            name: p.name,
            email: p.email || 'provider@yann.com',
            phone: p.phone || '0000000000',
            services: p.services || [],
            serviceRates: p.serviceRates || (p.price ? [{ serviceName: service.title, price: p.price }] : []),
            status: (p.status || 'active') as 'active' | 'inactive' | 'pending',
            rating: p.rating || 4.8,
            totalReviews: p.totalReviews || 0,
            profileImage: p.profileImage,
            priceForService: p.price || 0,
            experience: p.experience || 2,
            bio: p.bio,
            reviews: p.reviews || []
          }));
          setProviders(mapped);
          if (mapped.length === 1) setSelectedProvider(mapped[0]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [service.title]);

  // Derived Values
  const startPrice = providers.length > 0
    ? Math.min(...providers.map(p => p.priceForService || 0))
    : service.price;

  const renderHero = () => {
    const scale = scrollY.interpolate({
      inputRange: [-HERO_HEIGHT, 0, HERO_HEIGHT],
      outputRange: [2, 1, 1],
      extrapolate: 'clamp',
    });

    const translateY = scrollY.interpolate({
      inputRange: [-HERO_HEIGHT, 0, HERO_HEIGHT],
      outputRange: [-HERO_HEIGHT / 2, 0, HERO_HEIGHT * 0.5],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.heroContainer, { transform: [{ translateY }, { scale }] }]}>
        <Image
          source={getServiceIconImage(service.title)}
          style={styles.heroImage}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent']}
          style={styles.topGradient}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.heroGradient}
        />
        <View style={styles.heroContent}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View>
              <View style={styles.categoryTag}>
                <Text style={styles.categoryText}>{service.category?.toUpperCase()}</Text>
              </View>
              <Text style={styles.heroTitle}>{service.title}</Text>
            </View>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.heroStatItem}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.heroStatText}>4.8 (250+)</Text>
            </View>
            <View style={styles.dotSeparator} />
            <View style={styles.heroStatItem}>
              <Ionicons name="time-outline" size={16} color="#FFF" />
              <Text style={styles.heroStatText}>60 mins</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderQuickStats = () => (
    <DepthCard variant="floating" style={styles.quickStatsRow} padding={SPACING.md}>
      <View style={styles.statBox}>
        <View style={[styles.statIcon, { backgroundColor: isDark ? colors.primary + '20' : '#E3F2FD' }]}>
          <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
        </View>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Verified</Text>
      </View>
      <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
      <View style={styles.statBox}>
        <View style={[styles.statIcon, { backgroundColor: isDark ? colors.success + '20' : '#E8F5E9' }]}>
          <Ionicons name="wallet-outline" size={20} color={colors.success} />
        </View>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Best Price</Text>
      </View>
      <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
      <View style={styles.statBox}>
        <View style={[styles.statIcon, { backgroundColor: isDark ? colors.warning + '20' : '#FFF3E0' }]}>
          <Ionicons name="headset-outline" size={20} color={colors.warning} />
        </View>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Support</Text>
      </View>
    </DepthCard>
  );

  const renderTabs = () => {
    const tabWidth = (width - 40 - 16) / 3;
    const translateX = tabAnim.interpolate({
      inputRange: [0, 1, 2],
      outputRange: [4, 4 + tabWidth, 4 + tabWidth * 2]
    });

    return (
      <View style={[styles.tabsContainer, { backgroundColor: isDark ? colors.border : '#F1F5F9' }]}>
        <Animated.View style={[styles.activeTabIndicator, {
          width: tabWidth,
          transform: [{ translateX }],
          backgroundColor: colors.cardBg,
          shadowColor: colors.text
        }]} />

        {['providers', 'details', 'reviews'].map((tab, index) => (
          <TouchableOpacity
            key={tab}
            style={styles.tabItem}
            onPress={() => switchTab(tab, index)}
          >
            <Text style={[
              styles.tabText,
              { color: colors.textTertiary },
              activeTab === tab && { color: colors.text, fontWeight: '700' }
            ]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderProvider = (item: any, index: number) => {
    const isAvailable = item.status === 'active';
    const isPending = item.status === 'pending';

    // Determine overlay text based on status
    let statusText = 'Currently Unavailable';
    if (isPending) statusText = 'Approval Pending';
    else if (item.status === 'inactive') statusText = 'Currently Offline';

    return (
      <TouchableOpacity
        key={item._id}
        onPress={() => isAvailable && setSelectedProvider(item)}
        activeOpacity={isAvailable ? 0.9 : 1}
        disabled={!isAvailable}
      >
        <DepthCard
          variant="elevated"
          style={[
            styles.providerCard,
            selectedProvider?._id === item._id && { borderColor: colors.primary, borderWidth: 1.5 },
            !isAvailable && { backgroundColor: isDark ? '#1E1E1E' : '#F5F5F5', opacity: 0.7 }
          ]}
          padding={SPACING.md}
        >
          {!isAvailable && (
            <View style={styles.unavailableOverlay}>
              <Text style={[
                styles.unavailableText,
                isPending && { backgroundColor: '#F59E0B', color: '#FFF' } // Orange for pending
              ]}>
                {statusText}
              </Text>
            </View>
          )}
          <View style={styles.providerHeader}>
            <View style={styles.providerAvatarContainer}>
              {item.profileImage ? (
                <Image
                  source={{ uri: item.profileImage }}
                  style={styles.providerAvatar}
                />
              ) : (
                <View style={[styles.providerAvatar, { backgroundColor: isDark ? colors.border : '#F0F0F0' }]}>
                  <Ionicons name="person" size={24} color={colors.textTertiary} />
                </View>
              )}
            </View>
            <View style={styles.providerInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.providerName, { color: colors.text }]}>{item.name}</Text>
                {index === 0 && (
                  <View style={[styles.badgeContainer, { backgroundColor: colors.primary }]}>
                    <Text style={styles.badgeText}>TOP RATED</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.providerMeta, { color: colors.textTertiary }]}>{item.experience} years exp • {item.totalReviews} jobs</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text style={[styles.ratingVal, { color: colors.text }]}>{item.rating}</Text>
              </View>
            </View>
            <View style={styles.priceTag}>
              <Text style={[styles.priceVal, { color: colors.primary }]}>₹{item.priceForService}</Text>
              <Text style={[styles.priceUnit, { color: colors.textTertiary }]}>/hr</Text>
            </View>
          </View>

          {/* Selection Checkmark */}
          <View style={[
            styles.radioButton,
            { borderColor: isDark ? colors.border : '#E0E0E0' },
            selectedProvider?._id === item._id && {
              borderColor: colors.primary,
              backgroundColor: colors.primary
            }
          ]}>
            {selectedProvider?._id === item._id && (
              <Ionicons name="checkmark" size={16} color="#FFF" />
            )}
          </View>
        </DepthCard>
      </TouchableOpacity >
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {renderHero()}

      {/* Glass Header */}
      <TopBar
        title={service.title}
        glass
        showBack
        onBackPress={() => navigation.goBack()}
        showProfile={false}
      />

      <Animated.ScrollView
        contentContainerStyle={{ paddingTop: HERO_HEIGHT - 40, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <View style={[styles.sheetContainer, { backgroundColor: colors.cardBg }]}>
          <View style={styles.dragHandleCenter}>
            <View style={[styles.dragHandle, { backgroundColor: colors.divider }]} />
          </View>

          {renderQuickStats()}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
            <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
              {service.description || 'Experience top-tier service quality with verified professionals. We ensure satisfaction with every booking.'}
            </Text>
          </View>

          {renderTabs()}

          <Animated.View style={[styles.contentArea, { opacity: contentFade, transform: [{ translateY: contentFade.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}>
            {activeTab === 'providers' && (
              <View style={{ gap: 16 }}>
                {isLoading ? (
                  <View style={{ gap: 12 }}>
                    {[1, 2, 3].map(i => <SkeletonLoader key={i} height={100} variant="rect" />)}
                  </View>
                ) : providers.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="search" size={32} color={colors.textTertiary} />
                    <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No providers currently available.</Text>
                  </View>
                ) : (
                  providers.map((p, i) => renderProvider(p, i))
                )}
              </View>
            )}

            {activeTab === 'details' && (
              <View style={styles.detailsList}>
                {['Professional Equipment', 'Safety Protocols', 'Insured Service', 'Satisfaction Guarantee'].map((feat, i) => (
                  <DepthCard key={i} variant="flat" style={styles.detailRow} padding={SPACING.md}>
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                    <Text style={[styles.detailText, { color: colors.text }]}>{feat}</Text>
                  </DepthCard>
                ))}
              </View>
            )}

            {activeTab === 'reviews' && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reviewsScroll} contentContainerStyle={{ paddingRight: 20 }}>
                {[1, 2, 3].map((i) => (
                  <DepthCard key={i} variant="elevated" style={styles.reviewCard} padding={SPACING.md}>
                    <View style={styles.reviewHeader}>
                      <View style={[styles.reviewAvatar, { backgroundColor: isDark ? colors.border : '#E0E0E0' }]}>
                        <Text style={[styles.reviewInitial, { color: colors.textSecondary }]}>U{i}</Text>
                      </View>
                      <View>
                        <Text style={[styles.reviewerName, { color: colors.text }]}>User {i}</Text>
                        <View style={{ flexDirection: 'row' }}><Ionicons name="star" size={12} color="#FFD700" /><Text style={{ fontSize: 12, color: colors.text }}> 5.0</Text></View>
                      </View>
                    </View>
                    <Text style={[styles.reviewBody, { color: colors.textSecondary }]}>"Amazing service! The professional was on time and did a great job."</Text>
                  </DepthCard>
                ))}
              </ScrollView>
            )}
          </Animated.View>

        </View>
      </Animated.ScrollView>

      {/* Bottom FAB */}
      <BlurView intensity={20} tint={isDark ? "dark" : "light"} style={[styles.bottomBar, { paddingBottom: insets.bottom + 12, backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)' }]}>
        <View style={styles.priceContainer}>
          <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total Estimate</Text>
          <Text style={[styles.totalPrice, { color: colors.text }]}>
            {selectedProvider ? `₹${selectedProvider.priceForService}` : `From ₹${startPrice}`}
          </Text>
        </View>
        <View style={{ flex: 1, maxWidth: 180 }}>
          <Button
            title="View Profile"
            onPress={() => {
              if (providers.length > 1 && !selectedProvider) return; // Maybe show toast?
              const providerToView = selectedProvider || providers[0];
              if (!providerToView || !providerToView._id) return;
              navigation.navigate('ProviderPublicProfile', {
                provider: providerToView,
                service: service
              });
            }}
            disabled={!selectedProvider && providers.length > 1 || providers.length === 0}
            variant={(!selectedProvider && providers.length > 1) ? "ghost" : "primary"}
            icon={<Ionicons name="arrow-forward" size={18} color="#FFF" />}
            size="medium"
          />
        </View>
      </BlurView>
    </View >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  // Hero
  heroContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HERO_HEIGHT,
    zIndex: 0,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 1,
  },
  heroContent: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  categoryText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 8,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroStatText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '600',
  },
  dotSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 8,
  },

  // Sheet
  sheetContainer: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    minHeight: height - HERO_HEIGHT + 40,
    paddingHorizontal: 20,
    paddingBottom: 40,
    ...SHADOWS.lg,
  },
  dragHandleCenter: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
  },

  // Quick Stats
  quickStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 20,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#F0F0F0',
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 24,
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
    position: 'relative',
    height: 48,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    zIndex: 1,
  },
  activeTabIndicator: {
    position: 'absolute',
    top: 4,
    left: 0,
    height: 40,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    zIndex: 0,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },

  contentArea: {
    minHeight: 200,
  },

  // Providers
  providerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 4, // Spacing handled by parent gap
  },
  providerHeader: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  providerAvatarContainer: {
    marginRight: 4,
  },
  providerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
  },
  providerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '700',
  },
  badgeContainer: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
  providerMeta: {
    fontSize: 12,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginRight: 12,
  },
  priceVal: {
    fontSize: 16,
    fontWeight: '700',
  },
  priceUnit: {
    fontSize: 11,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 14,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
  },

  // Details list
  detailsList: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailText: {
    fontSize: 15,
    fontWeight: '500',
  },

  // Reviews
  reviewsScroll: {

  },
  reviewCard: {
    width: 280,
    marginRight: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  reviewAvatar: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  reviewInitial: {
    fontWeight: '700', fontSize: 14,
  },
  reviewerName: {
    fontWeight: '600', fontSize: 14,
  },
  reviewBody: {
    fontSize: 14, lineHeight: 20,
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  priceContainer: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 12,
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: '700',
  },
  bookBtnDisabled: {
    opacity: 0.6,
  },
  unavailableOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.5)',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  unavailableText: {
    backgroundColor: '#000',
    color: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
  },
});
