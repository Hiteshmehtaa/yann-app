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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { COLORS, RADIUS, SHADOWS } from '../../utils/theme';
import { Service, ServiceProvider } from '../../types';

const { width } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{ params: { provider: ServiceProvider; service?: Service } }, 'params'>;
};

// Mock data similar to the screenshot if real data is missing
const MOCK_DATA = {
  // Badge removed as per request
  type: 'INDIVIDUAL',
  specialty: 'ASSEMBLY',
  avgTime: '1 hour',
  about: 'As a professional assembler, I possess the necessary skills and experience to assemble furniture and equipment for clients. My expertise includes reading and interpreting assembly instructions, using power tools and hand tools, and ensuring that the finished product is sturdy and safe.',
  distance: '2.5 km',
};

export const ProviderPublicProfileScreen: React.FC<Props> = ({ navigation, route }) => {
  const { provider: initialProvider } = route.params;
  const [provider, setProvider] = useState<ServiceProvider>(initialProvider);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    // Fetch latest provider details (for bio, rates, etc.)
    const fetchProviderDetails = async () => {
      try {
        const response = await apiService.getProviderById(initialProvider._id);
        if (response.success && response.data) {
           const newData = response.data;
           setProvider(prev => ({
             ...prev,
             ...newData,
             // Ensure access to nested fields if backend structure differs slightly
             serviceRates: newData.serviceRates || prev.serviceRates
           }));
        }
      } catch (error) {
        console.log('Error fetching provider details:', error);
      }
    };

    fetchProviderDetails();
  }, [initialProvider._id]);

  // Animations
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [180, 100],
    extrapolate: 'clamp',
  });

  const avatarSize = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [100, 60],
    extrapolate: 'clamp',
  });

  const avatarTop = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [130, 70], // Position relative to top
    extrapolate: 'clamp',
  });
  
  const titleOpacity = scrollY.interpolate({
    inputRange: [0, 80, 100],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  const renderStars = (rating: number) => {
    return (
      <View style={styles.ratingContainer}>
        <Ionicons name="star" size={16} color="#FFB800" />
        <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E59F3" />

      {/* Blue Header Background */}
      <Animated.View style={[styles.blueHeader, { height: headerHeight }]}>
        <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
          <View style={styles.navBar}>
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={24} color="#FFF" />
            </TouchableOpacity>
            
            <Animated.Text style={[styles.headerTitle, { opacity: titleOpacity }]}>
              Provider Profile
            </Animated.Text>
            
            <Text style={[styles.headerTitleStatic, { opacity: 0 }]}>Provider Profile</Text> 
            {/* Invisible static title for layout if needed, but absolute positioning is used mostly */}

            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => setIsBookmarked(!isBookmarked)}
            >
              <Ionicons 
                name={isBookmarked ? "bookmark" : "bookmark-outline"} 
                size={22} 
                color="#FFF" 
              />
            </TouchableOpacity>
          </View>
          
          <Animated.Text style={[styles.bigHeaderTitle, { opacity: scrollY.interpolate({ inputRange: [0, 60], outputRange: [1, 0] }) }]}>
            Provider Profile
          </Animated.Text>
        </SafeAreaView>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.placeholderHeader} />
        
        <View style={styles.profileContent}>
          {/* Avatar Section */}
          <View style={styles.avatarContainer}>
            {provider.profileImage ? (
              <Image 
                source={{ uri: provider.profileImage }} 
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarPlaceholderText}>
                  {provider.name?.charAt(0).toUpperCase() || 'P'}
                </Text>
              </View>
            )}
            {/* Badge removed as per request */}
          </View>

          {/* Name & Type */}
          <Text style={styles.name}>{provider.name}</Text>
          <View style={styles.typeContainer}>
            <Text style={styles.typeText}>{MOCK_DATA.type}</Text>
            <View style={styles.dot} />
            <Text style={styles.specialtyText}>{provider.services[0]?.toUpperCase() || MOCK_DATA.specialty}</Text>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={styles.statValueContainer}>
                <Ionicons name="star" size={20} color="#FFB800" />
                <Text style={styles.statValue}>{provider.rating}</Text>
              </View>
              <Text style={styles.statLabel}>rating</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <View style={styles.statValueContainer}>
                <Ionicons name="checkbox" size={20} color="#6B9EFF" />
                <Text style={styles.statValue}>{provider.totalReviews}</Text>
              </View>
              <Text style={styles.statLabel}>tasks done</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <View style={styles.statValueContainer}>
                <Ionicons name="time" size={20} color="#6B9EFF" />
                <Text style={styles.statValue}>{MOCK_DATA.avgTime}</Text>
              </View>
              <Text style={styles.statLabel}>avg. job done</Text>
            </View>
          </View>

          <View style={styles.horizontalLine} />

          {/* About Tasker */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>About Tasker</Text>
            <Text style={styles.aboutText} numberOfLines={3}>
              {provider.bio || MOCK_DATA.about}
              <Text style={styles.viewMore}> View More</Text>
            </Text>
          </View>

          {/* Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <Ionicons name="cash-outline" size={20} color="#2E59F3" />
                <Text style={styles.detailLabel}>Cost</Text>
              </View>
              <Text style={styles.detailValue}>
               {/* Use effective hourly rate based on selected service or first available rate */}
               {(() => {
                  let price = 0;
                  // Try to find rate for the specific service passed in params
                  if (route.params.service && provider.serviceRates) {
                    if (Array.isArray(provider.serviceRates)) {
                      const rate = provider.serviceRates.find(r => r.serviceName === route.params.service?.title);
                      if (rate) price = rate.price;
                    } else {
                       price = provider.serviceRates[route.params.service.title] || 0;
                    }
                  }
                  
                  // Fallback to first available rate
                  if (!price && provider.serviceRates) {
                     if (Array.isArray(provider.serviceRates)) {
                        price = provider.serviceRates[0]?.price || 0;
                     } else {
                        // Safe cast as we know values are numbers in the Record
                        price = (Object.values(provider.serviceRates)[0] as number) || 0;
                     }
                  }
                  
                  // If still 0 and we have a priceForService (from list view), use that
                  if (!price && (provider as any).priceForService) {
                    price = (provider as any).priceForService;
                  }

                  return price > 0 ? `₹${price}/hour` : 'Contact for price';
               })()}
              </Text>
            </View>
          </View>
           
          <View style={styles.horizontalLine} />

          {/* Reviews Preview */}
          <View style={styles.section}>
            <View style={styles.reviewsHeader}>
               <Text style={styles.sectionHeader}>Reviews</Text>
               <TouchableOpacity style={styles.arrowButton}>
                 <Ionicons name="arrow-forward" size={20} color={COLORS.textSecondary} />
               </TouchableOpacity>
            </View>
            <View style={styles.ratingSummary}>
              <Ionicons name="star" size={18} color="#FFB800" />
              <Text style={styles.ratingSummaryText}>
                <Text style={styles.boldRating}>{provider.rating}</Text>/5 ({provider.totalReviews} reviews)
              </Text>
            </View>
            
            {/* Mock Review Item */}
            <View style={styles.reviewItem}>
               <View style={styles.reviewerInfo}>
                  <Image source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }} style={styles.reviewerAvatar} />
                  <Text style={styles.reviewerName}>Wilson Donin</Text>
                  <View style={{flex:1}} />
                  <Ionicons name="star" size={14} color="#FFB800" />
                  <Text style={styles.reviewRating}>5.0</Text>
               </View>
               <Text style={styles.reviewComment} numberOfLines={2}>
                 Great work! He arrived on time and finished the job quickly. very professional...
               </Text>
            </View>
          </View>
          
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.chatButton}>
          <Ionicons name="chatbubble-ellipses" size={24} color="#2E59F3" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.hireButton}
          onPress={() => {
             // Go back with selected provider to book
             // Or navigate directly to booking form
             if (route.params.service) {
                 navigation.navigate('BookingForm', {
                     service: route.params.service,
                     selectedProvider: provider
                 });
             } else {
                 // Fallback or just go back
                 navigation.goBack();
             }
          }}
        >
          <Text style={styles.hireButtonText}>Hire Now</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  blueHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#2E59F3',
    zIndex: 0,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerSafeArea: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: -1,
  },
  headerTitleStatic: {
    color: 'transparent',
    fontSize: 18,
    fontWeight: '600',
  },
  bigHeaderTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  placeholderHeader: {
    height: 140, // Space for the fixed header
  },
  profileContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  avatarContainer: {
    marginTop: -50, // This pulls it up 50px, so with 100px avatar height, center is at boundary
    alignItems: 'center',
    zIndex: 100,
    elevation: 100,
    marginBottom: 16,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#FFF',
    zIndex: 100,
    elevation: 100,
  },
  avatarPlaceholder: {
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFF',
  },
  badgeContainer: {
    position: 'absolute',
    bottom: -10,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 4,
  },
  badgeText: {
    color: '#2E59F3',
    fontWeight: '700',
    fontSize: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  typeText: {
    color: '#2E59F3',
    fontWeight: '600',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 8,
  },
  specialtyText: {
    color: '#2E59F3',
    fontWeight: '600',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  divider: {
    width: 1,
    height: '80%',
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
  },
  horizontalLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 24,
  },
  section: {
    width: '100%',
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#4B5563',
  },
  viewMore: {
    color: '#2E59F3',
    fontWeight: '600',
  },
  detailsContainer: {
    width: '100%',
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailLabel: {
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  arrowButton: {
    padding: 4,
  },
  ratingSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  ratingSummaryText: {
    fontSize: 15,
    color: '#6B7280',
  },
  boldRating: {
    fontWeight: '700',
    color: '#1F2937',
  },
  reviewItem: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  reviewerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D1D5DB',
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  reviewRating: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 4,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4B5563',
    fontStyle: 'italic',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  chatButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#2E59F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hireButton: {
    flex: 1,
    height: 52,
    backgroundColor: '#2E59F3', // App primary color
    borderRadius: 26,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#2E59F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  hireButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFB800',
  },
});
