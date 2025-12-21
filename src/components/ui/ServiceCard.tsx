import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, Image, ImageSourcePropType } from 'react-native';
import { SPACING, RADIUS, SHADOWS } from '../../utils/theme';
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
      {/* Card with white background and shadow */}
      <View style={styles.card}>
        {/* Image Container with rounded background */}
        <View style={styles.imageContainer}>
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

        {/* Title - Bold and clear */}
        <Text style={[styles.title, isComingSoon && styles.comingSoonText]} numberOfLines={2}>
          {title}
        </Text>
        
        {/* Coming Soon Badge */}
        {isComingSoon && (
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonBadgeText}>Coming Soon</Text>
          </View>
        )}
      </View>
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
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xlarge, // More rounded
    padding: SPACING.md, // Increased padding
    alignItems: 'center',
    // Stronger shadow for "Pop" effect
    ...SHADOWS.md,
    height: 140, // Fixed height for uniformity
    justifyContent: 'space-between',
  },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: SPACING.xs,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F6FF', // Soft blue tint
  },
  serviceImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1C1E',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 4,
  },
  comingSoonText: {
    color: '#999',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 6,
  },
  comingSoonBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFF',
    textTransform: 'uppercase',
  },
});
