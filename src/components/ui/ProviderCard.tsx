/**
 * Provider Card Component
 * Detailed provider card inspired by Design 2
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../utils/theme';
import { StarIcon, LocationIcon, VerifiedBadgeIcon, PhoneIcon } from '../icons';

interface ProviderCardProps {
  name: string;
  avatar?: ImageSourcePropType | string;
  rating: number;
  reviewCount: number;
  distance?: string;
  price: string;
  isVerified?: boolean;
  isTopRated?: boolean;
  isAvailable?: boolean; // Added optional prop
  specialties?: string[];
  bio?: string;
  status?: string; // Added for pending/inactive check
  onPress: () => void;
  onCall?: () => void;
}

export const ProviderCard = React.memo<ProviderCardProps>(({
  name,
  avatar,
  rating,
  reviewCount,
  distance,
  price,
  isVerified = false,
  isTopRated = false,
  isAvailable: isAvailableProp = true, // Default to true
  specialties,
  bio,
  status, // Pass status
  onPress,
  onCall,
  ...props
}) => {
  const bioOffline = (bio && bio.includes('[OFFLINE]'));
  const isAvailable = status === 'active' || (!status && !bioOffline);
  const isPending = status === 'pending';

  let statusText = 'Currently Unavailable';
  if (isPending) statusText = 'Approval Pending';
  else if (status === 'inactive' || bioOffline) statusText = 'Currently Offline';

  const isOffline = !isAvailable;

  return (
    <TouchableOpacity
      activeOpacity={!isOffline ? 0.9 : 1}
      onPress={!isOffline ? onPress : undefined} // Disable press if unavailable
      style={[styles.container, isOffline && styles.containerDisabled]}
    >
      {/* Offline Overlay */}
      {isOffline && (
        <View style={styles.offlineOverlay}>
          <View style={styles.offlineMessageContainer}>
            <Text style={[styles.offlineTitle, isPending && { color: COLORS.warning }]}>
              {statusText}
            </Text>
            <Text style={styles.offlineSubtitle}>
              {isPending ? 'Verified soon' : 'Please try again later'}
            </Text>
          </View>
        </View>
      )}

      {/* Top Badges */}
      <View style={[styles.badges, !computedIsAvailable && { opacity: 0.5 }]}>
        {isVerified && (
          <View style={[styles.badge, { backgroundColor: `${COLORS.success}15` }]}>
            <VerifiedBadgeIcon size={12} color={COLORS.success} />
            <Text style={[styles.badgeText, { color: COLORS.success }]}>Verified</Text>
          </View>
        )}
        {isTopRated && (
          <View style={[styles.badge, { backgroundColor: `${COLORS.warning}15` }]}>
            <StarIcon size={12} color={COLORS.warning} filled />
            <Text style={[styles.badgeText, { color: COLORS.warning }]}>Top Rated</Text>
          </View>
        )}
      </View>

      {/* Provider Info */}
      <View style={[styles.content, !computedIsAvailable && { opacity: 0.4 }]}>
        {/* Avatar and Name */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {avatar ? (
              <Image source={typeof avatar === 'string' ? { uri: avatar } : avatar} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </View>

          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>

            {/* Rating */}
            <View style={styles.rating}>
              <StarIcon size={14} color={COLORS.warning} filled />
              <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
              <Text style={styles.reviewCount}>({reviewCount} reviews)</Text>
            </View>

            {/* Distance */}
            {distance && (
              <View style={styles.distance}>
                <LocationIcon size={14} color={COLORS.textTertiary} />
                <Text style={styles.distanceText}>{distance}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Specialties */}
        {specialties && specialties.length > 0 && (
          <View style={styles.specialties}>
            {specialties.slice(0, 3).map((specialty) => (
              <View key={specialty} style={styles.specialtyTag}>
                <Text style={styles.specialtyText}>{specialty}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Starting at</Text>
            <Text style={styles.price}>{price}</Text>
          </View>

          {onCall && computedIsAvailable && ( // Hide call button if unavailable
            <TouchableOpacity
              onPress={onCall}
              style={styles.callButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <PhoneIcon size={18} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.large,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  badges: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.small,
    gap: 4,
  },
  badgeText: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: TYPOGRAPHY.weight.semibold,
  },
  content: {
    gap: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    marginRight: SPACING.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.white,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: COLORS.text,
  },
  reviewCount: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textTertiary,
  },
  distance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textTertiary,
  },
  specialties: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  specialtyTag: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.small,
  },
  specialtyText: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weight.medium,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textTertiary,
    marginBottom: 2,
  },
  price: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.primary,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  containerDisabled: {
    backgroundColor: COLORS.gray100, // Gray background when offline
    borderColor: COLORS.divider,
    borderWidth: 1,
  },
  offlineOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offlineMessageContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  offlineTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  offlineSubtitle: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
});
