import React, { useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, Animated, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY, GRADIENTS } from '../../utils/theme';
import LottieView from 'lottie-react-native';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'glass';
type ButtonSize = 'small' | 'medium' | 'large';

interface NeoButtonProps {
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

export const NeoButton: React.FC<NeoButtonProps> = ({
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
    const scale = useRef(new Animated.Value(1)).current;
    const shadowOpacity = useRef(new Animated.Value(variant === 'primary' ? 0.25 : 0)).current;

    // Animation handlers
    const handlePressIn = () => {
        Animated.parallel([
            Animated.spring(scale, {
                toValue: 0.97,
                useNativeDriver: true,
                speed: 50,
                bounciness: 4,
            }),
            Animated.timing(shadowOpacity, {
                toValue: 0.1, // Reduce shadow on press to simulate "pushed in"
                duration: 100,
                useNativeDriver: true,
            })
        ]).start();
    };

    const handlePressOut = () => {
        Animated.parallel([
            Animated.spring(scale, {
                toValue: 1,
                useNativeDriver: true,
                speed: 50,
                bounciness: 4,
            }),
            Animated.timing(shadowOpacity, {
                toValue: variant === 'primary' ? 0.25 : 0,
                duration: 200,
                useNativeDriver: true,
            })
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

    const paddingHorizontal = size === 'small' ? SPACING.md : SPACING.xl;
    const fontSize = size === 'small' ? TYPOGRAPHY.size.sm : TYPOGRAPHY.size.md;

    // Render Inner Content
    const renderContent = () => (
        <View style={[styles.contentContainer, { height: getHeight(), paddingHorizontal }]}>
            {loading ? (
                <LottieView
                    source={require('../../../assets/lottie/loading.json')} // Ensure this path exists or use fallback
                    autoPlay
                    loop
                    style={{ width: 24, height: 24 }}
                />
            ) : (
                <>
                    {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
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
                    {/* Inner Bevel Highlight (Top white line) */}
                    <View style={[
                        styles.innerBevel,
                        { borderColor: 'rgba(255,255,255,0.3)', borderTopWidth: 1, borderBottomWidth: 0 }
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

    return (
        <TouchableOpacity
            activeOpacity={1}
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled || loading}
            style={[style, styles.container]}
        >
            <Animated.View style={[
                styles.wrapper,
                {
                    transform: [{ scale }],
                    // Apply variable shadow
                    shadowColor: variant === 'primary' ? COLORS.primary : COLORS.black,
                    shadowOpacity: shadowOpacity,
                }
            ]}>
                {renderBackground()}
                {renderContent()}
            </Animated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        // Layout container
    },
    wrapper: {
        // Animation wrapper with shadow
        borderRadius: RADIUS.medium,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 16,
        elevation: 8, // Android elevation
        backgroundColor: 'transparent', // Needed for shadow to show behind gradient
    },
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    innerBevel: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: RADIUS.medium,
    },
    text: {
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    textLight: {
        color: '#FFFFFF',
    },
    textDark: {
        color: COLORS.text,
    },
    bgSolid: {
        backgroundColor: 'transparent',
    },
    borderOutline: {
        borderWidth: 1.5,
        borderColor: COLORS.border,
    },
});
