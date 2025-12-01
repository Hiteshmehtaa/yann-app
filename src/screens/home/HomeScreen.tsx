import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { SERVICES } from '../../utils/constants';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const { width } = Dimensions.get('window');

// Bold editorial color palette - Noir meets warmth
const THEME = {
  bg: '#0D0D0D',
  bgCard: '#1A1A1A',
  bgElevated: '#242424',
  accent: '#FF6B35',      // Warm orange
  accentSoft: '#FF6B3520',
  gold: '#D4AF37',
  text: '#FAFAFA',
  textMuted: '#8A8A8A',
  textSubtle: '#5A5A5A',
  border: '#2A2A2A',
  success: '#34D399',
};

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

const SERVICE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'House Cleaning': 'sparkles',
  'Repairs & Maintenance': 'construct',
  'Delivery Services': 'bicycle',
  'Pet Care': 'paw',
  'Personal Assistant': 'briefcase',
  'Garden & Landscaping': 'leaf',
  'Full-Day Personal Driver': 'car-sport',
  'Pujari Services': 'flower',
};

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const renderServiceCard = ({ item, index }: { item: typeof SERVICES[0]; index: number }) => {
    const iconName = SERVICE_ICONS[item.title] || 'ellipse';
    const isLarge = index === 0 || index === 3;
    
    return (
      <TouchableOpacity
        style={[styles.card, isLarge && styles.cardLarge]}
        onPress={() => navigation.navigate('ServiceDetail', { service: item })}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.cardGradient}
        />
        
        <View style={styles.cardContent}>
          <View style={styles.cardTop}>
            <View style={[styles.iconContainer, item.popular && styles.iconPopular]}>
              <Ionicons 
                name={iconName} 
                size={isLarge ? 28 : 22} 
                color={item.popular ? THEME.gold : THEME.accent} 
              />
            </View>
            {item.popular && (
              <View style={styles.popularBadge}>
                <Ionicons name="star" size={10} color={THEME.gold} />
              </View>
            )}
          </View>
          
          <View style={styles.cardBottom}>
            <Text style={[styles.cardTitle, isLarge && styles.cardTitleLarge]} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.cardPrice}>{item.price}</Text>
          </View>
        </View>
        
        <View style={styles.cardBorder} />
      </TouchableOpacity>
    );
  };

  const firstName = user?.name ? user.name.split(' ')[0] : 'there';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />
      
      <Animated.View 
        style={[
          styles.headerWrapper,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}
      >
        {/* Editorial Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Hello,</Text>
            <Text style={styles.userName}>{firstName}</Text>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="search" size={22} color={THEME.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <View style={styles.notifDot} />
              <Ionicons name="notifications" size={22} color={THEME.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Banner */}
        <TouchableOpacity style={styles.heroBanner} activeOpacity={0.9}>
          <LinearGradient
            colors={[THEME.accent, '#E85A2D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>PREMIUM{'\n'}SERVICES</Text>
              <Text style={styles.heroSubtitle}>Curated for you</Text>
            </View>
            <View style={styles.heroIcon}>
              <Ionicons name="arrow-forward" size={24} color="#FFF" />
            </View>
          </LinearGradient>
          <View style={styles.heroPattern} />
        </TouchableOpacity>

        {/* Metrics Row */}
        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>02</Text>
            <Text style={styles.metricLabel}>ACTIVE</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metric}>
            <Text style={styles.metricValue}>12</Text>
            <Text style={styles.metricLabel}>COMPLETED</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metric}>
            <View style={styles.ratingRow}>
              <Text style={styles.metricValue}>4.9</Text>
              <Ionicons name="star" size={14} color={THEME.gold} />
            </View>
            <Text style={styles.metricLabel}>RATING</Text>
          </View>
        </View>
      </Animated.View>

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <View style={styles.accentBar} />
          <Text style={styles.sectionTitle}>SERVICES</Text>
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={18} color={THEME.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Masonry-style Grid */}
      <FlatList
        data={SERVICES}
        renderItem={renderServiceCard}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  headerWrapper: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 24,
  },
  headerLeft: {},
  greeting: {
    fontSize: 14,
    color: THEME.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  userName: {
    fontSize: 32,
    fontWeight: '800',
    color: THEME.text,
    letterSpacing: -1,
    marginTop: -2,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  notifDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.accent,
    zIndex: 1,
  },
  heroBanner: {
    height: 140,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
  },
  heroGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
  },
  heroContent: {},
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 1,
    lineHeight: 32,
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroPattern: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 30,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: THEME.bgCard,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '800',
    color: THEME.text,
    letterSpacing: -1,
  },
  metricLabel: {
    fontSize: 10,
    color: THEME.textMuted,
    letterSpacing: 1.5,
    marginTop: 4,
  },
  metricDivider: {
    width: 1,
    height: 40,
    backgroundColor: THEME.border,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  accentBar: {
    width: 3,
    height: 20,
    backgroundColor: THEME.accent,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.text,
    letterSpacing: 3,
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: THEME.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  row: {
    justifyContent: 'space-between',
  },
  card: {
    width: (width - 52) / 2,
    height: 160,
    backgroundColor: THEME.bgCard,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  cardLarge: {
    height: 200,
  },
  cardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  cardContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: THEME.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconPopular: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
  },
  popularBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBottom: {},
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 6,
    lineHeight: 18,
  },
  cardTitleLarge: {
    fontSize: 16,
  },
  cardPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.accent,
    letterSpacing: 0.5,
  },
  cardBorder: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    height: 2,
    backgroundColor: THEME.accent,
    opacity: 0,
  },
});
