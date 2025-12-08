import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS } from '../../utils/theme';

interface ServiceOverviewCardProps {
  description: string;
  startingPrice: string;
  providerCount: number;
}

export const ServiceOverviewCard: React.FC<ServiceOverviewCardProps> = ({
  description,
  startingPrice,
  providerCount,
}) => {
  return (
    <View style={styles.card}>
      {/* Description */}
      <Text style={styles.description}>{description}</Text>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        {/* Price Badge */}
        <View style={styles.statItem}>
          <View style={styles.iconBadge}>
            <Ionicons name="cash-outline" size={18} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.statLabel}>Starting from</Text>
            <Text style={styles.statValue}>{startingPrice}</Text>
          </View>
        </View>

        {/* Provider Count Badge */}
        <View style={styles.statItem}>
          <View style={styles.iconBadge}>
            <Ionicons name="people-outline" size={18} color={COLORS.success} />
          </View>
          <View>
            <Text style={styles.statLabel}>Professionals</Text>
            <Text style={styles.statValue}>{providerCount} available</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: 16,
    marginHorizontal: 16,
    marginTop: -40,
    ...SHADOWS.lg,
    elevation: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.medium,
    padding: 12,
    gap: 10,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
});
