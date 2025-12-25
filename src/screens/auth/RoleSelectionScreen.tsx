import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS, LAYOUT } from '../../utils/theme';
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Background pattern */}
      <View style={styles.bgPattern}>
        <View style={styles.patternCircle1} />
        <View style={styles.patternCircle2} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <View style={styles.content}>
          {/* Logo Section */}
          <Animated.View style={[styles.logoSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../../public/Logo.jpg')} 
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
                    <Ionicons name="home" size={28} color={COLORS.primary} />
                  </View>
                  <View style={styles.arrowCircle}>
                    <Ionicons name="arrow-forward" size={20} color={COLORS.primary} />
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
                    <Ionicons name="arrow-forward" size={20} color={COLORS.textTertiary} />
                  </View>
                </View>
                
                <Text style={styles.cardTitleDark}>BECOME A PROVIDER  </Text>
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
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  bgPattern: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: -1,
  },
  patternCircle1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: COLORS.primary,
    opacity: 0.03,
  },
  patternCircle2: {
    position: 'absolute',
    bottom: -50,
    left: -100,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: COLORS.accentOrange,
    opacity: 0.02,
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
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...SHADOWS.md,
  },
  logoImage: {
    width: 65,
    height: 65,
  },
  brandName: {
    fontSize: 38,
    fontWeight: '900',
    color: COLORS.text,
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
    backgroundColor: COLORS.textTertiary,
  },
  tagline: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textTertiary,
    letterSpacing: 1.2,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: COLORS.text,
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
    backgroundColor: '#fff',
    borderColor: COLORS.primary,
    borderWidth: 2,
    ...SHADOWS.md,
  },
  cardWhite: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    ...SHADOWS.md,
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
    backgroundColor: COLORS.primary + '15',
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
    backgroundColor: COLORS.primary + '10',
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
    color: COLORS.primary,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  cardTitleDark: {
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    fontWeight: '400',
  },
  cardDescriptionDark: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    fontWeight: '400',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 20,
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 18,
    ...SHADOWS.sm,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textTertiary,
    letterSpacing: 0.6,
  },
  statDivider: {
    width: 1,
    height: 34,
    backgroundColor: COLORS.border,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 12,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '400',
  },
  footerLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
  },
});
