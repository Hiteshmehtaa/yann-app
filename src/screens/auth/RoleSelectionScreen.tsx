import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export const RoleSelectionScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoSection}>
          <Image 
            source={require('../../../public/download.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brandName}>YANN</Text>
          <Text style={styles.tagline}>Home Services Made Simple</Text>
        </View>

        {/* Welcome Text */}
        <View style={styles.welcomeSection}>
          <Text style={styles.title}>Get Started</Text>
          <Text style={styles.subtitle}>
            Choose how you'd like to use YANN
          </Text>
        </View>

        {/* Role Options */}
        <View style={styles.optionsContainer}>
          {/* Customer Option */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => navigation.navigate('Signup', { role: 'customer' })}
            activeOpacity={0.7}
          >
            <View style={styles.optionIcon}>
              <Ionicons name="home" size={28} color={COLORS.primary} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>I need services</Text>
              <Text style={styles.optionDescription}>
                Book trusted professionals for your home
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={COLORS.primary} />
          </TouchableOpacity>

          {/* Provider Option */}
          <TouchableOpacity
            style={[styles.optionCard, styles.optionCardOutline]}
            onPress={() => navigation.navigate('ProviderSignup')}
            activeOpacity={0.7}
          >
            <View style={[styles.optionIcon, styles.optionIconOutline]}>
              <Ionicons name="briefcase" size={28} color={COLORS.primary} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>I provide services</Text>
              <Text style={styles.optionDescription}>
                Join our network of professionals
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>10K+</Text>
            <Text style={styles.statLabel}>Professionals</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>50K+</Text>
            <Text style={styles.statLabel}>Happy Customers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>4.9</Text>
            <Text style={styles.statLabel}>Rating</Text>
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
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  welcomeSection: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
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
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  optionCardOutline: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionIconOutline: {
    backgroundColor: COLORS.background,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 40,
    paddingVertical: 24,
    backgroundColor: COLORS.background,
    borderRadius: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
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
