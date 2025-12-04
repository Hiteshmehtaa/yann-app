import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LogoSVG } from '../LogoSVG';
import { COLORS, SPACING, RADIUS, ICON_SIZES, SHADOWS, LAYOUT } from '../../utils/theme';

type TopBarProps = {
  title?: string;
  showLogo?: boolean;
  showProfile?: boolean;
  showBack?: boolean;
  userName?: string | null;
  onProfilePress?: () => void;
  onBackPress?: () => void;
};

export const TopBar: React.FC<TopBarProps> = ({
  title,
  showLogo = true,
  showProfile = true,
  showBack = false,
  userName,
  onProfilePress,
  onBackPress,
}) => {
  // Only show name if actually provided, otherwise show nothing
  const displayName = userName || '';
  const firstName = displayName ? displayName.split(' ')[0] : '';
  const initial = displayName ? displayName.charAt(0).toUpperCase() : 'U';

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.container}>
        {/* Left Side - Logo or Back Button */}
        {/* Left Side - Back Button or Logo */}
        {showBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
            <Ionicons name="arrow-back" size={ICON_SIZES.large} color={COLORS.text} />
          </TouchableOpacity>
        )}
        {!showBack && showLogo && (
          <View style={styles.logoContainer}>
            <LogoSVG size={28} />
          </View>
        )}
        {!showBack && !showLogo && (
          <View style={styles.spacer} />
        )}

        {/* Center - Title or Welcome Text */}
        <View style={styles.centerContent}>
          {!!title && <Text style={styles.title}>{title}</Text>}
          {!title && !!firstName && <Text style={styles.welcomeText}>Hi, {firstName} 👋</Text>}
        </View>

        {/* Right Side - Profile Avatar */}
        {showProfile && (
          <TouchableOpacity style={styles.profileButton} onPress={onProfilePress}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: COLORS.cardBg,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: LAYOUT.screenPadding,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.cardBg,
    height: LAYOUT.topBarHeight,
  },
  logoContainer: {
    width: LAYOUT.logoSize,
    height: LAYOUT.logoSize,
    borderRadius: RADIUS.small,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  logoImage: {
    width: 24,
    height: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.small,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  spacer: {
    width: LAYOUT.logoSize,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: SPACING.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.3,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    letterSpacing: 0.3,
  },
  profileButton: {
    width: LAYOUT.avatarSize,
    height: LAYOUT.avatarSize,
  },
  avatarCircle: {
    width: LAYOUT.avatarSize,
    height: LAYOUT.avatarSize,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.primary,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
});
