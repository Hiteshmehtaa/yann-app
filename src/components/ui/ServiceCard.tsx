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
    opacity: 0.6,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.medium,
    padding: SPACING.sm,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: RADIUS.medium,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  serviceImage: {
    width: '80%',
    height: '80%',
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1C1E',
    textAlign: 'center',
    lineHeight: 16,
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
