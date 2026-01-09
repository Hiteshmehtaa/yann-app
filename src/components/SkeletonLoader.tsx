/**
 * Skeleton Loader Components
 * 
 * Loading placeholders for better perceived performance
 */

import React from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface SkeletonProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: any;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    width = '100%',
    height = 20,
    borderRadius = 8,
    style,
}) => {
    const animatedValue = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(animatedValue, {
                    toValue: 0,
                    duration: 1000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const opacity = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <Animated.View
            style={[
                styles.skeleton,
                { width, height, borderRadius, opacity },
                style,
            ]}
        />
    );
};

export const BookingSkeleton: React.FC = () => {
    return (
        <View style={styles.bookingCard}>
            <View style={styles.bookingHeader}>
                <Skeleton width={60} height={60} borderRadius={12} />
                <View style={styles.bookingInfo}>
                    <Skeleton width="70%" height={18} />
                    <Skeleton width="50%" height={14} style={{ marginTop: 8 }} />
                </View>
            </View>
            <View style={styles.bookingDetails}>
                <Skeleton width="100%" height={14} />
                <Skeleton width="80%" height={14} style={{ marginTop: 6 }} />
            </View>
            <View style={styles.bookingFooter}>
                <Skeleton width={80} height={28} borderRadius={14} />
                <Skeleton width={100} height={28} borderRadius={14} />
            </View>
        </View>
    );
};

export const ProviderSkeleton: React.FC = () => {
    return (
        <View style={styles.providerCard}>
            <Skeleton width="100%" height={160} borderRadius={12} />
            <View style={styles.providerInfo}>
                <Skeleton width="60%" height={18} />
                <Skeleton width="40%" height={14} style={{ marginTop: 6 }} />
                <Skeleton width="80%" height={14} style={{ marginTop: 6 }} />
            </View>
            <View style={styles.providerFooter}>
                <Skeleton width={60} height={24} borderRadius={12} />
                <Skeleton width="30%" height={24} borderRadius={12} />
            </View>
        </View>
    );
};

export const ServiceSkeleton: React.FC = () => {
    return (
        <View style={styles.serviceCard}>
            <Skeleton width={80} height={80} borderRadius={16} />
            <Skeleton width="80%" height={16} style={{ marginTop: 12 }} />
            <Skeleton width="60%" height={12} style={{ marginTop: 6 }} />
        </View>
    );
};

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: '#E5E7EB',
    },
    bookingCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    bookingHeader: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    bookingInfo: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    bookingDetails: {
        marginBottom: 12,
    },
    bookingFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    providerCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    providerInfo: {
        padding: 12,
    },
    providerFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    serviceCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        marginRight: 12,
        width: 140,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
});
