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
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export const RoleSelectionScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <View style={styles.content}>
        {/* Logo & Branding */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>YANN</Text>
          </View>
          <Text style={styles.tagline}>Professional Home Services</Text>
        </View>

        {/* Welcome Text */}
        <View style={styles.welcomeSection}>
          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.subtitle}>
            How would you like to continue?
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
            <View style={styles.optionIconContainer}>
              <View style={styles.optionIcon}>
                <Ionicons name="person-outline" size={26} color="#1A1A1A" />
              </View>
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Book Services</Text>
              <Text style={styles.optionDescription}>
                Find verified professionals for your home
              </Text>
            </View>
            <View style={styles.arrowContainer}>
              <Text style={styles.arrow}>›</Text>
            </View>
          </TouchableOpacity>

          {/* Provider Option */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => navigation.navigate('ProviderSignup')}
            activeOpacity={0.7}
          >
            <View style={styles.optionIconContainer}>
              <View style={[styles.optionIcon, styles.providerIcon]}>
                <Ionicons name="construct-outline" size={26} color="#1A1A1A" />
              </View>
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Become a Partner</Text>
              <Text style={styles.optionDescription}>
                Join our network of service professionals
              </Text>
            </View>
            <View style={styles.arrowContainer}>
              <Text style={styles.arrow}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Trust Badges */}
        <View style={styles.trustSection}>
          <View style={styles.trustItem}>
            <Text style={styles.trustNumber}>5K+</Text>
            <Text style={styles.trustLabel}>Professionals</Text>
          </View>
          <View style={styles.trustDivider} />
          <View style={styles.trustItem}>
            <Text style={styles.trustNumber}>100K+</Text>
            <Text style={styles.trustLabel}>Customers</Text>
          </View>
          <View style={styles.trustDivider} />
          <View style={styles.trustItem}>
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
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 48,
  },
  logoContainer: {
    marginBottom: 8,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: 4,
  },
  tagline: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  welcomeSection: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  optionIconContainer: {
    marginRight: 16,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8F4FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerIcon: {
    backgroundColor: '#E8F5E9',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  arrowContainer: {
    marginLeft: 12,
  },
  arrow: {
    fontSize: 28,
    color: '#CCCCCC',
    fontWeight: '300',
  },
  trustSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 48,
    paddingVertical: 24,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  trustItem: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  trustNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  trustLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
    fontWeight: '500',
  },
  trustDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
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
    color: '#666666',
  },
  footerLink: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '600',
  },
});
