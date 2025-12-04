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

export const PrivacyPolicyScreen: React.FC<Props> = ({ navigation }) => {
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
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.effectiveDate}>Effective Date: {EFFECTIVE_DATE}</Text>

          {/* What Data We Collect */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What Data We Collect</Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• Personal info: Name, Phone, Email, Address</Text>
              <Text style={styles.bulletItem}>• Location data (for service delivery)</Text>
              <Text style={styles.bulletItem}>• Ratings, chat messages, logs</Text>
              <Text style={styles.bulletItem}>• Payment details (securely processed)</Text>
            </View>
          </View>

          {/* How We Use It */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How We Use It</Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• Booking & scheduling services</Text>
              <Text style={styles.bulletItem}>• Customer support</Text>
              <Text style={styles.bulletItem}>• Analytics & app improvement</Text>
              <Text style={styles.bulletItem}>• Verification of users & providers</Text>
              <Text style={styles.bulletItem}>• Marketing notifications (opt-out anytime)</Text>
            </View>
          </View>

          {/* Data Sharing */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Sharing</Text>
            <Text style={styles.paragraph}>We may share with:</Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• Verified service providers</Text>
              <Text style={styles.bulletItem}>• Payment gateways</Text>
              <Text style={styles.bulletItem}>• Law enforcement when required</Text>
            </View>
            <View style={styles.highlightBox}>
              <Ionicons name="shield-checkmark" size={20} color={COLORS.success} />
              <Text style={styles.highlightText}>We never sell personal data.</Text>
            </View>
          </View>

          {/* Data Security */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Security</Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• Encrypted storage & secure servers</Text>
              <Text style={styles.bulletItem}>• Access restricted to authorized personnel</Text>
              <Text style={styles.bulletItem}>• Your data may be deleted upon request</Text>
            </View>
          </View>

          {/* Your Rights */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Rights</Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• Access your personal data</Text>
              <Text style={styles.bulletItem}>• Request data correction</Text>
              <Text style={styles.bulletItem}>• Request data deletion</Text>
              <Text style={styles.bulletItem}>• Opt-out of marketing communications</Text>
            </View>
          </View>

          {/* Contact */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Us</Text>
            <Text style={styles.paragraph}>
              For privacy-related queries, contact us at:
            </Text>
            <Text style={styles.contactEmail}>privacy@yann.care</Text>
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
  highlightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: `${COLORS.success}15`,
    padding: SPACING.md,
    borderRadius: RADIUS.medium,
    marginTop: SPACING.md,
  },
  highlightText: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '600',
    color: COLORS.success,
  },
  contactEmail: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
