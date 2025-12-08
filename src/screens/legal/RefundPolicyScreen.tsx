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

export const RefundPolicyScreen: React.FC<Props> = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: ANIMATIONS.slow,
      useNativeDriver: true,
    }).start();
  }, []);

  const refundScenarios = [
    {
      scenario: 'User cancels before provider assigned',
      policy: 'Full refund',
      icon: 'checkmark-circle' as const,
      color: COLORS.success,
    },
    {
      scenario: 'User cancels after provider assigned',
      policy: 'Partial refund (visit charges deducted)',
      icon: 'remove-circle' as const,
      color: COLORS.warning,
    },
    {
      scenario: 'Service Provider cancels',
      policy: 'Full refund + replacement option',
      icon: 'checkmark-circle' as const,
      color: COLORS.success,
    },
    {
      scenario: 'Service quality issue',
      policy: 'Investigation first → partial/full refund',
      icon: 'search' as const,
      color: COLORS.info,
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
        <Text style={styles.headerTitle}>Refund Policy</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.effectiveDate}>Effective Date: {EFFECTIVE_DATE}</Text>

          <Text style={styles.intro}>
            At {BRAND_NAME}, we strive to ensure customer satisfaction. Here's our cancellation and refund policy:
          </Text>

          {/* Refund Scenarios */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Refund Scenarios</Text>
            {refundScenarios.map((item) => (
              <View key={item.scenario} style={styles.scenarioCard}>
                <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
                  <Ionicons name={item.icon} size={24} color={item.color} />
                </View>
                <View style={styles.scenarioContent}>
                  <Text style={styles.scenarioTitle}>{item.scenario}</Text>
                  <Text style={[styles.scenarioPolicy, { color: item.color }]}>{item.policy}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Processing Time */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Refund Processing Time</Text>
            <View style={styles.highlightBox}>
              <Ionicons name="time-outline" size={24} color={COLORS.primary} />
              <View style={styles.highlightContent}>
                <Text style={styles.highlightTitle}>5-7 Working Days</Text>
                <Text style={styles.highlightSubtext}>Refunds reflect in original payment method</Text>
              </View>
            </View>
          </View>

          {/* How to Request */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How to Request a Refund</Text>
            <View style={styles.stepsList}>
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
                <Text style={styles.stepText}>Go to "My Bookings" in the app</Text>
              </View>
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
                <Text style={styles.stepText}>Select the booking you want to cancel</Text>
              </View>
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
                <Text style={styles.stepText}>Tap "Cancel Booking" and select reason</Text>
              </View>
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}><Text style={styles.stepNumberText}>4</Text></View>
                <Text style={styles.stepText}>Refund will be processed automatically</Text>
              </View>
            </View>
          </View>

          {/* Exceptions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Exceptions</Text>
            <View style={styles.warningBox}>
              <Ionicons name="alert-circle" size={20} color={COLORS.error} />
              <Text style={styles.warningText}>
                Refunds may not be applicable for completed services or if cancellation is made less than 30 minutes before scheduled time.
              </Text>
            </View>
          </View>

          {/* Contact */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Need Help?</Text>
            <Text style={styles.paragraph}>
              For refund-related queries, contact our support team:
            </Text>
            <Text style={styles.contactEmail}>support@yann.care</Text>
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
  scenarioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    padding: SPACING.md,
    borderRadius: RADIUS.medium,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  scenarioContent: {
    flex: 1,
  },
  scenarioTitle: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  scenarioPolicy: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '600',
  },
  highlightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: `${COLORS.primary}10`,
    padding: SPACING.lg,
    borderRadius: RADIUS.medium,
  },
  highlightContent: {
    flex: 1,
  },
  highlightTitle: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: '700',
    color: COLORS.primary,
  },
  highlightSubtext: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  stepsList: {
    gap: SPACING.sm,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '700',
    color: COLORS.white,
  },
  stepText: {
    flex: 1,
    fontSize: TYPOGRAPHY.size.md,
    color: COLORS.textSecondary,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    backgroundColor: `${COLORS.error}10`,
    padding: SPACING.md,
    borderRadius: RADIUS.medium,
  },
  warningText: {
    flex: 1,
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  contactEmail: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
