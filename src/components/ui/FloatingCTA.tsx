import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS, SHADOWS } from '../../utils/theme';

interface FloatingCTAProps {
  providerName?: string;
  price: string;
  selectedProviderPrice?: number;
  onPress: () => void;
  disabled?: boolean;
}

export const FloatingCTA: React.FC<FloatingCTAProps> = ({
  providerName,
  price,
  selectedProviderPrice,
  onPress,
  disabled = false,
}) => {
  const slideAnim = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      <LinearGradient
        colors={['rgba(248, 248, 248, 0)', COLORS.background]}
        style={styles.gradient}
      >
        <SafeAreaView edges={['bottom']} style={styles.safeArea}>
          <View style={styles.content}>
            {/* Left: Price Info */}
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>
                {selectedProviderPrice ? 'Provider charge is' : 'Starting from'}
              </Text>
              <Text style={styles.price}>
                {selectedProviderPrice ? `₹${selectedProviderPrice}` : price}
              </Text>
            </View>

            {/* Right: CTA Button */}
            <TouchableOpacity
              style={[styles.button, disabled && styles.buttonDisabled]}
              onPress={onPress}
              disabled={disabled}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={disabled ? [COLORS.border, COLORS.border] : [COLORS.primary, COLORS.primaryGradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>
                  {providerName ? `Continue with ${providerName.split(' ')[0]}` : 'Book Now'}
                </Text>
                <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  gradient: {
    paddingTop: 16,
  },
  safeArea: {
    backgroundColor: 'transparent',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xlarge,
    borderTopRightRadius: RADIUS.xlarge,
    ...SHADOWS.lg,
    elevation: 12,
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginBottom: 2,
  },
  price: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  button: {
    borderRadius: RADIUS.medium,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 8,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
});
