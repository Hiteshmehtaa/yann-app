import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  StatusBar,
  Animated,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import RazorpayCheckout from 'react-native-razorpay';
import { COLORS, SPACING, RADIUS, SHADOWS, addAlpha } from '../utils/theme';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Toast } from '../components/Toast';
import { useToast } from '../hooks/useToast';

const { width } = Dimensions.get('window');

interface Transaction {
  _id: string;
  type: 'CREDIT' | 'DEBIT';
  category: string;
  amount: number;
  description: string;
  createdAt: string;
  balanceAfter: number;
}

const QUICK_AMOUNTS = [100, 500, 1000, 2000];

// Simple animated button component
const AnimatedButton: React.FC<{
  onPress: () => void;
  style?: any;
  children: React.ReactNode;
  disabled?: boolean;
}> = ({ onPress, style, children, disabled }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled}
      style={style}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

export const WalletScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const { toast, showSuccess, showError, hideToast } = useToast();
  
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddingMoney, setIsAddingMoney] = useState(false);
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [refundableAmount, setRefundableAmount] = useState(0);
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);

  useEffect(() => {
    loadWalletData();
    checkFailedTransactions();
  }, []);

  const loadWalletData = async () => {
    try {
      const response = await apiService.getWalletBalance();
      if (response.success && response.data) {
        setBalance(response.data.balance || 0);
        setTransactions(response.data.transactions || []);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error('Failed to load wallet:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const checkFailedTransactions = async () => {
    try {
      const response = await apiService.getFailedTransactions();
      if (response.success && response.data) {
        setRefundableAmount(response.data.totalRefundable || 0);
      }
    } catch (error) {
      console.error('Failed to check refundable transactions:', error);
    }
  };

  const handleRequestRefund = async () => {
    try {
      setIsProcessingRefund(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const response = await apiService.requestAutoRefund();
      if (response.success && (response as any).refundAmount) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showSuccess(`Refunded ₹${(response as any).refundAmount.toFixed(2)}!`);
        setRefundableAmount(0);
        setBalance((response as any).newBalance || balance);
        loadWalletData();
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showError(error.response?.data?.message || 'Refund failed');
    } finally {
      setIsProcessingRefund(false);
    }
  };

  const openAmountModal = () => {
    setCustomAmount('');
    setShowAmountModal(true);
  };

  const handleAddMoney = async (amountToAdd?: number) => {
    // Close modal if open
    if (showAmountModal) {
      setShowAmountModal(false);
    }

    const finalAmount = amountToAdd || 500;
    
    // Validate amount
    if (finalAmount < 1) {
      showError('Minimum amount is ₹1');
      return;
    }
    
    try {
      setIsAddingMoney(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const orderRes = await apiService.createWalletTopupOrder(finalAmount);
      if (!orderRes.success) throw new Error('Failed to create order');

      const options = {
        description: 'Add money to Yann Wallet',
        image: 'https://yann-care.vercel.app/logo.png',
        currency: 'INR',
        key: orderRes.keyId || '',
        amount: (orderRes.amount || 0).toString(),
        name: 'Yann Wallet',
        order_id: orderRes.orderId || '',
        prefill: {
          email: user?.email || '',
          contact: user?.phone || '',
          name: user?.name || '',
        },
        theme: { color: COLORS.primary },
      };

      const data = await RazorpayCheckout.open(options);
      
      const verifyRes = await apiService.verifyWalletTopup({
        razorpay_order_id: data.razorpay_order_id,
        razorpay_payment_id: data.razorpay_payment_id,
        razorpay_signature: data.razorpay_signature,
      });

      if (verifyRes.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showSuccess(`Successfully added ₹${finalAmount}!`);
        loadWalletData();
      }
    } catch (error: any) {
      console.error('Wallet topup error:', error);
      if (!error.message?.toLowerCase().includes('cancel')) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        // Show backend error message if available
        const errorMessage = error.response?.data?.message || error.message || 'Failed to add money';
        showError(errorMessage);
      }
    } finally {
      setIsAddingMoney(false);
    }
  };

  const getTransactionIcon = (description: string, type: string) => {
    const desc = description.toLowerCase();
    if (desc.includes('wallet top') || desc.includes('added')) return 'wallet-plus';
    if (desc.includes('booking') || desc.includes('service')) return 'calendar-check';
    if (desc.includes('refund') || desc.includes('cancel')) return 'cash-refund';
    if (desc.includes('payment')) return 'credit-card';
    return type === 'CREDIT' ? 'arrow-down-left' : 'arrow-up-right';
  };

  const renderTransaction = ({ item, index }: { item: Transaction, index: number }) => {
    const isCredit = item.type === 'CREDIT';
    const iconName = getTransactionIcon(item.description, item.type);
    
    // Enhanced color scheme
    const colors = {
      credit: {
        text: '#10B981',
        bg: 'rgba(16, 185, 129, 0.1)',
        border: 'rgba(16, 185, 129, 0.2)',
      },
      debit: {
        text: '#EF4444',
        bg: 'rgba(239, 68, 68, 0.1)',
        border: 'rgba(239, 68, 68, 0.2)',
      },
    };
    
    const colorScheme = isCredit ? colors.credit : colors.debit;
    
    const date = new Date(item.createdAt);
    const isToday = new Date().toDateString() === date.toDateString();
    const dateStr = isToday ? 'Today' : date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    return (
      <AnimatedButton
        key={item._id}
        onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
        style={[styles.transactionItem, { borderLeftWidth: 3, borderLeftColor: colorScheme.border }]}
      >
        <View style={[styles.transactionIcon, { backgroundColor: colorScheme.bg }]}>
          <MaterialCommunityIcons name={iconName} size={24} color={colorScheme.text} />
        </View>
        
        <View style={styles.transactionContent}>
          <View style={styles.transactionRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.transactionTitle}>{item.description || 'Transaction'}</Text>
              <Text style={styles.transactionCategory}>{item.category || 'General'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.transactionAmount, { color: colorScheme.text }]}>
                {isCredit ? '+' : '-'}₹{Math.abs(item.amount).toFixed(2)}
              </Text>
              <Text style={styles.transactionDate}>{dateStr} • {timeStr}</Text>
            </View>
          </View>
        </View>
      </AnimatedButton>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner visible={true} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <AnimatedButton
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </AnimatedButton>
          <Text style={styles.headerTitle}>My Wallet</Text>
          <AnimatedButton style={styles.helpButton} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
            <Ionicons name="help-circle-outline" size={24} color={COLORS.text} />
          </AnimatedButton>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                setIsRefreshing(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                loadWalletData();
              }}
              colors={[COLORS.primary]}
            />
          }
        >
          {/* Refund Banner */}
          {refundableAmount > 0 && (
            <View style={styles.refundBanner}>
              <View style={styles.refundBannerContent}>
                <View style={styles.refundIconContainer}>
                  <Ionicons name="alert-circle" size={24} color="#F59E0B" />
                </View>
                <View style={styles.refundTextContainer}>
                  <Text style={styles.refundBannerTitle}>Refund Available</Text>
                  <Text style={styles.refundBannerText}>
                    ₹{refundableAmount.toFixed(2)} from failed booking(s)
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.refundButton}
                onPress={handleRequestRefund}
                disabled={isProcessingRefund}
              >
                {isProcessingRefund ? (
                  <LoadingSpinner visible={true} color={COLORS.primary} size="small" />
                ) : (
                  <Text style={styles.refundButtonText}>Claim Refund</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Premium Wallet Card */}
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.walletCard}
          >
            <View style={styles.patternCircle1} />
            <View style={styles.patternCircle2} />
            
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardLabel}>Total Balance</Text>
                <Text style={styles.cardBalance}>₹{balance.toFixed(2)}</Text>
              </View>
              <View style={styles.chipContainer}>
                <MaterialCommunityIcons name="integrated-circuit-chip" size={32} color={addAlpha('#FFF', 0.6)} />
              </View>
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.cardUserInfo}>
                <Text style={styles.cardUserValues}>YANN CREDIT</Text>
                <Text style={styles.cardUserLabel}>Valid User</Text>
              </View>
              
              <AnimatedButton
                style={styles.mainAddButton}
                onPress={openAmountModal}
                disabled={isAddingMoney}
              >
                {isAddingMoney ? (
                  <LoadingSpinner visible={true} color={COLORS.primary} size="small" />
                ) : (
                  <>
                    <Ionicons name="add" size={20} color="#667eea" />
                    <Text style={styles.mainAddButtonText}>Top Up</Text>
                  </>
                )}
              </AnimatedButton>
            </View>
          </LinearGradient>

          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <Ionicons name="trending-up" size={20} color="#10B981" />
              </View>
              <Text style={styles.statLabel}>Total Income</Text>
              <Text style={styles.statValue}>
                ₹{transactions.filter(t => t.type === 'CREDIT').reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
              </Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                <Ionicons name="trending-down" size={20} color="#EF4444" />
              </View>
              <Text style={styles.statLabel}>Total Expenses</Text>
              <Text style={styles.statValue}>
                ₹{transactions.filter(t => t.type === 'DEBIT').reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Quick Add Actions */}
          <View style={styles.quickActionsSection}>
            <Text style={styles.sectionTitle}>Quick Top-up</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {QUICK_AMOUNTS.map((amt) => (
                <AnimatedButton
                  key={amt}
                  style={styles.amountChip}
                  onPress={() => handleAddMoney(amt)}
                  disabled={isAddingMoney}
                >
                  <Text style={styles.amountChipText}>+ ₹{amt}</Text>
                </AnimatedButton>
              ))}
            </ScrollView>
          </View>

          {/* Transactions */}
          <View style={styles.transactionsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              {transactions.length > 5 && (
                <AnimatedButton onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
                  <Text style={styles.seeAllText}>See All</Text>
                </AnimatedButton>
              )}
            </View>
            
            {transactions.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="receipt-outline" size={48} color={COLORS.textTertiary} />
                </View>
                <Text style={styles.emptyTitle}>No transactions yet</Text>
                <Text style={styles.emptyDescription}>Your transaction history will appear here</Text>
                <AnimatedButton
                  style={styles.emptyActionButton}
                  onPress={openAmountModal}
                >
                  <Text style={styles.emptyActionText}>Add Money</Text>
                </AnimatedButton>
              </View>
            ) : (
              <View style={styles.transactionsList}>
                {transactions.map((item, index) => renderTransaction({ item, index }))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Simple FAB */}
        <AnimatedButton
          style={styles.fab}
          onPress={openAmountModal}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </AnimatedButton>

        {/* Custom Amount Modal */}
        <Modal
          visible={showAmountModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAmountModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Money to Wallet</Text>
              <Text style={styles.modalSubtitle}>Enter amount to add</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.amountInput}
                  value={customAmount}
                  onChangeText={setCustomAmount}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  autoFocus
                />
              </View>

              <View style={styles.quickAmountsGrid}>
                {QUICK_AMOUNTS.map((amt) => (
                  <TouchableOpacity
                    key={amt}
                    style={styles.quickAmountChip}
                    onPress={() => setCustomAmount(amt.toString())}
                  >
                    <Text style={styles.quickAmountText}>₹{amt}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => setShowAmountModal(false)}
                >
                  <Text style={styles.modalButtonTextCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonConfirm]}
                  onPress={() => {
                    const amount = parseInt(customAmount);
                    if (amount && amount > 0) {
                      handleAddMoney(amount);
                    } else {
                      showError('Please enter a valid amount');
                    }
                  }}
                >
                  <Text style={styles.modalButtonTextConfirm}>Add Money</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: 'transparent',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  helpButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  
  // Wallet Card
  walletCard: {
    margin: SPACING.lg,
    padding: SPACING.xl,
    borderRadius: RADIUS.xlarge,
    height: 200,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    ...SHADOWS.primary,
  },
  patternCircle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  patternCircle2: {
    position: 'absolute',
    bottom: -80,
    left: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    marginBottom: 4,
  },
  cardBalance: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  chipContainer: {
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardUserInfo: {
    justifyContent: 'center',
  },
  cardUserValues: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 2,
    letterSpacing: 1,
  },
  cardUserLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  mainAddButton: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    gap: 6,
    ...SHADOWS.sm,
  },
  mainAddButtonText: {
    color: '#667eea',
    fontWeight: '700',
    fontSize: 14,
  },

  // Stats Section
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: 12,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: SPACING.md,
    borderRadius: RADIUS.medium,
    ...SHADOWS.sm,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },

  // Quick Actions
  quickActionsSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  chipsScroll: {
    marginHorizontal: -SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  amountChip: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  amountChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Transactions
  transactionsSection: {
    paddingHorizontal: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  transactionsList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: SPACING.md + 2,
    borderRadius: RADIUS.medium,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    ...SHADOWS.sm,
    marginBottom: 12,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  transactionContent: {
    flex: 1,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  transactionCategory: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textTertiary,
    textTransform: 'capitalize',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: '#FFF',
    borderRadius: RADIUS.large,
    paddingHorizontal: SPACING.xl,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptyDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  emptyActionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 25,
  },
  emptyActionText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.primary,
    elevation: 8,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
    paddingVertical: 16,
  },
  quickAmountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  quickAmountChip: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickAmountText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#F3F4F6',
  },
  modalButtonConfirm: {
    backgroundColor: COLORS.primary,
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalButtonTextConfirm: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  refundBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  refundBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  refundIconContainer: {
    marginRight: 12,
  },
  refundTextContainer: {
    flex: 1,
  },
  refundBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  refundBannerText: {
    fontSize: 14,
    color: '#78350F',
  },
  refundButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
  },
  refundButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
});
