import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../utils/theme';

type RatingModalProps = {
    visible: boolean;
    onClose: () => void;
    onSubmit: (rating: number, comment: string) => Promise<void>;
    providerName: string;
    serviceName: string;
};

export const RatingModal: React.FC<RatingModalProps> = ({
    visible,
    onClose,
    onSubmit,
    providerName,
    serviceName,
}) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert('Rating Required', 'Please select a rating before submitting');
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit(rating, comment);
            // Reset form
            setRating(0);
            setComment('');
            onClose();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to submit rating');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStars = () => {
        return (
            <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                        key={star}
                        onPress={() => setRating(star)}
                        style={styles.starButton}
                        disabled={isSubmitting}
                    >
                        <Ionicons
                            name={star <= rating ? 'star' : 'star-outline'}
                            size={40}
                            color={star <= rating ? '#FBBF24' : '#D1D5DB'}
                        />
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.title}>Rate Your Experience</Text>
                            <TouchableOpacity
                                onPress={onClose}
                                style={styles.closeButton}
                                disabled={isSubmitting}
                            >
                                <Ionicons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        {/* Provider Info */}
                        <View style={styles.providerInfo}>
                            <View style={styles.providerAvatar}>
                                <Text style={styles.providerInitial}>
                                    {providerName.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <View style={styles.providerDetails}>
                                <Text style={styles.providerName}>{providerName}</Text>
                                <Text style={styles.serviceName}>{serviceName}</Text>
                            </View>
                        </View>

                        {/* Star Rating */}
                        <View style={styles.ratingSection}>
                            <Text style={styles.sectionLabel}>How was your experience?</Text>
                            {renderStars()}
                            {rating > 0 && (
                                <Text style={styles.ratingText}>
                                    {rating === 1 && 'Poor'}
                                    {rating === 2 && 'Fair'}
                                    {rating === 3 && 'Good'}
                                    {rating === 4 && 'Very Good'}
                                    {rating === 5 && 'Excellent'}
                                </Text>
                            )}
                        </View>

                        {/* Comment */}
                        <View style={styles.commentSection}>
                            <Text style={styles.sectionLabel}>
                                Share your feedback (Optional)
                            </Text>
                            <TextInput
                                style={styles.commentInput}
                                placeholder="Tell us about your experience..."
                                placeholderTextColor={COLORS.textTertiary}
                                value={comment}
                                onChangeText={setComment}
                                multiline
                                numberOfLines={4}
                                maxLength={500}
                                textAlignVertical="top"
                                editable={!isSubmitting}
                            />
                            <Text style={styles.charCount}>{comment.length}/500</Text>
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={isSubmitting}
                        >
                            <LinearGradient
                                colors={['#60A5FA', '#3B82F6']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.submitGradient}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Text style={styles.submitText}>Submit Rating</Text>
                                        <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 20,
        paddingHorizontal: 24,
        paddingBottom: 40,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.text,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    providerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
    },
    providerAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    providerInitial: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    providerDetails: {
        flex: 1,
    },
    providerName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 4,
    },
    serviceName: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    ratingSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    sectionLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 16,
        alignSelf: 'flex-start',
    },
    starsContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    starButton: {
        padding: 4,
    },
    ratingText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.primary,
        marginTop: 8,
    },
    commentSection: {
        marginBottom: 24,
    },
    commentInput: {
        backgroundColor: COLORS.background,
        borderRadius: 12,
        padding: 16,
        fontSize: 15,
        color: COLORS.text,
        minHeight: 120,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    charCount: {
        fontSize: 12,
        color: COLORS.textSecondary,
        textAlign: 'right',
        marginTop: 8,
    },
    submitButton: {
        borderRadius: 12,
        overflow: 'hidden',
        ...SHADOWS.md,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    submitText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
