import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../utils/theme';
import { TabBar } from '../../components/ui/TabBar';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

interface FavoriteService {
  id: string;
  title: string;
  provider: string;
  rating: number;
  price: string;
  image: any;
}

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'cleaning', label: 'Cleaning' },
  { key: 'repairing', label: 'Repairing' },
  { key: 'plumbing', label: 'Plumbing' },
];

// Sample favorite services data
const FAVORITE_SERVICES: FavoriteService[] = [
  {
    id: '1',
    title: 'Home Cleaning',
    provider: 'Robert Kelvin',
    rating: 4.5,
    price: '$1,600',
    image: require('../../../assets/service-icons/cleaning.png'),
  },
  {
    id: '2',
    title: 'AC Repair',
    provider: 'John Mike',
    rating: 4.5,
    price: '$500',
    image: require('../../../assets/service-icons/repair.png'),
  },
  {
    id: '3',
    title: 'Kitchen Cleaning',
    provider: 'Sarah Wilson',
    rating: 4.2,
    price: '$1,900',
    image: require('../../../assets/service-icons/cleaning.png'),
  },
  {
    id: '4',
    title: 'Home Cleaning',
    provider: 'Mike Johnson',
    rating: 3.2,
    price: '$1,400',
    image: require('../../../assets/service-icons/cleaning.png'),
  },
];

export const FavoritesScreen: React.FC<Props> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [favorites, setFavorites] = useState(FAVORITE_SERVICES);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => prev.filter((item) => item.id !== id));
  };

  const renderServiceCard = ({ item }: { item: FavoriteService }) => (
    <TouchableOpacity
      style={styles.serviceCard}
      activeOpacity={0.7}
      onPress={() => {
        // Navigate to service detail
        console.log('Navigate to service:', item.id);
      }}
    >
      {/* Service Image */}
      <View style={styles.imageContainer}>
        <Image source={item.image} style={styles.serviceImage} resizeMode="cover" />
      </View>

      {/* Service Info */}
      <View style={styles.serviceInfo}>
        <Text style={styles.serviceTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.providerName} numberOfLines={1}>
          {item.provider}
        </Text>

        {/* Rating and Price Row */}
        <View style={styles.bottomRow}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color={COLORS.warning} />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
          <Text style={styles.priceText}>{item.price}/hour</Text>
        </View>
      </View>

      {/* Favorite Button */}
      <TouchableOpacity
        style={styles.favoriteButton}
        onPress={() => toggleFavorite(item.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="heart" size={20} color="#FF4757" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

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
        <Text style={styles.headerTitle}>Favourite</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Tab Bar */}
      <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Services List */}
      <FlatList
        data={favorites}
        renderItem={renderServiceCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={64} color={COLORS.textTertiary} />
            <Text style={styles.emptyTitle}>No Favorites Yet</Text>
            <Text style={styles.emptyText}>
              Add services to favorites to see them here
            </Text>
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
  listContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  serviceCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  imageContainer: {
    width: '100%',
    height: 140,
    backgroundColor: COLORS.gray100,
    position: 'relative',
  },
  serviceImage: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    bottom: SPACING.sm,
    right: SPACING.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  serviceInfo: {
    padding: SPACING.md,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: COLORS.text,
    marginBottom: 2,
  },
  providerName: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.gray100,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: COLORS.text,
  },
  priceText: {
    fontSize: 13,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxxl,
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.size.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
