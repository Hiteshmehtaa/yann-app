import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { apiService } from '../services/api';
import { storage } from '../utils/storage';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, otp: string, intent?: 'login' | 'signup') => Promise<void>;
  logout: () => Promise<void>;
  sendOTP: (email: string) => Promise<void>;
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
        } catch (error) {
          console.log('Could not refresh user data:', error);
          // Keep using cached data
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendOTP = async (email: string): Promise<void> => {
    try {
      await apiService.sendOTP(email);
      await storage.saveEmail(email);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to send OTP');
    }
  };

  const login = async (email: string, otp: string, intent: 'login' | 'signup' = 'login'): Promise<void> => {
    try {
      const response = await apiService.verifyOTP(email, otp, intent);
      
      // The new API returns homeowner data directly in response
      if (response.homeowner) {
        // Map homeowner data to User type
        const userData: User = {
          id: response.homeowner.id,
          name: response.homeowner.name,
          email: response.homeowner.email,
          phone: response.homeowner.phone || '',
          role: 'homeowner'
        };
        
        setUser(userData);
        await storage.saveUserData(userData);
      }

      // Note: The new API uses httpOnly cookies for auth, no token in response
      // We'll use a dummy token for compatibility
      const dummyToken = 'cookie-based-auth';
      await storage.saveToken(dummyToken);
      setToken(dummyToken);
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiService.logout();
    } catch (error) {
      console.log('Logout API call failed, but clearing local data');
    } finally {
      await storage.clearAll();
      setUser(null);
      setToken(null);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      storage.saveUserData(updatedUser);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    logout,
    sendOTP,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
