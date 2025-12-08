/**
 * Navigation Icons
 * Icons for bottom tab navigation and headers
 */

import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
import { COLORS } from '../../utils/theme';

interface IconProps {
  size?: number;
  color?: string;
  filled?: boolean;
}

export const HomeIconNav: React.FC<IconProps> = ({ size = 24, color = COLORS.primary, filled = false }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={filled ? color : 'none'}
    />
  </Svg>
);

export const SearchIconNav: React.FC<IconProps> = ({ size = 24, color = COLORS.textTertiary, filled = false }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle
      cx="11"
      cy="11"
      r="8"
      stroke={color}
      strokeWidth={2}
      fill={filled ? `${color}20` : 'none'}
    />
    <Path
      d="M21 21l-4.35-4.35"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

export const BookingsIconNav: React.FC<IconProps> = ({ size = 24, color = COLORS.textTertiary, filled = false }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 2v2m6-2v2M9 16h6m-6 4h6M5 8h14M3 6a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={filled ? `${color}20` : 'none'}
    />
  </Svg>
);

export const ProfileIconNav: React.FC<IconProps> = ({ size = 24, color = COLORS.textTertiary, filled = false}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle
      cx="12"
      cy="8"
      r="4"
      stroke={color}
      strokeWidth={2}
      fill={filled ? color : 'none'}
    />
    <Path
      d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      fill={filled ? `${color}20` : 'none'}
    />
  </Svg>
);

export const BackIcon: React.FC<IconProps> = ({ size = 24, color = COLORS.text, filled: _filled }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 18l-6-6 6-6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ChevronRightIcon: React.FC<IconProps> = ({ size = 20, color = COLORS.textTertiary, filled: _filled }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 18l6-6-6-6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const CloseIcon: React.FC<IconProps> = ({ size = 24, color = COLORS.text, filled: _filled }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18M6 6l12 12"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const MenuIcon: React.FC<IconProps> = ({ size = 24, color = COLORS.text, filled: _filled }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 6h16M4 12h16M4 18h16"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);
