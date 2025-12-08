import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../utils/theme';

interface Review {
  _id?: string;
  rating: number;
  comment: string;
  customerName?: string;
  createdAt?: string;
}

interface ProviderReviewsSectionProps {
  reviews: Review[];
  providerName: string;
}

export const ProviderReviewsSection: React.FC<ProviderReviewsSectionProps> = ({
  reviews,
  providerName,
}) => {
  if (!reviews || reviews.length === 0) return null;

  const topReviews = reviews.slice(0, 3);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <Ionicons name="star" size={20} color={COLORS.warning} />
        </View>
        <Text style={styles.title}>Reviews for {providerName}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.reviewsContainer}
      >
        {topReviews.map((review, index) => (
          <View key={review._id || index} style={styles.reviewCard}>
            {/* Rating Stars */}
            <View style={styles.starsRow}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Ionicons
                  key={`star-${review._id || index}-${i}`}
                  name={i < review.rating ? 'star' : 'star-outline'}
                  size={14}
                  color={i < review.rating ? COLORS.warning : COLORS.border}
                />
              ))}
            </View>

            {/* Review Comment */}
            <Text style={styles.comment} numberOfLines={3}>
              {review.comment}
            </Text>

            {/* Customer Name */}
            {review.customerName && (
              <View style={styles.customerRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {review.customerName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.customerName}>{review.customerName}</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {reviews.length > 3 && (
        <Text style={styles.moreText}>+{reviews.length - 3} more reviews</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 16,
    gap: 10,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${COLORS.warning}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  reviewsContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  reviewCard: {
    width: 280,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 10,
  },
  comment: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text,
    marginBottom: 12,
    minHeight: 60,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.background,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  customerName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  moreText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
});
