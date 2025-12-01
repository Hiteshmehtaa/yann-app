// YANN Brand Theme - Clean White & Blue Professional Design

export const COLORS = {
  // Primary Blue Palette
  primary: '#2563EB',        // Vibrant blue
  primaryLight: '#3B82F6',   // Light blue
  primaryDark: '#1D4ED8',    // Dark blue
  primarySoft: '#EFF6FF',    // Very light blue bg
  
  // White & Neutral
  white: '#FFFFFF',
  background: '#FFFFFF',
  backgroundSecondary: '#F8FAFC',
  surface: '#FFFFFF',
  
  // Text Colors
  text: '#0F172A',           // Slate 900
  textSecondary: '#64748B',  // Slate 500
  textMuted: '#94A3B8',      // Slate 400
  textOnPrimary: '#FFFFFF',
  
  // Borders
  border: '#E2E8F0',         // Slate 200
  borderLight: '#F1F5F9',    // Slate 100
  
  // Status Colors
  success: '#10B981',        // Emerald
  successLight: '#ECFDF5',
  warning: '#F59E0B',        // Amber
  warningLight: '#FFFBEB',
  error: '#EF4444',          // Red
  errorLight: '#FEF2F2',
  
  // Accent colors for variety
  accent: '#8B5CF6',         // Violet
  accentLight: '#F5F3FF',
};

export const SHADOWS = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  blue: {
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 999,
};
