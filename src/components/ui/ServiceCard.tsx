import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, Image, ImageSourcePropType } from 'react-native';
import { SPACING, RADIUS } from '../../utils/theme';
import { ServiceIcon } from '../icons/ServiceIcon';

type ServiceCardProps = {
  title: string;
  price: string;
  icon?: string;
  iconImage?: ImageSourcePropType;
  IconComponent?: React.FC<{ size?: number; color?: string }>;
  popular?: boolean;
  partnerCount?: number;
  isComingSoon?: boolean;
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
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={isComingSoon ? 1 : 0.7}
      style={[styles.container, isComingSoon && styles.comingSoonContainer, style]}
      disabled={isComingSoon}
    >
      {/* Icon Container - Simple like the image */}
      <View style={[styles.iconContainer, isComingSoon && styles.comingSoonIcon]}>
        {iconImage ? (
          <Image 
            source={iconImage} 
            style={[styles.iconImage, isComingSoon && { opacity: 0.5 }]} 
            resizeMode="contain"
          />
        ) : (
          <ServiceIcon size={40} color={isComingSoon ? '#999' : undefined} />
        )}
      </View>

      {/* Title - Simple and centered */}
      <Text style={[styles.title, isComingSoon && styles.comingSoonText]} numberOfLines={2}>
        {title}
      </Text>
      
      {/* Coming Soon Badge */}
      {isComingSoon && (
        <View style={styles.comingSoonBadge}>
          <Text style={styles.comingSoonBadgeText}>Coming Soon</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.large,
  },
  comingSoonContainer: {
    backgroundColor: '#F5F5F5',
    opacity: 0.6,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.medium,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  comingSoonIcon: {
    backgroundColor: '#E5E5E5',
  },
  iconImage: {
    width: 40,
    height: 40,
  },
  title: {
    fontSize: 11,
    fontWeight: '500',
    color: '#000',
    textAlign: 'center',
    lineHeight: 14,
  },
  comingSoonText: {
    color: '#999',
  },
  comingSoonBadge: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
  },
  comingSoonBadgeText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
  },
});
