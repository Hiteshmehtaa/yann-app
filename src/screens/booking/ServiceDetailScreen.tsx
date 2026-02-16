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
  Modal,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { apiService } from '../../services/api';
import { getServiceIconImage } from '../../utils/serviceImages';
import { COLORS, SPACING, SHADOWS } from '../../utils/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { DepthCard } from '../../components/ui/DepthCard';
import { TopBar } from '../../components/ui/TopBar';
import { Button } from '../../components/ui/Button';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import type { Service, ServiceProvider } from '../../types';

// Types
type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{ params: { service: Service } }, 'params'>;
};

// Constants
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
  const [selectedExperienceRange, setSelectedExperienceRange] = useState<{ label: string; min: number; max: number | null } | null>(null);
  const [experienceModalOpen, setExperienceModalOpen] = useState(false);

  // Animations
  const scrollY = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(1)).current;

  // Fetch Data
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
          // Auto-select if only one provider
          if (mapped.length === 1) setSelectedProvider(mapped[0]);
        }
      } catch (e) {
        console.error("Error fetching providers:", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [service.title]);

  // Filters
  const EXPERIENCE_RANGES = [
    { label: '0-5 years', min: 0, max: 5 },
    { label: '5-10 years', min: 5, max: 10 },
    { label: '10-15 years', min: 10, max: 15 },
    { label: '15-20 years', min: 15, max: 20 },
    { label: '20+ years', min: 20, max: null },
  ];

  const filteredProviders = providers.filter((p: any) => {
    if (!selectedExperienceRange) return true;
    const exp = Number(p.experience || 0);
    const { min, max } = selectedExperienceRange;
    return exp >= min && (max === null || exp < max);
  });

  // Calculate Base Price
  const startPrice = providers.length > 0
    ? Math.min(...providers.map(p => p.priceForService || 0))
    : service.price;

  // Render Helpers
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
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>{service.category?.toUpperCase() || 'SERVICE'}</Text>
          </View>
          <Text style={styles.heroTitle} numberOfLines={2}>{service.title}</Text>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatBadge}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.heroStatText}>4.8 (250+)</Text>
            </View>
            <View style={styles.heroStatBadge}>
              <Ionicons name="time-outline" size={14} color="#FFF" />
              <Text style={styles.heroStatText}>60 mins</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      {['providers', 'details', 'reviews'].map((tab) => {
        const isActive = activeTab === tab;
        return (
          <TouchableOpacity
            key={tab}
            style={styles.tabItem}
            onPress={() => {
              if (isActive) return;
              setActiveTab(tab);
              // Simple flicker animation for content
              contentFade.setValue(0);
              Animated.timing(contentFade, {
                toValue: 1,
                duration: 250,
                useNativeDriver: true,
              }).start();
            }}
          >
            <Text style={[
              styles.tabText,
              { color: isActive ? colors.text : colors.textTertiary },
              isActive && styles.tabTextActive
            ]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
            {isActive && <View style={[styles.activeTabDot, { backgroundColor: colors.primary }]} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderProviderCard = (item: ServiceProvider, index: number) => {
    const isAvailable = item.status === 'active';
    const isSelected = selectedProvider?._id === item._id;
    const isPending = item.status === 'pending';

    let statusText = 'Unavailable';
    if (isPending) statusText = 'Pending Approval';
    else if (!isAvailable) statusText = 'Offline';

    return (
      <TouchableOpacity
        key={item._id}
        onPress={() => isAvailable && setSelectedProvider(item)}
        activeOpacity={isAvailable ? 0.9 : 1}
        disabled={!isAvailable}
      >
        <DepthCard
          variant={isSelected ? "elevated" : "flat"}
          style={[
            styles.providerCard,
            isSelected && { borderColor: colors.primary, borderWidth: 1.5, backgroundColor: isDark ? '#1E293B' : '#F8FAFC' },
            !isAvailable && { opacity: 0.7 }
          ]}
          padding={16}
        >
          {/* Header: Avatar + Main Info */}
          <View style={styles.providerHeader}>
            <View style={styles.avatarContainer}>
              {item.profileImage ? (
                <Image source={{ uri: item.profileImage }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: isDark ? colors.border : '#E2E8F0', justifyContent: 'center', alignItems: 'center' }]}>
                  <Ionicons name="person" size={24} color={colors.textTertiary} />
                </View>
              )}
              {index === 0 && (
                <View style={styles.badgeTopRated}>
                  <Ionicons name="trophy" size={10} color="#FFF" />
                </View>
              )}
            </View>

            <View style={styles.providerInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.providerName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                {item.rating >= 4.8 && <Ionicons name="shield-checkmark" size={14} color={colors.primary} />}
              </View>
              <Text style={[styles.providerMeta, { color: colors.textSecondary }]}>
                {item.experience}+ years exp • {item.totalReviews} jobs
              </Text>

              <View style={styles.ratingRow}>
                <View style={styles.ratingPill}>
                  <Ionicons name="star" size={10} color="#FFD700" />
                  <Text style={[styles.ratingVal, { color: colors.text }]}>{item.rating}</Text>
                </View>
                <View style={styles.dotSeparator} />
                <Text style={[styles.verifiedText, { color: colors.success }]}>Verified</Text>
              </View>
            </View>

            <View style={styles.priceColumn}>
              <Text style={[styles.priceVal, { color: colors.primary }]}>₹{item.priceForService}</Text>
              <Text style={[styles.priceUnit, { color: colors.textSecondary }]}>/hr</Text>

              <View style={[
                styles.radioButton,
                { borderColor: isSelected ? colors.primary : colors.border },
                isSelected && { backgroundColor: colors.primary }
              ]}>
                {isSelected && <Ionicons name="checkmark" size={12} color="#FFF" />}
              </View>
            </View>
          </View>

          {/* Unavailable Overlay */}
          {!isAvailable && (
            <View style={styles.unavailableOverlay}>
              <Text style={styles.unavailableText}>{statusText}</Text>
            </View>
          )}

        </DepthCard>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Parallax Hero */}
      {renderHero()}

      {/* Top Navigation */}
      <TopBar
        title=""
        glass
        showBack
        onBackPress={() => navigation.goBack()}
        showProfile={false}
      />

      <Animated.ScrollView
        contentContainerStyle={{ paddingTop: HERO_HEIGHT - 30, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        <View style={[styles.sheetContainer, { backgroundColor: colors.background }]}>
          <View style={styles.dragHandleCenter}>
            <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
          </View>

          <View style={styles.headerSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
            <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
              {service.description || 'Experience top-tier service quality with verified professionals. We ensure satisfaction with every booking.'}
            </Text>
          </View>

          {/* Quick Stats Grid */}
          <View style={styles.quickStatsGrid}>
            {[
              { icon: 'shield-checkmark', color: colors.primary, text: 'Verified Pro', bg: isDark ? 'rgba(255,255,255,0.05)' : '#F0F9FF' },
              { icon: 'pricetag', color: colors.success, text: 'Best Price', bg: isDark ? 'rgba(255,255,255,0.05)' : '#ECFDF5' },
              { icon: 'headset', color: colors.warning, text: '24/7 Support', bg: isDark ? 'rgba(255,255,255,0.05)' : '#FFFBEB' }
            ].map((stat, i) => (
              <View key={i} style={[styles.statPill, { backgroundColor: stat.bg }]}>
                <Ionicons name={stat.icon as any} size={16} color={stat.color} />
                <Text style={[styles.statPillText, { color: colors.text }]}>{stat.text}</Text>
              </View>
            ))}
          </View>

          {/* Tabs */}
          {renderTabs()}

          {/* Tab Content */}
          <Animated.View style={{ opacity: contentFade, minHeight: 300 }}>
            {activeTab === 'providers' && (
              <View style={styles.tabContent}>
                {/* Filter Row */}
                <View style={styles.filterRow}>
                  <TouchableOpacity
                    style={[styles.filterChip, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
                    onPress={() => setExperienceModalOpen(true)}
                  >
                    <Ionicons name="options-outline" size={14} color={colors.text} />
                    <Text style={[styles.filterChipText, { color: colors.text }]}>
                      {selectedExperienceRange ? selectedExperienceRange.label : 'Filter by Experience'}
                    </Text>
                    <Ionicons name="chevron-down" size={12} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {isLoading ? (
                  <View style={{ gap: 12 }}>
                    {[1, 2, 3].map(i => <SkeletonLoader key={i} height={100} variant="rect" />)}
                  </View>
                ) : filteredProviders.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="search" size={48} color={colors.textTertiary} />
                    <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No providers found matching your criteria.</Text>
                  </View>
                ) : (
                  filteredProviders.map((p, i) => renderProviderCard(p, i))
                )}
              </View>
            )}

            {activeTab === 'details' && (
              <View style={styles.detailsList}>
                {['Professional Equipment Provided', 'Safety Protocols Followed', 'Insured Service', '100% Satisfaction Guarantee'].map((feat, i) => (
                  <View key={i} style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                    <View style={[styles.checkCircle, { backgroundColor: colors.primary + '20' }]}>
                      <Ionicons name="checkmark" size={16} color={colors.primary} />
                    </View>
                    <Text style={[styles.detailText, { color: colors.text }]}>{feat}</Text>
                  </View>
                ))}
              </View>
            )}

            {activeTab === 'reviews' && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                {[1, 2, 3].map(i => (
                  <DepthCard key={i} variant="flat" style={styles.reviewCard} padding={16}>
                    <View style={styles.reviewHeader}>
                      <View style={[styles.reviewAvatar, { backgroundColor: isDark ? colors.border : '#E2E8F0' }]}>
                        <Text style={{ fontWeight: '700', color: colors.textSecondary }}>U{i}</Text>
                      </View>
                      <View>
                        <Text style={{ fontWeight: '600', color: colors.text, fontSize: 14 }}>User {i}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Ionicons name="star" size={12} color="#FFD700" />
                          <Text style={{ fontSize: 12, color: colors.textSecondary }}>5.0</Text>
                        </View>
                      </View>
                    </View>
                    <Text style={{ fontSize: 13, lineHeight: 20, color: colors.textSecondary, marginTop: 8 }}>
                      "Exceptional service! Arrived on time and completed the job perfectly. Highly recommended."
                    </Text>
                  </DepthCard>
                ))}
              </ScrollView>
            )}
          </Animated.View>

        </View>
      </Animated.ScrollView>

      {/* Bottom Bar */}
      <BlurView intensity={30} tint={isDark ? "dark" : "light"} style={[styles.bottomBar, { paddingBottom: insets.bottom + 12, borderTopColor: colors.border }]}>
        <View style={styles.priceContainer}>
          <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Expected Total</Text>
          <Text style={[styles.totalPrice, { color: colors.text }]}>
            {selectedProvider ? `₹${selectedProvider.priceForService}` : `From ₹${startPrice}`}
            <Text style={{ fontSize: 14, fontWeight: '400', color: colors.textSecondary }}> /hr</Text>
          </Text>
        </View>
        <Button
          title={selectedProvider ? "Book Provider" : "Select Provider"}
          onPress={() => {
            const providerToBook = selectedProvider || (filteredProviders.length === 1 ? filteredProviders[0] : null);

            if (!providerToBook && filteredProviders.length > 1) {
              // Ideally scroll to provider list
              return;
            }

            if (providerToBook) {
              navigation.navigate('ProviderPublicProfile', {
                provider: providerToBook,
                service: service
              });
            }
          }}
          disabled={(!selectedProvider && filteredProviders.length !== 1 && filteredProviders.length !== 0)}
          variant={selectedProvider ? "primary" : "outline"}
          style={{ flex: 1, marginLeft: 20, maxWidth: 180 }}
          textStyle={!selectedProvider && { color: colors.primary }}
        />
      </BlurView>

      {/* Experience Modal */}
      <Modal
        visible={experienceModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setExperienceModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Filter Experience</Text>
            {EXPERIENCE_RANGES.map((range) => (
              <TouchableOpacity
                key={range.label}
                style={[styles.modalItem, { borderColor: colors.border }]}
                onPress={() => {
                  setSelectedExperienceRange(range);
                  setExperienceModalOpen(false);
                }}
              >
                <Text style={[styles.modalItemText, { color: colors.text }]}>{range.label}</Text>
                {selectedExperienceRange?.label === range.label && <Ionicons name="checkmark" size={18} color={colors.primary} />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.modalItem, { borderColor: colors.border }]}
              onPress={() => {
                setSelectedExperienceRange(null);
                setExperienceModalOpen(false);
              }}
            >
              <Text style={[styles.modalItemText, { color: colors.text }]}>Any Experience</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 16, alignItems: 'center' }} onPress={() => setExperienceModalOpen(false)}>
              <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  heroContent: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  categoryText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 12,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroStatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  heroStatText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // Sheet
  sheetContainer: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    minHeight: height - HERO_HEIGHT + 40,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 8,
  },
  dragHandleCenter: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 10,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    opacity: 0.3,
  },
  headerSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
  },
  quickStatsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
  },
  statPillText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tabItem: {
    marginRight: 24,
    paddingBottom: 10,
    position: 'relative',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  tabTextActive: {
    fontWeight: '700',
  },
  activeTabDot: {
    position: 'absolute',
    bottom: -1.5,
    left: '50%',
    marginLeft: -12,
    width: 24,
    height: 3,
    borderRadius: 1.5,
  },

  // Tab Content
  tabContent: {
    gap: 12,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Providers
  providerCard: {
    borderRadius: 16,
    marginBottom: 4,
  },
  providerHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  badgeTopRated: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  providerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  providerName: {
    fontSize: 15,
    fontWeight: '700',
    maxWidth: 120,
  },
  providerMeta: {
    fontSize: 12,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  ratingVal: {
    fontSize: 10,
    fontWeight: '700',
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#94A3B8',
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '600',
  },
  priceColumn: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  priceVal: {
    fontSize: 16,
    fontWeight: '700',
  },
  priceUnit: {
    fontSize: 11,
    marginBottom: 8,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unavailableOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#94A3B8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 10,
  },
  unavailableText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },

  // Details
  detailsList: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 16,
    padding: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderBottomWidth: 0.5,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },

  // Reviews
  reviewCard: {
    width: 280,
    marginRight: 12,
    borderRadius: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  reviewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: 30,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  priceContainer: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: '800',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    ...SHADOWS.medium,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  modalItemText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
