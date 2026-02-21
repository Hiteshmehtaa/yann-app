/**
 * Favorites Screen
 * 
 * Clean, Professional list of favorite providers.
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../utils/theme';
import { getFavorites, removeFromFavorites, FavoriteProvider } from '../../utils/favoritesStorage';
import { haptics } from '../../utils/haptics';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../../components/Toast';
import { EmptyState } from '../../components/EmptyState';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useTheme } from '../../contexts/ThemeContext';
import { TopBar } from '../../components/ui/TopBar';
import { Button } from '../../components/ui/Button';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export const FavoritesScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [favorites, setFavorites] = useState<FavoriteProvider[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Added initial loading state
  const { toast, showInfo, hideToast } = useToast();

  const loadFavorites = async () => {
    // Don't set loading on refresh to allow silent updates if needed, 
    // but useful for first load
    const favs = await getFavorites();
    setFavorites(favs);
    setIsLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      // Trigger load every time screen comes into focus
      loadFavorites();
      return () => { }; // Cleanup if needed
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadFavorites();
    haptics.success();
    setIsRefreshing(false);
  }, []);

  const handleRemoveFavorite = async (providerId: string) => {
    haptics.medium();
    await removeFromFavorites(providerId);
    // Optimistic update
    setFavorites(prev => prev.filter(p => (p.id || p._id) !== providerId));
    showInfo('Removed from Favorites');
  };

  const renderProviderItem = ({ item }: { item: FavoriteProvider }) => {
    const providerImage = item.profileImage || item.avatar;
    const firstService = item.services && item.services.length > 0 ? item.services[0] : 'General Service';

    return (
      <TouchableOpacity
        style={[styles.itemContainer, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
        onPress={() => {
          haptics.selection();
          navigation.navigate('ProviderPublicProfile', {
            provider: item
          });
        }}
        activeOpacity={0.7}
      >
        <View style={styles.itemContent}>
          {/* Avatar */}
          <View style={styles.imageWrapper}>
            {providerImage ? (
              <Image source={{ uri: providerImage }} style={styles.avatar} />
            ) : (
              <View style={[styles.placeholderAvatar, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.placeholderText, { color: colors.primary }]}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {/* Info */}
          <View style={styles.infoColumn}>
            <Text style={[styles.nameText, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
            <Text style={[styles.serviceText, { color: colors.textSecondary }]} numberOfLines={1}>{firstService}</Text>

            <View style={styles.statsRow}>
              <View style={styles.ratingBox}>
                <Ionicons name="star" size={12} color="#D97706" />
                <Text style={styles.ratingText}>{item.rating ? item.rating.toFixed(1) : 'New'}</Text>
              </View>
              <Text style={[styles.reviewCount, { color: colors.textTertiary }]}>{item.totalReviews || 0} reviews</Text>
            </View>
          </View>

          {/* Action */}
          <TouchableOpacity
            style={styles.heartButton}
            onPress={(e) => {
              e.stopPropagation(); // Prevent card click
              handleRemoveFavorite(item.id || item._id || '')
            }}
          >
            <Ionicons name="heart" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return <LoadingSpinner visible={true} size="small" />;

    return (
      <View style={[styles.emptyContainer, { paddingTop: 60 }]}>
        <EmptyState
          title="No Favorites"
          subtitle="Save providers you love to access them quickly here."
        >
          <View style={{ marginTop: 24 }}>
            <Button
              title="Find Providers"
              onPress={() => {
                haptics.medium();
                (navigation as any).navigate('MainTabs', { screen: 'Home' });
              }}
              variant="primary"
              size="medium"
            />
          </View>
        </EmptyState>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />

      <TopBar
        title="Favorites"
        showBack
        onBackPress={() => navigation.goBack()}
        showProfile={false}
      />

      <FlatList
        data={favorites}
        renderItem={renderProviderItem}
        keyExtractor={(item) => item.id || item._id || ''}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: insets.top + 10 },
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

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 100,
  },
  listContentEmpty: {
    flexGrow: 1,
  },

  // Clean List Item Styles
  itemContainer: {
    marginBottom: 12,
    borderRadius: RADIUS.medium,
    borderWidth: 1,
    // Very subtle shadow for definition
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  imageWrapper: {
    marginRight: 14,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F1F5F9',
  },
  placeholderAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: '700',
  },
  infoColumn: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  serviceText: {
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  reviewCount: {
    fontSize: 12,
  },
  heartButton: {
    padding: 10,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxxl,
  },
});
