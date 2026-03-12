import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Image,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { COLORS } from '../../utils/theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CustomDialog } from '../../components/CustomDialog';
import { AnimatedButton } from '../../components/AnimatedButton';
import { ImagePickerBottomSheet } from '../../components/ImagePickerBottomSheet';

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

  // UI State
  const [dialogState, setDialogState] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'warning';
    title: string;
    message: string;
    onClose: () => void;
  }>({
    visible: false,
    type: 'success',
    title: '',
    message: '',
    onClose: () => {},
  });
  
  // Sheet State
  const [isSheetVisible, setSheetVisible] = useState(false);
  const [activeDocType, setActiveDocType] = useState<string | null>(null);

  const requiredDocs = documentTypes[identityType];
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const showDialog = (type: 'success' | 'error' | 'warning', title: string, message: string, onClose?: () => void) => {
    setDialogState({
      visible: true,
      type,
      title,
      message,
      onClose: () => {
        setDialogState(prev => ({ ...prev, visible: false }));
        if (onClose) onClose();
      }
    });
  };

  const pickDocument = (docType: string) => {
    setActiveDocType(docType);
    setSheetVisible(true);
  };

  const handleCamera = async () => {
    setSheetVisible(false);
    if (!activeDocType) return;
    
    // Slight delay to allow sheet to close smoothly
    setTimeout(async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showDialog('error', 'Permission Required', 'Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setDocuments(prev => ({
          ...prev,
          [activeDocType]: {
            type: activeDocType,
            uri: result.assets[0].uri,
            name: `${activeDocType}_${Date.now()}.jpg`,
            mimeType: 'image/jpeg',
          },
        }));
      }
      setActiveDocType(null);
    }, 300);
  };

  const handleLibrary = async () => {
    setSheetVisible(false);
    if (!activeDocType) return;
    
    setTimeout(async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showDialog('error', 'Permission Required', 'Gallery permission is required');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setDocuments(prev => ({
          ...prev,
          [activeDocType]: {
            type: activeDocType,
            uri: result.assets[0].uri,
            name: `${activeDocType}_${Date.now()}.jpg`,
            mimeType: 'image/jpeg',
          },
        }));
      }
      setActiveDocType(null);
    }, 300);
  };

  const handleDocumentPick = () => {
    setSheetVisible(false);
    setTimeout(() => {
      showDialog('warning', 'Coming Soon', 'Document picker will be available in the next update');
    }, 300);
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
      showDialog(
        'error',
        'Missing Documents',
        `Please upload the following required documents:\n\n${missingRequired.join('\n')}`
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateDocuments()) return;

    setIsLoading(true);

    try {
      const base64Documents: Record<string, string> = {};
      for (const [docType, doc] of Object.entries(documents)) {
        const base64 = await FileSystem.readAsStringAsync(doc.uri, {
          encoding: 'base64',
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
        if (response.data?.user) {
          updateUser(response.data.user);
        }

        showDialog(
          'success',
          'Application Submitted',
          'Your documents have been submitted for verification. You will be notified once the review is complete.',
          () => {
            navigation.navigate(user?.role === 'provider' ? 'ProviderTabs' : 'MainTabs');
          }
        );
      } else {
        showDialog('error', 'Submission Failed', response.message || 'Failed to submit documents');
      }
    } catch (error: any) {
      console.error('Document submission error:', error);
      showDialog('error', 'Error', error.message || 'Failed to submit documents');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Documents</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>
              {identityType === 'foreigner' ? 'Foreigner Verification' : 'NRI Verification'}
            </Text>
            <Text style={styles.subtitle}>
              Please provide clear, readable photos of the following documents to verify your identity.
            </Text>
          </View>

          <View style={styles.documentList}>
            {requiredDocs.map((doc) => {
              const uploadedDoc = documents[doc.value];
              const isUploaded = !!uploadedDoc;
              const isImage = isUploaded && uploadedDoc?.mimeType?.startsWith('image/');

              return (
                <View key={doc.value} style={styles.docCard}>
                  <View style={styles.docHeader}>
                    <View style={styles.docTitleRow}>
                      <Text style={styles.docTitle}>{doc.label}</Text>
                      {doc.required && (
                        <View style={styles.requiredBadge}>
                          <Text style={styles.requiredText}>Required</Text>
                        </View>
                      )}
                    </View>
                    {isUploaded && (
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                    )}
                  </View>

                  {isUploaded ? (
                    <View style={styles.uploadedContainer}>
                      {isImage ? (
                        <Image source={{ uri: uploadedDoc.uri }} style={styles.previewImage} />
                      ) : (
                        <View style={styles.filePreview}>
                          <Ionicons name="document-text" size={40} color={COLORS.primary} />
                          <Text style={styles.fileName} numberOfLines={1}>{uploadedDoc.name}</Text>
                        </View>
                      )}
                      
                      <View style={styles.uploadedActions}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => pickDocument(doc.value)}
                        >
                          <Ionicons name="refresh-outline" size={20} color={COLORS.primary} />
                          <Text style={styles.actionText}>Retake</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.actionButtonDelete]}
                          onPress={() => removeDocument(doc.value)}
                        >
                          <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                          <Text style={[styles.actionText, { color: COLORS.error }]}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.uploadButton}
                      onPress={() => pickDocument(doc.value)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.uploadIconContainer}>
                        <Ionicons name="cloud-upload-outline" size={32} color={COLORS.primary} />
                      </View>
                      <Text style={styles.uploadText}>Tap to upload photo</Text>
                      <Text style={styles.uploadSubtext}>JPG, PNG up to 5MB</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark" size={20} color={COLORS.success} />
            <Text style={styles.infoText}>
              Your documents are encrypted and securely stored.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <AnimatedButton
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.submitButtonText}>Submit for Verification</Text>
          )}
        </AnimatedButton>
      </View>

      <CustomDialog
        visible={dialogState.visible}
        type={dialogState.type}
        title={dialogState.title}
        message={dialogState.message}
        onClose={dialogState.onClose}
        actions={[{ text: 'OK', style: 'default' }]}
      />

      <ImagePickerBottomSheet
        visible={isSheetVisible}
        onClose={() => setSheetVisible(false)}
        onCamera={handleCamera}
        onLibrary={handleLibrary}
        onDocument={handleDocumentPick}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8F9FA',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  headerTextContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#666666',
    lineHeight: 24,
  },
  documentList: {
    gap: 24,
  },
  docCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  docHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  docTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap',
    gap: 8,
  },
  docTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  requiredBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  requiredText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '600',
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  uploadIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  uploadText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  uploadedContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  previewImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  filePreview: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    backgroundColor: '#F9FAFB',
  },
  fileName: {
    marginTop: 8,
    fontSize: 13,
    color: '#4B5563',
    paddingHorizontal: 16,
    textAlign: 'center',
  },
  uploadedActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#F9FAFB',
    gap: 6,
  },
  actionButtonDelete: {
    borderLeftWidth: 1,
    borderLeftColor: '#F3F4F6',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 16,
    marginTop: 32,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    color: '#166534',
    lineHeight: 18,
    fontWeight: '500',
  },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 0 : 24,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  submitButtonDisabled: {
    backgroundColor: '#A0AEC0',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
