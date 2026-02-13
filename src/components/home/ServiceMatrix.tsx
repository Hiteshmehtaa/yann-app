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
const GAP = 16;
const PADDING = 24;
// Premium 2-column layout with better spacing
const CARD_WIDTH = (width - (PADDING * 2) - GAP) / 2;

export const ServiceMatrix: React.FC<ServiceMatrixProps> = ({ services, onPressService }) => {
    // Staggered animation values
    const animValues = useRef(services.map(() => new Animated.Value(0))).current;

    useEffect(() => {
        // Enhanced staggered animation with spring physics
        const animations = services.map((_, index) => {
            const animValue = animValues[index] || new Animated.Value(0);
            return Animated.spring(animValue, {
                toValue: 1,
                tension: 60,
                friction: 8,
                delay: index * 50,
                useNativeDriver: true,
            });
        });

        Animated.parallel(animations).start();
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
                            { 
                                translateY: animValue.interpolate({ 
                                    inputRange: [0, 1], 
                                    outputRange: [40, 0] 
                                }) 
                            },
                            { 
                                scale: animValue.interpolate({ 
                                    inputRange: [0, 1], 
                                    outputRange: [0.9, 1] 
                                }) 
                            }
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
        paddingBottom: 120,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    cardWrapper: {
        marginBottom: GAP,
    },
    card: {
        height: 170,
    },
});
