import axios, { AxiosInstance } from 'axios';
import { API_BASE_URL } from '../utils/constants';
import { storage } from '../utils/storage';
import type { AuthResponse, ApiResponse, Booking, ServiceProvider, User, Service } from '../types';

class ApiService {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // Increased for Vercel cold starts
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      withCredentials: true, // Enable cookies for session-based auth
    });

    // Request interceptor - cookies are handled automatically by withCredentials
    this.client.interceptors.request.use(
      async (config) => {
        // For cookie-based auth, no need to add Authorization header
        // Cookies are automatically sent with withCredentials: true
        console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        console.log(`🍪 Cookies enabled: withCredentials = true`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling and data synchronization
    this.client.interceptors.response.use(
      (response) => {
        console.log(`📥 API Response: ${response.config.url} - Status: ${response.status}`);
        return response;
      },
      async (error) => {
        const url = error.config?.url || '';
        const status = error.response?.status;
        const errorData = error.response?.data;
        
        // Handle network errors
        if (!error.response) {
          console.error(`🌐 Network Error: ${url} - ${error.message}`);
          console.error('💡 Check: 1) Internet connection 2) Vercel deployment status 3) API_BASE_URL');
          error.isNetworkError = true;
          throw error;
        }
        
        // Check if this is an expected 404 (endpoints not yet implemented)
        const isExpected404 = status === 404 && (
          url.includes('/services') || 
          url.includes('/auth/send-otp') && errorData?.message?.includes('not find')
        );
        
        // Only log unexpected errors in detail
        if (!isExpected404) {
          console.error(`❌ API Error: ${url}`);
          console.error(`   Status: ${status}`);
          console.error(`   Message: ${errorData?.message || error.message}`);
        }
        
        // Handle specific status codes
        if (status === 401) {
          // Token expired or invalid
          console.log('🔐 Unauthorized - clearing auth data');
          await storage.clearAll();
          // You can emit an event here to logout user
        } else if (status === 404) {
          if (isExpected404) {
            // Silently handle expected 404s - app will use local/mock data
            console.log(`ℹ️ ${url} not available - using fallback data`);
          } else {
            console.log('🔍 Endpoint not found - may not be implemented yet');
          }
        } else if (status === 500) {
          console.error('🚨 Server error - check Vercel logs');
        } else if (status === 403) {
          console.error('🚫 Forbidden - check permissions');
        }
        
        throw error;
      }
    );
  }

  // Authentication (Using existing backend endpoints)
  async sendOTP(email: string, audience: 'homeowner' | 'provider' = 'homeowner', intent: 'login' | 'signup' = 'login'): Promise<ApiResponse> {
    console.log('🔵 Sending OTP to:', email);
    console.log('📍 Using backend:', this.client.defaults.baseURL);
    console.log('👤 Audience:', audience, '| Intent:', intent);
    const response = await this.client.post('/auth/send-otp', { 
      email,
      audience,  // Backend expects: homeowner or provider
      intent     // Backend expects: login or signup
    });
    console.log('✅ OTP sent successfully');
    return response.data;
  }

  async sendSignupOTP(email: string, metadata: { name: string; phone?: string }): Promise<ApiResponse> {
    console.log('🔵 Sending signup OTP to:', email);
    console.log('📍 Using backend:', this.client.defaults.baseURL);
    const response = await this.client.post('/auth/send-otp', { 
      email,
      audience: 'homeowner',
      intent: 'signup',
      metadata               // Backend uses metadata.name for new account creation
    });
    console.log('✅ Signup OTP sent successfully');
    return response.data;
  }

  // Provider Login - uses different audience and returns provider data
  async sendProviderOTP(email: string): Promise<ApiResponse> {
    console.log('🔵 Sending Provider OTP to:', email);
    console.log('📍 Using backend:', this.client.defaults.baseURL);
    const response = await this.client.post('/auth/send-otp', { 
      email,
      audience: 'provider',  // Provider login
      intent: 'login'
    });
    console.log('✅ Provider OTP sent successfully');
    return response.data;
  }

  async verifyProviderOTP(email: string, otp: string): Promise<AuthResponse> {
    console.log('🔵 Verifying Provider OTP for:', email);
    console.log('📍 Using backend:', this.client.defaults.baseURL);
    const response = await this.client.post('/auth/verify-otp', { 
      email, 
      otp,
      audience: 'provider'
    });
    console.log('✅ Provider OTP verified');
    console.log('📦 Full response:', JSON.stringify(response.data, null, 2));
    
    // Extract provider data from response
    const rawUserData = response.data.provider || response.data.user || response.data.data?.provider;
    
    // Map to User type with provider role
    const userData = {
      id: rawUserData._id || rawUserData.id,
      _id: rawUserData._id || rawUserData.id,
      name: rawUserData.name,
      email: rawUserData.email,
      phone: rawUserData.phone || '',
      role: 'provider' as const,
      services: rawUserData.services || [],
      serviceRates: rawUserData.serviceRates || [],
      status: rawUserData.status || 'pending',
      rating: rawUserData.rating,
      totalReviews: rawUserData.totalReviews,
    };
    
    console.log('👤 Mapped provider data:', JSON.stringify(userData, null, 2));
    console.log('🍪 Provider auth via cookies (yann_session)');
    
    // Save marker for cookie-based auth
    await storage.saveToken('cookie-based-auth-provider');
    
    return {
      success: response.data.success,
      message: response.data.message,
      user: userData,
      token: 'cookie-based-auth-provider',
    };
  }

  async registerProvider(data: any): Promise<ApiResponse> {
    const payload = {
      ...data,
      role: 'provider',
      userType: 'provider', // Some backends use userType instead of role
      status: data.status || 'pending',
      isApproved: false, // Needs admin approval
      audience: 'provider', // Specify this is a provider registration
    };
    console.log('🔵 Provider Registration Payload:', JSON.stringify(payload, null, 2));
    console.log('📍 Endpoint:', this.client.defaults.baseURL + '/register');
    
    // Try primary endpoint
    const response = await this.client.post('/register', payload);
    
    console.log('🟢 Provider Registration Response:', JSON.stringify(response.data, null, 2));
    console.log('✅ Registration successful!');
    console.log('📋 Provider Details:');
    console.log('   - Name:', payload.name);
    console.log('   - Email:', payload.email);
    console.log('   - Phone:', payload.phone);
    console.log('   - Role: provider');
    console.log('   - Status:', payload.status);
    console.log('   - Services:', payload.services.join(', '));
    console.log('🔍 If not visible in admin panel, check:');
    console.log('   1. Admin panel filters (show "pending" providers)');
    console.log('   2. Database table/collection for providers');
    console.log('   3. Backend logs for any validation errors');
    
    return response.data;
  }

  async verifyOTP(email: string, otp: string, intent: 'login' | 'signup' = 'login'): Promise<AuthResponse> {
    console.log('🔵 Verifying OTP for:', email);
    console.log('📍 Using backend:', this.client.defaults.baseURL);
    const response = await this.client.post('/auth/verify-otp', { 
      email, 
      otp,
      audience: 'homeowner',
      intent
    });
    console.log('✅ OTP verified, user authenticated');
    console.log('📦 Full response:', JSON.stringify(response.data, null, 2));
    
    // Extract user data from response (your backend returns "homeowner" not "user")
    const rawUserData = response.data.homeowner || response.data.user || response.data.data?.user;
    
    // Map to User type with role
    const userData = {
      id: rawUserData.id,
      name: rawUserData.name,
      email: rawUserData.email,
      phone: rawUserData.phone || '',
      avatar: rawUserData.avatar || '',
      role: response.data.audience || 'homeowner',
      preferences: rawUserData.preferences || [],
      savedProviders: rawUserData.savedProviders || [],
      addressBook: rawUserData.addressBook || []
    };
    
    console.log('👤 Mapped user data:', JSON.stringify(userData, null, 2));
    console.log('🍪 Authentication via cookies (session-based)');
    console.log('💡 Backend will send session cookie automatically');
    
    // Save a marker to indicate we're using cookie-based auth
    await storage.saveToken('cookie-based-auth');
    
    // Return formatted response with user data
    return {
      success: response.data.success,
      message: response.data.message,
      user: userData,
      token: 'cookie-based-auth', // Marker for cookie auth
    };
  }

  async logout(): Promise<void> {
    await this.client.post('/auth/logout');
  }

  // User Profile
  async getProfile(): Promise<{ user: User }> {
    console.log('🔵 Fetching user profile from backend');
    console.log('📍 Using backend:', this.client.defaults.baseURL);
    console.log('🍪 Using cookie-based authentication');
    
    const response = await this.client.get('/homeowner/me');
    console.log('📦 Profile response:', JSON.stringify(response.data, null, 2));
    
    // Your backend returns "homeowner" not "user"
    const userData = response.data.homeowner || response.data.user || response.data.data?.user || response.data;
    console.log('✅ Profile fetched:', userData?.email || 'No email found');
    
    return { user: userData };
  }

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    console.log('🔵 Updating profile on backend');
    console.log('📍 Using backend:', this.client.defaults.baseURL);
    const response = await this.client.patch('/homeowner/profile', data);
    console.log('✅ Profile updated successfully');
    return response.data;
  }

  async uploadAvatar(formData: FormData): Promise<ApiResponse> {
    const response = await this.client.post('/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Bookings
  async createBooking(bookingData: any): Promise<ApiResponse<Booking>> {
    console.log('🔵 Creating booking on backend');
    console.log('📍 Using backend:', this.client.defaults.baseURL);
    console.log('📋 Booking data:', JSON.stringify(bookingData, null, 2));
    
    // Ensure providerId is set (required by backend)
    if (!bookingData.providerId) {
      throw new Error('providerId is required for booking creation');
    }
    
    const response = await this.client.post('/bookings/create', bookingData);
    console.log('✅ Booking created:', response.data.booking?.id);
    return response.data;
  }

  async getMyBookings(): Promise<ApiResponse<Booking[]>> {
    console.log('🔵 Fetching user bookings from backend');
    console.log('📍 Using backend:', this.client.defaults.baseURL);
    const response = await this.client.get('/resident/requests');
    console.log('📦 Bookings response:', JSON.stringify(response.data, null, 2));
    
    // Handle different response structures
    const bookings = response.data.data || response.data.bookings || response.data;
    const count = Array.isArray(bookings) ? bookings.length : 0;
    console.log('✅ Fetched', count, 'bookings');
    
    return response.data;
  }

  async getBookingById(id: string): Promise<ApiResponse<Booking>> {
    console.log('🔵 Fetching booking details:', id);
    console.log('📍 Using backend:', this.client.defaults.baseURL);
    const response = await this.client.get(`/resident/requests/${id}`);
    console.log('✅ Booking details fetched');
    return response.data;
  }

  async cancelBooking(bookingId: string): Promise<ApiResponse> {
    const response = await this.client.post('/bookings/reject', { bookingId });
    return response.data;
  }

  // Service Providers
  async getProvidersByService(serviceName: string): Promise<ApiResponse<ServiceProvider[]>> {
    const response = await this.client.get('/provider/by-service', {
      params: { serviceName },
    });
    return response.data;
  }

  async registerAsProvider(providerData: any): Promise<ApiResponse> {
    const response = await this.client.post('/register', providerData);
    return response.data;
  }

  // Debug endpoint for testing
  async getAllBookings(): Promise<ApiResponse<Booking[]>> {
    const response = await this.client.get('/debug/bookings');
    return response.data;
  }

  // Services - Fetch all services from backend (like website)
  async getAllServices(): Promise<ApiResponse<Service[]>> {
    try {
      console.log('🔵 Fetching all services from backend');
      const response = await this.client.get('/services');
      console.log(`✅ Loaded ${response.data.services?.length || 0} services from backend`);
      return response.data;
    } catch (error: any) {
      console.log('ℹ️ Services endpoint not available, using static data');
      throw error;
    }
  }

  // Services - Get partner counts per service
  async getServicePartnerCounts(): Promise<ApiResponse<{ [serviceTitle: string]: number }>> {
    try {
      // Fetch partner counts for each service category
      const response = await this.client.get('/provider/service-counts');
      console.log('✅ Loaded partner counts from backend');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('ℹ️ Partner counts endpoint not available, showing 0 partners');
      }
      // Return empty counts on error
      return { success: true, message: 'No partner data', data: {} };
    }
  }

  async getServiceById(serviceId: string): Promise<ApiResponse<Service>> {
    try {
      const response = await this.client.get(`/services/${serviceId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('ℹ️ Service details endpoint not available, using local data');
        throw error;
      }
      throw error;
    }
  }

  async getServiceReviews(serviceId: string): Promise<ApiResponse<any[]>> {
    try {
      const response = await this.client.get(`/services/${serviceId}/reviews`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('ℹ️ Reviews endpoint not available, using local data');
        throw error;
      }
      throw error;
    }
  }

  // Provider Endpoints - Fetches data for logged-in provider
  async getProviderRequests(providerId?: string, email?: string): Promise<ApiResponse<any>> {
    // Backend requires either providerId or email as query param
    const params: any = {};
    if (providerId) params.providerId = providerId;
    if (email) params.email = email;
    
    const response = await this.client.get('/provider/requests', { params });
    console.log(`✅ Loaded provider requests and stats`);
    return response.data;
  }

  async getProviderBookings(status?: string): Promise<ApiResponse<any[]>> {
    const params = status ? { status } : {};
    const response = await this.client.get('/provider/bookings', { params });
    return response.data;
  }

  async getProviderStats(): Promise<ApiResponse<any>> {
    const response = await this.client.get('/provider/stats');
    return response.data;
  }

  async getProviderEarnings(period?: 'week' | 'month' | 'year'): Promise<ApiResponse<any>> {
    const params = period ? { period } : {};
    const response = await this.client.get('/provider/earnings', { params });
    return response.data;
  }

  async acceptBooking(bookingId: string, providerId?: string, providerName?: string): Promise<ApiResponse> {
    const payload: any = { bookingId };
    if (providerId) payload.providerId = providerId;
    if (providerName) payload.providerName = providerName;
    
    const response = await this.client.post('/bookings/accept', payload);
    return response.data;
  }

  async rejectBooking(bookingId: string, reason?: string): Promise<ApiResponse> {
    const response = await this.client.post('/bookings/reject', { bookingId, reason });
    return response.data;
  }

  async negotiateBooking(bookingId: string, proposedAmount: number, note?: string): Promise<ApiResponse> {
    const response = await this.client.post('/bookings/negotiate', { 
      bookingId, 
      proposedAmount,
      note 
    });
    return response.data;
  }

  async getProviderProfile(): Promise<ApiResponse<any>> {
    const response = await this.client.get('/provider/profile');
    return response.data;
  }
}

export const apiService = new ApiService();
