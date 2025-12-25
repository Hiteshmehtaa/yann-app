import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, Image, ImageSourcePropType, Animated } from 'react-native';
import { SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import { ServiceIcon } from '../icons/ServiceIcon';
import { Badge } from './Badge';
import { haptics } from '../../utils/haptics';
import { useTheme } from '../../contexts/ThemeContext';

type ServiceCardProps = {
  title: string;
  price: string;
  icon?: string;
  iconImage?: ImageSourcePropType;
  IconComponent?: React.FC<{ size?: number; color?: string }>;
  popular?: boolean;
  partnerCount?: number;
  isComingSoon?: boolean;
  isNew?: boolean;
  onPress: () => void;
  style?: ViewStyle;
};



export const ServiceCard: React.FC<ServiceCardProps> = ({
  title,
  price,
  icon,
  iconImage,
  IconComponent,
  popular = false,
  partnerCount = 0,
  isComingSoon = false,
  isNew = false,
  onPress,
  style,
}) => {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Partner Count Logic
  const displayCount = partnerCount > 2 ? '2+' : partnerCount;
  const showCount = partnerCount > 0 && !isComingSoon;

  const handlePressIn = () => {
    if (!isComingSoon) {
      haptics.light();
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (!isComingSoon) {
      haptics.medium();
      onPress();
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={[styles.container, isComingSoon && styles.comingSoonContainer, style]}
      disabled={isComingSoon}
    >
      <Animated.View style={[
        styles.card, 
        { 
          backgroundColor: colors.cardBg,
          transform: [{ scale: scaleAnim }],
          shadowColor: colors.text, // Adapt shadow color
        }
      ]}>
        {/* Partner Count Badge - Top Left */}
        {showCount && (
          <View style={[styles.partnerCountBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.partnerCountText}>{displayCount}</Text>
          </View>
        )}

        {/* Image Container */}
        <View style={[styles.imageContainer, { backgroundColor: isComingSoon ? colors.gray100 : colors.primaryLight }]}>
          {iconImage ? (
            <Image 
              source={iconImage} 
              style={[styles.serviceImage, isComingSoon && { opacity: 0.5 }]} 
              resizeMode="cover"
            />
          ) : (
            <ServiceIcon size={60} color={isComingSoon ? '#999' : undefined} />
          )}
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.text }, isComingSoon && { color: colors.textTertiary }]} numberOfLines={2}>
          {title}
        </Text>
        
        {/* Badges - Top Right Stack */}
        <View style={styles.badgesContainer}>
          {isNew && !isComingSoon && (
            <View style={styles.badgeWrapper}>
              <Badge variant="new" />
            </View>
          )}
          
          {popular && !isComingSoon && !isNew && (
            <View style={styles.badgeWrapper}>
              <Badge variant="popular" />
            </View>
          )}
          
          {isComingSoon && (
            <View style={styles.badgeWrapper}>
              <Badge variant="coming-soon" />
            </View>
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  comingSoonContainer: {
    opacity: 0.7,
  },
  card: {
    borderRadius: RADIUS.xlarge,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.md,
    height: 150, // Increased slightly for spacing
    justifyContent: 'space-between',
    position: 'relative',
  },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: SPACING.xs,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8, // Space for top badges
  },
  serviceImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 4,
  },
  badgesContainer: {
    position: 'absolute',
    top: 6,
    right: 6,
    alignItems: 'flex-end',
    gap: 4,
  },
  badgeWrapper: {
    // scale down slightly if multiple
  },
  partnerCountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 20, // Circular or small bubble
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  partnerCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFF',
  },
});
