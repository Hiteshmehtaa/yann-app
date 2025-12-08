import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface ServiceIconProps {
  size?: number;
  color?: string;
}

export const ServiceIcon: React.FC<ServiceIconProps> = ({ size = 56, color = '#FFD700' }) => {
  const secondaryColor = color === '#FFD700' ? '#FFA500' : color;
  
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Sparkle/Star Icon */}
      <Path
        d="M50 10 L55 35 L80 40 L55 45 L50 70 L45 45 L20 40 L45 35 Z"
        fill={color}
      />
      <Path
        d="M70 20 L73 30 L83 33 L73 36 L70 46 L67 36 L57 33 L67 30 Z"
        fill={secondaryColor}
      />
      <Path
        d="M30 25 L32 32 L39 34 L32 36 L30 43 L28 36 L21 34 L28 32 Z"
        fill={secondaryColor}
      />
    </Svg>
  );
};
