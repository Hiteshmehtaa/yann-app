import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Switch,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY, ANIMATIONS } from '../../utils/theme';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

export const NotificationsScreen: React.FC<Props> = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [settings, setSettings] = useState<NotificationSetting[]>([
    { id: 'bookings', title: 'Booking Updates', description: 'Get notified about booking confirmations and status changes', enabled: true },
    { id: 'promotions', title: 'Promotions & Offers', description: 'Receive special deals and discounts', enabled: true },
    { id: 'reminders', title: 'Service Reminders', description: 'Reminders before your scheduled services', enabled: true },
    { id: 'newsletter', title: 'Newsletter', description: 'Weekly updates and new service announcements', enabled: false },
    { id: 'sms', title: 'SMS Notifications', description: 'Receive updates via SMS', enabled: true },
    { id: 'email', title: 'Email Notifications', description: 'Receive updates via email', enabled: true },
  ]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: ANIMATIONS.slow,
      useNativeDriver: true,
    }).start();
  }, []);

  const toggleSetting = (id: string) => {
    setSettings(prev =>
      prev.map(setting =>
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
      )
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Push Notifications Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>PUSH NOTIFICATIONS</Text>
          </View>
          <View style={styles.card}>
            {settings.slice(0, 4).map((setting, index) => (
              <View
                key={setting.id}
                style={[
                  styles.settingItem,
                  index === 3 && styles.settingItemLast
                ]}
              >
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>{setting.title}</Text>
                  <Text style={styles.settingDescription}>{setting.description}</Text>
                </View>
                <Switch
                  value={setting.enabled}
                  onValueChange={() => toggleSetting(setting.id)}
                  trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
                  thumbColor={setting.enabled ? '#3B82F6' : '#F1F5F9'}
                />
              </View>
            ))}
          </View>

          {/* Communication Preferences */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>COMMUNICATION CHANNELS</Text>
          </View>
          <View style={styles.card}>
            {settings.slice(4).map((setting, index) => (
              <View
                key={setting.id}
                style={[
                  styles.settingItem,
                  index === 1 && styles.settingItemLast
                ]}
              >
                <View style={styles.settingIcon}>
                  <Ionicons
                    name={setting.id === 'sms' ? 'chatbubble-outline' : 'mail-outline'}
                    size={20}
                    color={COLORS.primary}
                  />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>{setting.title}</Text>
                  <Text style={styles.settingDescription}>{setting.description}</Text>
                </View>
                <Switch
                  value={setting.enabled}
                  onValueChange={() => toggleSetting(setting.id)}
                  trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
                  thumbColor={setting.enabled ? '#3B82F6' : '#F1F5F9'}
                />
              </View>
            ))}
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color="#60A5FA" />
            <Text style={styles.infoText}>
              Security alerts and booking confirmations will always be sent regardless of your preferences.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  sectionHeader: {
    marginBottom: 10,
    marginLeft: 4,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    ...SHADOWS.sm,
    shadowColor: '#64748B',
    shadowOpacity: 0.05,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingIcon: {
    width: 36, height: 36,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },

  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#DBEAFE',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#2563EB',
    lineHeight: 18,
    fontWeight: '500',
  },
});
