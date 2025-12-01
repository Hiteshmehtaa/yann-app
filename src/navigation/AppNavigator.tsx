import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../utils/theme';
import { Logo } from '../components/Logo';

// Auth Screens
import { RoleSelectionScreen } from '../screens/auth/RoleSelectionScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { VerifyOTPScreen } from '../screens/auth/VerifyOTPScreen';
import { SignupScreen } from '../screens/auth/SignupScreen';
import { ProviderSignupScreen } from '../screens/auth/ProviderSignupScreen';

// Home Screens
import { HomeScreen } from '../screens/home/HomeScreen';

// Booking Screens
import { ServiceDetailScreen } from '../screens/booking/ServiceDetailScreen';
import { BookingFormScreen } from '../screens/booking/BookingFormScreen';
import { BookingsListScreen } from '../screens/booking/BookingsListScreen';

// Profile Screens
import { ProfileScreen } from '../screens/profile/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Custom Tab Bar Icon Component with YANN theme
const TabIcon = ({ name, focused }: { name: keyof typeof Ionicons.glyphMap; focused: boolean }) => {
  return (
    <View style={[styles.tabIconContainer, focused && styles.tabIconContainerActive]}>
      <Ionicons 
        name={name} 
        size={22} 
        color={focused ? '#FFFFFF' : COLORS.textSecondary} 
      />
    </View>
  );
};

// Header Logo Component
const HeaderLogo = () => (
  <View style={styles.headerLogoContainer}>
    <Logo size="small" showText={true} variant="dark" />
  </View>
);

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 24 : 16,
          left: 24,
          right: 24,
          backgroundColor: COLORS.surface,
          borderRadius: 28,
          height: 70,
          paddingBottom: 0,
          paddingTop: 0,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: COLORS.borderLight,
          shadowColor: COLORS.primary,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 24,
          elevation: 16,
        },
        tabBarItemStyle: {
          paddingVertical: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarShowLabel: true,
        headerShown: true,
        headerStyle: {
          backgroundColor: COLORS.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 20,
          color: COLORS.text,
          letterSpacing: -0.5,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? "home" : "home-outline"} focused={focused} />
          ),
          tabBarLabel: 'Home',
          headerTitle: () => <HeaderLogo />,
        }}
      />
      <Tab.Screen
        name="BookingsList"
        component={BookingsListScreen}
        options={{
          tabBarLabel: 'Bookings',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? "calendar" : "calendar-outline"} focused={focused} />
          ),
          headerTitle: 'My Bookings',
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 20,
            color: COLORS.text,
          },
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? "person" : "person-outline"} focused={focused} />
          ),
          tabBarLabel: 'Account',
          headerTitle: 'My Account',
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 20,
            color: COLORS.text,
          },
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  tabIconContainerActive: {
    backgroundColor: COLORS.primary,
  },
  headerLogoContainer: {
    paddingLeft: 4,
  },
});

export function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: COLORS.background,
          },
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
            color: COLORS.text,
          },
          headerTintColor: COLORS.primary,
          headerShadowVisible: false,
        }}
      >
        {isAuthenticated ? (
          // Main App Stack
          <>
            <Stack.Screen
              name="MainTabs"
              component={TabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ServiceDetail"
              component={ServiceDetailScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="BookingForm"
              component={BookingFormScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          // Auth Stack
          <>
            <Stack.Screen
              name="RoleSelection"
              component={RoleSelectionScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Signup"
              component={SignupScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ProviderSignup"
              component={ProviderSignupScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="VerifyOTP"
              component={VerifyOTPScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
