import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  TouchableOpacity,
  Dimensions,
  Platform
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../utils/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type DialogType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

export interface DialogAction {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomDialogProps {
  visible: boolean;
  type?: DialogType;
  title: string;
  message: string;
  actions?: DialogAction[];
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

const DIALOG_CONFIG: Record<DialogType, {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
}> = {
  success: {
    icon: 'checkmark-circle-outline',
    color: '#10B981',
    bgColor: '#D1FAE5',
  },
  error: {
    icon: 'close-circle-outline',
    color: '#EF4444',
    bgColor: '#FEE2E2',
  },
  warning: {
    icon: 'warning-outline',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
  },
  info: {
    icon: 'information-circle-outline',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
  },
  confirm: {
    icon: 'help-circle-outline',
    color: '#6366F1',
    bgColor: '#E0E7FF',
  },
};

export const CustomDialog: React.FC<CustomDialogProps> = ({
  visible,
  type = 'info',
  title,
  message,
  actions,
  onClose,
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCancel = false,
}) => {
  const { colors, isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const iconScaleAnim = useRef(new Animated.Value(0)).current;

  const config = DIALOG_CONFIG[type];

  useEffect(() => {
    if (visible) {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      iconScaleAnim.setValue(0);

      // Start animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
      ]).start();

      // Delayed icon animation
      setTimeout(() => {
        Animated.spring(iconScaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }).start();
      }, 150);
    }
  }, [visible]);

  const handleClose = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback?.();
      onClose();
    });
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent onRequestClose={() => handleClose()}>
      <TouchableOpacity
        style={[styles.overlay, { opacity: 1 }]}
        activeOpacity={1}
        onPress={() => handleClose()}
      >
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
          <BlurView intensity={25} style={StyleSheet.absoluteFill} tint={isDark ? 'dark' : 'light'} />
        </Animated.View>
        
        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: colors.cardBg,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Icon Header */}
          <View style={styles.iconWrapper}>
            <Animated.View style={[
              styles.iconCircle, 
              { backgroundColor: config.bgColor, transform: [{ scale: iconScaleAnim }] }
            ]}>
              <Ionicons name={config.icon} size={36} color={config.color} />
            </Animated.View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
          </View>

          {/* Buttons */}
          {actions && actions.length > 0 ? (
            <View style={styles.actionsList}>
              {actions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.actionButton,
                    action.style === 'cancel' && styles.actionButtonCancel,
                    action.style === 'destructive' && styles.actionButtonDestructive,
                    (!action.style || action.style === 'default') && { backgroundColor: config.color }
                  ]}
                  onPress={() => handleClose(action.onPress)}
                  activeOpacity={0.8}
                >
                  <View style={styles.actionButtonContent}>
                    <Text style={[
                      styles.actionButtonText,
                      (!action.style || action.style === 'default') && { color: '#FFFFFF' },
                      action.style === 'cancel' && { color: colors.textSecondary },
                      action.style === 'destructive' && { color: '#EF4444' },
                    ]}>
                      {action.text}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={[styles.buttonContainer, showCancel && styles.buttonContainerRow]}>
              {showCancel && (
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton, { borderColor: colors.divider }]}
                  onPress={() => handleClose()}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
                    {cancelText}
                  </Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[
                  styles.button, 
                  styles.confirmButton, 
                  { backgroundColor: config.color }
                ]}
                onPress={() => handleClose(onConfirm)}
                activeOpacity={0.8}
              >
                <View style={styles.confirmContent}>
                  <Text style={styles.confirmButtonText}>{confirmText}</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

// Hook for using dialogs easily
interface DialogState {
  visible: boolean;
  type: DialogType;
  title: string;
  message: string;
  onConfirm?: () => void;
  actions?: DialogAction[];
  showCancel?: boolean;
  confirmText?: string;
  cancelText?: string;
}

export const useDialog = () => {
  const [dialogState, setDialogState] = React.useState<DialogState>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showDialog = (
    type: DialogType,
    title: string,
    message: string,
    options?: {
      onConfirm?: () => void;
      actions?: DialogAction[];
      showCancel?: boolean;
      confirmText?: string;
      cancelText?: string;
    }
  ) => {
    setDialogState({
      visible: true,
      type,
      title,
      message,
      ...options,
    });
  };

  const hideDialog = () => {
    setDialogState(prev => ({ ...prev, visible: false }));
  };

  const showSuccess = (title: string, message: string, onConfirm?: () => void) => {
    showDialog('success', title, message, { onConfirm });
  };

  const showError = (title: string, message: string, onConfirm?: () => void) => {
    showDialog('error', title, message, { onConfirm });
  };

  const showWarning = (title: string, message: string, onConfirm?: () => void) => {
    showDialog('warning', title, message, { onConfirm });
  };

  const showInfo = (title: string, message: string, onConfirm?: () => void) => {
    showDialog('info', title, message, { onConfirm });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    options?: { confirmText?: string; cancelText?: string; type?: DialogType }
  ) => {
    showDialog(options?.type || 'confirm', title, message, {
      onConfirm,
      showCancel: true,
      ...options,
    });
  };

  const showOptions = (
    title: string,
    message: string,
    actions: DialogAction[]
  ) => {
    showDialog('info', title, message, { actions });
  };

  return {
    dialogState,
    hideDialog,
    showDialog,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
    showOptions,
    DialogComponent: (
      <CustomDialog
        visible={dialogState.visible}
        type={dialogState.type}
        title={dialogState.title}
        message={dialogState.message}
        onClose={hideDialog}
        onConfirm={dialogState.onConfirm}
        actions={dialogState.actions}
        showCancel={dialogState.showCancel}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
      />
    ),
  };
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  container: {
    width: Math.min(SCREEN_WIDTH - 48, 340),
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  iconWrapper: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  buttonContainerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cancelButton: {
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#F1F5F9', // Solid light grayish-blue
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  confirmButton: {
    // Background color is set dynamically via style prop
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  confirmContent: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  actionsList: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    width: '100%',
    gap: 12,
  },
  actionButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionButtonCancel: {
    backgroundColor: '#F1F5F9',
  },
  actionButtonDestructive: {
    backgroundColor: '#FEF2F2',
  },
  actionButtonContent: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CustomDialog;
