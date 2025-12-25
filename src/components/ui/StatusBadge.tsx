import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../utils/theme';

interface StatusBadgeProps {
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  animated?: boolean;
}

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    icon: 'time-outline' as const,
  },
  confirmed: {
    label: 'Confirmed',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    icon: 'checkmark-circle-outline' as const,
  },
  in_progress: {
    label: 'In Progress',
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
    icon: 'hourglass-outline' as const,
  },
  completed: {
    label: 'Completed',
    color: '#10B981',
    bgColor: '#D1FAE5',
    icon: 'checkmark-done-circle-outline' as const,
  },
  cancelled: {
    label: 'Cancelled',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    icon: 'close-circle-outline' as const,
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'medium',
  showIcon = true,
  animated = true,
}) => {
  const config = STATUS_CONFIG[status];
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (animated && status === 'in_progress') {
      // Pulse animation for in-progress status
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [status, animated]);

  const sizeStyles = {
    small: { paddingHorizontal: 8, paddingVertical: 4, fontSize: 11 },
    medium: { paddingHorizontal: 12, paddingVertical: 6, fontSize: 13 },
    large: { paddingHorizontal: 16, paddingVertical: 8, fontSize: 14 },
  };

  const iconSizes = {
    small: 14,
    medium: 16,
    large: 18,
  };

  return (
    <Animated.View
      style={[
        styles.badge,
        {
          backgroundColor: config.bgColor,
          paddingHorizontal: sizeStyles[size].paddingHorizontal,
          paddingVertical: sizeStyles[size].paddingVertical,
          transform: status === 'in_progress' && animated ? [{ scale: pulseAnim }] : [],
        },
      ]}
    >
      {showIcon && (
        <Ionicons
          name={config.icon}
          size={iconSizes[size]}
          color={config.color}
          style={styles.icon}
        />
      )}
      <Text
        style={[
          styles.label,
          {
            color: config.color,
            fontSize: sizeStyles[size].fontSize,
          },
        ]}
      >
        {config.label}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  label: {
    fontWeight: '600',
  },
});
