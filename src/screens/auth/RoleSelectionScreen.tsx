import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../utils/theme';
import { Logo } from '../../components/Logo';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export const RoleSelectionScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <View style={styles.content}>
        {/* Logo & Branding */}
        <View style={styles.header}>
          <Logo size="large" showText={true} variant="default" />
          <Text style={styles.tagline}>Your Home, Our Priority</Text>
        </View>

        {/* Welcome Text */}
        <View style={styles.welcomeSection}>
          <Text style={styles.title}>Welcome!</Text>
          <Text style={styles.subtitle}>
            How would you like to use YANN?
          </Text>
        </View>

        {/* Role Options */}
        <View style={styles.optionsContainer}>
          {/* Customer Option */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => navigation.navigate('Signup', { role: 'customer' })}
            activeOpacity={0.8}
          >
            <View style={styles.optionIconContainer}>
              <View style={[styles.optionIcon, { backgroundColor: '#E8F5F3' }]}>
                <Ionicons name="home-outline" size={28} color={COLORS.primary} />
              </View>
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Book Services</Text>
              <Text style={styles.optionDescription}>
                Find trusted professionals for your home needs
              </Text>
            </View>
            <View style={styles.arrowContainer}>
              <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
            </View>
          </TouchableOpacity>

          {/* Provider Option */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => navigation.navigate('ProviderSignup')}
            activeOpacity={0.8}
          >
            <View style={styles.optionIconContainer}>
              <View style={[styles.optionIcon, { backgroundColor: '#FFF3E8' }]}>
                <Ionicons name="briefcase-outline" size={28} color={COLORS.accent} />
              </View>
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Become a Partner</Text>
              <Text style={styles.optionDescription}>
                Join our network and grow your business
              </Text>
            </View>
            <View style={styles.arrowContainer}>
              <Ionicons name="chevron-forward" size={20} color={COLORS.accent} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Trust Badges */}
        <View style={styles.trustSection}>
          <View style={styles.trustItem}>
            <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
            <Text style={styles.trustNumber}>5K+</Text>
            <Text style={styles.trustLabel}>Verified Pros</Text>
          </View>
          <View style={styles.trustDivider} />
          <View style={styles.trustItem}>
            <Ionicons name="heart" size={20} color={COLORS.secondary} />
            <Text style={styles.trustNumber}>100K+</Text>
            <Text style={styles.trustLabel}>Happy Homes</Text>
          </View>
          <View style={styles.trustDivider} />
          <View style={styles.trustItem}>
            <Ionicons name="star" size={20} color={COLORS.accent} />
            <Text style={styles.trustNumber}>4.9</Text>
            <Text style={styles.trustLabel}>Rating</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 48,
    marginBottom: 40,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginTop: 12,
  },
  welcomeSection: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  optionIconContainer: {
    marginRight: 16,
  },
  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  arrowContainer: {
    marginLeft: 12,
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trustSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 48,
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  trustItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  trustNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 6,
  },
  trustLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  trustDivider: {
    width: 1,
    height: 50,
    backgroundColor: COLORS.border,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingBottom: 24,
  },
  footerText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  footerLink: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
