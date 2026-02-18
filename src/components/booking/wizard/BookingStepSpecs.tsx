import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS, RADIUS } from '../../../utils/theme';
import { CustomDateTimePicker } from '../../ui/CustomDateTimePicker';
import { FadeInView } from '../../animations/FadeInView';
import type { Service, ServiceProvider as Provider } from '../../../types';

interface BookingStepSpecsProps {
    service: Service;
    provider: any;
    bookingDate: Date | null;
    bookingTime: Date | null;
    endTime: Date | null;
    onDateChange: (date: Date) => void;
    onTimeChange: (date: Date) => void;
    onEndTimeChange: (date: Date) => void;
    bookedHours: number;
    basePrice: number;
    isHourlyService: boolean;
    hasOvertimeCharges: boolean;
    formErrors: any;
}

export const BookingStepSpecs: React.FC<BookingStepSpecsProps> = ({
    service,
    provider,
    bookingDate,
    bookingTime,
    endTime,
    onDateChange,
    onTimeChange,
    onEndTimeChange,
    bookedHours,
    basePrice,
    isHourlyService,
    hasOvertimeCharges,
    formErrors,
}) => {
    return (
        <View style={styles.container}>
            {/* 1. Service Info Card */}
            <FadeInView delay={100} style={styles.cardContainer}>
                <View style={styles.cardHighlight} />
                <View style={styles.serviceRow}>
                    <View style={styles.serviceIconContainer}>
                        <Ionicons name="briefcase-outline" size={26} color={COLORS.primary} />
                    </View>
                    <View style={styles.serviceInfo}>
                        <Text style={styles.serviceName}>{service.title}</Text>
                        <Text style={styles.serviceCategory}>{service.category}</Text>
                    </View>
                    <View style={styles.priceContainer}>
                        <Text style={styles.priceAmount}>₹{basePrice}</Text>
                        <Text style={styles.priceLabel}>/hr</Text>
                    </View>
                </View>

                {provider && (
                    <View style={styles.providerRow}>
                        {provider.profileImage ? (
                            <Image
                                source={{ uri: provider.profileImage }}
                                style={styles.providerAvatar}
                            />
                        ) : (
                            <View style={[styles.providerAvatar, { alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primaryGradientStart }]}>
                                <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>
                                    {provider.name?.charAt(0) || 'E'}
                                </Text>
                            </View>
                        )}
                        <View style={{ flex: 1 }}>
                            <Text style={styles.providerName}>{provider.name}</Text>
                            <View style={styles.ratingRow}>
                                <Ionicons name="star" size={12} color={COLORS.warning} />
                                <Text style={styles.ratingText}>{provider.rating ? provider.rating.toFixed(1) : 'New'}</Text>
                            </View>
                        </View>
                    </View>
                )}
            </FadeInView>

            {/* 2. Date & Time Selection */}
            <FadeInView delay={200} style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>When do you need it?</Text>
                </View>

                <View style={styles.cardContainerNoPadding}>
                    <View style={styles.pickerSection}>
                        <View style={{ gap: 16 }}>
                            {/* Date Picker */}
                            <CustomDateTimePicker
                                label="Select Date"
                                mode="date"
                                value={bookingDate}
                                onChange={onDateChange}
                                minimumDate={new Date()}
                                placeholder="Choose a date"
                                leftIcon="calendar"
                            />

                            {/* Start Time Picker */}
                            <CustomDateTimePicker
                                label="Select Start Time"
                                mode="time"
                                value={bookingTime}
                                onChange={onTimeChange}
                                placeholder="Choose start time"
                                leftIcon="time"
                            />

                            {/* End Time Picker - Only for Overtime/Hourly Services */}
                            {(hasOvertimeCharges || isHourlyService) && (
                                <View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        {bookedHours > 0 && (
                                            <View style={{ backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginLeft: 'auto' }}>
                                                <Text style={{ fontSize: 12, fontWeight: '600', color: '#4F46E5' }}>
                                                    {bookedHours.toFixed(1)} hours
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    <CustomDateTimePicker
                                        label="Select End Time"
                                        mode="time"
                                        value={endTime}
                                        onChange={onEndTimeChange}
                                        placeholder="Choose end time"
                                        leftIcon="time-outline"
                                    />

                                    {hasOvertimeCharges && bookedHours > 0 && (
                                        <View style={{ marginTop: 8, padding: 12, backgroundColor: '#FEF3C7', borderRadius: 8 }}>
                                            <Text style={{ fontSize: 12, color: '#92400E', fontWeight: '500' }}>
                                                ⚠️ Overtime charges may apply if job exceeds {bookedHours.toFixed(1)} hours
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>

                        {(formErrors.date || formErrors.time || formErrors.endTime) && (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                                <Text style={styles.errorText}>Please complete date and time selection</Text>
                            </View>
                        )}
                    </View>
                </View>
            </FadeInView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingBottom: 20,
    },
    cardContainer: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        ...SHADOWS.sm,
        borderWidth: 1,
        borderColor: COLORS.gray100,
        position: 'relative',
        overflow: 'hidden',
        marginBottom: 24,
    },
    cardContainerNoPadding: {
        backgroundColor: '#fff',
        borderRadius: 24,
        ...SHADOWS.sm,
        borderWidth: 1,
        borderColor: COLORS.gray100,
        overflow: 'hidden',
    },
    cardHighlight: {
        position: 'absolute',
        top: 0, left: 0, right: 0, height: 4,
        backgroundColor: COLORS.primary,
    },
    serviceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    serviceIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    serviceInfo: {
        flex: 1,
    },
    serviceName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 4,
    },
    serviceCategory: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    priceContainer: {
        alignItems: 'flex-end',
    },
    priceAmount: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.primary,
    },
    priceLabel: {
        fontSize: 12,
        color: '#64748B',
    },
    providerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    providerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    providerName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
        gap: 4,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#475569',
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
    pickerSection: {
        padding: 20,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        padding: 12,
        borderRadius: 12,
        marginTop: 16,
        gap: 8,
    },
    errorText: {
        fontSize: 13,
        color: COLORS.error,
        fontWeight: '500',
    },
});
