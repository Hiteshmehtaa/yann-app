import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, ANIMATIONS } from '../../utils/theme';

// Service-specific image/illustration mapping
// Using Ionicons as illustration base + gradient backgrounds
// In production, replace with actual images from assets or remote URLs
const SERVICE_THEMES: Record<string, {
  icon: keyof typeof Ionicons.glyphMap;
  gradient: string[];
  accent: string;
  illustration?: string; // Future: Add actual image URLs
}> = {
  'House Cleaning': {
    icon: 'sparkles',
    gradient: ['#667eea', '#764ba2'],
    accent: '#667eea',
  },
  'Deep Cleaning': {
    icon: 'water',
    gradient: ['#11998e', '#38ef7d'],
    accent: '#11998e',
  },
  'Bathroom Cleaning': {
    icon: 'fitness',
    gradient: ['#4facfe', '#00f2fe'],
    accent: '#4facfe',
  },
  'Laundry Services': {
    icon: 'shirt',
    gradient: ['#fa709a', '#fee140'],
    accent: '#fa709a',
  },
  'Pet Care': {
    icon: 'paw',
    gradient: ['#ffecd2', '#fcb69f'],
    accent: '#ff9a76',
  },
  'Pujari Services': {
    icon: 'flower',
    gradient: ['#ff9a9e', '#fecfef'],
    accent: '#ff9a9e',
  },
  'Full-Day Personal Driver': {
    icon: 'car-sport',
    gradient: ['#30cfd0', '#330867'],
    accent: '#30cfd0',
  },
  'Personal Assistant': {
    icon: 'briefcase',
    gradient: ['#a8edea', '#fed6e3'],
    accent: '#a8edea',
  },
  'Garden & Landscaping': {
    icon: 'leaf',
    gradient: ['#56ab2f', '#a8e063'],
    accent: '#56ab2f',
  },
  'Repairs & Maintenance': {
    icon: 'construct',
    gradient: ['#ff6b6b', '#feca57'],
    accent: '#ff6b6b',
  },
  'Delivery Services': {
    icon: 'bicycle',
    gradient: ['#f093fb', '#f5576c'],
    accent: '#f093fb',
  },
};

type ServiceHeroHeaderProps = {
  serviceTitle: string;
  rating?: number;
  reviewCount?: number;
  height?: number;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const ServiceHeroHeader: React.FC<ServiceHeroHeaderProps> = ({
  serviceTitle,
  rating = 4.8,
  reviewCount = 256,
  height = 320,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Get theme for this service (fallback to primary theme)
  const theme = SERVICE_THEMES[serviceTitle] || {
    icon: 'home-outline' as keyof typeof Ionicons.glyphMap,
    gradient: [COLORS.primary, COLORS.primaryGradientEnd],
    accent: COLORS.primary,
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: ANIMATIONS.verySlow,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: ANIMATIONS.verySlow,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { height }]}>
      {/* Gradient Background with Service-Specific Colors */}
      <LinearGradient
        colors={[theme.gradient[0], theme.gradient[1]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Decorative Pattern Overlay */}
      <View style={styles.patternOverlay}>
        <Animated.View 
          style={[
            styles.decorativeCircle, 
            styles.circle1,
            { 
              opacity: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.1],
              }),
            },
          ]} 
        />
        <Animated.View 
          style={[
            styles.decorativeCircle, 
            styles.circle2,
            { 
              opacity: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.08],
              }),
            },
          ]} 
        />
      </View>

      {/* Content - Title, Rating (NO ICON) */}
      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Service Title */}
        <Text style={styles.title} numberOfLines={2}>
          {serviceTitle}
        </Text>

        {/* Rating Row */}
        <View style={styles.ratingRow}>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={18} color={COLORS.warning} />
            <Text style={styles.ratingText}>{rating}</Text>
          </View>
          <Text style={styles.reviewText}>({(reviewCount ?? 0).toLocaleString()} reviews)</Text>
        </View>

        {/* Verified Badge */}
        <View style={styles.verifiedBadge}>
          <Ionicons name="shield-checkmark" size={14} color={COLORS.success} />
          <Text style={styles.verifiedText}>VERIFIED SERVICE</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    position: 'relative',
    overflow: 'hidden',
  },
  patternOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: COLORS.white,
  },
  circle1: {
    width: 300,
    height: 300,
    top: -150,
    right: -100,
  },
  circle2: {
    width: 200,
    height: 200,
    bottom: -80,
    left: -60,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: SPACING.xl,
    paddingBottom: SPACING.xxl,
    paddingTop: 80, // Space for back button
  },
  title: {
    fontSize: TYPOGRAPHY.size.xxxl + 4,
    fontWeight: '900',
    color: COLORS.white,
    marginBottom: SPACING.sm,
    letterSpacing: -1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  ratingText: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  reviewText: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '500',
    color: COLORS.white,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(39, 192, 125, 0.15)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(39, 192, 125, 0.3)',
  },
  verifiedText: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 1,
  },
});
