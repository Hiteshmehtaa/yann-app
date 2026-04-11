import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, Image, ImageSourcePropType, Animated, Platform } from 'react-native';
import { COLORS } from '../../utils/theme';
import { ServiceIcon } from '../icons/ServiceIcon';
import { haptics } from '../../utils/haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

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
  variant?: 'list' | 'grid';
};

export const ServiceCard = React.memo<ServiceCardProps>(({
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
  variant = 'list',
}) => {
  const { colors, isDark } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!isComingSoon) {
      haptics.light();
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        tension: 100,
        friction: 10,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 10,
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
      style={[style, variant === 'grid' && styles.gridContainer]}
      disabled={isComingSoon}
    >
      <Animated.View style={[
        variant === 'grid' ? styles.gridCard : styles.rowCard,
        { 
          transform: [{ scale: scaleAnim }],
          ...(variant === 'list' ? { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' } : {}),
          opacity: isComingSoon ? 0.5 : 1,
          backgroundColor: variant === 'grid' ? (isDark ? '#1F2937' : '#FFFFFF') : 'transparent',
          // Use very light, thin border instead of heavy shadow
          borderColor: variant === 'grid' ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.03)') : 'transparent',
          borderWidth: variant === 'grid' ? 1.5 : 0,
        }
      ]}>
        
        {/* Grid Badge */}
        {variant === 'grid' && (
          <View style={styles.gridBadgeContainer}>
            <View style={[styles.gridBadgeDot, { backgroundColor: isComingSoon ? '#EF4444' : '#10B981' }]} />
            <Text style={styles.gridBadgeText}>
              {isComingSoon 
                ? 'Coming Soon' 
                : `${partnerCount} Partner${partnerCount !== 1 ? 's' : ''}`
              }
            </Text>
          </View>
        )}

        {/* Icon */}
        <View style={[
          variant === 'grid' ? styles.gridIconContainer : styles.iconContainer, 
          { backgroundColor: variant === 'grid' ? 'transparent' : (isDark ? 'rgba(255,255,255,0.03)' : '#F3F4F6') }
        ]}>
          {iconImage ? (
            <Image
              source={iconImage}
              style={variant === 'grid' ? styles.gridServiceImage : styles.serviceImage}
              resizeMode="contain"
            />
          ) : icon && typeof icon === 'string' && icon.length < 5 ? (
            <Text style={variant === 'grid' ? styles.gridEmojiIcon : styles.emojiIcon}>{icon}</Text>
          ) : (
            <ServiceIcon
              size={variant === 'grid' ? 48 : 24}
              color={isDark ? '#E5E7EB' : '#374151'}
            />
          )}
        </View>

        {/* Text Content */}
        <View style={variant === 'grid' ? styles.gridTextContent : styles.textContent}>
          <View style={variant === 'grid' ? styles.gridTitleRow : styles.titleRow}>
            <Text 
              style={[variant === 'grid' ? styles.gridTitle : styles.title, { color: isDark ? '#FFFFFF' : '#111827' }]}
              numberOfLines={variant === 'grid' ? 2 : 1}
            >
              {title}
            </Text>
            {isNew && !isComingSoon && variant === 'list' && (
              <View style={styles.newPill}>
                <Text style={styles.newText}>NEW</Text>
              </View>
            )}
          </View>
          
          {variant === 'list' && (
            <Text 
              style={[styles.subtitle, { color: isDark ? 'rgba(255,255,255,0.5)' : '#6B7280' }]}
              numberOfLines={1}
            >
              {isComingSoon 
                ? 'Available Soon' 
                : partnerCount > 0 
                  ? `${partnerCount} providers`
                  : 'Explore services'
              }
            </Text>
          )}
        </View>

        {/* Right Arrow for list variant */}
        {variant === 'list' && (
          <View style={styles.rightContent}>
            <Ionicons 
              name="chevron-forward" 
              size={18} 
              color={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'} 
            />
          </View>
        )}

      </Animated.View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  serviceImage: {
    width: 28,
    height: 28,
  },
  emojiIcon: {
    fontSize: 24,
  },
  textContent: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '400',
  },
  newPill: {
    marginLeft: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#10B981',
  },
  rightContent: {
    paddingLeft: 12,
  },
  // Grid Variant Styles
  gridContainer: {
    width: '100%',
  },
  gridCard: {
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 24, // Sightly softer round corners are nicer without shadows
    minHeight: 180,
    // Removed harsh shadow/elevation
  },
  gridBadgeContainer: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(243, 244, 246, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 2,
  },
  gridBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  gridBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#374151',
  },
  gridIconContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24, // Space for the absolute badge
    marginBottom: 16,
  },
  gridServiceImage: {
    width: 70,
    height: 70,
  },
  gridEmojiIcon: {
    fontSize: 48,
  },
  gridTextContent: {
    alignItems: 'center',
    width: '100%',
  },
  gridTitleRow: {
    alignItems: 'center',
    width: '100%',
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
});
