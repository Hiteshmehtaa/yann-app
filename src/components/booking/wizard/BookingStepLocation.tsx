import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, SHADOWS } from '../../../utils/theme';
import { FadeInView } from '../../animations/FadeInView';
import { FloatingLabelInput } from '../../ui/FloatingLabelInput';
import type { Address } from '../../../types';

interface BookingStepLocationProps {
    selectedAddress: Address | null;
    onSelectAddressPress: () => void;
    notes: string;
    onNotesChange: (text: string) => void;
    formErrors: any;
}

export const BookingStepLocation: React.FC<BookingStepLocationProps> = ({
    selectedAddress,
    onSelectAddressPress,
    notes,
    onNotesChange,
    formErrors,
}) => {
    return (
        <View style={styles.container}>
            <FadeInView delay={100} style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Where should we arrive?</Text>
                </View>

                <View style={styles.cardContainerNoPadding}>
                    {/* Location Selection (Premium Card) */}
                    <TouchableOpacity
                        style={styles.premiumLocationCard}
                        onPress={onSelectAddressPress}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={[COLORS.gray50, COLORS.gray100]}
                            style={StyleSheet.absoluteFill}
                        />

                        <View style={styles.locationHeaderRow}>
                            <View style={styles.locationIconContainer}>
                                <Ionicons name="map" size={24} color={COLORS.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.locationTitle}>Service Location</Text>
                                {selectedAddress && selectedAddress.name && (
                                    <View style={styles.addressTag}>
                                        <Text style={styles.addressTagText}>{selectedAddress.name}</Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.changeButton}>
                                <Text style={styles.changeButtonText}>Change</Text>
                            </View>
                        </View>

                        <View style={styles.addressDetails}>
                            <Text style={[styles.addressText, !selectedAddress && { color: COLORS.textTertiary, fontStyle: 'italic' }]} numberOfLines={2}>
                                {selectedAddress ? selectedAddress.fullAddress : 'Select service location...'}
                            </Text>
                        </View>

                        {/* Decorative Map Pattern (Dots) */}
                        <View style={styles.mapPattern} pointerEvents="none">
                            <Ionicons name="location" size={120} color={COLORS.gray200} style={{ opacity: 0.1, transform: [{ rotate: '-15deg' }] }} />
                        </View>
                    </TouchableOpacity>
                </View>

                {formErrors.address && (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                        <Text style={styles.errorText}>Please select a service location</Text>
                    </View>
                )}
            </FadeInView>

            <FadeInView delay={200} style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Additional Details</Text>
                </View>

                <View style={styles.cardContainer}>
                    <FloatingLabelInput
                        label="Internal Notes (Gate code, landmarks, etc.)"
                        value={notes}
                        onChangeText={onNotesChange}
                        multiline
                        containerStyle={{ borderWidth: 1, borderColor: COLORS.gray200, backgroundColor: COLORS.gray50, borderRadius: 12 }}
                    />
                </View>
            </FadeInView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingBottom: 20,
    },
    sectionContainer: {
        marginBottom: 24,
    },
    sectionHeader: {
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#475569',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    cardContainerNoPadding: {
        backgroundColor: '#fff',
        borderRadius: 24,
        ...SHADOWS.sm,
        borderWidth: 1,
        borderColor: COLORS.gray100,
        overflow: 'hidden',
    },
    cardContainer: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        ...SHADOWS.sm,
        borderWidth: 1,
        borderColor: COLORS.gray100,
    },
    premiumLocationCard: {
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
        minHeight: 140,
    },
    locationHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        zIndex: 2,
    },
    locationIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    locationTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 4,
    },
    addressTag: {
        backgroundColor: '#DBEAFE',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    addressTagText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#1E40AF',
        textTransform: 'uppercase',
    },
    changeButton: {
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.gray200,
    },
    changeButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.primary,
    },
    addressDetails: {
        zIndex: 2,
    },
    addressText: {
        fontSize: 15,
        color: '#334155',
        lineHeight: 22,
    },
    mapPattern: {
        position: 'absolute',
        bottom: -20,
        right: -20,
        zIndex: 1,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        padding: 12,
        borderRadius: 12,
        marginTop: 12,
        gap: 8,
    },
    errorText: {
        fontSize: 13,
        color: COLORS.error,
        fontWeight: '500',
    },
});
