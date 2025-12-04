import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../utils/theme';
import { LogoSVG } from './LogoSVG';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  variant?: 'default' | 'white';
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 'medium', 
  showText = true,
  variant = 'default' 
}) => {
  const dimensions = {
    small: { logo: 32, text: 18 },
    medium: { logo: 40, text: 22 },
    large: { logo: 56, text: 28 },
  };

  const { logo, text } = dimensions[size];
  const textColor = variant === 'white' ? '#FFFFFF' : COLORS.text;

  return (
    <View style={styles.container}>
      <LogoSVG size={logo} color={variant === 'white' ? '#FFFFFF' : COLORS.primary} />
      {showText && (
        <Text style={[styles.logoText, { fontSize: text, color: textColor }]}>
          YANN
        </Text>
      )}
    </View>
  );
};

// Simple text logo for compact spaces
export const LogoText: React.FC<{ 
  size?: number; 
  color?: string;
}> = ({ 
  size = 22, 
  color = COLORS.primary,
}) => {
  return (
    <View style={styles.textLogoContainer}>
      <Text style={[styles.logoTextOnly, { fontSize: size, color }]}>
        YANN
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoText: {
    fontWeight: '700',
    letterSpacing: 1,
  },
  textLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoTextOnly: {
    fontWeight: '800',
    letterSpacing: 2,
  },
});
