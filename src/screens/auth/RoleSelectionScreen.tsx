import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useResponsive } from '../../hooks/useResponsive';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export const RoleSelectionScreen: React.FC<Props> = ({ navigation }) => {
  const { width } = useResponsive();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 30,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FB" />
      
      <View style={styles.content}>
        {/* Logo Section */}
        <Animated.View style={[styles.logoSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../../public/download.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.brandName}>YANN</Text>
          <View style={styles.taglineRow}>
            <View style={styles.taglineLine} />
            <Text style={styles.tagline}>PREMIUM HOME SERVICES</Text>
            <View style={styles.taglineLine} />
          </View>
        </Animated.View>

        {/* Welcome Text */}
        <Animated.View style={[styles.welcomeSection, { opacity: fadeAnim }]}>
          <Text style={styles.title}>Choose Your{'\n'}Experience</Text>
        </Animated.View>

        {/* Role Options */}
        <Animated.View style={[styles.optionsContainer, { opacity: fadeAnim }]}>
          {/* Customer/Homeowner Option */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => navigation.navigate('Signup', { role: 'customer' })}
            activeOpacity={0.95}
          >
            <View style={[styles.card, styles.cardBlue]}>
              <View style={styles.cardHeader}>
                <View style={styles.iconCircleBlue}>
                  <Ionicons name="home" size={28} color="#2E59F3" />
                </View>
                <View style={styles.arrowCircle}>
                  <Ionicons name="arrow-forward" size={20} color="#2E59F3" />
                </View>
              </View>
              
              <Text style={styles.cardTitle}>BOOK SERVICES</Text>
              <Text style={styles.cardDescription}>
                Trusted professionals at your doorstep
              </Text>
            </View>
          </TouchableOpacity>

          {/* Provider Option */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => navigation.navigate('ProviderSignup')}
            activeOpacity={0.95}
          >
            <View style={[styles.card, styles.cardWhite]}>
              <View style={styles.cardHeader}>
                <View style={styles.iconCircleYellow}>
                  <Text style={styles.iconEmoji}>💼</Text>
                </View>
                <View style={styles.arrowCircleGray}>
                  <Ionicons name="arrow-forward" size={20} color="#6B7280" />
                </View>
              </View>
              
              <Text style={styles.cardTitleDark}>BECOME A PRO</Text>
              <Text style={styles.cardDescriptionDark}>
                Join our network of experts
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Stats Section */}
        <Animated.View style={[styles.statsContainer, { opacity: fadeAnim }]}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>10K+</Text>
            <Text style={styles.statLabel}>EXPERTS</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>50K+</Text>
            <Text style={styles.statLabel}>CLIENTS</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>4.9 ⭐</Text>
            <Text style={styles.statLabel}>RATING</Text>
          </View>
        </Animated.View>

        {/* Footer */}
        <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8EAF0',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  logoImage: {
    width: 65,
    height: 65,
  },
  brandName: {
    fontSize: 38,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 1.5,
    marginTop: 6,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  taglineLine: {
    width: 32,
    height: 1.5,
    backgroundColor: '#6B7280',
  },
  tagline: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 1.2,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#000000',
    lineHeight: 38,
  },
  optionsContainer: {
    gap: 14,
    marginBottom: 24,
  },
  optionCard: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  card: {
    padding: 24,
    minHeight: 150,
    justifyContent: 'space-between',
  },
  cardBlue: {
    backgroundColor: '#5771F9',
    shadowColor: '#5771F9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 8,
  },
  cardWhite: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircleBlue: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleYellow: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#FFEAA7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconEmoji: {
    fontSize: 28,
  },
  arrowCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowCircleGray: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  cardTitleDark: {
    fontSize: 19,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
    fontWeight: '400',
  },
  cardDescriptionDark: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    fontWeight: '400',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.6,
  },
  statDivider: {
    width: 1,
    height: 34,
    backgroundColor: '#E5E7EB',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 12,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '400',
  },
  footerLink: {
    fontSize: 14,
    color: '#5771F9',
    fontWeight: '700',
  },
});
