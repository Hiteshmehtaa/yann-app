import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LogoSVG } from '../LogoSVG';
import { COLORS, SPACING, RADIUS, ICON_SIZES, SHADOWS, LAYOUT, TYPOGRAPHY } from '../../utils/theme';

type TopBarProps = {
  title?: string;
  showLogo?: boolean;
  showProfile?: boolean;
  showBack?: boolean;
  userName?: string | null;
  onProfilePress?: () => void;
  onBackPress?: () => void;
  glass?: boolean;
};

export const TopBar: React.FC<TopBarProps> = ({
  title,
  showLogo = true,
  showProfile = true,
  showBack = false,
  userName,
  onProfilePress,
  onBackPress,
  glass = false,
}) => {
  const displayName = userName || '';
  const firstName = displayName ? displayName.split(' ')[0] : '';
  const initial = displayName ? displayName.charAt(0).toUpperCase() : 'U';

  const Container = glass ? View : SafeAreaView;
  const containerStyle = glass ? styles.glassContainer : styles.safeArea;

  const renderContent = () => (
    <View style={[styles.contentContainer, glass && styles.glassContent]}>
      {/* Left Side */}
      <View style={styles.leftContainer}>
        {showBack ? (
          <TouchableOpacity
            style={[styles.iconButton, glass && styles.glassButton]}
            onPress={onBackPress}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
        ) : showLogo && (
          <View style={[styles.logoContainer, glass && styles.glassButton]}>
            <LogoSVG size={28} />
          </View>
        )}
      </View>

      {/* Center content */}
      <View style={styles.centerContainer}>
        {title ? (
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
        ) : (
          !!firstName && (
            <Text style={styles.welcomeText}>
              <Text style={{ fontWeight: '400', color: COLORS.textSecondary }}>Hi, </Text>
              {firstName}
            </Text>
          )
        )}
      </View>

      {/* Right Side */}
      <View style={styles.rightContainer}>
        {showProfile && (
          <TouchableOpacity
            onPress={onProfilePress}
            activeOpacity={0.8}
            style={[styles.profileButton, glass && styles.glassButton]}
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (glass) {
    if (Platform.OS === 'ios') {
      return (
        <BlurView intensity={80} tint="light" style={styles.absoluteHeader}>
          <SafeAreaView edges={['top']}>
            {renderContent()}
          </SafeAreaView>
        </BlurView>
      );
    }
    // Android Fallback for Glass
    return (
      <View style={[styles.absoluteHeader, styles.androidGlass]}>
        <SafeAreaView edges={['top']}>
          {renderContent()}
        </SafeAreaView>
      </View>
    );
  }

  return (
    <Container edges={['top']} style={containerStyle}>
      {renderContent()}
    </Container>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: COLORS.background,
    zIndex: 10,
  },
  glassContainer: {
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  absoluteHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  androidGlass: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  contentContainer: {
    height: LAYOUT.topBarHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
  },
  glassContent: {
    // specialized spacing for glass headers if needed
  },
  leftContainer: {
    width: 48,
    alignItems: 'flex-start',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
  },
  rightContainer: {
    width: 48,
    alignItems: 'flex-end',
  },
  // Refactored to Tactile Style (No Shadows)
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.small,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderBottomWidth: 3, // Tactile depth
    borderBottomColor: '#CBD5E1',
  },
  glassButton: {
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  logoContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.small,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderBottomWidth: 3,
    borderBottomColor: '#CBD5E1',
  },
  welcomeText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  profileButton: {
    padding: 2,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderBottomWidth: 2,
    borderBottomColor: '#CBD5E1',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
