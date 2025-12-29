import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Application from 'expo-application';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import { dismissVersionUpdate } from '../../utils/versionCheck';

interface UpdateNotificationBannerProps {
  currentVersion: string;
  latestVersion: string;
  onDismiss: () => void;
}

export const UpdateNotificationBanner: React.FC<UpdateNotificationBannerProps> = ({
  currentVersion,
  latestVersion,
  onDismiss,
}) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slide in animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleDismiss = async () => {
    // Slide out animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      dismissVersionUpdate(latestVersion);
      onDismiss();
    });
  };

  const handleUpdate = async () => {
    const packageName = Application.applicationId || 'com.yann.mobile';
    
    let url = '';
    if (Platform.OS === 'android') {
      url = `market://details?id=${packageName}`;
      // Fallback to web URL if Play Store app is not available
      const webUrl = `https://play.google.com/store/apps/details?id=${packageName}`;
      
      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          await Linking.openURL(webUrl);
        }
      } catch (error) {
        console.error('Error opening Play Store:', error);
        // Try web URL as fallback
        await Linking.openURL(webUrl);
      }
    } else if (Platform.OS === 'ios') {
      // iOS App Store URL
      const appId = 'YOUR_APP_ID'; // Replace with actual App Store ID
      url = `itms-apps://apps.apple.com/app/id${appId}`;
      
      try {
        await Linking.openURL(url);
      } catch (error) {
        console.error('Error opening App Store:', error);
      }
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="information-circle" size={24} color="#F59E0B" />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>Update Available</Text>
          <Text style={styles.description}>
            Version {latestVersion} is now available. You're using {currentVersion}.
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.updateButton}
            onPress={handleUpdate}
            activeOpacity={0.7}
          >
            <Text style={styles.updateButtonText}>Update</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={handleDismiss}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFBEB', // Amber-50
    borderBottomWidth: 1,
    borderBottomColor: '#FCD34D', // Amber-300
    ...SHADOWS.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7', // Amber-100
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E', // Amber-900
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    color: '#78350F', // Amber-950
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  updateButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  dismissButton: {
    padding: 4,
  },
});
