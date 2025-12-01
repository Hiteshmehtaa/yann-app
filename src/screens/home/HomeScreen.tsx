import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { SERVICES } from '../../utils/constants';
import { COLORS, SHADOWS } from '../../utils/theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

const SERVICE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'House Cleaning': 'sparkles-outline',
  'Repairs & Maintenance': 'hammer-outline',
  'Delivery Services': 'bicycle-outline',
  'Pet Care': 'paw-outline',
  'Personal Assistant': 'briefcase-outline',
  'Garden & Landscaping': 'leaf-outline',
  'Full-Day Personal Driver': 'car-sport-outline',
  'Pujari Services': 'flower-outline',
};

// Colors for each service card - warm, unique palette
const SERVICE_COLORS: Record<string, { bg: string; icon: string }> = {
  'House Cleaning': { bg: '#E8F5F3', icon: COLORS.primary },
  'Repairs & Maintenance': { bg: '#FFF3E8', icon: COLORS.accent },
  'Delivery Services': { bg: '#F0E8FF', icon: '#7C3AED' },
  'Pet Care': { bg: '#FFE8EE', icon: '#EC4899' },
  'Personal Assistant': { bg: '#E8F0FF', icon: '#3B82F6' },
  'Garden & Landscaping': { bg: '#E8FFE8', icon: '#22C55E' },
  'Full-Day Personal Driver': { bg: '#FFF8E8', icon: '#F59E0B' },
  'Pujari Services': { bg: '#FFE8E8', icon: '#EF4444' },
};

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();

  const renderServiceCard = ({ item }: { item: typeof SERVICES[0] }) => {
    const iconName = SERVICE_ICONS[item.title] || 'ellipse-outline';
    const colors = SERVICE_COLORS[item.title] || { bg: COLORS.backgroundAlt, icon: COLORS.primary };
    
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ServiceDetail', { service: item })}
        activeOpacity={0.8}
      >
        <View style={[styles.cardInner, { borderLeftColor: colors.icon }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: colors.bg }]}>
              <Ionicons name={iconName} size={24} color={colors.icon} />
            </View>
            {item.popular && (
              <View style={styles.popularBadge}>
                <Ionicons name="flame" size={10} color="#FFFFFF" />
                <Text style={styles.popularText}>Hot</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description}
          </Text>
          
          <View style={styles.cardFooter}>
            <Text style={styles.cardPrice}>{item.price}</Text>
            <View style={styles.arrowButton}>
              <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>
              {user?.name ? `Hi, ${user.name.split(' ')[0]} 👋` : 'Welcome!'}
            </Text>
            <Text style={styles.subtitle}>Your home, our priority</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <TouchableOpacity style={styles.searchBar} activeOpacity={0.8}>
          <Ionicons name="search-outline" size={20} color={COLORS.textSecondary} />
          <Text style={styles.searchText}>What service do you need?</Text>
        </TouchableOpacity>
      </View>

      {/* Services Grid */}
      <FlatList
        data={SERVICES}
        renderItem={renderServiceCard}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Our Services</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  notificationDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.secondary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
    ...SHADOWS.sm,
  },
  searchText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  listContent: {
    padding: 20,
    paddingTop: 8,
    paddingBottom: 120,
  },
  row: {
    justifyContent: 'space-between',
  },
  card: {
    flex: 1,
    maxWidth: '48%',
    marginBottom: 16,
  },
  cardInner: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderLeftWidth: 3,
    ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 3,
  },
  popularText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
    marginBottom: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  cardPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  arrowButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
