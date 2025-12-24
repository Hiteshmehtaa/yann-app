import React, { useRef, useEffect, useState, useCallback } from 'react';
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
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { Service, ServiceProvider } from '../../types';
import { apiService } from '../../services/api';
import { getServiceIconImage } from '../../utils/serviceImages';
import { COLORS, RADIUS, SHADOWS } from '../../utils/theme';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{ params: { service: Service } }, 'params'>;
};

const { width, height } = Dimensions.get('window');
const HERO_HEIGHT = height * 0.45;

export const ServiceDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { service } = route.params;
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
            serviceRates: p.serviceRates || [],
            status: 'active' as 'active' | 'inactive' | 'pending',
            rating: p.rating || 4.8,
            totalReviews: p.totalReviews || 0,
            profileImage: p.profileImage,
            priceForService: p.price || service.price,
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

  // Render Helpers
  const renderHeader = () => {
    const headerOpacity = scrollY.interpolate({
      inputRange: [HERO_HEIGHT - 100, HERO_HEIGHT - 50],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });

    return (
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: headerOpacity }]}>
          <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
          <View style={styles.headerBorder} />
        </Animated.View>
        
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.roundButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>

          <Animated.Text style={[styles.headerTitle, { opacity: headerOpacity }]}>
            {service.title}
          </Animated.Text>

          <TouchableOpacity style={styles.roundButton}>
            <Ionicons name="share-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={styles.heroGradient}
        />
        <View style={styles.heroContent}>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>{service.category?.toUpperCase()}</Text>
          </View>
          <Text style={styles.heroTitle}>{service.title}</Text>
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
    <View style={styles.quickStatsRow}>
      <View style={styles.statBox}>
        <View style={[styles.statIcon, { backgroundColor: '#E3F2FD' }]}>
          <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
        </View>
        <Text style={styles.statLabel}>Verified</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statBox}>
        <View style={[styles.statIcon, { backgroundColor: '#E8F5E9' }]}>
          <Ionicons name="wallet-outline" size={20} color={COLORS.success} />
        </View>
        <Text style={styles.statLabel}>Best Price</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statBox}>
        <View style={[styles.statIcon, { backgroundColor: '#FFF3E0' }]}>
          <Ionicons name="headset-outline" size={20} color={COLORS.warning} />
        </View>
        <Text style={styles.statLabel}>Support</Text>
      </View>
    </View>
  );

  const renderTabs = () => {
    const tabWidth = (width - 40 - 16) / 3; // (Screen Width - Sheet Padding - Internal Tab Padding) / 3
    const translateX = tabAnim.interpolate({
      inputRange: [0, 1, 2],
      outputRange: [4, 4 + tabWidth, 4 + tabWidth * 2] // Adjusting for padding
    });

    return (
      <View style={styles.tabsContainer}>
        {/* Animated Background Indicator */}
        <Animated.View style={[styles.activeTabIndicator, { 
            width: tabWidth,
            transform: [{ translateX }] 
        }]} />
        
        {['providers', 'details', 'reviews'].map((tab, index) => (
          <TouchableOpacity 
            key={tab} 
            style={styles.tabItem}
            onPress={() => switchTab(tab, index)}
          >
            <Text style={[
              styles.tabText, 
              activeTab === tab && styles.activeTabText
            ]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderProvider = (item: any, index: number) => (
    <TouchableOpacity 
      key={item._id}
      style={[
        styles.providerCard, 
        selectedProvider?._id === item._id && styles.selectedProviderCard
      ]}
      onPress={() => setSelectedProvider(item)}
      activeOpacity={0.9}
    >
      <View style={styles.providerHeader}>
        {item.profileImage ? (
          <Image 
            source={{ uri: item.profileImage }}
            style={styles.providerAvatar}
          />
        ) : (
          <View style={[styles.providerAvatar, { justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="person" size={24} color={COLORS.textTertiary} />
          </View>
        )}
        <View style={styles.providerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.providerName}>{item.name}</Text>
            {index === 0 && (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>TOP RATED</Text>
              </View>
            )}
          </View>
          <Text style={styles.providerMeta}>{item.experience} years exp • {item.totalReviews} jobs</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingVal}>{item.rating}</Text>
          </View>
        </View>
        <View style={styles.priceTag}>
          <Text style={styles.priceVal}>₹{item.priceForService}</Text>
          <Text style={styles.priceUnit}>/hr</Text>
        </View>
      </View>
      
      {/* Selection Checkmark */}
      <View style={[
        styles.radioButton,
        selectedProvider?._id === item._id && styles.radioButtonSelected
      ]}>
        {selectedProvider?._id === item._id && (
          <Ionicons name="checkmark" size={16} color="#FFF" />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {renderHero()}
      {renderHeader()}

      <Animated.ScrollView
        contentContainerStyle={{ paddingTop: HERO_HEIGHT - 40, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.sheetContainer}>
          {/* Dragger */}
          <View style={styles.dragHandleCenter}>
            <View style={styles.dragHandle} />
          </View>

          {renderQuickStats()}
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>
              {service.description || 'Experience top-tier service quality with verified professionals. We ensure satisfaction with every booking.'}
            </Text>
          </View>

          {renderTabs()}

          <Animated.View style={[styles.contentArea, { opacity: contentFade, transform: [{ translateY: contentFade.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}>
            {activeTab === 'providers' && (
              <View style={{ gap: 16 }}>
                 {isLoading ? (
                   <Text style={styles.loadingText}>Loading professionals...</Text>
                 ) : providers.length === 0 ? (
                   <View style={styles.emptyState}>
                     <Ionicons name="search" size={32} color={COLORS.textTertiary} />
                     <Text style={styles.emptyText}>No providers currently available.</Text>
                   </View>
                 ) : (
                   providers.map((p, i) => renderProvider(p, i))
                 )}
              </View>
            )}

            {activeTab === 'details' && (
               <View style={styles.detailsList}>
                 {['Professional Equipment', 'Safety Protocols', 'Insured Service', 'Satisfaction Guarantee'].map((feat, i) => (
                   <View key={i} style={styles.detailRow}>
                     <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                     <Text style={styles.detailText}>{feat}</Text>
                   </View>
                 ))}
               </View>
            )}

            {activeTab === 'reviews' && (
               <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reviewsScroll}>
                  {[1, 2, 3].map((i) => (
                    <View key={i} style={styles.reviewCard}>
                       <View style={styles.reviewHeader}>
                         <View style={styles.reviewAvatar}>
                            <Text style={styles.reviewInitial}>U{i}</Text>
                         </View>
                         <View>
                           <Text style={styles.reviewerName}>User {i}</Text>
                           <View style={{flexDirection:'row'}}><Ionicons name="star" size={12} color="#FFD700"/><Text style={{fontSize:12}}> 5.0</Text></View>
                         </View>
                       </View>
                       <Text style={styles.reviewBody}>"Amazing service! The professional was on time and did a great job."</Text>
                    </View>
                  ))}
               </ScrollView>
            )}
          </Animated.View>

        </View>
      </Animated.ScrollView>

      {/* Bottom FAB */}
      <BlurView intensity={20} tint="light" style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.priceContainer}>
          <Text style={styles.totalLabel}>Total Estimate</Text>
          <Text style={styles.totalPrice}>
            {selectedProvider ? `₹${selectedProvider.priceForService}` : `From ₹${startPrice}`}
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.bookBtn, (!selectedProvider && providers.length > 1) && styles.bookBtnDisabled]}
          onPress={() => {
            if (providers.length > 1 && !selectedProvider) return;
            const providerToView = selectedProvider || providers[0];
            if (!providerToView || !providerToView._id) {
              console.warn('No valid provider to view');
              return;
            }
            navigation.navigate('ProviderPublicProfile', { 
              provider: providerToView,
              service: service
            });
          }}
        >
          <Text style={styles.bookBtnText}>View Profile</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </TouchableOpacity>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7', // Slightly grey background for contrast
  },
  // Header
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    height: 100, // Approximate safe area + nav height
    justifyContent: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 50,
  },
  headerBorder: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
  },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    height: '50%',
  },
  heroContent: {
    position: 'absolute',
    bottom: 50,
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
    backgroundColor: '#FAFAFA',
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
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    ...SHADOWS.sm,
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
    color: COLORS.textSecondary,
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
    color: COLORS.text,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.textSecondary,
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
    position: 'relative', // for absolute indicator
    height: 48,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    zIndex: 1,
  },
  // validation fix: Removed activeTab style as it is no longer used directly on the item
  activeTabIndicator: {
    position: 'absolute',
    top: 4,
    left: 0, 
    height: 40,
    backgroundColor: '#FFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    zIndex: 0,
  },
  activeTab: {
    // keeping for reference or if we fall back, but currently relying on indicator
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textTertiary,
  },
  activeTabText: {
    color: COLORS.text,
    fontWeight: '700',
  },
  
  contentArea: {
    minHeight: 200,
  },

  // Providers
  providerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
    ...SHADOWS.sm,
    shadowOpacity: 0.05,
    alignItems: 'center',
  },
  selectedProviderCard: {
    borderColor: COLORS.primary,
    backgroundColor: '#F5F9FF',
  },
  providerHeader: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  providerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
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
    color: COLORS.text,
  },
  badgeContainer: {
    backgroundColor: COLORS.primary,
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
    color: COLORS.textTertiary,
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
    color: COLORS.text,
  },
  priceTag: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginRight: 12,
  },
  priceVal: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  priceUnit: {
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },

  // Details
  detailsList: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
  },
  detailText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },

  // Reviews
  reviewsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  reviewCard: {
    width: 280,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  reviewHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewInitial: {
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  reviewBody: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    color: COLORS.textTertiary,
    fontSize: 14,
  },
  loadingText: {
    textAlign: 'center',
    color: COLORS.textTertiary,
    marginTop: 20,
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  priceContainer: {
    gap: 4,
  },
  totalLabel: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  bookBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  bookBtnDisabled: {
    backgroundColor: '#E0E0E0',
    shadowOpacity: 0,
  },
  bookBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});
