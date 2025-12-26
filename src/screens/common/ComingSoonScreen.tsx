import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import { useNavigation } from '@react-navigation/native';

export const ComingSoonScreen = () => {
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Floating animation loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 10,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View 
          style={[
            styles.iconContainer, 
            { 
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: floatAnim }
              ] 
            }
          ]}
        >
          <LinearGradient
            colors={['#1E3A5F', '#2E5077']}
            style={styles.iconGradient}
          >
            <Ionicons name="chatbubbles" size={48} color="#FFF" />
          </LinearGradient>
          <View style={[styles.decorationCircle, styles.circle1]} />
          <View style={[styles.decorationCircle, styles.circle2]} />
        </Animated.View>

        <Animated.View style={[styles.textContainer, { opacity: fadeAnim }]}>
          <Text style={styles.title}>Coming Soon!</Text>
          <Text style={styles.subtitle}>
            Chat with your service providers directly in the app.{'\n'}
            Real-time messaging is under development.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.featureList, { opacity: fadeAnim }]}>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#0D9488" />
            <Text style={styles.featureText}>Real-time messaging</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#0D9488" />
            <Text style={styles.featureText}>Photo & file sharing</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#0D9488" />
            <Text style={styles.featureText}>Booking updates</Text>
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, width: '100%', alignItems: 'center' }}>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </Animated.View>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  iconContainer: {
    marginBottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
    width: 160,
    height: 160,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    ...SHADOWS.lg,
  },
  decorationCircle: {
    position: 'absolute',
    borderRadius: 999,
  },
  circle1: {
    width: 130,
    height: 130,
    backgroundColor: '#1E3A5F',
    opacity: 0.1,
    zIndex: 5,
  },
  circle2: {
    width: 160,
    height: 160,
    backgroundColor: '#0D9488',
    opacity: 0.05,
    zIndex: 1,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  featureList: {
    alignSelf: 'stretch',
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.large,
    padding: SPACING.lg,
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  featureText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: RADIUS.medium,
    ...SHADOWS.sm,
    minWidth: 160,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

