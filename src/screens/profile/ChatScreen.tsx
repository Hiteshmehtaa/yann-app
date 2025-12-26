import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../utils/theme';
import LottieView from 'lottie-react-native';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export const ChatScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Coming Soon Content */}
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={['#1E3A5F', '#2E5077']}
            style={styles.iconGradient}
          >
            <Ionicons name="chatbubbles" size={48} color="#FFF" />
          </LinearGradient>
        </View>
        
        <Text style={styles.title}>Coming Soon!</Text>
        <Text style={styles.subtitle}>
          Chat with your service providers directly in the app. 
          Real-time messaging is under development.
        </Text>

        <View style={styles.featureList}>
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
        </View>

        <TouchableOpacity 
          style={styles.notifyButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.notifyButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerRight: {
    width: 40,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxxl,
    backgroundColor: COLORS.white,
  },
  iconContainer: {
    marginBottom: SPACING.xl,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: TYPOGRAPHY.size.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  featureList: {
    alignSelf: 'stretch',
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.large,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  featureText: {
    fontSize: TYPOGRAPHY.size.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  notifyButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxxl,
    borderRadius: RADIUS.medium,
    ...SHADOWS.md,
  },
  notifyButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '600',
  },
});

