import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY, ANIMATIONS } from '../../utils/theme';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

const EFFECTIVE_DATE = 'December 4, 2025';
const BRAND_NAME = 'Yann Home';

export const ProviderTermsScreen: React.FC<Props> = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: ANIMATIONS.slow,
      useNativeDriver: true,
    }).start();
  }, []);

  const requirements = [
    { icon: 'id-card' as const, text: 'Valid Government ID (Aadhar/PAN)' },
    { icon: 'shield-checkmark' as const, text: 'Background verification clearance' },
    { icon: 'school' as const, text: 'Skill training and certification' },
    { icon: 'phone-portrait' as const, text: 'Smartphone with Yann Partner App' },
    { icon: 'business' as const, text: 'Bank account for payments' },
    { icon: 'checkmark-done' as const, text: 'Clean criminal record' },
  ];

  const obligations = [
    'Maintain professionalism during all service interactions',
    'Arrive on time for scheduled services',
    'Wear clean, appropriate attire as per service category',
    'Carry valid ID and Yann Partner badge',
    'Follow safety and hygiene protocols',
    'Respect customer privacy and property',
    'Report any incidents or concerns immediately',
  ];

  const prohibitions = [
    'Accepting direct payments outside the platform',
    'Sharing customer information with third parties',
    'Engaging in any form of misconduct or harassment',
    'Providing services under influence of alcohol/drugs',
    'Using customer facilities without permission',
    'Bringing unauthorized persons to service location',
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Provider Terms</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.effectiveDate}>Effective Date: {EFFECTIVE_DATE}</Text>

          <Text style={styles.intro}>
            Welcome to the {BRAND_NAME} Service Provider community. By joining our platform, you agree to the following terms and conditions.
          </Text>

          {/* Eligibility */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Eligibility Requirements</Text>
            <View style={styles.requirementsGrid}>
              {requirements.map((item) => (
                <View key={item.text} style={styles.requirementItem}>
                  <View style={styles.requirementIcon}>
                    <Ionicons name={item.icon} size={20} color={COLORS.primary} />
                  </View>
                  <Text style={styles.requirementText}>{item.text}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Payment Terms */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment & Earnings</Text>
            <View style={styles.card}>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Commission Structure</Text>
                <Text style={styles.paymentValue}>15-20% platform fee</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Payout Frequency</Text>
                <Text style={styles.paymentValue}>Weekly (Every Monday)</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Minimum Payout</Text>
                <Text style={styles.paymentValue}>₹500</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Payment Method</Text>
                <Text style={styles.paymentValue}>Direct Bank Transfer</Text>
              </View>
            </View>
          </View>

          {/* Provider Obligations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Provider Obligations</Text>
            <View style={styles.card}>
              {obligations.map((item) => (
                <View key={item} style={styles.listItem}>
                  <View style={styles.checkIcon}>
                    <Ionicons name="checkmark" size={14} color={COLORS.white} />
                  </View>
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Prohibited Activities */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Prohibited Activities</Text>
            <View style={[styles.card, styles.warningCard]}>
              {prohibitions.map((item) => (
                <View key={item} style={styles.listItem}>
                  <View style={styles.crossIcon}>
                    <Ionicons name="close" size={14} color={COLORS.white} />
                  </View>
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Ratings & Reviews */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ratings & Performance</Text>
            <Text style={styles.paragraph}>
              Your performance is evaluated based on:
            </Text>
            <View style={styles.ratingFactors}>
              <View style={styles.ratingFactor}>
                <Text style={styles.ratingFactorLabel}>Customer Ratings</Text>
                <Text style={styles.ratingFactorDesc}>Maintain 4.0+ star rating</Text>
              </View>
              <View style={styles.ratingFactor}>
                <Text style={styles.ratingFactorLabel}>Completion Rate</Text>
                <Text style={styles.ratingFactorDesc}>Complete 95%+ of accepted bookings</Text>
              </View>
              <View style={styles.ratingFactor}>
                <Text style={styles.ratingFactorLabel}>Response Time</Text>
                <Text style={styles.ratingFactorDesc}>Respond within 5 minutes</Text>
              </View>
            </View>
          </View>

          {/* Termination */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Termination</Text>
            <Text style={styles.paragraph}>
              {BRAND_NAME} reserves the right to suspend or terminate provider accounts for:
            </Text>
            <View style={styles.terminationReasons}>
              <Text style={styles.bulletPoint}>• Violation of these terms</Text>
              <Text style={styles.bulletPoint}>• Consistent poor ratings (below 3.5 stars)</Text>
              <Text style={styles.bulletPoint}>• Customer complaints or misconduct</Text>
              <Text style={styles.bulletPoint}>• Fraudulent activity or false information</Text>
              <Text style={styles.bulletPoint}>• Failure to complete background verification</Text>
            </View>
          </View>

          {/* Agreement */}
          <View style={styles.agreementBox}>
            <Ionicons name="document-text" size={24} color={COLORS.primary} />
            <Text style={styles.agreementText}>
              By continuing to use the Yann Partner platform, you acknowledge that you have read, understood, and agree to these terms.
            </Text>
          </View>

          <View style={{ height: 100 }} />
        </Animated.View>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    padding: SPACING.lg,
  },
  effectiveDate: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  intro: {
    fontSize: TYPOGRAPHY.size.md,
    color: COLORS.textSecondary,
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  paragraph: {
    fontSize: TYPOGRAPHY.size.md,
    color: COLORS.textSecondary,
    lineHeight: 24,
    marginBottom: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.medium,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  warningCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  requirementsGrid: {
    gap: SPACING.sm,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.cardBg,
    padding: SPACING.md,
    borderRadius: RADIUS.medium,
    ...SHADOWS.sm,
  },
  requirementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requirementText: {
    flex: 1,
    fontSize: TYPOGRAPHY.size.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  paymentLabel: {
    fontSize: TYPOGRAPHY.size.md,
    color: COLORS.textSecondary,
  },
  paymentValue: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  checkIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  crossIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  listText: {
    flex: 1,
    fontSize: TYPOGRAPHY.size.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  ratingFactors: {
    gap: SPACING.sm,
  },
  ratingFactor: {
    backgroundColor: COLORS.cardBg,
    padding: SPACING.md,
    borderRadius: RADIUS.medium,
    ...SHADOWS.sm,
  },
  ratingFactorLabel: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  ratingFactorDesc: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  terminationReasons: {
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  bulletPoint: {
    fontSize: TYPOGRAPHY.size.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  agreementBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    backgroundColor: `${COLORS.primary}10`,
    padding: SPACING.lg,
    borderRadius: RADIUS.medium,
    marginTop: SPACING.xl,
  },
  agreementText: {
    flex: 1,
    fontSize: TYPOGRAPHY.size.md,
    color: COLORS.text,
    lineHeight: 22,
  },
});
