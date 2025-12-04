import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY, ANIMATIONS } from '../../utils/theme';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    question: 'How do I book a service?',
    answer: 'Browse services on the home screen, select a service, choose a provider, and fill in the booking form with your details.',
  },
  {
    question: 'How can I cancel a booking?',
    answer: 'Go to My Bookings, select the booking you want to cancel, and tap on Cancel Booking. Cancellation policies may apply.',
  },
  {
    question: 'What payment methods are accepted?',
    answer: 'We accept cash, UPI, and card payments. You can choose your preferred method during booking.',
  },
  {
    question: 'How are service providers verified?',
    answer: 'All providers go through a thorough verification process including ID verification, background checks, and skill assessment.',
  },
  {
    question: 'What if I\'m not satisfied with a service?',
    answer: 'Contact our support team within 24 hours of service completion. We\'ll work to resolve your concern or provide appropriate compensation.',
  },
];

export const HelpSupportScreen: React.FC<Props> = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [expandedFAQ, setExpandedFAQ] = React.useState<number | null>(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: ANIMATIONS.slow,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@yann.care');
  };

  const handleCallSupport = () => {
    Linking.openURL('tel:+911234567890');
  };

  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/911234567890');
  };

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Contact Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CONTACT US</Text>
            <View style={styles.contactGrid}>
              <TouchableOpacity style={styles.contactCard} onPress={handleCallSupport}>
                <View style={[styles.contactIcon, { backgroundColor: `${COLORS.success}15` }]}>
                  <Ionicons name="call-outline" size={24} color={COLORS.success} />
                </View>
                <Text style={styles.contactLabel}>Call Us</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.contactCard} onPress={handleContactSupport}>
                <View style={[styles.contactIcon, { backgroundColor: `${COLORS.primary}15` }]}>
                  <Ionicons name="mail-outline" size={24} color={COLORS.primary} />
                </View>
                <Text style={styles.contactLabel}>Email</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.contactCard} onPress={handleWhatsApp}>
                <View style={[styles.contactIcon, { backgroundColor: `${COLORS.success}15` }]}>
                  <Ionicons name="logo-whatsapp" size={24} color={COLORS.success} />
                </View>
                <Text style={styles.contactLabel}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* FAQ Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>FREQUENTLY ASKED QUESTIONS</Text>
            <View style={styles.faqList}>
              {FAQ_DATA.map((faq, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.faqItem,
                    index === FAQ_DATA.length - 1 && styles.faqItemLast
                  ]}
                  onPress={() => toggleFAQ(index)}
                  activeOpacity={0.7}
                >
                  <View style={styles.faqHeader}>
                    <Text style={styles.faqQuestion}>{faq.question}</Text>
                    <Ionicons 
                      name={expandedFAQ === index ? 'chevron-up' : 'chevron-down'} 
                      size={20} 
                      color={COLORS.textTertiary} 
                    />
                  </View>
                  {expandedFAQ === index && (
                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Quick Links */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>QUICK LINKS</Text>
            <View style={styles.linksList}>
              <TouchableOpacity style={styles.linkItem} onPress={() => navigation.navigate('Terms' as never)}>
                <View style={styles.linkLeft}>
                  <Ionicons name="document-text-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.linkText}>Terms of Service</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.linkItem} onPress={() => navigation.navigate('Privacy' as never)}>
                <View style={styles.linkLeft}>
                  <Ionicons name="shield-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.linkText}>Privacy Policy</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.linkItem} onPress={() => navigation.navigate('RefundPolicy' as never)}>
                <View style={styles.linkLeft}>
                  <Ionicons name="card-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.linkText}>Refund Policy</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.linkItem} onPress={() => navigation.navigate('SafetyPolicy' as never)}>
                <View style={styles.linkLeft}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.linkText}>Safety & Quality</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.linkItem, styles.linkItemLast]} onPress={handleContactSupport}>
                <View style={styles.linkLeft}>
                  <Ionicons name="chatbubble-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.linkText}>Give Feedback</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Support Hours */}
          <View style={styles.infoCard}>
            <Ionicons name="time-outline" size={20} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Support Hours</Text>
              <Text style={styles.infoText}>Monday - Saturday: 9 AM - 9 PM</Text>
              <Text style={styles.infoText}>Sunday: 10 AM - 6 PM</Text>
            </View>
          </View>
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
    paddingBottom: 100,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
    marginBottom: SPACING.md,
  },
  contactGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  contactCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.large,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  contactIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  contactLabel: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  faqList: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.large,
    ...SHADOWS.sm,
  },
  faqItem: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  faqItemLast: {
    borderBottomWidth: 0,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '600',
    color: COLORS.text,
    marginRight: SPACING.sm,
  },
  faqAnswer: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    lineHeight: 20,
  },
  linksList: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.large,
    ...SHADOWS.sm,
  },
  linkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  linkItemLast: {
    borderBottomWidth: 0,
  },
  linkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  linkText: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.large,
    padding: SPACING.lg,
    gap: SPACING.md,
    ...SHADOWS.sm,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  infoText: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});
