import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../utils/theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { Service } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{ params: { service: Service } }, 'params'>;
};

const SERVICE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'House Cleaning': 'sparkles-outline',
  'Repairs & Maintenance': 'hammer-outline',
  'Delivery Services': 'bicycle-outline',
  'Pet Care': 'paw-outline',
  'Personal Assistant': 'briefcase-outline',
  'Garden & Landscaping': 'leaf-outline',
  'Full-Day Personal Driver': 'car-sport-outline',
  'Pujari Services': 'flower-outline',
};

const SERVICE_COLORS: Record<string, { bg: string; icon: string }> = {
  'House Cleaning': { bg: '#E8F5F3', icon: COLORS.primary },
  'Repairs & Maintenance': { bg: '#FFF3E8', icon: COLORS.accent },
  'Delivery Services': { bg: '#F0E8FF', icon: '#7C3AED' },
  'Pet Care': { bg: '#FFE8EE', icon: '#EC4899' },
  'Personal Assistant': { bg: '#E8F0FF', icon: '#3B82F6' },
  'Garden & Landscaping': { bg: '#E8FFE8', icon: '#22C55E' },
  'Full-Day Personal Driver': { bg: '#FFF8E8', icon: '#F59E0B' },
  'Pujari Services': { bg: '#FFE8E8', icon: '#EF4444' },
};

export const ServiceDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { service } = route.params;
  const iconName = SERVICE_ICONS[service.title] || 'ellipse-outline';
  const colors = SERVICE_COLORS[service.title] || { bg: COLORS.backgroundAlt, icon: COLORS.primary };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Details</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={[styles.heroIconContainer, { backgroundColor: colors.bg }]}>
            <Ionicons name={iconName} size={48} color={colors.icon} />
          </View>
          <Text style={styles.heroTitle}>{service.title}</Text>
          {service.popular && (
            <View style={[styles.popularBadge, { backgroundColor: colors.icon }]}>
              <Ionicons name="flame" size={12} color="#FFFFFF" />
              <Text style={styles.popularText}>Popular Choice</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About this service</Text>
            <Text style={styles.description}>{service.description}</Text>
          </View>

          {/* Features */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What's included</Text>
            {service.features.map((feature, index) => (
              <View key={`feature-${index}`} style={styles.featureItem}>
                <View style={[styles.featureIconContainer, { backgroundColor: colors.bg }]}>
                  <Ionicons name="checkmark" size={16} color={colors.icon} />
                </View>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          {/* Trust Badges */}
          <View style={styles.trustBadges}>
            <View style={styles.trustBadge}>
              <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
              <Text style={styles.trustBadgeText}>Verified</Text>
            </View>
            <View style={styles.trustBadge}>
              <Ionicons name="time" size={20} color={COLORS.accent} />
              <Text style={styles.trustBadgeText}>On Time</Text>
            </View>
            <View style={styles.trustBadge}>
              <Ionicons name="star" size={20} color={COLORS.warning} />
              <Text style={styles.trustBadgeText}>4.9 Rating</Text>
            </View>
          </View>

          {/* Pricing */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pricing</Text>
            <View style={[styles.priceCard, { borderLeftColor: colors.icon }]}>
              <View style={styles.priceHeader}>
                <Text style={[styles.price, { color: colors.icon }]}>{service.price}</Text>
                <Text style={styles.priceLabel}>onwards</Text>
              </View>
              <Text style={styles.priceNote}>
                Final price may vary based on your specific requirements
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Button */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceContainer}>
          <Text style={styles.bottomPriceLabel}>Starting at</Text>
          <Text style={styles.bottomPrice}>{service.price}</Text>
        </View>
        <TouchableOpacity
          style={[styles.bookButton, { backgroundColor: colors.icon }]}
          onPress={() => navigation.navigate('BookingForm', { service })}
          activeOpacity={0.8}
        >
          <Text style={styles.bookButtonText}>Book Now</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  hero: {
    paddingTop: 24,
    paddingBottom: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  heroIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    ...SHADOWS.md,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  popularText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  featureIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  trustBadges: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  trustBadge: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  trustBadgeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 6,
    fontWeight: '500',
  },
  priceCard: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    ...SHADOWS.sm,
  },
  priceHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 8,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
  },
  priceLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  priceNote: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.lg,
  },
  bottomPriceContainer: {
    flex: 1,
  },
  bottomPriceLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  bottomPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    ...SHADOWS.md,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
