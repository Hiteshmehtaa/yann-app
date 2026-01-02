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
  Share,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '../../services/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { COLORS, SHADOWS, SPACING } from '../../utils/theme';
import { Service, ServiceProvider } from '../../types';

const { width } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{ params: { provider: ServiceProvider; service?: Service } }, 'params'>;
};

export const ProviderPublicProfileScreen: React.FC<Props> = ({ navigation, route }) => {
  const { provider: initialProvider } = route.params;
  const [provider, setProvider] = useState<ServiceProvider>(initialProvider);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [isBookmarked, setIsBookmarked] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const fetchProviderDetails = async () => {
      try {
        const response = await apiService.getProviderById((initialProvider as any).id || initialProvider._id);
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
      } catch (error) {
        console.log('Error fetching provider details:', error);
      }
    };
    fetchProviderDetails();
  }, [initialProvider]);

  // Animation Values
  const HEADER_HEIGHT_MAX = 280;
  const HEADER_HEIGHT_MIN = 100 + insets.top;
  
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT_MAX - HEADER_HEIGHT_MIN],
    outputRange: [HEADER_HEIGHT_MAX, HEADER_HEIGHT_MIN],
    extrapolate: 'clamp',
  });

  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [HEADER_HEIGHT_MAX - HEADER_HEIGHT_MIN - 40, HEADER_HEIGHT_MAX - HEADER_HEIGHT_MIN],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const imageOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT_MAX - HEADER_HEIGHT_MIN],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const avatarScale = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT_MAX - HEADER_HEIGHT_MIN],
    outputRange: [1, 0.6],
    extrapolate: 'clamp',
  });

  const avatarTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT_MAX - HEADER_HEIGHT_MIN],
    outputRange: [0, -40],
    extrapolate: 'clamp',
  });

  const handleShare = async () => {
      try {
          await Share.share({
              message: `Check out ${provider.name} on Yann! Professional ${provider.services?.[0] || 'service provider'}.`,
          });
      } catch (error) {
          console.log(error);
      }
  };

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

      if (!price && (provider as any).priceForService) {
        price = (provider as any).priceForService;
      }

      return price > 0 ? `₹${price}/hr` : 'Contact for price';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Animated Header */}
      <Animated.View style={[styles.headerContainer, { height: headerHeight }]}>
          {provider.profileImage ? (
             <Animated.Image 
                source={{ uri: provider.profileImage }}
                style={[styles.headerImage, { opacity: imageOpacity }]}
                blurRadius={20}
             />
          ) : (
             <Animated.View style={[styles.headerImage, { backgroundColor: '#2E59F3', opacity: imageOpacity }]} />
          )}
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.2)', 'rgba(255,255,255,1)']}
            style={StyleSheet.absoluteFill}
          />
          
          {/* Header Actions */}
          <View style={[styles.headerActions, { paddingTop: insets.top + 10 }]}>
             <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
             </TouchableOpacity>
             
             <Animated.Text style={[styles.headerTitleText, { opacity: headerTitleOpacity }]}>
                 {provider.name}
             </Animated.Text>

             <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
                    <Ionicons name="share-social-outline" size={22} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton} onPress={() => setIsBookmarked(!isBookmarked)}>
                    <Ionicons name={isBookmarked ? "heart" : "heart-outline"} size={22} color={isBookmarked ? "#EF4444" : "#fff"} />
                </TouchableOpacity>
             </View>
          </View>
      </Animated.View>

      <ScrollView
         showsVerticalScrollIndicator={false}
         contentContainerStyle={{ paddingTop: HEADER_HEIGHT_MAX - 70, paddingBottom: 120 }}
         onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
         )}
         scrollEventThrottle={16}
      >
          {/* Profile Card */}
          <View style={styles.profileCard}>
              <Animated.View 
                 style={[
                    styles.avatarContainer, 
                    { 
                        transform: [
                            { scale: avatarScale },
                            { translateY: avatarTranslateY }
                        ] 
                    }
                 ]}
              >
                 {provider.profileImage ? (
                    <Image 
                        source={{ uri: provider.profileImage }} 
                        style={styles.avatar} 
                    />
                 ) : (
                    <View style={[styles.avatar, { backgroundColor: '#FFD700', alignItems: 'center', justifyContent: 'center' }]}>
                        <Text style={{ fontSize: 40, fontWeight: '700', color: '#FFF' }}>
                            {provider.name?.charAt(0).toUpperCase() || 'P'}
                        </Text>
                    </View>
                 )}
                 <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                 </View>
              </Animated.View>

              <View style={styles.infoCenter}>
                  <Text style={styles.name}>{provider.name}</Text>
                  <Text style={styles.specialty}>{provider.services?.[0] || 'Professional Tasker'}</Text>
                  
                  <View style={styles.badgesRow}>
                      <View style={styles.pillBadge}>
                         <Ionicons name="time-outline" size={14} color="#4B5563" />
                         <Text style={styles.pillText}>{(provider as any).avgTime || '1 hr msg time'}</Text>
                      </View>
                      <View style={styles.pillBadge}>
                         <Ionicons name="location-outline" size={14} color="#4B5563" />
                         <Text style={styles.pillText}>{(provider as any).distance || '2.5 km away'}</Text>
                      </View>
                  </View>
              </View>

              {/* Stats Grid */}
              <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                      <Text style={styles.statValue}>{provider.rating ? provider.rating.toFixed(1) : 'New'}</Text>
                      <Text style={styles.statLabel}>Rating</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                      <Text style={styles.statValue}>{provider.totalReviews || 0}</Text>
                      <Text style={styles.statLabel}>Reviews</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                      <Text style={styles.statValue}>100%</Text>
                      <Text style={styles.statLabel}>Reliable</Text>
                  </View>
              </View>
          </View>

          {/* About Section */}
          <View style={styles.contentSection}>
              <Text style={styles.sectionTitle}>About Me</Text>
              <Text style={styles.bodyText} numberOfLines={8}>
                 {provider.bio || (provider as any).about || 'I am a dedicated professional committed to delivering high-quality work. With years of experience in my field, I ensure customer satisfaction and reliable service.'}
              </Text>
          </View>

          {/* Reviews Section */}
          <View style={styles.contentSection}>
              <View style={styles.sectionHeaderRow}>
                 <Text style={styles.sectionTitle}>Recent Reviews</Text>
                 <TouchableOpacity>
                     <Text style={styles.linkText}>See All</Text>
                 </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, paddingHorizontal: 20 }}>
                  {[1, 2].map((_, i) => (
                      <View key={i} style={styles.reviewCard}>
                          <View style={styles.reviewHeader}>
                             <Image source={{ uri: `https://randomuser.me/api/portraits/men/${32+i}.jpg` }} style={styles.reviewerImg} />
                             <View>
                                 <Text style={styles.reviewerName}>Client Name</Text>
                                 <View style={{flexDirection:'row'}}>
                                     {[...Array(5)].map((_,j) => (
                                         <Ionicons key={j} name="star" size={12} color="#F59E0B" />
                                     ))}
                                 </View>
                             </View>
                          </View>
                          <Text style={styles.reviewText} numberOfLines={3}>
                             Excellent service! Arrived exactly on time and did a fantastic job. Would definitely hire again for future projects.
                          </Text>
                      </View>
                  ))}
              </ScrollView>
          </View>

      </ScrollView>

      {/* Sticky Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Starting from</Text>
              <Text style={styles.priceValue}>{getPriceDisplay()}</Text>
          </View>

          <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.chatBtn} onPress={() => (navigation as any).navigate('MainTabs', { screen: 'Chat' })}>
                  <Ionicons name="chatbubble-ellipses-outline" size={24} color={COLORS.primary} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                 style={styles.bookBtn}
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
                  <Text style={styles.bookBtnText}>Hire Now</Text>
              </TouchableOpacity>
          </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  headerContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    overflow: 'hidden',
    zIndex: 10,
    backgroundColor: '#eee',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  headerActions: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 20,
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  iconButton: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center', justifyContent: 'center',
    // backdropFilter not supported in RN usually
  },
  
  // Profile Content
  profileCard: {
      marginTop: Platform.OS === 'ios' ? 0 : 20,
      backgroundColor: '#fff',
      marginHorizontal: 16,
      borderRadius: 24,
      padding: 16,
      paddingTop: 60,
      alignItems: 'center',
      ...SHADOWS.md,
      marginBottom: 24,
  },
  avatarContainer: {
     position: 'absolute',
     top: -50,
     alignSelf: 'center',
     ...SHADOWS.md,
  },
  avatar: {
     width: 100,
     height: 100,
     borderRadius: 50,
     borderWidth: 4,
     borderColor: '#fff',
  },
  verifiedBadge: {
     position: 'absolute',
     bottom: 0, right: 0,
     backgroundColor: '#fff',
     borderRadius: 12,
  },
  infoCenter: {
     alignItems: 'center',
     marginBottom: 20,
  },
  name: {
     fontSize: 22,
     fontWeight: '800',
     color: '#111827',
     marginBottom: 4,
  },
  specialty: {
     fontSize: 14,
     color: COLORS.primary,
     fontWeight: '600',
     marginBottom: 12,
     textTransform: 'uppercase',
     letterSpacing: 0.5,
  },
  badgesRow: {
     flexDirection: 'row',
     gap: 8,
  },
  pillBadge: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: '#F3F4F6',
     paddingHorizontal: 12,
     paddingVertical: 6,
     borderRadius: 20,
     gap: 6,
  },
  pillText: {
     fontSize: 12,
     color: '#4B5563',
     fontWeight: '500',
  },
  statsGrid: {
     flexDirection: 'row',
     width: '100%',
     borderTopWidth: 1,
     borderTopColor: '#F3F4F6',
     paddingTop: 20,
  },
  statItem: {
     flex: 1,
     alignItems: 'center',
  },
  statDivider: {
     width: 1,
     height: 30,
     backgroundColor: '#E5E7EB',
  },
  statValue: {
     fontSize: 18,
     fontWeight: '700',
     color: '#111827',
  },
  statLabel: {
     fontSize: 12,
     color: '#6B7280',
     marginTop: 2,
  },

  // Content Sections
  contentSection: {
      paddingHorizontal: 20,
      marginBottom: 32,
  },
  sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
  },
  sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#111827',
      marginBottom: 8,
  },
  linkText: {
      fontSize: 14,
      color: COLORS.primary,
      fontWeight: '600',
  },
  bodyText: {
      fontSize: 15,
      lineHeight: 24,
      color: '#4B5563',
  },

  // Review Card
  reviewCard: {
      width: 280,
      backgroundColor: '#fff',
      padding: 16,
      borderRadius: 16,
      marginRight: 16,
      borderWidth: 1,
      borderColor: '#E5E7EB',
  },
  reviewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 12,
  },
  reviewerImg: {
      width: 40, height: 40,
      borderRadius: 20,
      backgroundColor: '#E5E7EB',
  },
  reviewerName: {
      fontSize: 14,
      fontWeight: '600',
      color: '#111827',
  },
  reviewText: {
      fontSize: 13,
      color: '#4B5563',
      lineHeight: 20,
  },

  // Footer
  footer: {
      position: 'absolute',
      bottom: 0, left: 0, right: 0,
      backgroundColor: '#fff',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: '#F3F4F6',
      ...SHADOWS.lg,
  },
  priceContainer: {
     flex: 1,
  },
  priceLabel: {
     fontSize: 12,
     color: '#6B7280',
  },
  priceValue: {
     fontSize: 20,
     fontWeight: '800',
     color: COLORS.primary,
  },
  actionButtons: {
     flexDirection: 'row',
     gap: 12,
  },
  chatBtn: {
     width: 50, height: 50,
     borderRadius: 16,
     borderWidth: 1,
     borderColor: '#E5E7EB',
     alignItems: 'center', justifyContent: 'center',
  },
  bookBtn: {
     backgroundColor: COLORS.primary,
     height: 50,
     paddingHorizontal: 32,
     borderRadius: 16,
     alignItems: 'center', justifyContent: 'center',
     ...SHADOWS.md,
  },
  bookBtnText: {
     color: '#fff',
     fontSize: 16,
     fontWeight: '700',
  },
});
