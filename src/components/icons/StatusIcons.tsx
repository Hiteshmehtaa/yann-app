/**
 * Status Icons
 * Icons for status indicators (check, star, clock, etc.)
 */

import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { COLORS } from '../../utils/theme';

interface IconProps {
  size?: number;
  color?: string;
}

interface IconFillProps extends IconProps {
  filled?: boolean;
}

export const CheckIcon: React.FC<IconProps> = ({ size = 20, color = COLORS.success }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 6L9 17l-5-5"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const CheckCircleIcon: React.FC<IconFillProps> = ({ size = 20, color = COLORS.success, filled = false }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle 
      cx="12" 
      cy="12" 
      r="10" 
      stroke={color} 
      strokeWidth={2} 
      fill={filled ? color : 'none'}
    />
    <Path
      d="M9 12l2 2 4-4"
      stroke={filled ? COLORS.white : color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const StarIcon: React.FC<IconFillProps> = ({ size = 16, color = COLORS.warning, filled = true }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'}>
    <Path
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      stroke={filled ? 'none' : color}
      strokeWidth={filled ? 0 : 2}
    />
  </Svg>
);

export const ClockIcon: React.FC<IconProps> = ({ size = 20, color = COLORS.textSecondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Path
      d="M12 6v6l4 2"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const CalendarIcon: React.FC<IconProps> = ({ size = 20, color = COLORS.textSecondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth={2} />
    <Path
      d="M16 2v4M8 2v4M3 10h18"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

export const AlertIcon: React.FC<IconProps> = ({ size = 20, color = COLORS.warning }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={`${color}20`}
    />
    <Path
      d="M12 9v4m0 4h.01"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

export const ErrorCircleIcon: React.FC<IconProps> = ({ size = 20, color = COLORS.error }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} fill={`${color}20`} />
    <Path
      d="M15 9l-6 6m0-6l6 6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

export const InfoCircleIcon: React.FC<IconProps> = ({ size = 20, color = COLORS.info }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Path
      d="M12 16v-4m0-4h.01"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

export const VerifiedBadgeIcon: React.FC<IconProps> = ({ size = 16, color = COLORS.success }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    <Path
      d="M9 12l2 2 4-4"
      stroke={COLORS.white}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

export const TopRatedBadgeIcon: React.FC<IconProps> = ({ size = 16, color = COLORS.warning }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </Svg>
);

export const TrendingUpIcon: React.FC<IconProps> = ({ size = 20, color = COLORS.success }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M23 6l-9.5 9.5-5-5L1 18"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M17 6h6v6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const TrendingDownIcon: React.FC<IconProps> = ({ size = 20, color = COLORS.error }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M23 18L13.5 8.5l-5 5L1 6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M17 18h6v-6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const LoadingIcon: React.FC<IconProps> = ({ size = 20, color = COLORS.primary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle
      cx="12"
      cy="12"
      r="10"
      stroke={`${color}30`}
      strokeWidth={2}
    />
    <Path
      d="M12 2a10 10 0 0110 10"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);
