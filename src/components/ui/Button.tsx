import React, { useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, Animated, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, GRADIENTS } from '../../utils/theme';
import LottieView from 'lottie-react-native';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'glass';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'large',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}) => {
  // Use translateY for "physical" press effect
  const translateY = useRef(new Animated.Value(0)).current;
  const borderBottomWidth = useRef(new Animated.Value(4)).current;

  // Animation handlers
  const handlePressIn = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 2, // Move down
        duration: 100,
        useNativeDriver: true,
      }),
      // Visual border reduction would need layout animation or non-native driver, 
      // but translate is smoother. We'll stick to translate.
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0, // Move back up
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Styles generation
  const getGradientColors = () => {
    if (disabled) return [COLORS.gray200, COLORS.gray200] as const;
    switch (variant) {
      case 'primary': return GRADIENTS.primary;
      case 'secondary': return GRADIENTS.orange;
      case 'glass': return GRADIENTS.glass;
      default: return undefined;
    }
  };

  const getHeight = () => {
    switch (size) {
      case 'small': return 36;
      case 'medium': return 48;
      case 'large': return 56;
      default: return 56;
    }
  };

  const paddingHorizontal = title ? (size === 'small' ? SPACING.md : SPACING.xl) : 0;
  const fontSize = size === 'small' ? TYPOGRAPHY.size.sm : TYPOGRAPHY.size.md;

  // Render Inner Content
  const renderContent = () => (
    <View style={[styles.contentContainer, { height: getHeight(), paddingHorizontal }]}>
      {loading ? (
        <LottieView
          source={require('../../../assets/lottie/loading.json')}
          autoPlay
          loop
          style={{ width: 24, height: 24 }}
        />
      ) : (
        <>
          {icon && <View style={title ? { marginRight: 8 } : {}}>{icon}</View>}
          <Text style={[
            styles.text,
            { fontSize },
            variant === 'outline' || variant === 'ghost' ? styles.textDark : styles.textLight,
            textStyle
          ]}>
            {title}
          </Text>
        </>
      )}
    </View>
  );

  // Render Background
  const renderBackground = () => {
    const colors = getGradientColors();

    // Gradient Background (Primary, Secondary, Glass)
    if (colors) {
      return (
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: RADIUS.medium }]}
        >
          {/* Inner Highlight for "Plastic" feel */}
          <View style={[
            styles.innerHighlight,
            { borderColor: 'rgba(255,255,255,0.4)', borderTopWidth: 1 }
          ]} />
        </LinearGradient>
      );
    }

    // Solid Background (Outline, Ghost)
    return (
      <View style={[
        StyleSheet.absoluteFill,
        styles.bgSolid,
        variant === 'outline' && styles.borderOutline,
        { borderRadius: RADIUS.medium }
      ]} />
    );
  };

  // Border Color for the "3D" bottom edge
  const get3DBorderColor = () => {
    if (disabled) return COLORS.gray200;
    switch (variant) {
      case 'primary': return '#1D4ED8'; // Darker Blue
      case 'secondary': return '#C2410C'; // Darker Orange
      case 'outline': return COLORS.gray200;
      // Ghost bumps don't throw shadows usually
      default: return 'transparent';
    }
  };

  const has3Deffect = variant === 'primary' || variant === 'secondary';

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[style]}
    >
      <Animated.View style={[
        styles.container,
        // Tactile 3D Border
        has3Deffect && {
          borderBottomWidth: 4,
          borderColor: get3DBorderColor(),
          borderRadius: RADIUS.medium,
        },
        { transform: [{ translateY }] }
      ]}>
        <View style={styles.face}>
          {renderBackground()}
          {renderContent()}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    // Container holds the 3D depth
    backgroundColor: 'transparent',
  },
  face: {
    // The actual button face
    borderRadius: RADIUS.medium,
    overflow: 'hidden',
    position: 'relative',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerHighlight: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS.medium,
  },
  text: {
    fontWeight: '700', // Bolder for tactile feel
    letterSpacing: 0.3,
  },
  textLight: {
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  textDark: {
    color: COLORS.text,
  },
  bgSolid: {
    backgroundColor: 'transparent',
  },
  borderOutline: {
    borderWidth: 2, // Thicker outline
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
});
