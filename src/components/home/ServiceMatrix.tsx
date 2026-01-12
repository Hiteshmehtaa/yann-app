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
const PADDING = 20;
// Calculate widths
const COL_2_WIDTH = (width - (PADDING * 2) - GAP) / 2;
const COL_3_WIDTH = (width - (PADDING * 2) - (GAP * 2)) / 3;

export const ServiceMatrix: React.FC<ServiceMatrixProps> = ({ services, onPressService }) => {
    // Staggered animation values
    const animValues = useRef(services.map(() => new Animated.Value(0))).current;

    useEffect(() => {
        const animations = services.map((_, index) => {
            return Animated.spring(animValues[index], {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
                delay: index * 50, // Stagger effect
            });
        });

        Animated.stagger(50, animations).start();
    }, [services]);

    // Split services for Bento Layout
    // Top 2 services get larger cards
    const topServices = services.slice(0, 2);
    const otherServices = services.slice(2);

    const renderServiceItem = (service: Service, index: number, isLarge: boolean) => {
        const animIndex = isLarge ? index : index + 2;
        const animValue = animValues[animIndex] || new Animated.Value(1);

        return (
            <Animated.View
                key={service.id}
                style={[
                    {
                        width: isLarge ? COL_2_WIDTH : COL_3_WIDTH,
                        marginBottom: GAP,
                        marginRight: isLarge ? 0 : ((index + 1) % 3 === 0 ? 0 : GAP), // Add right margin except for every 3rd item
                        transform: [
                            { translateY: animValue.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) },
                            { scale: animValue }
                        ],
                        opacity: animValue
                    }
                ]}
            >
                <ServiceCard
                    title={service.title}
                    price={service.price}
                    icon={service.icon}
                    iconImage={typeof service.icon === 'number' ? service.icon : undefined} // handle image source
                    popular={service.popular}
                    isNew={service.isNew}
                    // partnerCount={service.partnerCount} // Assuming this might be passed or added to Type
                    onPress={() => onPressService(service)}
                    style={{ height: isLarge ? 170 : 145 }} // Taller for top cards
                />
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Top Row: 2 Large Cards */}
            <View style={styles.row}>
                {topServices.map((service, index) => renderServiceItem(service, index, true))}
            </View>

            {/* Grid: 3 Column Layout */}
            <View style={styles.grid}>
                {otherServices.map((service, index) => renderServiceItem(service, index, false))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: PADDING,
        paddingBottom: 100, // Space for scrolling
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: GAP,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
});
