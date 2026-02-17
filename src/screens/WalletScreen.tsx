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
  type: string; // wallet_topup, wallet_debit, wallet_credit, wallet_refund
  category: string;
  amount: number;
  description: string;
  createdAt: string;
  balanceAfter: number;
}

// Helper to determine if transaction is income or expense
const isIncomeTransaction = (type: string) => {
  return [
    'wallet_topup',
    'wallet_refund',
    'wallet_credit',
    'escrow_refund',      // Refund to user when rejected
    'escrow_release',     // Credit to provider on acceptance
    'booking_initial_payment', // 25% initial payment for providers
    'booking_completion_payment', // 75% completion payment for providers
    'completion_payment', // Service completion payment
    'withdrawal_rejected' // Returned funds on rejected withdrawal
  ].includes(type);
};

// Helper to get transaction display info
const getTransactionInfo = (type: string): { label: string; icon: string } => {
  const typeMap: Record<string, { label: string; icon: string }> = {
    wallet_topup: { label: 'Wallet Top-up', icon: 'add-circle' },
    wallet_debit: { label: 'Payment', icon: 'remove-circle' },
    wallet_refund: { label: 'Refund', icon: 'refresh-circle' },
    wallet_credit: { label: 'Earning', icon: 'cash' },
    escrow_hold: { label: 'Booking Deposit (25%)', icon: 'lock-closed' },
    escrow_release: { label: 'Booking Payment Received', icon: 'lock-open' },
    escrow_refund: { label: 'Deposit Refunded', icon: 'refresh-circle' },
    booking_initial_payment: { label: 'Initial Payment (25%)', icon: 'cash' },
    booking_completion_payment: { label: 'Completion Payment (75%)', icon: 'checkmark-circle' },
    completion_payment: { label: 'Service Payment (75%)', icon: 'checkmark-circle' },
    withdrawal_request: { label: 'Withdrawal Pending', icon: 'hourglass' },
    withdrawal_completed: { label: 'Withdrawal Completed', icon: 'checkmark-done-circle' },
    withdrawal_rejected: { label: 'Withdrawal Rejected', icon: 'close-circle' },
    commission: { label: 'Platform Commission', icon: 'trending-down' },
  };
  return typeMap[type] || { label: type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), icon: 'ellipse' };
};

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

  // Partner Withdrawal State
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawalConfig, setWithdrawalConfig] = useState({
    commissionRate: 15,
    minAmount: 1,
    maxAmount: 100000,
    processingDays: 3,
    hasBankDetails: false,
    bankAccount: null as string | null,
  });

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

      // Load withdrawal config for providers
      if (user?.role === 'provider') {
        try {
          const withdrawInfo = await apiService.getWithdrawalInfo();
          if (withdrawInfo.success && withdrawInfo.data) {
            const minAmount = withdrawInfo.data.withdrawalConfig?.minAmount;
            console.log('🔍 Withdrawal config from API:', withdrawInfo.data.withdrawalConfig);
            console.log('🔍 minAmount received:', minAmount);
            const finalMinAmount = minAmount === 100 ? 1 : (minAmount || 1);
            console.log('✅ minAmount after override:', finalMinAmount);
            setWithdrawalConfig({
              commissionRate: withdrawInfo.data.withdrawalConfig?.commissionRate || 15,
              minAmount: finalMinAmount,
              maxAmount: withdrawInfo.data.withdrawalConfig?.maxAmount || 100000,
              processingDays: withdrawInfo.data.withdrawalConfig?.processingDays || 3,
              hasBankDetails: withdrawInfo.data.hasBankDetails || false,
              bankAccount: withdrawInfo.data.bankAccount || null,
            });
          }
        } catch (e) {
          console.log('Failed to load withdrawal config:', e);
        }
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

  // Handler for partner withdrawal
  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);

    if (isNaN(amount) || amount <= 0) {
      showError('Please enter a valid amount');
      return;
    }

    if (amount < withdrawalConfig.minAmount) {
      showError(`Minimum withdrawal is ₹${withdrawalConfig.minAmount}`);
      return;
    }

    if (amount > balance) {
      showError('Insufficient balance');
      return;
    }

    if (!withdrawalConfig.hasBankDetails) {
      navigation.navigate('BankDetails' as never);
      return;
    }

    try {
      setIsWithdrawing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const response = await apiService.requestWithdrawal(amount);

      if (response.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const data = (response as any).data || response;
        const netAmount = data.netAmount || amount;
        const autoApproved = data.autoApproved || false;
        showSuccess(`Withdrawal of ₹${netAmount} ${autoApproved ? 'processed' : 'requested'}!`);
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        loadWalletData(); // Refresh balance
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showError(error.message || 'Withdrawal failed');
    } finally {
      setIsWithdrawing(false);
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

  // Ensure we have a safe user role fallback
  const isProvider = user?.role === 'provider';

  const renderTransaction = ({ item, index }: { item: Transaction, index: number }) => {
    const isIncome = isIncomeTransaction(item.type);
    const iconName = getTransactionIcon(item.description, item.type);

    // Modern color scheme - Green for income, Red for expense
    const colors = {
      income: {
        icon: COLORS.success,
        iconBg: addAlpha(COLORS.success, 0.1),
        amount: COLORS.success,
      },
      expense: {
        icon: COLORS.error,
        iconBg: addAlpha(COLORS.error, 0.1),
        amount: COLORS.error,
      },
    };

    const colorScheme = isIncome ? colors.income : colors.expense;

    const date = new Date(item.createdAt);
    const isToday = new Date().toDateString() === date.toDateString();
    const dateStr = isToday ? 'Today' : date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    // Determine labels and signs based on user role
    let amountPrefix = '';
    let statusLabel = '';

    if (isProvider) {
      // Partners: Income/Expense
      amountPrefix = isIncome ? '+' : '-';
      statusLabel = isIncome ? 'Income' : 'Expense';
    } else {
      // Members: Credit/Debit
      // Credit = Income (Green, +)
      // Debit = Expense (Red, -)
      amountPrefix = isIncome ? '+' : '-';
      statusLabel = isIncome ? 'Credit' : 'Debit';
    }

    return (

      <View key={item._id} style={styles.transactionCard}>
        <View style={[styles.transactionIconCircle, { backgroundColor: colorScheme.iconBg }]}>
          <MaterialCommunityIcons name={iconName} size={20} color={colorScheme.icon} />
        </View>

        <View style={styles.transactionDetails}>
          <Text style={styles.transactionTitle} numberOfLines={1}>
            {item.description || 'Transaction'}
          </Text>
          <Text style={styles.transactionMeta}>
            {dateStr} • {timeStr}
          </Text>
        </View>

        <View style={styles.transactionAmountContainer}>
          <Text style={[styles.transactionAmount, { color: colorScheme.amount }]}>
            {amountPrefix}₹{Math.abs(item.amount).toFixed(2)}
          </Text>
          <Text style={[styles.transactionStatus, { color: colorScheme.icon }]}>
            {statusLabel}
          </Text>
        </View>
      </View>
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
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
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
                  <Ionicons name="alert-circle" size={24} color={COLORS.warning} />
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

          {/* Premium Mesh Gradient Card */}
          <View style={styles.cardContainer}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryGradientEnd]} // Blue-600 -> Blue-800
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.walletCard}
            >
              <View style={styles.patternDot1} />
              <View style={styles.patternDot2} />
              <View style={styles.patternAhoy} />

              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardLabel}>Total Balance</Text>
                  <Text style={styles.cardBalance}>₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                </View>
                <View style={styles.glassChip}>
                  <MaterialCommunityIcons name="contactless-payment" size={24} color="rgba(255,255,255,0.9)" />
                </View>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.cardUserInfo}>
                  <Text style={styles.cardUserValues}>YANN WALLET </Text>
                  <Text style={styles.cardUserLabel}>•••• 8832</Text>
                </View>
                {/* Top Up button removed as requested */}
              </View>
            </LinearGradient>

            {/* Floating 3D Stats - Overlapping the Card */}
            <View style={styles.floatingStatsContainer}>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: addAlpha(COLORS.success, 0.1) }]}>
                  <Ionicons name="arrow-down" size={20} color={COLORS.success} />
                </View>
                <View>
                  <Text style={styles.statLabel}>{isProvider ? 'Income' : 'Credit'}</Text>
                  <Text style={[styles.statValue, { color: COLORS.success }]}>
                    ₹{transactions.filter(t => isIncomeTransaction(t.type)).reduce((sum, t) => sum + t.amount, 0).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: addAlpha(COLORS.error, 0.1) }]}>
                  <Ionicons name="arrow-up" size={20} color={COLORS.error} />
                </View>
                <View>
                  <Text style={styles.statLabel}>{isProvider ? 'Expense' : 'Debit'}</Text>
                  <Text style={[styles.statValue, { color: COLORS.error }]}>
                    ₹{transactions.filter(t => !isIncomeTransaction(t.type)).reduce((sum, t) => sum + t.amount, 0).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Spacer for overlapping stats */}
          <View style={{ height: 40 }} />

          {/* Quick Actions - Top-up for Members, Withdrawal for Providers */}
          {user?.role === 'provider' ? (
            <View style={styles.quickActionsSection}>
              <Text style={styles.sectionTitle}>Withdraw Earnings</Text>

              {/* Commission Info Card */}
              <View style={{ backgroundColor: addAlpha(COLORS.warning, 0.1), borderRadius: 12, padding: 12, marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="information-circle-outline" size={18} color={COLORS.warning} />
                  <Text style={{ fontSize: 12, color: COLORS.warning, marginLeft: 8, flex: 1 }}>
                    {withdrawalConfig.commissionRate}% platform commission on withdrawals
                  </Text>
                </View>
              </View>

              {/* Bank Account Status */}
              {withdrawalConfig.bankAccount ? (
                <View style={{ backgroundColor: addAlpha(COLORS.success, 0.1), borderRadius: 12, padding: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={{ fontSize: 12, color: COLORS.success, fontWeight: '500' }}>Bank Account Linked</Text>
                    <Text style={{ fontSize: 14, color: COLORS.success, fontWeight: '600' }}>{withdrawalConfig.bankAccount}</Text>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={{ backgroundColor: addAlpha(COLORS.error, 0.1), borderRadius: 12, padding: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}
                  onPress={() => navigation.navigate('BankDetails' as never)}
                >
                  <Ionicons name="warning-outline" size={20} color={COLORS.error} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={{ fontSize: 12, color: COLORS.error, fontWeight: '500' }}>Bank Account Required</Text>
                    <Text style={{ fontSize: 11, color: COLORS.error }}>Add bank details to enable withdrawals</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.error} />
                </TouchableOpacity>
              )}

              {/* Withdrawal Button */}
              <TouchableOpacity
                style={[styles.withdrawButton, { opacity: balance >= withdrawalConfig.minAmount && withdrawalConfig.hasBankDetails ? 1 : 0.5 }]}
                onPress={() => {
                  if (!withdrawalConfig.hasBankDetails) {
                    navigation.navigate('BankDetails' as never);
                    return;
                  }
                  if (balance < withdrawalConfig.minAmount) {
                    showError(`Minimum balance of ₹${withdrawalConfig.minAmount} required`);
                    return;
                  }
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setShowWithdrawModal(true);
                }}
                disabled={isWithdrawing}
              >
                <Ionicons name="cash-outline" size={24} color={COLORS.white} />
                <Text style={styles.withdrawButtonText}>Withdraw to Bank</Text>
              </TouchableOpacity>

              <Text style={{ fontSize: 11, color: COLORS.textTertiary, textAlign: 'center', marginTop: 8 }}>
                Min ₹{withdrawalConfig.minAmount} • Processed in {withdrawalConfig.processingDays} days
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.quickActionsSection}>
                <Text style={styles.sectionTitle}>Quick Top-up</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={{ paddingRight: 20 }}>
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

              {/* Withdrawal for Members - temporarily commented out */}
              {/* <View style={[styles.quickActionsSection, { marginTop: 0 }]}>
                <Text style={styles.sectionTitle}>Withdraw Money</Text>
                <TouchableOpacity
                  style={[styles.withdrawButton, { backgroundColor: '#059669' }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    showSuccess('Withdrawal feature coming soon!');
                  }}
                >
                  <Ionicons name="arrow-up-outline" size={24} color="#FFF" />
                  <Text style={styles.withdrawButtonText}>Withdraw to Bank</Text>
                </TouchableOpacity>
              </View> */}
            </>
          )}

          {/* Transactions */}
          <View style={styles.transactionsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
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
                <Text style={styles.emptyTitle}>No transaction history</Text>
                <Text style={styles.emptyDescription}>Your recent payments and top-ups will show here</Text>
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
          <Ionicons name="add" size={24} color={COLORS.white} />
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
                  placeholderTextColor={COLORS.textTertiary}
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

        {/* Withdrawal Modal for Providers */}
        <Modal
          visible={showWithdrawModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowWithdrawModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Withdraw to Bank</Text>
              <Text style={styles.modalSubtitle}>Enter withdrawal amount</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.amountInput}
                  value={withdrawAmount}
                  onChangeText={setWithdrawAmount}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={COLORS.textTertiary}
                  autoFocus
                />
              </View>

              {/* Live Commission Preview */}
              {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
                <View style={{ backgroundColor: addAlpha(COLORS.primary, 0.05), borderRadius: 12, padding: 12, marginTop: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 13, color: COLORS.text }}>Amount</Text>
                    <Text style={{ fontSize: 13, color: COLORS.text }}>₹{parseFloat(withdrawAmount).toFixed(2)}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 13, color: COLORS.error }}>Commission ({withdrawalConfig.commissionRate}%)</Text>
                    <Text style={{ fontSize: 13, color: COLORS.error }}>
                      -₹{(parseFloat(withdrawAmount) * withdrawalConfig.commissionRate / 100).toFixed(2)}
                    </Text>
                  </View>
                  <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 8 }} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: COLORS.success, fontWeight: '600' }}>You'll Receive</Text>
                    <Text style={{ fontSize: 14, color: COLORS.success, fontWeight: '700' }}>
                      ₹{(parseFloat(withdrawAmount) * (1 - withdrawalConfig.commissionRate / 100)).toFixed(2)}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => {
                    setShowWithdrawModal(false);
                    setWithdrawAmount('');
                  }}
                >
                  <Text style={styles.modalButtonTextCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonConfirm, { backgroundColor: COLORS.success }]}
                  onPress={handleWithdraw}
                  disabled={isWithdrawing}
                >
                  {isWithdrawing ? (
                    <Text style={[styles.modalButtonTextConfirm, { opacity: 0.7 }]}>Processing...</Text>
                  ) : (
                    <Text style={styles.modalButtonTextConfirm}>Withdraw</Text>
                  )}
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
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
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
    backgroundColor: COLORS.white,
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
  // Premium Wallet Card
  cardContainer: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    marginBottom: 40, // Space for overlapping stats
    zIndex: 1,
  },
  walletCard: {
    padding: SPACING.xl,
    borderRadius: 24,
    height: 220,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    ...SHADOWS.md,
    elevation: 10,
  },
  patternDot1: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.15)',
    zIndex: 0,
  },
  patternDot2: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.1)',
    zIndex: 0,
  },
  patternAhoy: {
    position: 'absolute',
    top: 40,
    left: '40%',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(139, 92, 246, 0.3)', // Violet glow
    filter: 'blur(40px)', // Note: blur might not work on native without library, using opacity fallback
    opacity: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 2,
  },
  cardLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  cardBalance: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -1,
    lineHeight: 42,
  },
  glassChip: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    zIndex: 2,
  },
  cardUserInfo: {
    justifyContent: 'center',
  },
  cardUserValues: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
    letterSpacing: 1,
    opacity: 0.9,
  },
  cardUserLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'monospace', // Monospace for card number feel
  },
  mainAddButton: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 100,
    gap: 6,
    ...SHADOWS.sm,
  },
  mainAddButtonText: {
    color: '#2563EB', // Indigo Primary
    fontWeight: '700',
    fontSize: 15,
  },

  // Floating Stats Section - 3D Overlap
  floatingStatsContainer: {
    position: 'absolute',
    bottom: -35,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    zIndex: 10,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 20,
    ...SHADOWS.md, // Elevated shadow
    elevation: 8,
    gap: 12,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12, // Softer square
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textTertiary, // Gray-400
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
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
    backgroundColor: COLORS.white,
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
  withdrawButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 12,
    ...SHADOWS.md,
  },
  withdrawButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  comingSoonCard: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  comingSoonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
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
  // Transaction Styles - Clean List
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    paddingHorizontal: 0, // No horizontal padding for cleaner list look
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100, // #F3F4F6
  },
  transactionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  transactionDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text, // #1F2937 Gray-900
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  transactionMeta: {
    fontSize: 13,
    color: COLORS.textSecondary, // #6B7280 Gray-500
    fontWeight: '500',
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    fontVariant: ['tabular-nums'], // Better alignment for numbers
  },
  transactionStatus: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: COLORS.white,
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
    color: COLORS.white,
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
    backgroundColor: COLORS.white,
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
    backgroundColor: COLORS.gray50, // #F9FAFB
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
    backgroundColor: COLORS.gray100, // #F3F4F6
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border, // #E5E7EB
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
    backgroundColor: COLORS.gray100, // #F3F4F6
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
    color: COLORS.white,
  },
  refundBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: COLORS.accentYellow,
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
    color: COLORS.warning, // Using warning color instead of specific hex
    marginBottom: 4,
  },
  refundBannerText: {
    fontSize: 14,
    color: COLORS.warning, // Using warning color
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
    color: COLORS.white,
  },
});
