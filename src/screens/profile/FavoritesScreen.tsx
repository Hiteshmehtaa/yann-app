/**
 * Favorites Screen
 * 
 * Shows all liked/favorited providers
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../../utils/theme';
import { getFavorites, removeFromFavorites, FavoriteProvider } from '../../utils/favoritesStorage';
import { EmptyState } from '../../components/EmptyState';
import { useTheme } from '../../contexts/ThemeContext';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export const FavoritesScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const [favorites, setFavorites] = useState<FavoriteProvider[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadFavorites = async () => {
    const favs = await getFavorites();
    setFavorites(favs);
  };

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadFavorites();
    setIsRefreshing(false);
  }, []);

  const handleRemoveFavorite = async (providerId: string) => {
    await removeFromFavorites(providerId);
    await loadFavorites();
  };

  const handleProviderPress = (provider: FavoriteProvider) => {
    navigation.navigate('ProviderPublicProfile', { provider });
  };

  const renderProviderCard = ({ item }: { item: FavoriteProvider }) => {
    const providerImage = item.profileImage || item.avatar;
    const providerInitial = item.name.charAt(0).toUpperCase();

    return (
      <TouchableOpacity
        style={[styles.cardContainer, { backgroundColor: colors.cardBg, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
        onPress={() => navigation.navigate('ProviderPublicProfile', {
          provider: item,
          service: { title: item.services && item.services.length > 0 ? item.services[0] : 'Service' }
        })}
        activeOpacity={0.9}
      >
        <View style={styles.cardHeader}>
          {providerImage ? (
            <Image source={{ uri: providerImage }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.placeholderAvatar, { backgroundColor: item.name.length % 2 === 0 ? colors.primary : colors.accentOrange }]}>
              <Text style={styles.placeholderText}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
          )}

          <View style={styles.headerInfo}>
            <Text style={[styles.providerName, { color: colors.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.ratingRow}>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <Text style={[styles.ratingText, { color: colors.text }]}>{item.rating?.toFixed(1) || 'NEW'}</Text>
              </View>
              <Text style={[styles.reviewCount, { color: colors.textSecondary }]}>• {item.totalReviews || 0} reviews</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.heartButton, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2' }]}
            onPress={() => handleRemoveFavorite(item.id || item._id || '')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="heart" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.tagContainer}>
            {item.services?.slice(0, 3).map((service, index) => (
              <View key={index} style={[styles.serviceTag, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6' }]}>
                <Text style={[styles.serviceTagText, { color: isDark ? '#FFF' : '#4B5563' }]}>
                  {service}
                </Text>
              </View>
            ))}
          </View>

          <View style={[styles.statsRow, { marginTop: 12 }]}>
            <View style={styles.statItem}>
              <Ionicons name="briefcase-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.statText, { color: colors.textSecondary, marginLeft: 6 }]}>
                {item.experience || 0} Years Exp.
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <EmptyState
        title="No Favorites Yet"
        subtitle="Tap the heart icon on provider profiles to add them to your favorites"
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBg, borderBottomColor: colors.divider }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Favorites</Text>
        <View style={styles.headerRight}>
          {favorites.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{favorites.length}</Text>
            </View>
          )}
        </View>
      </View>

      {/* List */}
      <FlatList
        data={favorites}
        renderItem={renderProviderCard}
        keyExtractor={(item) => item.id || item._id || ''}
        contentContainerStyle={[
          styles.listContent,
          favorites.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: TYPOGRAPHY.weight.bold,
  },
  headerRight: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  countBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  // List Item Styles
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.large,
    borderWidth: 1,
    ...SHADOWS.sm,
  },
  listItemLeft: {
    marginRight: 16,
  },
  listAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  placeholderAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  listItemCenter: {
    flex: 1,
    justifyContent: 'center',
  },
  listName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  listService: {
    fontSize: 13,
    marginBottom: 6,
  },
  listRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listRating: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  listReviews: {
    fontSize: 12,
  },
  listItemRight: {
    marginLeft: 12,
    justifyContent: 'center',
  },
  listHeartButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxxl,
  },
});
