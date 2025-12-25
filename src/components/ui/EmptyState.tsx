import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import { AnimatedTouchable } from './AnimatedTouchable';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  illustration?: any; // For custom illustrations
}

/**
 * Enhanced empty state component with optional action button
 * Provides better UX for empty screens
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'file-tray-outline',
  title,
  description,
  actionLabel,
  onAction,
  illustration,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        {illustration ? (
          <Image source={illustration} style={styles.illustration} resizeMode="contain" />
        ) : (
          <Ionicons name={icon} size={64} color={COLORS.textTertiary} />
        )}
      </View>
      
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      {actionLabel && onAction && (
        <AnimatedTouchable
          onPress={onAction}
          style={styles.actionButton}
          hapticFeedback="medium"
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </AnimatedTouchable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxxl,
    paddingVertical: SPACING.xxxl * 2,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  illustration: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 25,
    marginTop: SPACING.md,
  },
  actionText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
