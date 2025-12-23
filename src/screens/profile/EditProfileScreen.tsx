import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { AnimatedButton } from '../../components/AnimatedButton';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY, ANIMATIONS } from '../../utils/theme';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export const EditProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user, updateUser } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: ANIMATIONS.slow,
      useNativeDriver: true,
    }).start();
  }, []);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const pickImage = async () => {
    try {
      // Request permissions first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photos to upload a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true, // Request base64 encoding
      });

      if (!result.canceled && result.assets[0]) {
        setIsSaving(true);
        const asset = result.assets[0];
        
        // Get the base64 string or read from URI
        let base64Image = asset.base64;
        
        if (!base64Image && asset.uri) {
          // Fallback: read file and convert to base64 if needed
          const response = await fetch(asset.uri);
          const blob = await response.blob();
          base64Image = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const dataUrl = reader.result as string;
              resolve(dataUrl);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } else if (base64Image) {
          // Add data URL prefix if not present
          const mimeType = asset.mimeType || 'image/jpeg';
          if (!base64Image.startsWith('data:')) {
            base64Image = `data:${mimeType};base64,${base64Image}`;
          }
        }

        if (!base64Image) {
          Alert.alert('Error', 'Failed to process image');
          return;
        }

        // Upload as JSON with base64 image
        const response = await apiService.uploadAvatar(base64Image);
        
        if (response.success && response.data) {
           // Update local user state with new avatar URL
           const newAvatarUrl = response.data.profileImage || response.data.avatar || response.data.url;
           updateUser({
             ...user,
             avatar: newAvatarUrl
           });
           Alert.alert('Success', 'Profile photo updated');
        } else {
           Alert.alert('Error', response.message || 'Failed to upload image');
        }
      }
    } catch (error) {
      console.log('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick or upload image');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setIsSaving(true);
    try {
      await apiService.updateProfile({
        name: formData.name,
        phone: formData.phone,
      });
      updateUser({ ...user, name: formData.name, phone: formData.phone });
      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <AnimatedButton style={styles.saveButton} onPress={handleSave} disabled={isSaving}>
          <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save'}</Text>
        </AnimatedButton>
      </View>
      <LoadingSpinner visible={isSaving} />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              {user?.avatar ? (
                 <Image 
                   source={{ uri: user.avatar }} 
                   style={{ width: 100, height: 100, borderRadius: 50 }} 
                 />
              ) : (
                 <Text style={styles.avatarText}>
                   {user?.name?.charAt(0).toUpperCase() || 'U'}
                 </Text>
              )}
            </View>
            <TouchableOpacity style={styles.changePhotoButton} onPress={pickImage}>
              <Ionicons name="camera-outline" size={18} color={COLORS.primary} />
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(value) => updateField('name', value)}
                placeholder="Enter your name"
                placeholderTextColor={COLORS.textTertiary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputDisabled}>
                <Text style={styles.inputDisabledText}>{formData.email}</Text>
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.textTertiary} />
              </View>
              <Text style={styles.inputHint}>Email cannot be changed</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(value) => updateField('phone', value)}
                placeholder="Enter phone number"
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </Animated.View>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  saveButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  saveButtonText: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '600',
    color: COLORS.primary,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: COLORS.white,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  changePhotoText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
  formSection: {
    marginBottom: SPACING.xl,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.size.md,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputDisabled: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputDisabledText: {
    fontSize: TYPOGRAPHY.size.md,
    color: COLORS.textSecondary,
  },
  inputHint: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textTertiary,
    marginTop: SPACING.xs,
  },
});
