import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../utils/theme';

type CardVariant = 'flat' | 'elevated' | 'floating' | 'glass';

interface DepthCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    variant?: CardVariant;
    padding?: number;
}

export const DepthCard: React.FC<DepthCardProps> = ({
    children,
    style,
    variant = 'elevated',
    padding = SPACING.md,
}) => {

    // Tactile 3D Styling (No drop shadows, just physical depth)
    const getVariantStyle = () => {
        switch (variant) {
            case 'flat':
                return styles.flat;
            case 'elevated':
                return styles.elevated;
            case 'floating':
                return styles.floating;
            default:
                return styles.elevated;
        }
    };

    const getBackgroundColor = () => {
        if (variant === 'flat') return 'transparent';
        return COLORS.cardBg;
    };

    return (
        <View style={[
            styles.base,
            {
                backgroundColor: getBackgroundColor(),
                padding,
            },
            getVariantStyle(),
            style
        ]}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    base: {
        borderRadius: RADIUS.large,
    },
    // No visual effects, just layout
    flat: {
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.gray50,
    },
    // Subtle Physical Lift (Top light, Bottom dark border)
    elevated: {
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderBottomWidth: 3, // Thicker bottom for "physical" height
        borderColor: '#E2E8F0', // Light slate
        borderBottomColor: '#CBD5E1', // Darker slate for shadow simulation
    },
    // High "Floating" Lift
    floating: {
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderBottomWidth: 4,
        borderColor: '#E2E8F0',
        borderBottomColor: '#94A3B8', // Even darker for higher lift
        // No drop shadow (elevation: 0) to avoid "AI glow"
    }
});
