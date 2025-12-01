import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const { width } = Dimensions.get('window');

// Dark editorial theme
const THEME = {
  bg: '#0D0D0D',
  bgCard: '#1A1A1A',
  bgElevated: '#242424',
  accent: '#FF6B35',
  accentSoft: '#FF6B3515',
  gold: '#D4AF37',
  text: '#FAFAFA',
  textMuted: '#6A6A6A',
  textSubtle: '#4A4A4A',
  border: '#2A2A2A',
};

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export const RoleSelectionScreen: React.FC<Props> = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />
      
      {/* Background elements */}
      <View style={styles.bgPattern}>
        <View style={styles.gradientCircle} />
        <View style={styles.gridLines} />
      </View>
      
      <Animated.View 
        style={[
          styles.content,
          { 
            opacity: fadeAnim, 
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ] 
          }
        ]}
      >
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../../public/download.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.brandName}>YANN</Text>
          <View style={styles.taglineRow}>
            <View style={styles.taglineLine} />
            <Text style={styles.tagline}>PREMIUM HOME SERVICES</Text>
            <View style={styles.taglineLine} />
          </View>
        </View>

        {/* Welcome Text */}
        <View style={styles.welcomeSection}>
          <Text style={styles.title}>Choose Your{'\n'}Experience</Text>
        </View>

        {/* Role Options */}
        <View style={styles.optionsContainer}>
          {/* Customer Option */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => navigation.navigate('Signup', { role: 'customer' })}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[THEME.accent, '#E85A2D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.optionGradient}
            >
              <View style={styles.optionTop}>
                <View style={styles.optionIconActive}>
                  <Ionicons name="home" size={26} color="#FFF" />
                </View>
                <View style={styles.arrowCircle}>
                  <Ionicons name="arrow-forward" size={18} color="#FFF" />
                </View>
              </View>
              <View style={styles.optionBottom}>
                <Text style={styles.optionTitleActive}>BOOK SERVICES</Text>
                <Text style={styles.optionDescActive}>
                  Trusted professionals at your doorstep
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Provider Option */}
          <TouchableOpacity
            style={styles.optionCardOutline}
            onPress={() => navigation.navigate('ProviderSignup')}
            activeOpacity={0.85}
          >
            <View style={styles.optionTop}>
              <View style={styles.optionIcon}>
                <Ionicons name="briefcase" size={26} color={THEME.gold} />
              </View>
              <View style={styles.arrowCircleOutline}>
                <Ionicons name="arrow-forward" size={18} color={THEME.textMuted} />
              </View>
            </View>
            <View style={styles.optionBottom}>
              <Text style={styles.optionTitle}>BECOME A PRO</Text>
              <Text style={styles.optionDesc}>
                Join our network of experts
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
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
            <View style={styles.ratingRow}>
              <Text style={styles.statNumber}>4.9</Text>
              <Ionicons name="star" size={14} color={THEME.gold} />
            </View>
            <Text style={styles.statLabel}>RATING</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already a member? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  bgPattern: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  gradientCircle: {
    position: 'absolute',
    top: -150,
    right: -150,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: THEME.accent,
    opacity: 0.04,
  },
  gridLines: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    opacity: 0.3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 48,
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: THEME.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  logo: {
    width: 52,
    height: 52,
  },
  brandName: {
    fontSize: 36,
    fontWeight: '900',
    color: THEME.text,
    letterSpacing: 8,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  taglineLine: {
    width: 24,
    height: 1,
    backgroundColor: THEME.textSubtle,
  },
  tagline: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME.textMuted,
    letterSpacing: 3,
  },
  welcomeSection: {
    marginBottom: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: THEME.text,
    letterSpacing: -1,
    lineHeight: 42,
  },
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  optionGradient: {
    padding: 24,
  },
  optionCardOutline: {
    backgroundColor: THEME.bgCard,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  optionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  optionBottom: {},
  optionIconActive: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowCircleOutline: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTitleActive: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 1,
    marginBottom: 6,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.text,
    letterSpacing: 1,
    marginBottom: 6,
  },
  optionDescActive: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
  },
  optionDesc: {
    fontSize: 14,
    color: THEME.textMuted,
    lineHeight: 20,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 32,
    paddingVertical: 24,
    backgroundColor: THEME.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.text,
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.textMuted,
    letterSpacing: 2,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: THEME.border,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingBottom: 24,
  },
  footerText: {
    fontSize: 14,
    color: THEME.textMuted,
  },
  footerLink: {
    fontSize: 14,
    color: THEME.accent,
    fontWeight: '700',
  },
});
