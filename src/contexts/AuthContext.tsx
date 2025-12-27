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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const savedToken = await storage.getToken();
      const savedUser = await storage.getUserData();

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(savedUser);
        
        // Optionally refresh user data from server
        try {
          const response = await apiService.getProfile();
          if (response.user) {
            setUser(response.user);
            await storage.saveUserData(response.user);
          }
        } catch (error: any) {
          // Cookie-based auth may fail on mobile if session expired
          // This is expected behavior - we continue with cached data
          if (error.response?.status !== 401) {
            console.log('Could not refresh user data:', error);
          }
          // Keep using cached data
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
      
      console.log('🔐 Processing login response:', response);
      
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
        };
        
        console.log('👤 Setting user data:', userData);
        
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
          const pushToken = await registerForPushNotificationsAsync();
          if (pushToken) {
            await apiService.savePushToken(pushToken, 'homeowner');
            console.log('📱 Push token registered:', pushToken);
          }
          setupNotificationListeners();
        } catch (pushError) {
          console.error('Failed to register push notifications:', pushError);
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
    }
  };

  // Login as provider/partner - uses different backend endpoint
  const loginAsProvider = async (identifier: string, otp: string): Promise<void> => {
    try {
      const response = await apiService.verifyProviderOTP(identifier, otp);
      
      console.log('🔐 Processing provider login response:', response);
      
      if (response.user) {
        const userData: User = {
          id: response.user.id,
          _id: response.user._id || response.user.id,
          name: response.user.name,
          email: response.user.email,
          phone: response.user.phone || '',
          role: 'provider',
          services: response.user.services || [],
          status: response.user.status,
          avatar: response.user.avatar || response.user.profileImage || '',
          profileImage: response.user.profileImage || response.user.avatar || '',
        };
        
        console.log('👤 Setting provider data:', userData);
        
        // Use the actual JWT token from response for mobile auth
        const actualToken = response.token || 'cookie-based-auth-provider';
        
        await storage.saveToken(actualToken);
        await storage.saveUserData(userData);
        
        setToken(actualToken);
        setUser(userData);
        
        // Register for push notifications after successful provider login
        try {
          const pushToken = await registerForPushNotificationsAsync();
          if (pushToken) {
            await apiService.savePushToken(pushToken, 'provider');
            console.log('📱 Provider push token registered:', pushToken);
          }
          setupNotificationListeners();
        } catch (pushError) {
          console.error('Failed to register provider push notifications:', pushError);
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
    sendOTP,
    sendProviderOTP,
    updateUser,
  }), [user, token, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
