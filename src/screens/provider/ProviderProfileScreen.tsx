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
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const THEME = {
  colors: {
    background: '#F7F8FA',
    card: '#FFFFFF',
    primary: '#2E59F3',
    text: '#1A1C1E',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    border: '#E5E7EB',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  radius: {
    sm: 12,
    md: 16,
    lg: 20,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
};

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export const ProviderProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user, updateUser } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    experience: user?.experience?.toString() || '',
    bio: user?.bio || '',
    hourlyRate: (() => {
      if (Array.isArray(user?.serviceRates)) {
        return user.serviceRates[0]?.price?.toString() || '';
      }
      if (typeof user?.serviceRates === 'object' && user.serviceRates) {
        return Object.values(user.serviceRates)[0]?.toString() || '';
      }
      return '';
    })(),
  });

  // Mock stats - you can replace with real data from API
  const stats = {
    rating: user?.rating || 4.9,
    totalReviews: user?.totalReviews || 1098,
    tasksDone: (user as any)?.completedBookings || 1098,
    avgJobTime: (user as any)?.avgJobTime || '1 hour',
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
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

        console.log('📤 Uploading avatar, user:', user?.email, 'size:', base64Image.length);

        // Upload as JSON with base64 image
        const response = await apiService.uploadAvatar(base64Image);
        
        console.log('📥 Avatar upload response:', response.success, response.message);
        
        if (response.success && response.data) {
           // Update local user state with new avatar URL
           const newAvatarUrl = response.data.profileImage || response.data.avatar || response.data.url;
           updateUser({
             ...user,
             profileImage: newAvatarUrl,
             avatar: newAvatarUrl // Cover both fields depending on role schema
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
      // Prepare update payload
      const updateData: any = {
        name: formData.name,
        phone: formData.phone,
        experience: Number.parseInt(formData.experience, 10) || 0,
        bio: formData.bio,
      };

      // Handle service rates (updating first service rate for now as simple implementation)
      if (formData.hourlyRate && user?.services?.[0]) {
        updateData.serviceRates = [{
          serviceName: user.services[0],
          price: Number.parseInt(formData.hourlyRate, 10) || 0
        }];
      }

      await apiService.updateProviderProfile(updateData);
      
      // Update local context
      updateUser({
        ...user,
        ...updateData
      });

      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.colors.background} />

      <LoadingSpinner visible={isSaving} />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
            {/* Header with gradient background */}
            <View style={styles.profileHeader}>
              <View style={styles.headerTopRow}>
                <TouchableOpacity 
                  style={styles.backButtonTop}
                  onPress={() => navigation.goBack()}
                >
                  <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Tasker Profile</Text>

                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => setIsEditing(!isEditing)}
                >
                  <Ionicons name={isEditing ? "close" : "pencil"} size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Profile Picture - Overlapping Header */}
            <View style={styles.profileSection}>
              <View style={styles.profilePictureContainer}>
                <View style={styles.profilePictureWrapper}>
                  {user?.profileImage || user?.avatar ? (
                    <Image 
                      source={{ uri: user.profileImage || user.avatar }} 
                      style={styles.profilePicture} 
                    />
                  ) : (
                    <View style={[styles.profilePicture, styles.placeholderPicture]}>
                      <Text style={styles.placeholderText}>
                        {user?.name?.charAt(0).toUpperCase() || 'P'}
                      </Text>
                    </View>
                  )}
                  {isEditing && (
                    <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
                      <Ionicons name="camera" size={18} color="#FFF" />
                    </TouchableOpacity>
                  )}
                </View>
                
                {/* Badge */}
                <View style={styles.topBadge}>
                  <Ionicons name="ribbon" size={12} color={THEME.colors.primary} />
                  <Text style={styles.topBadgeText}>Top TaskKing</Text>
                </View>
              </View>

              {/* Name and Title */}
              {isEditing ? null : (
                <>
                  <Text style={styles.profileName}>{user?.name || 'Professional'}</Text>
                  <View style={styles.titleRow}>
                    <Text style={styles.profileTitle}>INDIVIDUAL</Text>
                    <View style={styles.dot} />
                    <Text style={styles.profileTitle}>ASSEMBLY</Text>
                  </View>
                </>
              )}
            </View>

            {/* Stats Section */}
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="star" size={20} color="#FFB800" />
                </View>
                <Text style={styles.statValue}>{stats.rating}</Text>
                <Text style={styles.statLabel}>rating</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statBox}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="checkmark-circle" size={20} color={THEME.colors.primary} />
                </View>
                <Text style={styles.statValue}>{stats.tasksDone}</Text>
                <Text style={styles.statLabel}>tasks done</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statBox}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="time" size={20} color="#10B981" />
                </View>
                <Text style={styles.statValue}>{stats.avgJobTime}</Text>
                <Text style={styles.statLabel}>avg job done</Text>
              </View>
            </View>

            {/* About Section */}
            {isEditing ? null : (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>About Tasker</Text>
                <Text style={styles.aboutText}>
                  {user?.bio || 'As a professional assembler, I possess the necessary skills and experience to assemble furniture and equipment for clients. My expertise...'}
                </Text>
                <TouchableOpacity onPress={() => setIsEditing(true)}>
                  <Text style={styles.viewMoreText}>View More</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Cost Section */}
            {isEditing ? null : (
              <View style={styles.infoRow}>
                <Ionicons name="cash-outline" size={20} color={THEME.colors.primary} />
                <Text style={styles.infoLabel}>Cost</Text>
                <Text style={styles.infoValue}>₹{formData.hourlyRate || '0'}/hour</Text>
              </View>
            )}

            {/* Distance Section */}
            {isEditing ? null : (
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={20} color={THEME.colors.primary} />
                <Text style={styles.infoLabel}>Distance from you</Text>
                <Text style={styles.infoValue}>25 km</Text>
              </View>
            )}

          {/* Reviews Section */}
          {isEditing ? null : (
            <View style={styles.section}>
              <View style={styles.reviewsHeader}>
                <Text style={styles.sectionTitle}>Reviews</Text>
                <TouchableOpacity style={styles.seeAllButton}>
                  <Text style={styles.seeAllText}>See all</Text>
                  <Ionicons name="arrow-forward" size={16} color={THEME.colors.primary} />
                </TouchableOpacity>
              </View>
              <View style={styles.reviewSummary}>
                <Ionicons name="star" size={16} color="#FFB800" />
                <Text style={styles.reviewRating}>{stats.rating}/5 ({stats.totalReviews} review)</Text>
              </View>
            </View>
          )}

          {/* Edit Form */}
          {isEditing && (
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(value) => updateField('name', value)}
                  placeholder="Enter your name"
                  placeholderTextColor={THEME.colors.textTertiary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={styles.inputDisabled}>
                  <Text style={styles.inputDisabledText}>{formData.email}</Text>
                  <Ionicons name="lock-closed-outline" size={18} color={THEME.colors.textTertiary} />
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
                  placeholderTextColor={THEME.colors.textTertiary}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Experience (years)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.experience}
                  onChangeText={(value) => updateField('experience', value)}
                  placeholder="Years of experience"
                  placeholderTextColor={THEME.colors.textTertiary}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bio</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.bio}
                  onChangeText={(value) => updateField('bio', value)}
                  placeholder="Tell customers about yourself..."
                  placeholderTextColor={THEME.colors.textTertiary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Hourly Rate (₹)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.hourlyRate}
                  onChangeText={(value) => updateField('hourlyRate', value)}
                  placeholder="0"
                  placeholderTextColor={THEME.colors.textTertiary}
                  keyboardType="numeric"
                />
              </View>

              {/* Save Button */}
              <TouchableOpacity 
                style={[styles.saveButtonBottom, isSaving && styles.saveButtonDisabled]} 
                onPress={handleSave} 
                disabled={isSaving}
                activeOpacity={0.7}
              >
                <Ionicons name="checkmark-circle" size={20} color={THEME.colors.card} />
                <Text style={styles.saveButtonBottomText}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 100 }} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  content: {
    paddingBottom: THEME.spacing.xl,
  },
  profileHeader: {
    backgroundColor: THEME.colors.primary,
    paddingTop: THEME.spacing.lg,
    paddingBottom: 80, // Space for the overlap
    paddingHorizontal: THEME.spacing.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.md,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  backButtonTop: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    alignItems: 'center',
    marginTop: -60, // Overlap amount
    marginBottom: THEME.spacing.lg,
  },
  profilePictureContainer: {
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
  profilePictureWrapper: {
    position: 'relative',
    ...THEME.shadow, // Add shadow to the picture for depth
  },
  profilePicture: {
    width: 120, // Slightly larger
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#FFF',
  },
  placeholderPicture: {
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFF',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.colors.primary,
    borderWidth: 3,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBadge: {
    position: 'absolute',
    bottom: -15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    ...THEME.shadow,
  },
  topBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.primary,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: THEME.colors.text, // Dark text
    textAlign: 'center',
    marginTop: THEME.spacing.xl, // Space for badge
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.xs,
    marginTop: 4,
  },
  profileTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.primary,
    letterSpacing: 1,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.colors.textTertiary,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.card,
    marginHorizontal: THEME.spacing.lg,
    marginTop: THEME.spacing.xs,
    borderRadius: THEME.radius.md,
    padding: THEME.spacing.md,
    ...THEME.shadow,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statIconContainer: {
    marginBottom: THEME.spacing.xs,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.text,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: THEME.colors.border,
    marginHorizontal: THEME.spacing.sm,
  },
  section: {
    backgroundColor: THEME.colors.card,
    marginHorizontal: THEME.spacing.lg,
    marginTop: THEME.spacing.md,
    padding: THEME.spacing.md,
    borderRadius: THEME.radius.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.text,
    marginBottom: THEME.spacing.sm,
  },
  aboutText: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    lineHeight: 20,
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.primary,
    marginTop: THEME.spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.card,
    marginHorizontal: THEME.spacing.lg,
    marginTop: THEME.spacing.md,
    padding: THEME.spacing.md,
    borderRadius: THEME.radius.md,
  },
  infoLabel: {
    flex: 1,
    fontSize: 14,
    color: THEME.colors.textSecondary,
    marginLeft: THEME.spacing.sm,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.text,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.primary,
  },
  reviewSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reviewRating: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
  },
  formSection: {
    marginTop: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
  },
  inputGroup: {
    marginBottom: THEME.spacing.md,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.text,
    marginBottom: THEME.spacing.xs,
  },
  input: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.md,
    padding: THEME.spacing.md,
    fontSize: 16,
    color: THEME.colors.text,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  textArea: {
    height: 100,
  },
  inputDisabled: {
    backgroundColor: THEME.colors.background,
    borderRadius: THEME.radius.md,
    padding: THEME.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  inputDisabledText: {
    fontSize: 16,
    color: THEME.colors.textSecondary,
  },
  inputHint: {
    fontSize: 12,
    color: THEME.colors.textTertiary,
    marginTop: THEME.spacing.xs,
  },
  saveButtonBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.sm,
    backgroundColor: THEME.colors.primary,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.xl,
    borderRadius: THEME.radius.md,
    marginTop: THEME.spacing.xl,
    marginHorizontal: THEME.spacing.lg,
    ...THEME.shadow,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonBottomText: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.card,
  },
});
