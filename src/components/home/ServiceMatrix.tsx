import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import { ServiceCard } from '../ui/ServiceCard';
import { SPACING } from '../../utils/theme';
import { Service } from '../../types';

interface ServiceMatrixProps {
    services: Service[];
    onPressService: (service: Service) => void;
}

const { width } = Dimensions.get('window');
const GAP = 12;
const PADDING = 16;
// Consistent 2-column layout
const CARD_WIDTH = (width - (PADDING * 2) - GAP) / 2;

export const ServiceMatrix: React.FC<ServiceMatrixProps> = ({ services, onPressService }) => {
    // Staggered animation values
    const animValues = useRef(services.map(() => new Animated.Value(0))).current;

    useEffect(() => {
        // Reset and create new animation values when services change
        const animations = services.map((_, index) => {
            return Animated.spring(animValues[index] || new Animated.Value(0), {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            });
        });

        Animated.stagger(40, animations).start();
    }, [services]);

    const renderServiceItem = (service: Service, index: number) => {
        const animValue = animValues[index] || new Animated.Value(1);
        const isRightColumn = index % 2 === 1;

        return (
            <Animated.View
                key={service.id || index}
                style={[
                    styles.cardWrapper,
                    {
                        width: CARD_WIDTH,
                        marginRight: isRightColumn ? 0 : GAP,
                        transform: [
                            { translateY: animValue.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
                            { scale: animValue.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }
                        ],
                        opacity: animValue
                    }
                ]}
            >
                <ServiceCard
                    title={service.title}
                    price={service.price}
                    icon={service.icon}
                    iconImage={typeof service.icon === 'number' ? service.icon : undefined}
                    popular={service.popular}
                    isNew={service.isNew}
                    partnerCount={service.partnerCount}
                    isComingSoon={service.isComingSoon}
                    onPress={() => onPressService(service)}
                    style={styles.card}
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
        paddingHorizontal: PADDING,
        paddingBottom: 100, // Space for bottom navigation
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    cardWrapper: {
        marginBottom: GAP,
    },
    card: {
        height: 160,
    },
});
