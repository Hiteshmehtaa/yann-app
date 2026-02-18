import React, { useRef, useEffect } from 'react';
import { Animated, ViewStyle } from 'react-native';

interface FadeInViewProps {
    children: React.ReactNode;
    delay?: number;
    style?: ViewStyle | ViewStyle[];
}

export const FadeInView: React.FC<FadeInViewProps> = ({ children, delay = 0, style }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            delay,
            useNativeDriver: true,
        }).start();
    }, [delay, fadeAnim]);

    return (
        <Animated.View style={[{ opacity: fadeAnim }, style]}>
            {children}
        </Animated.View>
    );
};
