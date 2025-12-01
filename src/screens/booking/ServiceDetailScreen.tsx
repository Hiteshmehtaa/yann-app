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
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { Service } from '../../types';

// Dark Editorial Theme
const THEME = {
  bg: '#0A0A0A',
  bgCard: '#1A1A1A',
  bgElevated: '#242424',
  text: '#F5F0EB',
  textMuted: '#8A8A8A',
  accent: '#FF6B35',
  accentSoft: 'rgba(255, 107, 53, 0.12)',
  border: '#2A2A2A',
  gold: '#D4AF37',
};

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
      <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={THEME.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Details</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.heroIconContainer}>
            <Ionicons name={iconName} size={42} color={THEME.accent} />
          </View>
          <Text style={styles.heroTitle}>{service.title}</Text>
          {service.popular && (
            <View style={styles.popularBadge}>
              <Ionicons name="flame" size={12} color={THEME.accent} />
              <Text style={styles.popularText}>POPULAR</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Description */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.accentBar} />
              <Text style={styles.sectionTitle}>ABOUT</Text>
            </View>
            <Text style={styles.description}>{service.description}</Text>
          </View>

          {/* Features */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.accentBar} />
              <Text style={styles.sectionTitle}>INCLUDED</Text>
            </View>
            {service.features.map((feature, index) => (
              <View key={`feature-${index}`} style={styles.featureItem}>
                <View style={styles.featureIconContainer}>
                  <Ionicons name="checkmark" size={14} color={THEME.accent} />
                </View>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          {/* Trust Badges */}
          <View style={styles.trustBadges}>
            <View style={styles.trustBadge}>
              <Ionicons name="shield-checkmark" size={18} color={THEME.accent} />
              <Text style={styles.trustBadgeText}>VERIFIED</Text>
            </View>
            <View style={styles.trustBadge}>
              <Ionicons name="time" size={18} color={THEME.accent} />
              <Text style={styles.trustBadgeText}>ON TIME</Text>
            </View>
            <View style={styles.trustBadge}>
              <Ionicons name="star" size={18} color={THEME.gold} />
              <Text style={styles.trustBadgeText}>4.9</Text>
            </View>
          </View>

          {/* Pricing */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.accentBar} />
              <Text style={styles.sectionTitle}>PRICING</Text>
            </View>
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
          <Text style={styles.bottomPriceLabel}>STARTING AT</Text>
          <Text style={styles.bottomPrice}>{service.price}</Text>
        </View>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => navigation.navigate('BookingForm', { service })}
          activeOpacity={0.8}
        >
          <Text style={styles.bookButtonText}>BOOK NOW</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: THEME.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.text,
    letterSpacing: 1,
  },
  headerSpacer: {
    width: 44,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  hero: {
    paddingTop: 40,
    paddingBottom: 36,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: THEME.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  heroIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: THEME.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: THEME.text,
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: -1,
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.accentSoft,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  popularText: {
    color: THEME.accent,
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  accentBar: {
    width: 3,
    height: 18,
    backgroundColor: THEME.accent,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.text,
    letterSpacing: 2,
  },
  description: {
    fontSize: 15,
    color: THEME.textMuted,
    lineHeight: 26,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: THEME.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  featureIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: THEME.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: THEME.text,
    fontWeight: '500',
  },
  trustBadges: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
    gap: 8,
  },
  trustBadge: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
    backgroundColor: THEME.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  trustBadgeText: {
    fontSize: 10,
    color: THEME.textMuted,
    marginTop: 8,
    fontWeight: '700',
    letterSpacing: 1,
  },
  priceCard: {
    backgroundColor: THEME.bgCard,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.accent,
  },
  priceHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 10,
  },
  price: {
    fontSize: 32,
    fontWeight: '800',
    color: THEME.accent,
    letterSpacing: -1,
  },
  priceLabel: {
    fontSize: 14,
    color: THEME.textMuted,
  },
  priceNote: {
    fontSize: 13,
    color: THEME.textMuted,
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
    backgroundColor: THEME.bg,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
  },
  bottomPriceContainer: {
    flex: 1,
  },
  bottomPriceLabel: {
    fontSize: 10,
    color: THEME.textMuted,
    letterSpacing: 1,
    marginBottom: 2,
  },
  bottomPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.text,
    letterSpacing: -0.5,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.accent,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  bookButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
