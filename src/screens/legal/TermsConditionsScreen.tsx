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
const COMPANY_NAME = 'Safe & Care Shuttle Ride Pvt Ltd';
const BRAND_NAME = 'Yann Home';

export const TermsConditionsScreen: React.FC<Props> = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: ANIMATIONS.slow,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.effectiveDate}>Effective Date: {EFFECTIVE_DATE}</Text>
          <Text style={styles.companyName}>Company: {COMPANY_NAME} ("{BRAND_NAME}", "we", "our", "us")</Text>

          {/* Section A */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>A. Introduction</Text>
            <Text style={styles.paragraph}>
              Welcome to {BRAND_NAME}, a home-services marketplace connecting customers with verified professionals ("Service Providers"). By accessing or using our platform (website, app, or any services), you agree to these Terms.
            </Text>
            <Text style={styles.paragraph}>
              If you do not agree, please do not use {BRAND_NAME}.
            </Text>
          </View>

          {/* Section B */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>B. Platform Role</Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• {BRAND_NAME} is only a facilitator connecting users and independent professionals.</Text>
              <Text style={styles.bulletItem}>• We are not the employer, agent, or representative of Service Providers.</Text>
            </View>
          </View>

          {/* Section C */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>C. User Eligibility</Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• Must be 18+ and capable of forming legal contracts.</Text>
              <Text style={styles.bulletItem}>• Provide accurate and verifiable information.</Text>
            </View>
          </View>

          {/* Section D */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>D. Booking & Payments</Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• Users must complete payments only through {BRAND_NAME} platform.</Text>
              <Text style={styles.bulletItem}>• Prices may vary based on service type, location & urgency.</Text>
              <Text style={styles.bulletItem}>• We may apply taxes or convenience fees.</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>E. User Conduct & Zero Tolerance Policy</Text>
            <Text style={styles.paragraph}>Users must NOT:</Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• Misuse the platform for illegal activities</Text>
              <Text style={styles.bulletItem}>• Harass, abuse, or engage in offensive behavior towards service providers</Text>
              <Text style={styles.bulletItem}>• Share fake reviews or cause fraudulent transactions</Text>
              <Text style={styles.bulletItem}>• Post or share any objectionable, offensive, or inappropriate content</Text>
            </View>
            <Text style={[styles.paragraph, { marginTop: 8, fontWeight: '700', color: COLORS.error }]}>
              Zero Tolerance Policy: We have a strict zero-tolerance policy for objectionable content and abusive behavior. Any user found violating these terms will be immediately banned, and their content removed. We commit to acting on reports of such behavior within 24 hours.
            </Text>
          </View>

          {/* Section F */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>F. Service Provider Responsibility</Text>
            <Text style={styles.paragraph}>Service providers are solely responsible for:</Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• Service quality</Text>
              <Text style={styles.bulletItem}>• Legal compliance</Text>
              <Text style={styles.bulletItem}>• Tools, safety, and required licenses</Text>
            </View>
          </View>

          {/* Section G */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>G. Cancellation & Refunds</Text>
            <Text style={styles.paragraph}>
              Refer to our Cancellation & Refund Policy for detailed information.
            </Text>
          </View>

          {/* Section H */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>H. Liability Limitation</Text>
            <Text style={styles.paragraph}>{BRAND_NAME} is not liable for:</Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• Personal disputes or service failures by third-party providers</Text>
              <Text style={styles.bulletItem}>• Loss, theft, or damage unless proven due to our negligence</Text>
              <Text style={styles.bulletItem}>• Maximum liability = total booking amount paid</Text>
            </View>
          </View>

          {/* Section I */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>I. Privacy</Text>
            <Text style={styles.paragraph}>
              We handle data as per our Privacy Policy.
            </Text>
          </View>

          {/* Section J */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>J. Intellectual Property</Text>
            <Text style={styles.paragraph}>
              All content, branding, and software belong to {BRAND_NAME}.
            </Text>
          </View>

          {/* Section K */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>K. Termination</Text>
            <Text style={styles.paragraph}>We can suspend or block accounts for:</Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• Violations</Text>
              <Text style={styles.bulletItem}>• Fraud</Text>
              <Text style={styles.bulletItem}>• Misconduct</Text>
            </View>
          </View>

          {/* Section L */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>L. Governing Law</Text>
            <Text style={styles.paragraph}>
              Under jurisdiction of India courts.
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
    marginBottom: SPACING.xs,
  },
  companyName: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  paragraph: {
    fontSize: TYPOGRAPHY.size.md,
    color: COLORS.textSecondary,
    lineHeight: 24,
    marginBottom: SPACING.sm,
  },
  bulletList: {
    marginLeft: SPACING.sm,
  },
  bulletItem: {
    fontSize: TYPOGRAPHY.size.md,
    color: COLORS.textSecondary,
    lineHeight: 24,
    marginBottom: SPACING.xs,
  },
});
