import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../utils/theme';
import type { ServiceProvider } from '../../types';

interface ProviderListCardProps {
  provider: ServiceProvider;
  isSelected: boolean;
  onSelect: () => void;
}

export const ProviderListCard: React.FC<ProviderListCardProps> = ({
  provider,
  isSelected,
  onSelect,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  const price = (provider as any).priceForService || 0;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardSelected]}
        onPress={onSelect}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {/* Left: Avatar */}
        <View style={[styles.avatar, isSelected && styles.avatarSelected]}>
          <Text style={[styles.avatarText, isSelected && styles.avatarTextSelected]}>
            {provider.name?.charAt(0).toUpperCase() || 'P'}
          </Text>
        </View>

        {/* Middle: Info */}
        <View style={styles.info}>
          <Text style={styles.name}>{provider.name}</Text>
          
          {/* Rating & Experience Row */}
          <View style={styles.metaRow}>
            <Ionicons name="star" size={12} color={COLORS.warning} />
            <Text style={styles.ratingText}>
              {provider.rating?.toFixed(1) || '0.0'}
            </Text>
            <View style={styles.dot} />
            <Text style={styles.experienceText}>
              {provider.experience || 0} yrs exp
            </Text>
          </View>
        </View>

        {/* Right: Price & Select */}
        <View style={styles.right}>
          {price > 0 && (
            <Text style={styles.price}>₹{price}</Text>
          )}
          <View style={[styles.selectButton, isSelected && styles.selectButtonActive]}>
            {isSelected ? (
              <Ionicons name="checkmark" size={18} color={COLORS.white} />
            ) : (
              <Text style={[styles.selectText, isSelected && styles.selectTextActive]}>
                Select
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    ...SHADOWS.sm,
  },
  cardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
    ...SHADOWS.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarSelected: {
    backgroundColor: COLORS.primary,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  avatarTextSelected: {
    color: COLORS.white,
  },
  info: {
    flex: 1,
    marginLeft: 14,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.warning,
    marginLeft: 3,
  },
  dot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: COLORS.textTertiary,
    marginHorizontal: 8,
  },
  experienceText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  right: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.success,
    letterSpacing: -0.3,
  },
  selectButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '10',
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectButtonActive: {
    backgroundColor: COLORS.primary,
  },
  selectText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  selectTextActive: {
    color: COLORS.white,
  },
});
