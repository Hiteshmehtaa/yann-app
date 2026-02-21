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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { COLORS, SPACING, RADIUS, SHADOWS, LAYOUT } from '../../utils/theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useResponsive } from '../../hooks/useResponsive';
import { useAuth } from '../../contexts/AuthContext';
import { MD2Colors } from 'react-native-paper';
import LottieView from 'lottie-react-native';
import { LottieAnimations } from '../../utils/lottieAnimations';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing
} from 'react-native-reanimated';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

const AnimatedLetter = ({ letter, index }: { letter: string; index: number }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);

  useEffect(() => {
    // Entrance animation
    opacity.value = withDelay(index * 100, withTiming(1, { duration: 500 }));
    translateY.value = withDelay(
      index * 100,
      withSpring(0, { damping: 12, stiffness: 90 }, (finished) => {
        if (finished) {
          // Continuous floating animation after entrance
          translateY.value = withDelay(
            index * 100, // Stagger the floating too
            withRepeat(
              withSequence(
                withTiming(-5, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
                withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.quad) })
              ),
              -1,
              true
            )
          );
        }
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <Reanimated.Text style={[styles.brandLetter, animatedStyle]}>
      {letter}
    </Reanimated.Text>
  );
};

export const RoleSelectionScreen: React.FC<Props> = ({ navigation }) => {
  const { continueAsGuest } = useAuth();
  const { width } = useResponsive();
  const insets = useSafeAreaInsets();
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

  const brandName = "YANN";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Background pattern - Full Screen */}
      <View style={styles.bgPattern}>
        <View style={styles.patternCircle1} />
        <View style={styles.patternCircle2} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom + 40
          }
        ]}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <View style={styles.content}>
          {/* Header with Top-Left Logo (Animation Target) */}
          <View style={styles.header}>
            <Image
              source={require('../../../assets/Logo.jpg')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          </View>

          {/* Logo Section - Text Only now */}
          <Animated.View style={[styles.logoSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.brandNameContainer}>
              {brandName.split('').map((letter, index) => (
                <AnimatedLetter key={`${letter}-${index}`} letter={letter} index={index} />
              ))}
            </View>
            <View style={styles.taglineRow}>
              <View style={styles.taglineLine} />
              <Text style={styles.tagline}>PREMIUM HOME SERVICES</Text>
              <View style={styles.taglineLine} />
            </View>
          </Animated.View>

          {/* Welcome Text */}
          <Animated.View style={[styles.welcomeSection, { opacity: fadeAnim }]}>
            <Text style={styles.title}>Get Started With Yann</Text>
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
                  <View style={[styles.iconCircleBlue, { backgroundColor: 'transparent', position: 'relative' }]}>
                    <Video
                      source={require('../../../assets/lottie/Home.mp4')}
                      style={{ width: 56, height: 56 }}
                      resizeMode={ResizeMode.COVER}
                      shouldPlay
                      isLooping
                      isMuted
                    />
                    {/* Tiny box with off-white to blend into the mp4 background and cover the watermark */}
                    <View style={{
                      position: 'absolute',
                      width: 14,
                      height: 5,
                      backgroundColor: '#F9FAFB',
                      top: 26.5,
                      left: 21
                    }} />
                  </View>
                </View>

                <View style={styles.titleRow}>
                  <Text style={styles.cardTitle}>BECOME A MEMBER</Text>
                  <Ionicons name="arrow-forward" size={20} color={COLORS.primary} style={{ marginLeft: 8 }} />
                </View>
                <Text style={styles.cardDescription}>
                  Verified professionals at your doorstep
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
                </View>

                <View style={styles.titleRow}>
                  <Text style={styles.cardTitleDark}>BECOME A PARTNER</Text>
                  <Ionicons name="arrow-forward" size={20} color={COLORS.textTertiary} style={{ marginLeft: 8 }} />
                </View>
                <Text style={styles.cardDescriptionDark}>
                  Your Skills. Your Rates. Your Income.
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


            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => continueAsGuest()}
              activeOpacity={0.7}
            >
              <Text style={styles.skipText}>Skip & Browse Services</Text>
              <Ionicons name="arrow-forward" size={14} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
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
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
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
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  header: {
    paddingHorizontal: 0, // content has padding, but header is inside content. actually let's check
    marginBottom: 40,
    marginTop: 10,
  },
  headerLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  brandNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4, // Space between letters
    marginTop: 6,
  },
  brandLetter: {
    fontSize: 42, // Slightly larger for impact
    fontWeight: '900',
    color: MD2Colors.blue700, // Using the same premium blue
    // letterSpacing is handled by gap in container now for cleaner layout
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
  heroAnimation: {
    alignItems: 'center',
    marginBottom: 16,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.5,
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
    paddingTop: 12,
    alignItems: 'center', // Center content
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.medium,
    gap: 6,
    ...SHADOWS.sm,
  },
  skipText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
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
