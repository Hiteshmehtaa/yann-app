import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Share,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, RADIUS, SHADOWS, addAlpha } from '../utils/theme';
import { apiService } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Toast } from '../components/Toast';
import { useToast } from '../hooks/useToast';

interface ReferralInfo {
  referralCode: string;
  hasAppliedCode: boolean;
  totalReferred: number;
  totalReferralEarnings: number;
  bonusBalance: number;
  refereeSignupBonus: number;
  referrerBonus: number;
  bonusSpendCapPercent: number;
  shareMessage: string;
}

export const ReferralScreen = ({ navigation }: any) => {
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [codeInput, setCodeInput] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    loadReferralInfo();
  }, []);

  const loadReferralInfo = async () => {
    try {
      const response = await apiService.getReferralInfo();
      if (response.success && response.data) {
        setInfo(response.data as ReferralInfo);
      }
    } catch (error) {
      console.error('Failed to load referral info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!info) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({ message: info.shareMessage });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleApplyCode = async () => {
    if (!codeInput.trim()) {
      showError('Please enter a referral code');
      return;
    }
    setIsApplying(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const response = await apiService.applyReferralCode(codeInput.trim().toUpperCase());
      if (response.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showSuccess(`₹${response.data?.refereeBonus || ''} bonus credit added!`);
        setCodeInput('');
        loadReferralInfo();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showError(response.message || 'Invalid referral code');
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showError(error.response?.data?.message || 'Failed to apply referral code');
    } finally {
      setIsApplying(false);
    }
  };

  if (isLoading || !info) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={22} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Refer & Earn</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.loadingContainer}>
            <LoadingSpinner visible={true} size="large" />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Refer & Earn</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Hero Card */}
          <LinearGradient
            colors={['#1D4ED8', '#2563EB', '#3B82F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <Ionicons name="gift" size={36} color="rgba(255,255,255,0.9)" />
            <Text style={styles.heroTitle}>Give ₹{info.refereeSignupBonus}, Get ₹{info.referrerBonus}</Text>
            <Text style={styles.heroSubtitle}>
              Share your code - your friend gets ₹{info.refereeSignupBonus} bonus credit, and you earn ₹{info.referrerBonus} when they sign up.
            </Text>
          </LinearGradient>

          {/* Referral Code Card */}
          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>YOUR REFERRAL CODE</Text>
            <Text style={styles.codeValue}>{info.referralCode}</Text>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare} activeOpacity={0.85}>
              <Ionicons name="share-social-outline" size={18} color={COLORS.white} />
              <Text style={styles.shareButtonText}>Share Code</Text>
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{info.totalReferred}</Text>
              <Text style={styles.statLabel}>Friends Referred</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>₹{info.totalReferralEarnings}</Text>
              <Text style={styles.statLabel}>Total Earned</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>₹{info.bonusBalance}</Text>
              <Text style={styles.statLabel}>Bonus Balance</Text>
            </View>
          </View>

          <View style={styles.infoNote}>
            <Ionicons name="information-circle-outline" size={16} color={COLORS.info} />
            <Text style={styles.infoNoteText}>
              Bonus credit can cover up to {info.bonusSpendCapPercent}% of any single booking payment - the rest is charged to your regular wallet balance.
            </Text>
          </View>

          {/* Apply a code */}
          {!info.hasAppliedCode && (
            <View style={styles.applyCard}>
              <Text style={styles.applyTitle}>Have a friend's code?</Text>
              <Text style={styles.applySubtitle}>Apply it once to get your ₹{info.refereeSignupBonus} bonus credit.</Text>
              <View style={styles.applyInputRow}>
                <TextInput
                  style={styles.applyInput}
                  placeholder="Enter code"
                  placeholderTextColor={COLORS.textTertiary}
                  value={codeInput}
                  onChangeText={(v) => setCodeInput(v.toUpperCase())}
                  autoCapitalize="characters"
                  editable={!isApplying}
                />
                <TouchableOpacity
                  style={[styles.applyButton, isApplying && { opacity: 0.6 }]}
                  onPress={handleApplyCode}
                  disabled={isApplying}
                >
                  <Text style={styles.applyButtonText}>{isApplying ? 'Applying...' : 'Apply'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>

        <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: 24,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
    marginTop: 12,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 19,
  },
  codeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: addAlpha(COLORS.primary, 0.3),
    ...SHADOWS.sm,
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  codeValue: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 3,
    marginBottom: 16,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  shareButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textTertiary,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: addAlpha(COLORS.info, 0.08),
    borderRadius: 14,
    padding: 12,
    gap: 8,
    marginBottom: SPACING.lg,
  },
  infoNoteText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
  },
  applyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  applyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  applySubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: 14,
  },
  applyInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  applyInput: {
    flex: 1,
    backgroundColor: COLORS.gray50,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  applyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    justifyContent: 'center',
    borderRadius: 12,
  },
  applyButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
