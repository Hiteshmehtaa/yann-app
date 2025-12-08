import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../utils/theme';

interface SavedAddress {
  _id: string;
  name: string;
  phone: string;
  fullAddress: string;
  label: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

interface SavedAddressCardProps {
  selectedAddress: SavedAddress | null;
  onSelectAddress: () => void;
  onChangeAddress: () => void;
  error?: string;
  containerStyle?: ViewStyle;
}

export const SavedAddressCard: React.FC<SavedAddressCardProps> = ({
  selectedAddress,
  onSelectAddress,
  onChangeAddress,
  error,
  containerStyle,
}) => {
  const getIconName = (label: string): keyof typeof Ionicons.glyphMap => {
    if (label === 'Home') return 'home';
    if (label === 'Work') return 'briefcase';
    return 'location';
  };

  if (!selectedAddress) {
    return (
      <View style={[styles.container, containerStyle]}>
        <TouchableOpacity
          style={[styles.selectButton, error && styles.selectButtonError]}
          onPress={onSelectAddress}
          activeOpacity={0.7}
        >
          <View style={styles.selectIconContainer}>
            <Ionicons name="bookmark-outline" size={28} color={COLORS.primary} />
          </View>
          <View style={styles.selectContent}>
            <Text style={styles.selectTitle}>Select Saved Address</Text>
            <Text style={styles.selectSubtitle}>
              Choose from your saved addresses or add new
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={COLORS.textTertiary} />
        </TouchableOpacity>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.selectedCard}>
        {/* Header with label and change button */}
        <View style={styles.selectedHeader}>
          <View style={styles.labelBadge}>
            <Ionicons
              name={getIconName(selectedAddress.label)}
              size={14}
              color={COLORS.primary}
            />
            <Text style={styles.labelText}>{selectedAddress.label}</Text>
          </View>
          <TouchableOpacity
            style={styles.changeButton}
            onPress={onChangeAddress}
            activeOpacity={0.7}
          >
            <Text style={styles.changeButtonText}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* Name */}
        <Text style={styles.selectedName}>{selectedAddress.name}</Text>

        {/* Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="call" size={16} color={COLORS.primary} />
            </View>
            <Text style={styles.detailText}>{selectedAddress.phone}</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="location" size={16} color={COLORS.primary} />
            </View>
            <Text style={styles.detailText} numberOfLines={2}>
              {selectedAddress.fullAddress}
            </Text>
          </View>

          {selectedAddress.coordinates && (
            <View style={styles.coordinatesTag}>
              <Ionicons name="navigate" size={12} color={COLORS.success} />
              <Text style={styles.coordinatesText}>Location verified</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.large,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    padding: SPACING.lg,
    gap: SPACING.md,
    ...SHADOWS.sm,
  },
  selectButtonError: {
    borderColor: COLORS.error,
  },
  selectIconContainer: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.medium,
    backgroundColor: `${COLORS.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectContent: {
    flex: 1,
  },
  selectTitle: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  selectSubtitle: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  selectedCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.large,
    borderWidth: 1,
    borderColor: COLORS.primary,
    padding: SPACING.lg,
    ...SHADOWS.md,
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  labelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    gap: 6,
  },
  labelText: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  changeButton: {
    backgroundColor: `${COLORS.primary}10`,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.medium,
  },
  changeButtonText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '700',
    color: COLORS.primary,
  },
  selectedName: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  detailsContainer: {
    gap: SPACING.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  detailIconContainer: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.small,
    backgroundColor: `${COLORS.primary}08`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailText: {
    flex: 1,
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
    lineHeight: 20,
    paddingTop: 6,
  },
  coordinatesTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: `${COLORS.success}15`,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    gap: 4,
    marginTop: SPACING.xs,
  },
  coordinatesText: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '600',
    color: COLORS.success,
  },
  errorText: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
    marginLeft: SPACING.sm,
    fontWeight: '500',
  },
});
