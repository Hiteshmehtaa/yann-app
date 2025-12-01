import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Svg, { Path, Circle, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { COLORS } from '../utils/theme';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  variant?: 'default' | 'white' | 'dark';
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 'medium', 
  showText = true,
  variant = 'default' 
}) => {
  const dimensions = {
    small: { icon: 28, text: 18 },
    medium: { icon: 36, text: 24 },
    large: { icon: 48, text: 32 },
  };

  const { icon, text } = dimensions[size];
  
  const colors = {
    default: {
      primary: COLORS.primary,
      accent: COLORS.accent,
      text: COLORS.text,
    },
    white: {
      primary: '#FFFFFF',
      accent: '#FFFFFF',
      text: '#FFFFFF',
    },
    dark: {
      primary: COLORS.text,
      accent: COLORS.primary,
      text: COLORS.text,
    },
  };

  const colorScheme = colors[variant];

  return (
    <View style={styles.container}>
      {/* Custom YANN Logo Icon - Abstract Y shape with warmth */}
      <Svg width={icon} height={icon} viewBox="0 0 48 48">
        <Defs>
          <LinearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colorScheme.primary} />
            <Stop offset="100%" stopColor={colorScheme.accent} />
          </LinearGradient>
        </Defs>
        {/* Main Y shape */}
        <Path
          d="M24 4L8 20L16 20L24 28L32 20L40 20L24 4Z"
          fill="url(#logoGradient)"
        />
        {/* Bottom stem */}
        <Path
          d="M20 26L20 44L28 44L28 26L24 30L20 26Z"
          fill={colorScheme.primary}
        />
        {/* Decorative dot */}
        <Circle cx="24" cy="18" r="3" fill="#FFFFFF" opacity="0.9" />
      </Svg>
      
      {showText && (
        <Text style={[
          styles.logoText, 
          { fontSize: text, color: colorScheme.text }
        ]}>
          YANN
        </Text>
      )}
    </View>
  );
};

// Simple text-only logo for headers
export const LogoText: React.FC<{ 
  size?: number; 
  color?: string;
  subtitle?: string;
}> = ({ 
  size = 24, 
  color = COLORS.text,
  subtitle
}) => {
  return (
    <View style={styles.textLogoContainer}>
      <View style={styles.textLogoRow}>
        <View style={[styles.logoDot, { backgroundColor: COLORS.primary }]} />
        <Text style={[styles.logoTextOnly, { fontSize: size, color }]}>
          YANN
        </Text>
      </View>
      {subtitle && (
        <Text style={[styles.subtitle, { color: COLORS.textSecondary }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
};

// Network logo from URL
export const NetworkLogo: React.FC<{ size?: number }> = ({ size = 40 }) => {
  return (
    <Image
      source={{ uri: 'https://yann-care.vercel.app/logo.svg' }}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    fontWeight: '800',
    letterSpacing: 2,
  },
  textLogoContainer: {
    alignItems: 'flex-start',
  },
  textLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  logoTextOnly: {
    fontWeight: '800',
    letterSpacing: 3,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginTop: 2,
  },
});
