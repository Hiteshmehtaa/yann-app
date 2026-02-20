import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  FlatList,
  Platform,
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

type FilterTab = 'all' | 'credit' | 'debit';



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

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const filterAnim = useRef(new Animated.Value(0)).current;
  const balanceAnim = useRef(new Animated.Value(0)).current;
  const cardScaleAnim = useRef(new Animated.Value(0.95)).current;
  const listOpacity = useRef(new Animated.Value(1)).current;
  const listTranslateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadWalletData(true);
    checkFailedTransactions();
    // Card entrance animation
    Animated.parallel([
      Animated.spring(cardScaleAnim, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
      Animated.timing(balanceAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const loadWalletData = async (reset = false) => {
    try {
      if (reset) {
        setIsLoading(true);
        setPage(1);
      }

      const currentPage = reset ? 1 : page;
      const response = await apiService.getWalletBalance(currentPage, 20);

      if (response.success && response.data) {
        setBalance(response.data.balance || 0);

        const newTransactions = response.data.transactions || [];

        if (reset) {
          setTransactions(newTransactions);
        } else {
          setTransactions(prev => [...prev, ...newTransactions]);
        }

        // Update pagination state
        if (response.data.meta) {
          setHasMore(response.data.meta.hasMore);
          setPage(currentPage + 1);
        } else {
          // Fallback if no meta
          setHasMore(newTransactions.length === 20);
          if (newTransactions.length > 0) setPage(currentPage + 1);
        }

        if (reset) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Load withdrawal config for providers only on initial load
      if (reset && user?.role === 'provider') {
        loadWithdrawalConfig();
      }
    } catch (error) {
      console.error('Failed to load wallet:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  };

  const loadWithdrawalConfig = async () => {
    try {
      const withdrawInfo = await apiService.getWithdrawalInfo();
      if (withdrawInfo.success && withdrawInfo.data) {
        const minAmount = withdrawInfo.data.withdrawalConfig?.minAmount;
        const finalMinAmount = minAmount === 100 ? 1 : (minAmount || 1);
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
        loadWalletData(true);
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showError(error.response?.data?.message || 'Refund failed');
    } finally {
      setIsProcessingRefund(false);
    }
  };

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
        loadWalletData(true); // Refresh balance
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
    if (showAmountModal) {
      setShowAmountModal(false);
    }

    const finalAmount = amountToAdd || 500;

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
        loadWalletData(true);
      }
    } catch (error: any) {
      console.error('Wallet topup error:', error);
      if (!error.message?.toLowerCase().includes('cancel')) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        const errorMessage = error.response?.data?.message || error.message || 'Failed to add money';
        showError(errorMessage);
      }
    } finally {
      setIsAddingMoney(false);
    }
  };

  const handleFilterChange = (filter: FilterTab) => {
    if (filter === activeFilter) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Fade + slide out
    Animated.parallel([
      Animated.timing(listOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(listTranslateY, { toValue: 8, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setActiveFilter(filter);
      listTranslateY.setValue(-8);
      // Fade + slide in from opposite direction
      Animated.parallel([
        Animated.timing(listOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(listTranslateY, { toValue: 0, tension: 120, friction: 10, useNativeDriver: true }),
      ]).start();
    });
  };

  const getTransactionIcon = (description: string, type: string) => {
    const desc = description.toLowerCase();
    if (desc.includes('wallet top') || desc.includes('added')) return 'wallet-plus';
    if (desc.includes('booking') || desc.includes('service')) return 'calendar-check';
    if (desc.includes('refund') || desc.includes('cancel')) return 'cash-refund';
    if (desc.includes('payment')) return 'credit-card';
    return type === 'CREDIT' ? 'arrow-down-left' : 'arrow-up-right';
  };

  const isProvider = user?.role === 'provider';

  const renderTransaction = ({ item, index }: { item: Transaction, index: number }) => {
    const isDebit = item.amount < 0;
    const absAmount = Math.abs(item.amount);
    const iconName = getTransactionIcon(item.description, item.type);

    const incomeColor = COLORS.success;
    const expenseColor = COLORS.error;
    const tintColor = isDebit ? expenseColor : incomeColor;
    const bgColor = isDebit ? addAlpha(expenseColor, 0.1) : addAlpha(incomeColor, 0.1);

    const date = new Date(item.createdAt);
    const isToday = new Date().toDateString() === date.toDateString();
    const isYesterday = new Date(Date.now() - 86400000).toDateString() === date.toDateString();
    const dateStr = isToday ? 'Today' : isYesterday ? 'Yesterday' : date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const amountPrefix = isDebit ? '-' : '+';
    const statusLabel = isProvider ? (isDebit ? 'Expense' : 'Income') : (isDebit ? 'Debit' : 'Credit');

    return (
      <View key={item._id} style={styles.transactionCard}>
        <View style={[styles.transactionIconCircle, { backgroundColor: bgColor }]}>
          <MaterialCommunityIcons name={iconName} size={20} color={tintColor} />
        </View>

        <View style={styles.transactionDetails}>
          <Text style={styles.transactionTitle} numberOfLines={1}>
            {item.description || 'Transaction'}
          </Text>
          <View style={styles.transactionMetaRow}>
            <Text style={styles.transactionMeta}>{dateStr}</Text>
            <View style={styles.metaDot} />
            <Text style={styles.transactionMeta}>{timeStr}</Text>
          </View>
        </View>

        <View style={styles.transactionAmountContainer}>
          <Text style={[styles.transactionAmount, { color: tintColor }]}>
            {amountPrefix}₹{absAmount.toFixed(2)}
          </Text>
          <View style={[styles.transactionBadge, { backgroundColor: bgColor }]}>
            <Text style={[styles.transactionStatus, { color: tintColor }]}>
              {statusLabel}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const activeTransactions = activeFilter === 'credit'
    ? transactions.filter(t => t.amount >= 0)
    : activeFilter === 'debit'
      ? transactions.filter(t => t.amount < 0)
      : transactions;

  // Memoized static top section — never re-renders when filter changes
  const renderStaticTop = useCallback(() => (
    <>
      {/* Header */}
      <View style={styles.header}>
        <AnimatedButton onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </AnimatedButton>
        <Text style={styles.headerTitle}>My Wallet</Text>
        <AnimatedButton
          style={styles.helpButton}
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
        >
          <Ionicons name="help-circle-outline" size={24} color={COLORS.text} />
        </AnimatedButton>
      </View>

      {/* Refund Banner */}
      {refundableAmount > 0 && (
        <View style={styles.refundBanner}>
          <View style={styles.refundBannerContent}>
            <View style={styles.refundIconContainer}>
              <Ionicons name="alert-circle" size={22} color={COLORS.warning} />
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
              <LoadingSpinner visible={true} color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.refundButtonText}>Claim</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Premium Wallet Card */}
      <Animated.View style={[styles.cardContainer, { transform: [{ scale: cardScaleAnim }] }]}>
        <LinearGradient
          colors={['#1D4ED8', '#2563EB', '#3B82F6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.walletCard}
        >
          <View style={styles.patternDot1} />
          <View style={styles.patternDot2} />
          <View style={styles.patternDot3} />

          <View style={styles.cardHeader}>
            <View style={styles.cardLabelRow}>
              <View style={styles.walletDotIndicator} />
              <Text style={styles.cardLabel}>YANN WALLET</Text>
            </View>
            <View style={styles.glassChip}>
              <MaterialCommunityIcons name="contactless-payment" size={22} color="rgba(255,255,255,0.9)" />
            </View>
          </View>

          <Animated.View style={{ opacity: balanceAnim }}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.cardBalance}>
              ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Text>
          </Animated.View>

          <View style={styles.cardFooter}>
            <View style={styles.cardChip}>
              <MaterialCommunityIcons name="shield-check" size={13} color="rgba(255,255,255,0.7)" />
              <Text style={styles.cardChipText}>Secured Wallet</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Floating Stats */}
        <View style={styles.floatingStatsContainer}>
          <View style={[styles.statPill, { borderColor: addAlpha(COLORS.success, 0.25) }]}>
            <View style={[styles.statPillIcon, { backgroundColor: addAlpha(COLORS.success, 0.12) }]}>
              <Ionicons name="arrow-down-circle" size={20} color={COLORS.success} />
            </View>
            <View>
              <Text style={styles.statPillLabel}>{isProvider ? 'Income' : 'Money In'}</Text>
              <Text style={[styles.statPillValue, { color: COLORS.success }]}>
                ₹{transactions.filter(t => t.amount >= 0).reduce((s, t) => s + t.amount, 0).toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
          <View style={[styles.statPill, { borderColor: addAlpha(COLORS.error, 0.25) }]}>
            <View style={[styles.statPillIcon, { backgroundColor: addAlpha(COLORS.error, 0.12) }]}>
              <Ionicons name="arrow-up-circle" size={20} color={COLORS.error} />
            </View>
            <View>
              <Text style={styles.statPillLabel}>{isProvider ? 'Expense' : 'Money Out'}</Text>
              <Text style={[styles.statPillValue, { color: COLORS.error }]}>
                ₹{Math.abs(transactions.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0)).toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Spacer for floating stats */}
      <View style={{ height: 56 }} />

      {/* Quick Actions */}
      {user?.role === 'provider' ? (
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Withdraw Earnings</Text>
          <View style={styles.infoRow}>
            <Ionicons name="information-circle-outline" size={16} color={COLORS.warning} />
            <Text style={styles.infoText}>
              {withdrawalConfig.commissionRate}% platform commission on withdrawals
            </Text>
          </View>
          {withdrawalConfig.bankAccount ? (
            <View style={styles.bankLinkedRow}>
              <View style={styles.bankLinkedIcon}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bankLinkedLabel}>Bank Account Linked</Text>
                <Text style={styles.bankLinkedValue}>{withdrawalConfig.bankAccount}</Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.bankMissingRow}
              onPress={() => navigation.navigate('BankDetails' as never)}
            >
              <Ionicons name="warning-outline" size={20} color={COLORS.error} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.bankMissingLabel}>Bank Account Required</Text>
                <Text style={styles.bankMissingSubLabel}>Add bank details to enable withdrawals</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.error} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.withdrawButton, {
              opacity: balance >= withdrawalConfig.minAmount && withdrawalConfig.hasBankDetails ? 1 : 0.45,
            }]}
            onPress={() => {
              if (!withdrawalConfig.hasBankDetails) { navigation.navigate('BankDetails' as never); return; }
              if (balance < withdrawalConfig.minAmount) { showError(`Minimum balance ₹${withdrawalConfig.minAmount} required`); return; }
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowWithdrawModal(true);
            }}
            disabled={isWithdrawing}
          >
            <Ionicons name="cash-outline" size={22} color={COLORS.white} />
            <Text style={styles.withdrawButtonText}>Withdraw to Bank</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Top-up</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsScroll}
            contentContainerStyle={{ paddingRight: 20, gap: 10 }}
          >
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
      )}
    </>
  ), [balance, refundableAmount, isProcessingRefund, transactions, withdrawalConfig, isWithdrawing, isProvider]);

  // Lightweight list header — only this re-renders on filter change
  const renderListHeader = useCallback(() => (
    <View style={styles.transactionsSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <Text style={styles.txCountText}>{activeTransactions.length} transactions</Text>
      </View>
      <View style={styles.filterTabsContainer}>
        {(['all', 'credit', 'debit'] as FilterTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, activeFilter === tab && styles.filterTabActive]}
            onPress={() => handleFilterChange(tab)}
            activeOpacity={0.75}
          >
            {tab !== 'all' && (
              <View style={[
                styles.filterDot,
                { backgroundColor: tab === 'credit' ? COLORS.success : COLORS.error },
                activeFilter !== tab && { opacity: 0.5 },
              ]} />
            )}
            <Text style={[styles.filterTabText, activeFilter === tab && styles.filterTabTextActive]}>
              {tab === 'all' ? 'All' : tab === 'credit' ? 'Credits' : 'Debits'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  ), [activeFilter, activeTransactions.length]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>

        {/* Static section — wallet card, stats, quick actions. Never re-renders on filter change */}
        {renderStaticTop()}

        {/* Animated wrapper — only wraps the transaction list */}
        <Animated.View style={[styles.animatedListWrapper, { opacity: listOpacity, transform: [{ translateY: listTranslateY }] }]}>
        <FlatList
          data={activeTransactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderListHeader}
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="receipt-outline" size={44} color={COLORS.textTertiary} />
                </View>
                <Text style={styles.emptyTitle}>
                  {activeFilter === 'all' ? 'No transactions yet' : `No ${activeFilter} transactions`}
                </Text>
                <Text style={styles.emptyDescription}>
                  {activeFilter === 'all'
                    ? 'Your payments and top-ups will appear here'
                    : `Switch filter to see other transactions`}
                </Text>
              </View>
            ) : null
          }
          onEndReached={() => {
            if (!isLoadingMore && hasMore && !isLoading && activeFilter === 'all') {
              setIsLoadingMore(true);
              loadWalletData(false);
            }
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.loadMoreFooter}>
                <LoadingSpinner visible={true} size="small" />
                <Text style={styles.loadMoreText}>Loading more...</Text>
              </View>
            ) : hasMore && activeFilter === 'all' && transactions.length > 0 ? (
              <View style={styles.paginationFooter}>
                <TouchableOpacity
                  style={styles.loadMoreBtn}
                  onPress={() => {
                    setIsLoadingMore(true);
                    loadWalletData(false);
                  }}
                >
                  <Ionicons name="chevron-down" size={16} color={COLORS.primary} />
                  <Text style={styles.loadMoreBtnText}>Load more</Text>
                </TouchableOpacity>
              </View>
            ) : transactions.length > 0 ? (
              <View style={styles.endOfListFooter}>
                <View style={styles.endDivider} />
                <Text style={styles.endOfListText}>You're all caught up</Text>
                <View style={styles.endDivider} />
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                setIsRefreshing(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                loadWalletData(true);
              }}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        />
        </Animated.View>

        {/* FAB - only for customers */}
        {user?.role !== 'provider' && (
          <AnimatedButton style={styles.fab} onPress={openAmountModal}>
            <Ionicons name="add" size={26} color={COLORS.white} />
          </AnimatedButton>
        )}

        {/* Custom Amount Modal */}
        <Modal
          visible={showAmountModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAmountModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />
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
              <View style={styles.modalHandle} />
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
  animatedListWrapper: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 120,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
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
    letterSpacing: -0.3,
  },

  // ── Refund Banner ────────────────────────────────────────────────────────────
  refundBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: SPACING.lg,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  refundBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  refundIconContainer: {
    marginRight: 10,
  },
  refundTextContainer: {
    flex: 1,
  },
  refundBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 2,
  },
  refundBannerText: {
    fontSize: 12,
    color: '#B45309',
  },
  refundButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 60,
    minHeight: 36,
    justifyContent: 'center',
  },
  refundButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },

  // ── Wallet Card ──────────────────────────────────────────────────────────────
  cardContainer: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    marginBottom: 44,
    zIndex: 1,
  },
  walletCard: {
    padding: SPACING.xl,
    borderRadius: 28,
    height: 210,
    justifyContent: 'space-between',
    overflow: 'hidden',
    ...SHADOWS.md,
    elevation: 12,
  },
  patternDot1: {
    position: 'absolute',
    top: -70,
    right: -70,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  patternDot2: {
    position: 'absolute',
    bottom: -50,
    left: -50,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  patternDot3: {
    position: 'absolute',
    top: 60,
    right: '30%',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  walletDotIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  cardLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  glassChip: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  balanceLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    marginBottom: 6,
  },
  cardBalance: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -1,
    lineHeight: 40,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  cardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  cardChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.3,
  },

  // ── Floating Stats ───────────────────────────────────────────────────────────
  floatingStatsContainer: {
    position: 'absolute',
    bottom: -38,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 10,
  },
  statPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
    borderWidth: 1,
    ...SHADOWS.sm,
    elevation: 4,
  },
  statPillIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statPillLabel: {
    fontSize: 11,
    color: COLORS.textTertiary,
    fontWeight: '600',
    marginBottom: 2,
  },
  statPillValue: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  // ── Quick Actions ────────────────────────────────────────────────────────────
  quickActionsSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
    letterSpacing: -0.3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: addAlpha(COLORS.warning, 0.1),
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.warning,
    fontWeight: '500',
    flex: 1,
  },
  bankLinkedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: addAlpha(COLORS.success, 0.08),
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: addAlpha(COLORS.success, 0.2),
  },
  bankLinkedIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: addAlpha(COLORS.success, 0.15),
    justifyContent: 'center',
    alignItems: 'center',
  },
  bankLinkedLabel: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '600',
  },
  bankLinkedValue: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: '700',
    marginTop: 1,
  },
  bankMissingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: addAlpha(COLORS.error, 0.08),
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: addAlpha(COLORS.error, 0.2),
  },
  bankMissingLabel: {
    fontSize: 13,
    color: COLORS.error,
    fontWeight: '600',
    marginLeft: 10,
  },
  bankMissingSubLabel: {
    fontSize: 11,
    color: COLORS.error,
    opacity: 0.8,
    marginLeft: 10,
    marginTop: 2,
  },
  chipsScroll: {
    marginHorizontal: -SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  amountChip: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: addAlpha(COLORS.primary, 0.2),
    ...SHADOWS.sm,
  },
  amountChipText: {
    fontSize: 14,
    fontWeight: '700',
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
    gap: 10,
    ...SHADOWS.md,
  },
  withdrawButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },

  // ── Transactions Section ─────────────────────────────────────────────────────
  transactionsSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  txCountText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textTertiary,
    alignSelf: 'flex-start',
    marginTop: 2,
  },

  // ── Filter Tabs ──────────────────────────────────────────────────────────────
  filterTabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray100,
    borderRadius: 14,
    padding: 4,
    marginBottom: SPACING.md,
    gap: 4,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    gap: 5,
  },
  filterTabActive: {
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
    elevation: 2,
  },
  filterDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textTertiary,
  },
  filterTabTextActive: {
    color: COLORS.text,
    fontWeight: '700',
  },

  // ── Transaction Card ─────────────────────────────────────────────────────────
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  transactionIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  transactionDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 5,
    letterSpacing: -0.2,
  },
  transactionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.textTertiary,
  },
  transactionMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 5,
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  transactionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  transactionStatus: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── Pagination Footer ────────────────────────────────────────────────────────
  loadMoreFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 10,
  },
  loadMoreText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  paginationFooter: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: addAlpha(COLORS.primary, 0.25),
    ...SHADOWS.sm,
  },
  loadMoreBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  endOfListFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 24,
    gap: 12,
  },
  endDivider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  endOfListText: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // ── Empty State ──────────────────────────────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
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
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptyDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  // ── FAB ─────────────────────────────────────────────────────────────────────
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.primary,
    elevation: 10,
  },

  // ── Modals ───────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
    padding: 0,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: -0.5,
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
    backgroundColor: COLORS.gray50,
    borderRadius: 16,
    paddingHorizontal: 18,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  currencySymbol: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 34,
    fontWeight: '800',
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
    backgroundColor: addAlpha(COLORS.primary, 0.07),
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: addAlpha(COLORS.primary, 0.15),
  },
  quickAmountText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: COLORS.gray100,
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
    fontWeight: '700',
    color: COLORS.white,
  },
});
