/**
 * Favorites Screen
 * 
 * Dynamic Liquid UI Edition.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  StatusBar,
  Animated,
  Dimensions,
  Easing
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getFavorites, removeFromFavorites, FavoriteProvider } from '../../utils/favoritesStorage';
import { haptics } from '../../utils/haptics';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../../components/Toast';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../../components/ui/Button';
import LottieView from 'lottie-react-native';
import { LottieAnimations } from '../../utils/lottieAnimations';

const { width, height } = Dimensions.get('window');

// DYNAMIC TRANSPARENT UI TOKENS (Matching ProfileScreen)
const DESIGN = {
  primary: '#3B82F6',           
  bg: '#FFFFFF', 
  glassBg: 'transparent', 
  glassBorder: 'rgba(148, 163, 184, 0.4)', // Subtle gray for better separation 
  text: '#0F172A',              
  textSecondary: '#334155',     
  textTertiary: '#64748B',      
  error: '#EF4444',
};

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export const FavoritesScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [favorites, setFavorites] = useState<FavoriteProvider[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast, showInfo, hideToast } = useToast();

  // Entrances
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Large Background Blobs
  const blob1X = useRef(new Animated.Value(0)).current;
  const blob1Y = useRef(new Animated.Value(0)).current;
  const blob2X = useRef(new Animated.Value(0)).current;
  const blob2Y = useRef(new Animated.Value(0)).current;
  const blob3X = useRef(new Animated.Value(0)).current;
  const blob3Y = useRef(new Animated.Value(0)).current;

  // Small Elements (Particles)
  const particle1X = useRef(new Animated.Value(0)).current;
  const particle1Y = useRef(new Animated.Value(0)).current;
  const particle1Scale = useRef(new Animated.Value(1)).current;
  const particle2X = useRef(new Animated.Value(0)).current;
  const particle2Y = useRef(new Animated.Value(0)).current;
  const particle3X = useRef(new Animated.Value(0)).current;
  const particle3Y = useRef(new Animated.Value(0)).current;
  const particle4X = useRef(new Animated.Value(0)).current;
  const particle4Y = useRef(new Animated.Value(0)).current;
  const particle5X = useRef(new Animated.Value(0)).current;
  const particle5Y = useRef(new Animated.Value(0)).current;
  const particle6X = useRef(new Animated.Value(0)).current;
  const particle6Y = useRef(new Animated.Value(0)).current;

  const loadFavorites = async () => {
    const favs = await getFavorites();
    setFavorites(favs);
    setIsLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
      return () => { };
    }, [])
  );

  useEffect(() => {
    // Entrance Animation
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true, easing: Easing.out(Easing.exp) }),
    ]).start();

    // Wandering Algorithms
    const generateRandomPos = () => ({
      x: (Math.random() * width * 2) - width * 0.5,
      y: (Math.random() * height * 2) - height * 0.5,
    });

    const generateParticlePos = () => ({
      x: Math.random() * width,
      y: Math.random() * height,
    });

    const startWander = (animX: Animated.Value, animY: Animated.Value, durationRange: [number, number], generator = generateRandomPos) => {
      const nextPos = generator();
      const duration = Math.random() * (durationRange[1] - durationRange[0]) + durationRange[0];
      
      Animated.parallel([
        Animated.timing(animX, { toValue: nextPos.x, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(animY, { toValue: nextPos.y, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ]).start(({ finished }) => {
        if (finished) startWander(animX, animY, durationRange, generator);
      });
    };

    const pulseParticle = () => {
      Animated.sequence([
        Animated.timing(particle1Scale, { toValue: 1.5, duration: 3000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(particle1Scale, { toValue: 1, duration: 3000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) })
      ]).start(({ finished }) => {
        if (finished) pulseParticle();
      });
    };

    // Fire large blobs
    startWander(blob1X, blob1Y, [5000, 9000]);
    startWander(blob2X, blob2Y, [6000, 11000]);
    startWander(blob3X, blob3Y, [4000, 8000]);
    
    // Fire small & medium particles (all circles)
    startWander(particle1X, particle1Y, [10000, 15000], generateParticlePos);
    startWander(particle2X, particle2Y, [12000, 18000], generateParticlePos);
    startWander(particle3X, particle3Y, [15000, 22000], generateParticlePos);
    startWander(particle4X, particle4Y, [18000, 25000], generateRandomPos); 
    startWander(particle5X, particle5Y, [14000, 20000], generateRandomPos); 
    startWander(particle6X, particle6Y, [16000, 24000], generateParticlePos); 
    
    pulseParticle();

    return () => {
      blob1X.stopAnimation(); blob1Y.stopAnimation();
      blob2X.stopAnimation(); blob2Y.stopAnimation();
      blob3X.stopAnimation(); blob3Y.stopAnimation();
      particle1X.stopAnimation(); particle1Y.stopAnimation(); particle1Scale.stopAnimation();
      particle2X.stopAnimation(); particle2Y.stopAnimation();
      particle3X.stopAnimation(); particle3Y.stopAnimation();
      particle4X.stopAnimation(); particle4Y.stopAnimation(); 
      particle5X.stopAnimation(); particle5Y.stopAnimation(); 
      particle6X.stopAnimation(); particle6Y.stopAnimation();
    };
  }, []);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadFavorites();
    haptics.success();
    setIsRefreshing(false);
  }, []);

  const handleRemoveFavorite = async (providerId: string) => {
    haptics.medium();
    await removeFromFavorites(providerId);
    setFavorites(prev => prev.filter(p => (p.id || p._id) !== providerId));
    showInfo('Removed from Favorites');
  };

  const renderProviderItem = ({ item, index }: { item: FavoriteProvider, index: number }) => {
    const providerImage = item.profileImage || item.avatar;
    const firstService = item.services && item.services.length > 0 ? item.services[0] : 'General Service';

    // Staggered entrance based on index
    const itemSlide = slideAnim.interpolate({
      inputRange: [0, 20],
      outputRange: [0, 20 + (index * 5)]
    });

    return (
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: itemSlide }] }}>
        <TouchableOpacity
          style={styles.transparentCard}
          onPress={() => {
            haptics.selection();
            navigation.navigate('ProviderPublicProfile', { provider: item });
          }}
          activeOpacity={0.7}
        >
          <View style={styles.itemContent}>
            {/* Avatar (Overlapping edge) */}
            <View style={styles.imageWrapper}>
              {providerImage ? (
                <Image source={{ uri: providerImage }} style={styles.avatar} />
              ) : (
                <View style={[styles.placeholderAvatar, { backgroundColor: DESIGN.bg }]}>
                  <Text style={[styles.placeholderText, { color: DESIGN.primary }]}>
                    {item.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            {/* Info */}
            <View style={styles.infoColumn}>
              <Text style={styles.nameText} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.serviceText} numberOfLines={1}>{firstService}</Text>

              <View style={styles.statsRow}>
                <View style={styles.statBadge}>
                  <Ionicons name="star" size={14} color="#D97706" />
                  <Text style={styles.ratingText}>{item.rating ? item.rating.toFixed(1) : 'New'}</Text>
                </View>
                <Text style={styles.reviewCount}>{item.totalReviews || 0} reviews</Text>
              </View>
            </View>

            {/* Action */}
            <TouchableOpacity
              style={styles.heartButton}
              onPress={(e) => {
                e.stopPropagation();
                handleRemoveFavorite(item.id || item._id || '')
              }}
            >
              <Ionicons name="heart" size={24} color={DESIGN.error} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return <LoadingSpinner visible={true} size="small" />;

    return (
      <Animated.View style={[styles.emptyContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <LottieView
          source={LottieAnimations.emptyCart}
          autoPlay
          loop
          style={{ width: 180, height: 180, marginBottom: 10 }}
        />
        <Text style={styles.emptyTitle}>No Favorites Yet</Text>
        <Text style={styles.emptySubtitle}>
          Save providers you love to access them quickly here.
        </Text>
        <View style={{ marginTop: 32 }}>
          <TouchableOpacity
            style={styles.findProvidersBtn}
            onPress={() => {
              haptics.medium();
              (navigation as any).navigate('MainTabs', { screen: 'Home' });
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.findProvidersText}>Explore Providers</Text>
            <Ionicons name="arrow-forward" size={20} color={DESIGN.primary} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* 🌊 DYNAMIC RANDOM BACKGROUND MESH + PARTICLES */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.bgBase} />
        
        {/* Large Blobs */}
        <Animated.View style={[styles.fluidBlob, { 
          backgroundColor: 'rgba(59, 130, 246, 0.15)', width: width * 1.2, height: width * 1.2,
          transform: [{ translateX: blob1X }, { translateY: blob1Y }] 
        }]} />
        <Animated.View style={[styles.fluidBlob, { 
          backgroundColor: 'rgba(139, 92, 246, 0.1)', width: width * 1.5, height: width * 1.5,
          transform: [{ translateX: blob2X }, { translateY: blob2Y }] 
        }]} />
        <Animated.View style={[styles.fluidBlob, { 
          backgroundColor: 'rgba(59, 130, 246, 0.12)', width: width * 0.8, height: width * 0.8,
          transform: [{ translateX: blob3X }, { translateY: blob3Y }] 
        }]} />

        {/* Small Elements (Micro-fluidity) */}
        <Animated.View style={[styles.smallParticle, { 
          width: 8, height: 8, borderRadius: 4, backgroundColor: DESIGN.primary, opacity: 0.3,
          transform: [{ translateX: particle1X }, { translateY: particle1Y }, { scale: particle1Scale }]
        }]} />
        <Animated.View style={[styles.smallParticle, { 
          width: 12, height: 12, borderRadius: 6, backgroundColor: 'rgba(139, 92, 246, 0.4)',
          transform: [{ translateX: particle2X }, { translateY: particle2Y }]
        }]} />
        <Animated.View style={[styles.smallParticle, { 
          width: 6, height: 6, borderRadius: 3, backgroundColor: DESIGN.primary, opacity: 0.2,
          transform: [{ translateX: particle3X }, { translateY: particle3Y }]
        }]} />
        <Animated.View style={[styles.smallParticle, { 
          width: 14, height: 14, borderRadius: 7, backgroundColor: 'rgba(59, 130, 246, 0.25)',
          transform: [{ translateX: particle4X }, { translateY: particle4Y }]
        }]} />
        <Animated.View style={[styles.smallParticle, { 
          width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(139, 92, 246, 0.3)',
          transform: [{ translateX: particle5X }, { translateY: particle5Y }]
        }]} />
        <Animated.View style={[styles.smallParticle, { 
          width: 8, height: 8, borderRadius: 4, backgroundColor: DESIGN.primary, opacity: 0.35,
          transform: [{ translateX: particle6X }, { translateY: particle6Y }]
        }]} />
      </View>

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={DESIGN.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favorites</Text>
        <View style={styles.headerBtn} /> 
      </View>

      <FlatList
        data={favorites}
        renderItem={renderProviderItem}
        keyExtractor={(item) => item.id || item._id || ''}
        contentContainerStyle={[
          styles.listContent,
          favorites.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={DESIGN.primary} />
        }
        showsVerticalScrollIndicator={false}
      />

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN.bg,
  },
  bgBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: DESIGN.bg,
  },
  fluidBlob: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 0.8, 
  },
  smallParticle: {
    position: 'absolute',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: DESIGN.text,
    letterSpacing: -0.5,
  },
  listContent: {
    paddingRight: 20,
    paddingLeft: 36, // Extra padding on left to make room for overlapping avatars
    paddingTop: 16,
    paddingBottom: 100,
  },
  listContentEmpty: {
    flexGrow: 1,
    paddingLeft: 20, // Reset when empty
  },

  // ✨ TRANSPARENT WIREFRAME CARDS
  transparentCard: {
    backgroundColor: DESIGN.glassBg, // Fully transparent
    marginBottom: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: DESIGN.glassBorder, // Subtle gray edge
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingRight: 16,
    paddingLeft: 0, // Avatar handles left spacing
  },
  imageWrapper: {
    marginLeft: -26, // Pulls the avatar leftward, breaking the card boundary!
    marginRight: 16,
    shadowColor: '#000', 
    shadowOffset: { width: 4, height: 6 }, 
    shadowOpacity: 0.12, 
    shadowRadius: 10, 
    elevation: 6, // 3D shadow for the avatar popping out
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  placeholderAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 26,
    fontWeight: '800',
  },
  infoColumn: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  nameText: {
    fontSize: 17,
    fontWeight: '800',
    color: DESIGN.text,
    letterSpacing: -0.3,
  },
  serviceText: {
    fontSize: 14,
    fontWeight: '600',
    color: DESIGN.primary, // Brand pop
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#D97706',
  },
  reviewCount: {
    fontSize: 13,
    fontWeight: '600',
    color: DESIGN.textTertiary,
  },
  heartButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.5)', // Glassy button
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },

  // 📭 Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: DESIGN.text,
    marginTop: 16,
    letterSpacing: -0.5,
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: DESIGN.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  findProvidersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 9999, // Pill shape
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,1)',
    shadowColor: DESIGN.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  findProvidersText: {
    fontSize: 16,
    fontWeight: '800',
    color: DESIGN.primary,
    marginRight: 6,
    letterSpacing: -0.3,
  },
});
