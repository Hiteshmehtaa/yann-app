import React from 'react';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { COLORS } from '../utils/theme';

interface LogoSVGProps {
  size?: number;
  color?: string;
}

export const LogoSVG: React.FC<LogoSVGProps> = ({ 
  size = 40,
  color = COLORS.primary 
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={COLORS.primary} stopOpacity="1" />
          <Stop offset="100%" stopColor={COLORS.primaryGradientEnd} stopOpacity="1" />
        </LinearGradient>
      </Defs>
      
      {/* House roof - representing home services */}
      <Path
        d="M50 10 L90 40 L85 40 L85 85 L15 85 L15 40 L10 40 Z"
        fill="url(#logoGradient)"
      />
      
      {/* Door */}
      <Path
        d="M40 85 L40 60 L60 60 L60 85 Z"
        fill={COLORS.background}
      />
      
      {/* Window */}
      <Circle cx="35" cy="55" r="6" fill={COLORS.background} />
      <Circle cx="65" cy="55" r="6" fill={COLORS.background} />
      
      {/* Checkmark - representing service completion */}
      <Path
        d="M45 50 L48 53 L55 42"
        stroke={COLORS.accentOrange}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
};
