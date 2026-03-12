import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../utils/theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: {
    params: {
      identityType: 'foreigner' | 'nri';
    };
  };
};

interface DocumentItem {
  type: string;
  uri: string;
  name: string;
  mimeType?: string;
}

const documentTypes = {
  foreigner: [
    { value: 'passport', label: 'Passport', required: true },
    { value: 'visa', label: 'Visa Document', required: true },
    { value: 'residential_certificate', label: 'Proof of Residence', required: false },
  ],
  nri: [
    { value: 'passport', label: 'Passport', required: true },
    { value: 'oci_card', label: 'OCI Card (if applicable)', required: false },
    { value: 'residential_certificate', label: 'Proof of Residence', required: true },
  ],
};

export const DocumentUploadScreen: React.FC<Props> = ({ navigation, route }) => {
  const { identityType } = route.params;
  const { user, updateUser } = useAuth();
  const [documents, setDocuments] = useState<Record<string, DocumentItem>>({});
  const [isLoading, setIsLoading] = useState(false);

  const requiredDocs = documentTypes[identityType];

  const pickDocument = async (docType: string) => {
    Alert.alert(
      'Choose Option',
      'Select how you want to upload the document',
      [
        {
          text: 'Take Photo',
          onPress: () => void pickImage(docType),
        },
        {
          text: 'Choose from Library',
          onPress: () => void pickFromLibrary(docType),
        },
        // Temporarily disabled until expo-document-picker is installed
        // {
        //   text: 'Select File',
        //   onPress: () => void pickFile(docType),
        // },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const pickImage = async (docType: string) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setDocuments({
        ...documents,
        [docType]: {
          type: docType,
          uri: result.assets[0].uri,
          name: `${docType}_${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
        },
      });
    }
  };

  const pickFromLibrary = async (docType: string) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Gallery permission is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({

      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setDocuments({
        ...documents,
        [docType]: {
          type: docType,
          uri: result.assets[0].uri,
          name: `${docType}_${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
        },
      });
    }
  };

  const pickFile = async (docType: string) => {
    // TODO: Install and enable expo-document-picker
    Alert.alert('Coming Soon', 'Document picker will be available in the next update');
    /*
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setDocuments({
          ...documents,
          [docType]: {
            type: docType,
            uri: result.assets[0].uri,
            name: result.assets[0].name,
            mimeType: result.assets[0].mimeType,
          },
        });
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
    */
  };

  const removeDocument = (docType: string) => {
    const newDocs = { ...documents };
    delete newDocs[docType];
    setDocuments(newDocs);
  };

  const validateDocuments = () => {
    const missingRequired = requiredDocs
      .filter((doc) => doc.required && !documents[doc.value])
      .map((doc) => doc.label);

    if (missingRequired.length > 0) {
      Alert.alert(
        'Missing Documents',
        `Please upload the following required documents:\n${missingRequired.join(', ')}`
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateDocuments()) {
      return;
    }

    setIsLoading(true);

    try {
      // Convert all document URIs to base64 data URLs (same pattern as avatar upload)
      const base64Documents: Record<string, string> = {};
      for (const [docType, doc] of Object.entries(documents)) {
        const base64 = await FileSystem.readAsStringAsync(doc.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const mimeType = doc.mimeType || 'image/jpeg';
        base64Documents[docType] = `data:${mimeType};base64,${base64}`;
      }

      const response = await apiService.submitIdentityDocuments({
        userId: (user?._id || user?.id) as string,
        userType: user?.role === 'provider' ? 'provider' : 'homeowner',
        identityType,
        documents: base64Documents,
      });

      if (response.success) {
        // Update user context
        if (response.data?.user) {
          updateUser(response.data.user);
        }

        Alert.alert(
          'Application Submitted',
          'Your documents have been submitted for verification. You will be notified once the review is complete.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate back to profile
                navigation.navigate(user?.role === 'provider' ? 'ProviderTabs' : 'MainTabs');
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to submit documents');
      }
    } catch (error: any) {
      console.error('Document submission error:', error);
      Alert.alert('Error', error.message || 'Failed to submit documents');
    } finally {
      setIsLoading(false);
    }
  };

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
        <Text style={styles.headerTitle}>Upload Documents</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Text style={styles.title}>Upload Your Documents</Text>
        <Text style={styles.subtitle}>
          Please upload clear photos or scans of your documents. All required documents must be uploaded to proceed.
        </Text>

        {/* Document List */}
        <View style={styles.documentsContainer}>
          {requiredDocs.map((doc) => {
            const uploaded = documents[doc.value];
            const isImage = uploaded?.mimeType?.startsWith('image/');

            return (
              <View key={doc.value} style={styles.documentCard}>
                <View style={styles.documentHeader}>
                  <View style={styles.documentLabelContainer}>
                    <Text style={styles.documentLabel}>{doc.label}</Text>
                    {doc.required && <Text style={styles.requiredBadge}>Required</Text>}
                  </View>
                  {uploaded && (
                    <TouchableOpacity onPress={() => removeDocument(doc.value)}>
                      <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                    </TouchableOpacity>
                  )}
                </View>

                {uploaded ? (
                  <View style={styles.uploadedContainer}>
                    {isImage ? (
                      <Image source={{ uri: uploaded.uri }} style={styles.uploadedImage} />
                    ) : (
                      <View style={styles.filePreview}>
                        <Ionicons name="document" size={40} color={COLORS.primary} />
                        <Text style={styles.fileName} numberOfLines={1}>
                          {uploaded.name}
                        </Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.changeButton}
                      onPress={() => pickDocument(doc.value)}
                    >
                      <Text style={styles.changeButtonText}>Change</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => pickDocument(doc.value)}
                  >
                    <Ionicons name="cloud-upload-outline" size={32} color={COLORS.primary} />
                    <Text style={styles.uploadButtonText}>Upload {doc.label}</Text>
                    <Text style={styles.uploadButtonSubtext}>
                      Photo, Scan or File
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Your documents will be securely stored and reviewed by our admin team. You'll receive a notification once the review is complete.
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.white} />
              <Text style={styles.submitButtonText}>Submit for Verification</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text,
  },
  content: {
    flex: 1,
    padding: SPACING.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.size.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xxl,
    lineHeight: 22,
  },
  documentsContainer: {
    gap: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  documentCard: {
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.medium,
    padding: SPACING.lg,
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  documentLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  documentLabel: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  requiredBadge: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.white,
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.small,
    overflow: 'hidden',
  },
  uploadButton: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.medium,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  uploadButtonSubtext: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  uploadedContainer: {
    gap: SPACING.sm,
  },
  uploadedImage: {
    width: '100%',
    height: 200,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.gray200,
  },
  filePreview: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.medium,
  },
  fileName: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  changeButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.small,
  },
  changeButtonText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '600',
    color: COLORS.white,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  infoText: {
    flex: 1,
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.medium,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '600',
    color: COLORS.white,
  },
});
