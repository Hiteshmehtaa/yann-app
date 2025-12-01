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
import { COLORS } from '../../utils/theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { Service } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{ params: { service: Service } }, 'params'>;
};

const SERVICE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'House Cleaning': 'sparkles',
  'Repairs & Maintenance': 'construct',
  'Delivery Services': 'bicycle',
  'Pet Care': 'paw',
  'Personal Assistant': 'briefcase',
  'Garden & Landscaping': 'leaf',
  'Full-Day Personal Driver': 'car-sport',
  'Pujari Services': 'flower',
};

export const ServiceDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { service } = route.params;
  const iconName = SERVICE_ICONS[service.title] || 'ellipse';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Details</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.heroIconContainer}>
            <Ionicons name={iconName} size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.heroTitle}>{service.title}</Text>
          {service.popular && (
            <View style={styles.popularBadge}>
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
                <View style={styles.featureIconContainer}>
                  <Ionicons name="checkmark" size={16} color={COLORS.primary} />
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
              <Ionicons name="time" size={20} color={COLORS.primary} />
              <Text style={styles.trustBadgeText}>On Time</Text>
            </View>
            <View style={styles.trustBadge}>
              <Ionicons name="star" size={20} color="#F59E0B" />
              <Text style={styles.trustBadgeText}>4.9 Rating</Text>
            </View>
          </View>

          {/* Pricing */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pricing</Text>
            <View style={styles.priceCard}>
              <View style={styles.priceHeader}>
                <Text style={styles.price}>{service.price}</Text>
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
          style={styles.bookButton}
          onPress={() => navigation.navigate('BookingForm', { service })}
          activeOpacity={0.8}
        >
          <Text style={styles.bookButtonText}>Book Now</Text>
          <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
  },
  headerSpacer: {
    width: 44,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  hero: {
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  heroIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  popularBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  popularText: {
    color: COLORS.white,
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
    backgroundColor: COLORS.background,
    borderRadius: 12,
  },
  featureIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
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
    backgroundColor: COLORS.background,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  trustBadgeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 6,
    fontWeight: '500',
  },
  priceCard: {
    backgroundColor: COLORS.primaryLight,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
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
    color: COLORS.primary,
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
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
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
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  bookButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
