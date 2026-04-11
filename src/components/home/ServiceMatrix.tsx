import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { ServiceCard } from '../ui/ServiceCard';
import { Service } from '../../types';

interface ServiceMatrixProps {
    services: Service[];
    onPressService: (service: Service) => void;
}

export const ServiceMatrix: React.FC<ServiceMatrixProps> = ({ services, onPressService }) => {
    // Staggered animation values
    const animValues = useRef(services.map(() => new Animated.Value(0))).current;

    useEffect(() => {
        const animations = services.map((_, index) => {
            return Animated.spring(animValues[index] || new Animated.Value(0), {
                toValue: 1,
                tension: 60,
                friction: 8,
                useNativeDriver: true,
            });
        });

        Animated.stagger(30, animations).start();
    }, [services]);

    const renderServiceItem = (service: Service, index: number) => {
        const animValue = animValues[index] || new Animated.Value(1);

        return (
            <Animated.View
                key={service.id || index}
                style={[
                    styles.cardWrapper,
                    {
                        opacity: animValue,
                        transform: [
                            { translateY: animValue.interpolate({ inputRange: [0, 1], outputRange: [15, 0] }) },
                        ],
                    }
                ]}
            >
                <ServiceCard
                    variant="grid"
                    title={service.title}
                    price={service.price}
                    icon={service.icon}
                    iconImage={typeof service.icon === 'number' ? service.icon : undefined}
                    popular={service.popular}
                    isNew={service.isNew}
                    partnerCount={service.partnerCount}
                    isComingSoon={service.isComingSoon}
                    onPress={() => onPressService(service)}
                />
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.grid}>
                {services.map((service, index) => renderServiceItem(service, index))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingBottom: 100, // Space for bottom navigation
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    cardWrapper: {
        width: '48%', // Control grid column width here to align the animated containers
        marginBottom: 16,
    },
});
