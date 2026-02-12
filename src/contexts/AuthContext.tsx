import React, { createContext, useState, useContext, useEffect, ReactNode, useMemo } from 'react';
import { apiService } from '../services/api';
import { storage } from '../utils/storage';
import { registerForPushNotificationsAsync, setupNotificationListeners } from '../utils/notifications';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, otp: string, intent?: 'login' | 'signup') => Promise<void>;
  loginAsProvider: (identifier: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  sendOTP: (identifier: string) => Promise<void>;
  sendProviderOTP: (identifier: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  isGuest: boolean;
  continueAsGuest: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const savedToken = await storage.getToken();
      const savedUser = await storage.getUserData();

      console.log('🔍 Checking auth status:', {
        hasToken: !!savedToken,
        hasUser: !!savedUser,
        userId: savedUser?.id,
        user_id: savedUser?._id,
        userEmail: savedUser?.email,
        userRole: savedUser?.role
      });

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(savedUser);

        // Only refresh from server if we have valid cached data with at least an ID
        const hasValidData = savedUser.id || savedUser._id || savedUser.email;

        // Register for push notifications on app launch to ensure we have a valid token
        // This handles cases where token expired or wasn't registered during login
        if (hasValidData) {
          registerForPushNotificationsAsync().then(async (pushToken) => {
            if (pushToken) {
              try {
                const role = savedUser.role === 'provider' ? 'provider' : 'homeowner';
                await apiService.savePushToken(pushToken, role);
                console.log('📱 Push token refreshed on app launch:', pushToken);
                setupNotificationListeners();
              } catch (err) {
                console.error('Failed to save push token on launch:', err);
              }
            }
          }).catch(err => {
            console.error('Failed to register push notifications on launch:', err);
          });
        }

        if (hasValidData) {
          // Optionally refresh user data from server
          try {
            const role = savedUser.role || 'homeowner';
            const response = await apiService.getProfile(role);
            if (response.user) {
              // Validate response has critical fields before saving
              const hasValidResponse = response.user.id || response.user._id || response.user.email || response.user.name;
              if (hasValidResponse) {
                setUser(response.user);
                await storage.saveUserData(response.user);
              } else {
                console.warn('⚠️ Received invalid user data from server, keeping cached data');
              }
            }
          } catch (error: any) {
            // Cookie-based auth may fail on mobile if session expired
            // This is expected behavior - we continue with cached data
            if (error.response?.status !== 401) {
              console.log('Could not refresh user data:', error);
            }
            // Keep using cached data
          }
        } else {
          console.warn('⚠️ Cached user data is corrupted, please log in again');
          // Clear corrupted data
          await storage.clearAll();
          setUser(null);
          setToken(null);
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendOTP = async (identifier: string): Promise<void> => {
    try {
      await apiService.sendOTP(identifier, 'homeowner', 'login');
      await storage.saveEmail(identifier); // Save identifier for later use
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to send OTP');
    }
  };

  // Send OTP for provider/partner login
  const sendProviderOTP = async (identifier: string): Promise<void> => {
    try {
      await apiService.sendProviderOTP(identifier);
      await storage.saveEmail(identifier); // Save identifier for later use
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to send OTP. Make sure you are registered as a partner.');
    }
  };

  const login = async (identifier: string, otp: string, intent: 'login' | 'signup' = 'login'): Promise<void> => {
    try {
      const response = await apiService.verifyOTP(identifier, otp, intent);

      // console.log('🔐 Processing login response:', response);

      // The new API returns homeowner data directly in response
      if (response.user) {
        // Map response user data to User type
        const userData: User = {
          id: response.user.id,
          name: response.user.name,
          email: response.user.email,
          phone: response.user.phone || '',
          role: response.user.role || 'homeowner',
          avatar: response.user.avatar || response.user.profileImage || '',
          profileImage: response.user.profileImage || response.user.avatar || '',
          isVerified: response.user.isVerified || false,
          aadhaarVerified: response.user.aadhaarVerified || false,
        };

        // console.log('👤 Setting user data:', { ...userData, avatar: '[BASE64_IMAGE]', profileImage: '[BASE64_IMAGE]' });

        // Use the actual JWT token from response for mobile auth
        const actualToken = response.token || 'cookie-based-auth';

        // Save to storage first
        await storage.saveToken(actualToken);
        await storage.saveUserData(userData);

        // Then update state (this triggers navigation)
        setToken(actualToken);
        setUser(userData);

        // Register for push notifications after successful login
        try {
          console.log('🔔 Starting push notification registration for homeowner...');
          const pushToken = await registerForPushNotificationsAsync();

          if (pushToken) {
            console.log('📱 Push token generated, saving to backend...');
            const saveResponse = await apiService.savePushToken(pushToken, 'homeowner');

            if (saveResponse.success) {
              console.log('✅ Push token saved successfully to backend');
              console.log('   Token:', pushToken.substring(0, 30) + '...');
            } else {
              console.error('❌ Failed to save push token to backend:', saveResponse.message);
            }
          } else {
            console.warn('⚠️ No push token generated - notifications will not work');
            console.warn('   Check if device is physical and permissions are granted');
          }

          setupNotificationListeners();
          console.log('✅ Notification listeners set up');
        } catch (pushError: any) {
          console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.error('❌ PUSH NOTIFICATION REGISTRATION FAILED');
          console.error('   Error:', pushError.message);
          console.error('   Stack:', pushError.stack);
          console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          // Don't fail login if push registration fails
        }

        console.log('✅ Login successful, auth state updated');
      } else {
        throw new Error('No user data in response');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiService.logout();
    } catch (error: any) {
      console.log('Logout API call failed, but clearing local data:', error.message || 'Unknown error');
    } finally {
      await storage.clearAll();
      setUser(null);
      setToken(null);
      setIsGuest(false);
    }
  };

  // Login as provider/partner - uses different backend endpoint
  const loginAsProvider = async (identifier: string, otp: string): Promise<void> => {
    try {
      const response = await apiService.verifyProviderOTP(identifier, otp);

      console.log('🔐 Processing provider login response:', {
        hasUser: !!response.user,
        userId: response.user?.id,
        user_id: response.user?._id,
        email: response.user?.email
      });

      if (response.user) {
        const userData: User = {
          id: response.user.id || response.user._id,
          _id: response.user._id || response.user.id,
          name: response.user.name,
          email: response.user.email,
          phone: response.user.phone || '',
          role: 'provider',
          services: response.user.services || [],
          status: response.user.status,
          avatar: response.user.avatar || response.user.profileImage || '',
          profileImage: response.user.profileImage || response.user.avatar || '',
          isVerified: response.user.isVerified || false,
          aadhaarVerified: response.user.aadhaarVerified || false,
        };

        console.log('👤 Setting provider data:', {
          id: userData.id,
          _id: userData._id,
          email: userData.email,
          name: userData.name
        });

        // Use the actual JWT token from response for mobile auth
        const actualToken = response.token || 'cookie-based-auth-provider';

        await storage.saveToken(actualToken);
        await storage.saveUserData(userData);

        setToken(actualToken);
        setUser(userData);

        // Register for push notifications after successful provider login
        try {
          console.log('🔔 Starting push notification registration for provider...');
          const pushToken = await registerForPushNotificationsAsync();

          if (pushToken) {
            console.log('📱 Provider push token generated, saving to backend...');
            const saveResponse = await apiService.savePushToken(pushToken, 'provider');

            if (saveResponse.success) {
              console.log('✅ Provider push token saved successfully to backend');
              console.log('   Token:', pushToken.substring(0, 30) + '...');
            } else {
              console.error('❌ Failed to save provider push token to backend:', saveResponse.message);
            }
          } else {
            console.warn('⚠️ No provider push token generated - notifications will not work');
            console.warn('   Check if device is physical and permissions are granted');
          }

          setupNotificationListeners();
          console.log('✅ Provider notification listeners set up');
        } catch (pushError: any) {
          console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.error('❌ PROVIDER PUSH NOTIFICATION REGISTRATION FAILED');
          console.error('   Error:', pushError.message);
          console.error('   Stack:', pushError.stack);
          console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          // Don't fail login if push registration fails
        }

        console.log('✅ Provider login successful');
      } else {
        throw new Error('No provider data in response');
      }
    } catch (error: any) {
      console.error('Provider login error:', error);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const continueAsGuest = async (): Promise<void> => {
    setIsGuest(true);
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      storage.saveUserData(updatedUser);
    }
  };

  const value: AuthContextType = useMemo(() => ({
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    loginAsProvider,
    logout,
    continueAsGuest,
    isGuest,
    sendOTP,
    sendProviderOTP,
    updateUser,
  }), [user, token, isLoading, isGuest]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
