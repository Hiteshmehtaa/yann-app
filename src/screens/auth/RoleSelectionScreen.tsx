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
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

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
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { GlassCard } from '../../components/ui/GlassCard';
import { NeoButton } from '../../components/ui/NeoButton';
import { LiquidBackground } from '../../components/ui/LiquidBackground';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FC',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: Dimensions.get('window').height - 100,
  },
  topSpacer: {
    height: 20,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  brandNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  brandLetter: {
    fontSize: 56,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -2,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  taglineLine: {
    width: 24,
    height: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.2)',
  },
  tagline: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 2,
  },
  welcomeSection: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  splitLayout: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    height: Dimensions.get('window').height * 0.38,
    marginBottom: 40,
  },
  splitPanel: {
    flex: 1,
  },
  roleCard: {
    flex: 1,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  roleCardContent: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconCircleBlue: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleOrange: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 138, 61, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleTextContainer: {
    alignItems: 'center',
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  roleDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
  },
  actionArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsBar: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 40,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  statDesc: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 1,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
  },
  guestButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  guestButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textTertiary,
    textDecorationLine: 'underline',
    letterSpacing: 0.5,
  },
});

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

      <LiquidBackground mode="light" />

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
          <View style={styles.topSpacer} />

          {/* Centered Brand Name */}
          <Animated.View style={[styles.logoSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.brandNameContainer}>
              {brandName.split('').map((item, idx) => (
                <AnimatedLetter key={"Role-" + idx} letter={item} index={idx} />
              ))}
            </View>
            <View style={styles.taglineRow}>
              <View style={styles.taglineLine} />
              <Text style={styles.tagline}>SIGNATURE LUXURY</Text>
              <View style={styles.taglineLine} />
            </View>
          </Animated.View>

          <View style={styles.welcomeSection}>
            <Text style={styles.title}> Get started with YANN</Text>
          </View>

          {/* Side-by-Side Role Options */}
          <Animated.View style={[styles.splitLayout, { opacity: fadeAnim }]}>
            {/* Customer/Homeowner Option */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Signup', { role: 'customer' })}
              activeOpacity={0.9}
              style={styles.splitPanel}
            >
              <GlassCard intensity={80} style={styles.roleCard} enableTilt glowColor="rgba(59, 130, 246, 0.1)">
                <View style={styles.roleCardContent}>
                  <View style={styles.iconCircleBlue}>
                    <Ionicons name="home" size={42} color={COLORS.primary} />
                  </View>
                  <View style={styles.roleTextContainer}>
                    <Text style={styles.roleTitle}>MEMBER</Text>
                    <Text style={styles.roleDescription}>
                      Verified Professionals at your doorstep
                    </Text>
                  </View>
                  <View style={styles.actionArrow}>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
                  </View>
                </View>
              </GlassCard>
            </TouchableOpacity>

            {/* Provider Option */}
            <TouchableOpacity
              onPress={() => navigation.navigate('ProviderSignup')}
              activeOpacity={0.9}
              style={styles.splitPanel}
            >
              <GlassCard intensity={80} style={styles.roleCard} enableTilt glowColor="rgba(255, 138, 61, 0.1)">
                <View style={styles.roleCardContent}>
                  <View style={styles.iconCircleOrange}>
                    <Ionicons name="briefcase" size={42} color="#FF8A3D" />
                  </View>
                  <View style={styles.roleTextContainer}>
                    <Text style={styles.roleTitle}>PARTNER</Text>
                    <Text style={styles.roleDescription}>
                      Your skills, Your Rates, Your Income, Our Platform
                    </Text>
                  </View>
                  <View style={styles.actionArrow}>
                    <Ionicons name="chevron-forward" size={20} color="#FF8A3D" />
                  </View>
                </View>
              </GlassCard>
            </TouchableOpacity>
          </Animated.View>

          {/* Stats Bar */}
          <Animated.View style={[styles.statsBar, { opacity: fadeAnim }]}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>10K+</Text>
              <Text style={styles.statDesc}>EXPERTS</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>4.9 ⭐</Text>
              <Text style={styles.statDesc}>RATING</Text>
            </View>
          </Animated.View>

          {/* Footer */}
          <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
            <TouchableOpacity
              onPress={() => continueAsGuest()}
              activeOpacity={0.7}
              style={styles.guestButton}
            >
              <Text style={styles.guestButtonText}>Skip & Browse Services</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
};

