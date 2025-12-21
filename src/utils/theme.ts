/**
 * YANN Global Design System
 * Premium UI/UX Theme - Consistent across all screens
 * Aligned with YANN website aesthetic
 */

// ============================================
// 🎨 OFFICIAL YANN WEBSITE COLOR PALETTE
// ============================================
export const COLORS = {
  // PRIMARY COLORS (from YANN website)
  primary: '#2E59F3',          // Primary Blue
  primaryLight: '#E8EEFF',     // Light blue background for icons
  primaryGradientStart: '#2E59F3',  // Gradient start
  primaryGradientEnd: '#4362FF',    // Gradient end

  // SECONDARY COLORS (from YANN website)
  accentOrange: '#FF8A3D',     // Accent Orange
  accentYellow: '#F7C948',     // Accent Yellow

  // NEUTRAL COLORS (from YANN website)
  background: '#F8F9FA',       // Background Light (softer gray)
  cardBg: '#FFFFFF',           // Card Background (pure white)
  elevated: '#FFFFFF',         // Elevated surfaces (pure white)

  // TEXT COLORS (from YANN website)
  text: '#1A1C1E',             // Heading Text
  textSecondary: '#6B7280',    // Body Text (softer gray)
  textTertiary: '#9CA3AF',     // Muted text

  // BORDERS & LINES (from YANN website)
  border: '#E5E7EB',           // Borders / Light Lines
  divider: '#F0F0F0',          // Dividers (lighter)

  // SUPPORTING COLORS (from YANN website)
  success: '#27C07D',          // Success Green
  error: '#E63946',            // Error Red
  warning: '#F7C948',          // Warning Yellow (same as accent)
  info: '#2E59F3',             // Info Blue (same as primary)

  // OVERLAYS
  overlay: 'rgba(0, 0, 0, 0.5)',
  gradientOverlay: 'rgba(26, 28, 30, 0.6)',

  // UTILITY
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
} as const;

// ============================================
// 📐 SPACING SYSTEM - 12 / 16 / 20
// ============================================
export const SPACING = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

// ============================================
// 🔤 TYPOGRAPHY SYSTEM
// ============================================
export const TYPOGRAPHY = {
  // Font Sizes
  size: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    heading: 28,
  },

  // Font Weights
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
  },

  // Letter Spacing
  letterSpacing: {
    tight: -0.4,
    normal: 0,
    wide: 0.3, // Reduced from 0.5 for cleaner look
    extraWide: 1,
  },

  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// ============================================
// 🎯 BORDER RADIUS SYSTEM (YANN Website Style)
// ============================================
export const RADIUS = {
  small: 12,        // Small corners (badges, chips)
  medium: 16,       // Buttons, inputs
  large: 20,        // Cards, panels (YANN website standard)
  xlarge: 28,       // Large cards, modals (YANN website premium)
  full: 9999,       // Circular (avatars)
} as const;

// ============================================
// 🌟 ICON SIZES
// ============================================
export const ICON_SIZES = {
  small: 20,
  medium: 24,
  large: 28,
  xlarge: 32,
  xxlarge: 40,
} as const;

// ============================================
// 🎭 SHADOWS - Soft & Premium (Apple-like)
// ============================================
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03, // Reduced from 0.04
    shadowRadius: 8,     // Increased from 6
    elevation: 2,
  },

  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 }, // Increased height
    shadowOpacity: 0.05, // Reduced from 0.06
    shadowRadius: 14,    // Increased from 10
    elevation: 4,
  },

  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.07, // Reduced from 0.08
    shadowRadius: 30,    // Increased from 20
    elevation: 8,
  },

  // Colored shadows for emphasis
  primary: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },

  orange: {
    shadowColor: COLORS.accentOrange,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
} as const;

// ============================================
// 📏 LAYOUT CONSTANTS
// ============================================
export const LAYOUT = {
  // Screen Padding
  screenPadding: SPACING.lg,

  // Card Aspect Ratios
  serviceCardAspectRatio: 1.1,

  // Grid
  gridGap: 12,
  gridColumns: 2,

  // Top Bar
  topBarHeight: 64,
  logoSize: 36,
  avatarSize: 44,

  // Bottom Tab Bar
  tabBarHeight: 68,
  tabIconSize: ICON_SIZES.large,

  // Sticky CTA
  ctaHeight: 80,
} as const;

// ============================================
// 🎬 ANIMATION TIMINGS
// ============================================
export const ANIMATIONS = {
  fast: 200,
  normal: 300,
  slow: 500,
  verySlow: 800,
} as const;

// ============================================
// 🔍 HELPER FUNCTIONS
// ============================================

/**
 * Calculate responsive card width for grid layouts
 * @param screenWidth - Current screen width from useWindowDimensions()
 * @returns Card width for 2-column grid with proper gap
 */
export const getResponsiveCardWidth = (screenWidth: number): number => {
  const totalPadding = LAYOUT.screenPadding * 2;
  const totalGap = LAYOUT.gridGap;
  return (screenWidth - totalPadding - totalGap) / LAYOUT.gridColumns;
};

/**
 * Get status color based on status string
 * @param status - Status string (active, completed, pending, etc.)
 * @returns Color hex code
 */
export const getStatusColor = (status: string): string => {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('active') || statusLower.includes('ongoing')) {
    return COLORS.success;
  }
  if (statusLower.includes('completed') || statusLower.includes('done')) {
    return COLORS.info;
  }
  if (statusLower.includes('pending') || statusLower.includes('waiting')) {
    return COLORS.warning;
  }
  if (statusLower.includes('cancelled') || statusLower.includes('failed')) {
    return COLORS.error;
  }
  return COLORS.textSecondary;
};

/**
 * Add transparency to hex color
 * @param hex - Hex color code
 * @param opacity - Opacity value (0-1)
 * @returns Hex color with alpha channel
 */
export const addAlpha = (hex: string, opacity: number): string => {
  const alpha = Math.round(opacity * 255).toString(16).padStart(2, '0');
  return `${hex}${alpha}`;
};
