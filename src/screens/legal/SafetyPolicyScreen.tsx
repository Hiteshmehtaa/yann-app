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

export const SafetyPolicyScreen: React.FC<Props> = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: ANIMATIONS.slow,
      useNativeDriver: true,
    }).start();
  }, []);

  const safetyMeasures = [
    {
      icon: 'shield-checkmark' as const,
      title: 'Background Verified',
      description: 'All service partners undergo thorough police verification and background checks',
    },
    {
      icon: 'id-card' as const,
      title: 'Identity Verified',
      description: 'Aadhar-based KYC verification for all partners ensuring genuine identity',
    },
    {
      icon: 'school' as const,
      title: 'Skill Trained',
      description: 'Partners complete mandatory skill training and certification programs',
    },
    {
      icon: 'location' as const,
      title: 'Live Tracking',
      description: 'Real-time location tracking during service for your peace of mind',
    },
    {
      icon: 'call' as const,
      title: 'Emergency Support',
      description: '24/7 emergency helpline and instant support at your fingertips',
    },
    {
      icon: 'shield' as const,
      title: 'Insurance Covered',
      description: 'All services include insurance coverage for damages and incidents',
    },
  ];

  const qualityStandards = [
    'Punctuality - Partners arrive within the scheduled time window',
    'Professionalism - Courteous behavior and proper attire',
    'Hygiene - Clean equipment and proper sanitation practices',
    'Completeness - All agreed services delivered as promised',
    'Communication - Clear updates and transparent pricing',
  ];

  const sosFeatures = [
    {
      icon: 'alert-circle' as const,
      title: 'SOS Button',
      description: 'One-tap emergency alert to our safety team',
      color: COLORS.error,
    },
    {
      icon: 'people' as const,
      title: 'Share Trip',
      description: 'Share service details with trusted contacts',
      color: COLORS.info,
    },
    {
      icon: 'recording' as const,
      title: 'Audio Recording',
      description: 'Optional audio recording during service',
      color: COLORS.warning,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Safety & Quality</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.effectiveDate}>Effective Date: {EFFECTIVE_DATE}</Text>

          {/* Hero Section */}
          <View style={styles.heroCard}>
            <Ionicons name="shield-checkmark" size={48} color={COLORS.primary} />
            <Text style={styles.heroTitle}>Your Safety, Our Priority</Text>
            <Text style={styles.heroText}>
              At {BRAND_NAME}, we've implemented comprehensive safety measures to ensure every service experience is secure and trustworthy.
            </Text>
          </View>

          {/* Safety Measures */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Our Safety Measures</Text>
            <View style={styles.measuresGrid}>
              {safetyMeasures.map((item, index) => (
                <View key={index} style={styles.measureCard}>
                  <View style={styles.measureIcon}>
                    <Ionicons name={item.icon} size={24} color={COLORS.primary} />
                  </View>
                  <View style={styles.measureContent}>
                    <Text style={styles.measureTitle}>{item.title}</Text>
                    <Text style={styles.measureDescription}>{item.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Quality Standards */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quality Standards</Text>
            <View style={styles.card}>
              <Text style={styles.cardIntro}>
                Every service on our platform adheres to strict quality benchmarks:
              </Text>
              {qualityStandards.map((item, index) => (
                <View key={index} style={styles.qualityItem}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                  <Text style={styles.qualityText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* SOS Features */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Emergency Features</Text>
            <View style={styles.sosGrid}>
              {sosFeatures.map((item, index) => (
                <View key={index} style={styles.sosCard}>
                  <View style={[styles.sosIcon, { backgroundColor: `${item.color}15` }]}>
                    <Ionicons name={item.icon} size={24} color={item.color} />
                  </View>
                  <Text style={styles.sosTitle}>{item.title}</Text>
                  <Text style={styles.sosDescription}>{item.description}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Reporting */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Report a Concern</Text>
            <View style={styles.reportCard}>
              <Text style={styles.reportText}>
                We take all safety concerns seriously. If you experience any issues:
              </Text>
              <View style={styles.reportOptions}>
                <View style={styles.reportOption}>
                  <Ionicons name="chatbubble" size={20} color={COLORS.primary} />
                  <Text style={styles.reportOptionText}>In-app Report</Text>
                </View>
                <View style={styles.reportOption}>
                  <Ionicons name="mail" size={20} color={COLORS.primary} />
                  <Text style={styles.reportOptionText}>safety@yann.care</Text>
                </View>
                <View style={styles.reportOption}>
                  <Ionicons name="call" size={20} color={COLORS.primary} />
                  <Text style={styles.reportOptionText}>24/7 Helpline</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Commitment */}
          <View style={styles.commitmentBox}>
            <Text style={styles.commitmentTitle}>Our Commitment</Text>
            <Text style={styles.commitmentText}>
              We continuously improve our safety protocols based on feedback and industry best practices. Your trust is our most valuable asset.
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
  heroCard: {
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: RADIUS.large,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  heroTitle: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  heroText: {
    fontSize: TYPOGRAPHY.size.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
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
  measuresGrid: {
    gap: SPACING.sm,
  },
  measureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.cardBg,
    padding: SPACING.md,
    borderRadius: RADIUS.medium,
    ...SHADOWS.sm,
  },
  measureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  measureContent: {
    flex: 1,
  },
  measureTitle: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  measureDescription: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.medium,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  cardIntro: {
    fontSize: TYPOGRAPHY.size.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  qualityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  qualityText: {
    flex: 1,
    fontSize: TYPOGRAPHY.size.md,
    color: COLORS.text,
    lineHeight: 22,
  },
  sosGrid: {
    gap: SPACING.sm,
  },
  sosCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.medium,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  sosIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sosTitle: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  sosDescription: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  reportCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.medium,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  reportText: {
    fontSize: TYPOGRAPHY.size.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  reportOptions: {
    gap: SPACING.sm,
  },
  reportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  reportOptionText: {
    fontSize: TYPOGRAPHY.size.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  commitmentBox: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.large,
    padding: SPACING.xl,
    marginTop: SPACING.lg,
  },
  commitmentTitle: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.sm,
  },
  commitmentText: {
    fontSize: TYPOGRAPHY.size.md,
    color: COLORS.white,
    lineHeight: 22,
    opacity: 0.9,
  },
});
