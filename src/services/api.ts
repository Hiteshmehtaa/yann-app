import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getApiBaseUrl } from '../utils/constants';
import { storage } from '../utils/storage';
import { getErrorMessage } from '../utils/errorMessages';
import type { AuthResponse, ApiResponse, Booking, ServiceProvider, User, Service, ServiceProviderListItem, ServiceCount, ProviderDashboardData, Address } from '../types';

/**
 * Yann Mobile API Service
 * 
 * This service mirrors the website's API calls exactly.
 * All endpoints match the Next.js API routes in /src/app/api/
 * 
 * Key Endpoints (matching website):
 * - GET /api/services - List all services
 * - GET /api/services/[id]/providers - Get providers for a service
 * - GET /api/providers - List all providers
 * - GET /api/providers/[id] - Get provider details
 * - GET /api/provider/by-service?service=X - Get providers by service name
 * - GET /api/provider/service-counts - Get provider counts per service
 * - GET /api/bookings - Get user's bookings
 * - POST /api/bookings/create - Create a booking
 * - GET /api/homeowner/me - Get current user profile
 * - GET /api/resident/requests - Get user's service requests
 * - GET /api/provider/requests - Get provider's incoming requests
 */
class ApiService {
  private readonly client: AxiosInstance;
  private baseUrlUpdateInterval: NodeJS.Timeout | null = null;

  private normalizeUserVerification(user: any): User {
    const isVerified = user?.isVerified ?? user?.aadhaarVerified ?? false;
    const aadhaarVerified = user?.aadhaarVerified ?? user?.isVerified ?? false;

    return {
      ...user,
      isVerified,
      aadhaarVerified,
    } as User;
  }

  constructor() {
    this.client = axios.create({
      baseURL: 'https://yann-care.vercel.app/api', // Initial default
      timeout: 30000, // Increased for Vercel cold starts
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      withCredentials: true, // Enable cookies for session-based auth (same as website)
    });

    // Initialize with dynamic backend detection
    this.initializeBackend();


    // Request interceptor - add JWT token for mobile auth
    this.client.interceptors.request.use(
      async (config) => {
        // For mobile app, we need to send the JWT token in Authorization header
        // since React Native doesn't support httpOnly cookies
        try {
          const token = await storage.getToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            // console.log(`🔑 Attaching token to ${config.url}: ${token.substring(0, 10)}...`);
          } else {
            console.log(`⚠️ No token found for ${config.url} (Storage returned null)`);
          }

          // Add user ID header for wallet and other authenticated endpoints
          const userData = await storage.getUserData();
          const userId = userData?.id || userData?._id;
          if (userId) {
            config.headers['x-user-id'] = userId;
          }

          // Debug logging for wallet endpoints
          if (__DEV__ && config.url?.includes('/wallet')) {
            // console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`, {
            //   hasUserId: !!userId,
            //   userId: userId ? `${userId.substring(0, 8)}...` : 'missing',
            //   data: config.data
            // });
          }
        } catch (error) {
          // Silently fail - request will proceed without auth
          console.error('Request interceptor error:', error);
        }

        return config;
      },
      (error) => Promise.reject(error)
    );


    // Response interceptor for error handling and data synchronization
    this.client.interceptors.response.use(
      (response) => {
        // Only log in development if needed for debugging
        // console.log(`📥 ${response.config.url} - ${response.status}`);
        return response;
      },
      async (error: AxiosError<any>) => {
        const url = error.config?.url || '';
        const status = error.response?.status;

        // Handle network errors
        if (!error.response) {
          console.error(`🌐 Network Error: ${url}`);
          (error as any).isNetworkError = true;
          // Enhance error with user-friendly message
          error.message = getErrorMessage(error);
          throw error;
        }

        // Check if this is an expected 404 (endpoints not yet implemented)
        const isExpected404 = status === 404 && (
          url.includes('/services/') ||
          url.includes('/reviews')
        );

        // Only log unexpected errors
        if (!isExpected404 && status !== 200) {
          console.error(`❌ API Error: ${url} - ${status}`);
        }

        // Handle specific status codes
        if (status === 401) {
          console.log('🔐 Session expired');
        } else if (status === 500) {
          console.error('🚨 Server error');
          if (error.response?.data) {
            console.error('🔥 Server Error Details:', JSON.stringify(error.response.data, null, 2));
          }
        }

        // Enhance error with user-friendly message
        error.message = getErrorMessage(error);
        throw error;
      }
    );
  }

  /**
   * Initialize backend URL detection
   * Checks if local backend is available, otherwise uses production
   */
  private async initializeBackend(): Promise<void> {
    try {
      const detectedUrl = await getApiBaseUrl();
      this.client.defaults.baseURL = detectedUrl;
      console.log('🔗 API initialized with:', detectedUrl);

      // Periodically re-check backend availability (every 30 seconds)
      this.baseUrlUpdateInterval = setInterval(async () => {
        try {
          const updatedUrl = await getApiBaseUrl();
          if (this.client.defaults.baseURL !== updatedUrl) {
            this.client.defaults.baseURL = updatedUrl;
            console.log('🔄 Backend URL updated to:', updatedUrl);
          }
        } catch (error) {
          // Silently fail - keep using current URL
          console.log('⚠️ Backend re-check failed, keeping current URL');
        }
      }, 30000);
    } catch (error) {
      console.error('❌ Failed to detect backend, using production:', error);
      this.client.defaults.baseURL = 'https://yann-care.vercel.app/api';
      console.log('🔗 API initialized with production fallback');
    }
  }

  // Authentication (Using existing backend endpoints)
  async sendOTP(identifier: string, audience: 'homeowner' | 'provider' = 'homeowner', intent: 'login' | 'signup' = 'login'): Promise<ApiResponse> {
    const response = await this.client.post('/auth/send-otp', {
      identifier,  // Can be email or phone number - backend auto-detects
      audience,    // Backend expects: homeowner or provider
      intent       // Backend expects: login or signup
    });
    return response.data;
  }

  async sendSignupOTP(identifier: string, metadata: { name: string; phone?: string; email?: string }): Promise<ApiResponse> {
    const response = await this.client.post('/auth/send-otp', {
      identifier,            // Can be email or phone number
      audience: 'homeowner',
      intent: 'signup',
      metadata               // Backend uses metadata.name for new account creation
    });
    return response.data;
  }

  // Provider Login - uses different audience and returns provider data
  async sendProviderOTP(identifier: string): Promise<ApiResponse> {
    const response = await this.client.post('/auth/send-otp', {
      identifier,            // Can be email or phone number
      audience: 'provider',  // Provider login
      intent: 'login'
    });
    return response.data;
  }

  async verifyProviderOTP(identifier: string, otp: string): Promise<AuthResponse> {
    const response = await this.client.post('/auth/verify-otp', {
      identifier,  // Can be email or phone number
      otp,
      audience: 'provider'
    });

    // console.log('🔐 Provider OTP verify raw response:', JSON.stringify(response.data, null, 2));

    // Extract provider data from response
    const rawUserData = response.data.provider || response.data.user || response.data.data?.provider;

    if (!rawUserData) {
      console.error('❌ No provider data found in response:', response.data);
      throw new Error(response.data?.message || 'No provider data in response');
    }

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
      avatar: rawUserData.avatar || rawUserData.profileImage || '',
      profileImage: rawUserData.profileImage || rawUserData.avatar || '',
    };

    // console.log('✅ Mapped provider data:', userData);

    // Use actual JWT token from backend response
    const token = response.data.token;

    // Save token for cookie-based auth
    if (token) {
      await storage.saveToken(token);
    } else {
      // Fallback only if no token received (legacy behavior)
      await storage.saveToken('cookie-based-auth-provider');
    }

    return {
      success: response.data.success,
      message: response.data.message,
      user: userData,
      token: token || 'cookie-based-auth-provider',
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

    // Try primary endpoint
    const response = await this.client.post('/register', payload);

    return response.data;
  }

  async verifyOTP(identifier: string, otp: string, intent: 'login' | 'signup' = 'login'): Promise<AuthResponse> {
    const response = await this.client.post('/auth/verify-otp', {
      identifier,  // Can be email or phone number
      otp,
      audience: 'homeowner',
      intent
    });

    // Extract user data from response (backend returns "homeowner" not "user")
    const rawUserData = response.data.homeowner || response.data.user || response.data.data?.user;

    // Map to User type with role
    const userData = {
      id: rawUserData._id || rawUserData.id,
      _id: rawUserData._id || rawUserData.id,
      name: rawUserData.name,
      email: rawUserData.email,
      phone: rawUserData.phone || '',
      avatar: rawUserData.avatar || '',
      role: response.data.audience || 'homeowner',
      preferences: rawUserData.preferences || [],
      savedProviders: rawUserData.savedProviders || [],
      addressBook: rawUserData.addressBook || []
    };

    // Use actual JWT token from backend response
    const actualToken = response.data.token;

    console.log('🔑 Received token from backend:', {
      hasToken: !!actualToken,
      tokenLength: actualToken?.length,
      tokenPreview: actualToken?.substring(0, 20) + '...'
    });

    // Return formatted response with user data and actual token
    return {
      success: response.data.success,
      message: response.data.message,
      user: userData,
      token: actualToken, // Use actual JWT token from backend
    };
  }





  async deleteAccount(): Promise<ApiResponse<any>> {
    const response = await this.client.delete('/auth/delete-account');
    return {
      success: true,
      message: 'Account deleted successfully',
      data: response.data,
    };
  }

  async logout(): Promise<ApiResponse<void>> {
    try {
      await this.client.post('/auth/logout');
    } catch (error: any) {
      console.log('Logout error (non-critical):', error?.message || '');
      // Silently handle - local cleanup will happen anyway
    }
    return { success: true, message: 'Logged out' };
  }

  async markNotificationsRead(notificationIds: string[]): Promise<ApiResponse> {
    const userStr = await AsyncStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const userId = user?.id || user?._id;

    const response = await this.client.post('/notifications/mark-read', {
      notificationIds,
      userId
    });
    return response.data;
  }

  async registerAsProvider(providerData: any): Promise<ApiResponse> {
    const response = await this.client.post('/register', providerData);
    return response.data;
  }

  // ====================================================================
  // SERVICES ENDPOINTS (matching website /api/services routes)
  // ====================================================================

  /**
   * GET /api/services
   * Fetch all services from backend (exactly like website)
   * Website uses this in: ServiceSelector, homepage, service pages
   */
  async getAllServices(): Promise<ApiResponse<Service[]>> {
    try {
      const response = await this.client.get('/services');

      // Website response format: { success: true, data: [...services] }
      const services = response?.data?.data || response?.data?.services || response?.data || [];

      // Ensure we always return an array
      if (!Array.isArray(services)) {
        return {
          success: true,
          message: 'Services loaded',
          data: [],
        };
      }

      return {
        success: true,
        message: 'Services loaded',
        data: services,
      };
    } catch (error: any) {
      console.log('Service fetch failed:', error?.message || 'Unknown error');
      // Silently fail - component will use fallback
      return {
        success: false,
        message: 'Failed to load services',
        data: [],
      };
    }
  }

  /**
   * GET /api/services/[id]
   * Get single service details
   */
  async getServiceById(serviceId: string): Promise<ApiResponse<Service>> {
    try {
      const response = await this.client.get(`/services/${serviceId}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * GET /api/services/[id]/providers
   * Get providers for a specific service by service ID
   * Website uses this on service detail pages
   */
  async getProvidersForService(serviceId: string): Promise<ApiResponse<ServiceProviderListItem[]>> {
    try {
      const response = await this.client.get(`/services/${serviceId}/providers`);

      // Response includes: { success, data: providers[], service: {...}, meta: { total, serviceName } }
      const providers = response.data.data || response.data.providers || [];

      return {
        success: true,
        message: 'Providers loaded',
        data: providers,
        service: response.data.service,
        meta: response.data.meta,
      };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * GET /api/services/[id]/reviews
   * Get reviews for a service
   */
  async getServiceReviews(serviceId: string): Promise<ApiResponse<any[]>> {
    try {
      const response = await this.client.get(`/services/${serviceId}/reviews`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  // ====================================================================
  // PROVIDERS ENDPOINTS (matching website /api/providers routes)
  // ====================================================================

  /**
   * GET /api/providers
   * Get all active providers with optional filtering
   * Query params: service, status, limit, page
   * Website uses this for provider listings
   */
  async getAllProviders(params?: {
    service?: string;
    status?: string;
    limit?: number;
    page?: number;
  }): Promise<ApiResponse<ServiceProviderListItem[]>> {
    try {
      const response = await this.client.get('/providers', { params });

      const providers = response.data.data || [];

      return {
        success: true,
        message: 'Providers loaded',
        data: providers,
        meta: response.data.meta,
      };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * GET /api/providers/search
   * Search providers with detailed filters (including driver specifics)
   */
  async searchProviders(filters: {
    service?: string;
    vehicleType?: string;
    transmission?: string;
    tripType?: string;
    limit?: number;
    page?: number;
  }): Promise<ApiResponse<ServiceProviderListItem[]>> {
    try {
      const response = await this.client.get('/providers/search', { params: filters });
      const providers = response.data?.data || response.data?.providers || [];
      return {
        success: Array.isArray(providers) && providers.length > 0,
        message: 'Search completed',
        data: Array.isArray(providers) ? providers : [],
        meta: response.data?.meta
      };
    } catch (error: any) {
      console.log('Provider search failed:', error?.message || '', '- will fallback to alternative methods');
      return {
        success: false,
        message: 'Search failed',
        data: []
      };
    }
  }

  /**
   * GET /api/providers/[id]
   * Get specific provider by ID
   * Website uses this for provider profile pages
   */
  async getProviderById(providerId: string): Promise<ApiResponse<ServiceProvider>> {
    try {
      const response = await this.client.get(`/providers/${providerId}`);

      return {
        success: true,
        message: 'Provider loaded',
        data: response.data.data,
      };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * GET /api/provider/by-service?service=X
   * Get providers by service NAME (not ID)
   * Website uses this when filtering providers
   * Returns providers sorted by price
   */
  async getProvidersByService(serviceName: string, filters?: any): Promise<ApiResponse<ServiceProviderListItem[]>> {
    try {
      const params: any = { service: serviceName };

      // Add filters if provided
      if (filters) {
        if (filters.experienceMin !== undefined) params.experienceMin = filters.experienceMin;
        if (filters.experienceMax !== undefined) params.experienceMax = filters.experienceMax;
        if (filters.excludeProviderId) params.excludeProviderId = filters.excludeProviderId;
      }

      console.log('📊 Fetching providers with filters:', params);

      const response = await this.client.get('/provider/by-service', { params });

      // Response: { success, data: providers[], providers: providers[], meta: { total, service } }
      const providers = response?.data?.data || response?.data?.providers || response?.data || [];

      // Ensure array type
      if (!Array.isArray(providers)) {
        return {
          success: false,
          message: 'No providers found',
          data: [],
          meta: { total: 0, service: serviceName },
        };
      }

      console.log(`✅ Found ${providers.length} providers matching filters`);

      return {
        success: providers.length > 0,
        message: providers.length > 0 ? 'Providers loaded' : 'No providers available',
        data: providers,
        meta: response?.data?.meta || { total: providers.length, service: serviceName },
      };
    } catch (error: any) {
      console.log('Provider fetch failed:', error.message);
      return {
        success: false,
        message: 'Failed to load providers',
        data: [],
        meta: { total: 0, service: serviceName },
      };
    }
  }

  /**
   * GET /api/provider/service-counts
   * Get provider counts grouped by service with pricing data
   * Website uses this to show "X providers available" badges and min/max prices
   * Returns: [{ service, providerCount, avgRating, minPrice, maxPrice }]
   */
  async getServicePartnerCounts(): Promise<ApiResponse<ServiceCount[]>> {
    try {
      const response = await this.client.get('/provider/service-counts');

      // Response: { success, data: [{ service, providerCount, avgRating }] }
      const counts = response?.data?.data || response?.data || [];

      // Ensure we return an array
      if (!Array.isArray(counts)) {
        return { success: true, message: 'No partner data', data: [] };
      }

      return {
        success: true,
        message: 'Partner counts loaded',
        data: counts,
      };
    } catch (error: any) {
      console.log('Partner counts error:', error?.message || '');
      // Partner counts are optional - return empty if fails
      return { success: true, message: 'No partner data', data: [] };
    }
  }

  // ====================================================================
  // BOOKINGS ENDPOINTS (matching website /api/bookings routes)
  // ====================================================================

  /**
   * GET /api/bookings
   * Get all bookings for the authenticated homeowner
   * Website uses this in My Bookings page
   */
  async getMyBookings(): Promise<ApiResponse<Booking[]>> {
    // console.log('🔵 API: Calling GET /bookings');
    const response = await this.client.get('/bookings');

    // console.log('📦 API: Raw response from /bookings:', JSON.stringify(response.data, null, 2));

    // Website response: { success, data: bookings[], meta: { total } }
    const bookings = response.data.data || response.data.bookings || [];

    // console.log(`✅ API: Parsed ${bookings.length} bookings from response`);

    return {
      success: true,
      message: 'Bookings loaded',
      data: bookings,
      meta: response.data.meta,
    };
  }

  /**
   * POST /api/bookings/create
   * Create a new booking
   * Website uses this in booking form
   * REQUIRES: providerId, serviceName, customerPhone, customerAddress, bookingDate, bookingTime
   */
  async createBooking(bookingData: {
    serviceId: number | string;
    serviceName: string;
    serviceCategory: string;
    customerId?: string | null;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    customerAddress: string;
    latitude?: number;
    longitude?: number;
    providerNavigationAddress?: any;
    bookingDate: string;
    bookingTime: string;
    startTime?: string;
    endTime?: string;
    bookedHours?: number;
    providerId: string; // REQUIRED - get from selected provider
    paymentMethod?: string;
    billingType?: string;
    quantity?: number;
    notes?: string;
    extras?: any[];
    driverDetails?: any;
    driverTripDetails?: any;
    basePrice?: number;
    gstAmount?: number;
    totalPrice?: number;
    [key: string]: any; // Allow any extra fields to pass through
  }): Promise<ApiResponse<Booking>> {
    if (!bookingData.providerId) {
      throw new Error('providerId is required - select a provider first');
    }

    // Sanitize booking data - keep all fields, just set defaults for missing ones
    const cleanedData: Record<string, any> = {
      serviceId: bookingData.serviceId,
      serviceName: bookingData.serviceName,
      serviceCategory: bookingData.serviceCategory,
      customerId: bookingData.customerId || null,
      customerName: bookingData.customerName,
      customerPhone: bookingData.customerPhone,
      customerEmail: bookingData.customerEmail || '',
      customerAddress: bookingData.customerAddress,
      bookingDate: bookingData.bookingDate,
      bookingTime: bookingData.bookingTime,
      providerId: bookingData.providerId,
      paymentMethod: bookingData.paymentMethod || 'cash',
      billingType: bookingData.billingType || 'one-time',
      quantity: bookingData.quantity || 1,
      notes: bookingData.notes || '',
      extras: bookingData.extras || [],
      basePrice: bookingData.basePrice || 0,
      totalPrice: bookingData.totalPrice || 0,
    };

    // Pass through all additional fields (needed for driver bookings, etc.)
    if (bookingData.driverDetails) cleanedData.driverDetails = bookingData.driverDetails;
    if (bookingData.driverTripDetails) cleanedData.driverTripDetails = bookingData.driverTripDetails;
    if (bookingData.bookedHours) cleanedData.bookedHours = bookingData.bookedHours;
    if (bookingData.startTime) cleanedData.startTime = bookingData.startTime;
    if (bookingData.endTime) cleanedData.endTime = bookingData.endTime;
    if (bookingData.gstAmount != null) cleanedData.gstAmount = bookingData.gstAmount;
    if (bookingData.latitude) cleanedData.latitude = bookingData.latitude;
    if (bookingData.longitude) cleanedData.longitude = bookingData.longitude;
    if (bookingData.providerNavigationAddress) cleanedData.providerNavigationAddress = bookingData.providerNavigationAddress;

    const response = await this.client.post('/bookings/create', cleanedData);

    return response.data;
  }

  /**
   * GET /api/bookings/[id]
   * Get booking details by ID
   */
  async getBookingById(bookingId: string): Promise<ApiResponse<Booking>> {
    const response = await this.client.get(`/bookings/${bookingId}`);
    return response.data;
  }

  /**
   * POST /api/bookings/accept
   * Accept a booking (provider action)
   */
  async acceptBooking(bookingId: string, providerId?: string, providerName?: string): Promise<ApiResponse> {
    const payload: any = { bookingId };
    if (providerId) payload.providerId = providerId;
    if (providerName) payload.providerName = providerName;

    const response = await this.client.post('/bookings/accept', payload);
    return response.data;
  }

  /**
   * POST /api/bookings/update-status
   * Update booking status (in_progress, completed, cancelled)
   * Used by providers to manage job progress
   */
  async updateBookingStatus(bookingId: string, status: 'in_progress' | 'completed' | 'cancelled', providerId?: string): Promise<ApiResponse> {
    const response = await this.client.post('/bookings/update-status', {
      bookingId,
      status,
      providerId
    });
    return response.data;
  }

  /**
   * POST /api/bookings/reject
   * Reject/cancel a booking
   */
  async rejectBooking(bookingId: string, providerId: string, reason?: string): Promise<ApiResponse> {
    const response = await this.client.post('/bookings/reject', { bookingId, providerId, reason });
    return response.data;
  }

  /**
   * POST /api/bookings/negotiate
   * Negotiate booking price (provider action)
   */
  async negotiateBooking(bookingId: string, proposedAmount: number, note?: string): Promise<ApiResponse> {
    const response = await this.client.post('/bookings/negotiate', {
      bookingId,
      proposedAmount,
      note
    });
    return response.data;
  }

  // Alias for cancel - requires providerId for provider cancellations
  async cancelBooking(bookingId: string, providerId?: string): Promise<ApiResponse> {
    return this.rejectBooking(bookingId, providerId || '', 'Cancelled by user');
  }

  /**
   * POST /api/bookings/cancel
   * Cancel a booking as a member (customer). Uses the dedicated cancel endpoint
   * which handles wallet refunds and does NOT require providerId.
   */
  async cancelBookingByMember(bookingId: string, reason?: string): Promise<ApiResponse> {
    const response = await this.client.post('/bookings/cancel', {
      bookingId,
      reason: reason || 'Cancelled by customer',
    });
    return response.data;
  }

  // ====================================================================
  // BOOKING REQUEST FLOW (3-minute timer system)
  // ====================================================================

  /**
   * POST /api/bookings/request
   * Send booking request to provider with 3-minute timer
   */
  async sendBookingRequest(bookingId: string, providerId: string): Promise<ApiResponse> {
    const response = await this.client.post('/bookings/request', { bookingId, providerId });
    return response.data;
  }

  /**
   * POST /api/bookings/reassign
   * Reassign a rejected booking to a new provider
   */
  async reassignBooking(bookingId: string, newProviderId: string): Promise<ApiResponse> {
    const response = await this.client.post('/bookings/reassign', { bookingId, newProviderId });
    return response.data;
  }

  /**
   * GET /api/bookings/request
   * Check booking request status (for polling)
   */
  async checkBookingRequestStatus(bookingId: string, customerId?: string): Promise<ApiResponse> {
    if (!bookingId || bookingId === 'undefined') {
      console.warn('⚠️ checkBookingRequestStatus called with invalid ID:', bookingId);
      return { success: false, message: 'Invalid booking ID', data: null };
    }
    const params = new URLSearchParams({ bookingId });
    if (customerId) params.append('customerId', customerId);
    const response = await this.client.get(`/bookings/request?${params.toString()}`);
    return response.data;
  }

  /**
   * Alias for checkBookingRequestStatus (clearer naming)
   */
  async getBookingStatus(bookingId: string, customerId?: string): Promise<ApiResponse> {
    return this.checkBookingRequestStatus(bookingId, customerId);
  }

  /**
   * GET /api/bookings/pending-requests
   * Get all pending booking requests for a provider
   */
  async getProviderPendingRequests(providerId: string): Promise<ApiResponse> {
    const response = await this.client.get(`/bookings/pending-requests?providerId=${providerId}`);
    return response.data;
  }

  /**
   * POST /api/bookings/respond
   * Provider responds to booking request (accept/reject)
   */
  async respondToBookingRequest(bookingId: string, providerId: string, action: 'accept' | 'reject', reason?: string): Promise<ApiResponse> {
    const response = await this.client.post('/bookings/respond', {
      bookingId,
      providerId,
      action,
      reason
    });
    return response.data;
  }

  /**
   * POST /api/bookings/buzzer
   * Send buzzer notification to provider (called periodically)
   */
  async sendProviderBuzzer(bookingId: string): Promise<ApiResponse> {
    const response = await this.client.post('/bookings/buzzer', { bookingId });
    return response.data;
  }

  // ====================================================================
  // PAYMENT ENDPOINTS
  // ====================================================================

  /**
   * POST /api/payment/create-order
   * Create a Razorpay order
   */
  async createPaymentOrder(data: {
    amount: number;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    serviceName?: string;
    bookingId?: string;
  }): Promise<ApiResponse> {
    const response = await this.client.post('/payment/create-order', data);
    return response.data;
  }

  /**
   * POST /api/payment/verify
   * Verify Razorpay payment signature
   */
  async verifyPayment(data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<ApiResponse> {
    const response = await this.client.post('/payment/verify', data);
    return response.data;
  }

  /**
   * POST /api/bookings/pay-initial
   * Process 25% initial payment after provider accepts
   */
  async payInitialBookingAmount(bookingId: string, paymentMethod: string): Promise<ApiResponse> {
    const response = await this.client.post('/bookings/pay-initial', {
      bookingId,
      paymentMethod
    });
    return response.data;
  }

  // ====================================================================
  // HOMEOWNER/RESIDENT ENDPOINTS (matching website routes)
  // ====================================================================

  /**
   * GET /api/homeowner/me
   * Get current authenticated homeowner profile
   * Website uses this for user dashboard
   */
  async getProfile(role: 'homeowner' | 'provider' = 'homeowner'): Promise<{ user: User }> {
    if (role === 'provider') {
      const response = await this.client.get('/provider/profile');

      // Debugging logs (commented out to reduce spam)
      // console.log('📡 Provider profile response structure:', {
      //   hasData: !!response.data,
      //   hasDataData: !!response.data?.data,
      //   hasProvider: !!response.data?.provider,
      //   hasUser: !!response.data?.user,
      //   keys: Object.keys(response.data || {})
      // });

      // Try multiple possible response structures
      const providerData = response.data.data || response.data.provider || response.data.user || response.data;

      if (!providerData) {
        console.error('❌ No provider data found in response');
        throw new Error('No provider data in response');
      }

      // console.log('✅ Extracted provider data:', {
      //   id: providerData.id || providerData._id,
      //   email: providerData.email,
      //   name: providerData.name
      // });
      console.log('✅ Provider profile loaded. Has bio:', !!providerData.bio);

      return { user: this.normalizeUserVerification({ ...providerData, role: 'provider' }) };
    }

    const response = await this.client.get('/homeowner/me');

    // Website response: { success, homeowner: {...} }
    const userData = response.data.homeowner || response.data.user || response.data.data;

    return { user: this.normalizeUserVerification(userData) };
  }

  /**
   * PATCH /api/homeowner/profile
   * Update homeowner profile
   * Website uses this in profile edit
   */
  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    const response = await this.client.patch('/homeowner/profile', data);
    return response.data;
  }

  /**
   * POST /api/verification/initiate
   * Initiate Aadhaar verification via Meon Tech (DigiLocker)
   */
  async verifyIdentity(
    userId: string,
    userType: 'homeowner' | 'provider',
    redirectUrl?: string
  ): Promise<{ success: boolean; url: string; message?: string }> {
    const response = await this.client.post('/verification/initiate', {
      userId,
      userType,
      redirectUrl,
    });
    return response.data;
  }

  /**
   * GET /api/resident/requests
   * Get service requests for the homeowner
   * Website uses this in My Requests page
   */
  async getMyRequests(): Promise<ApiResponse<any[]>> {
    const response = await this.client.get('/resident/requests');

    // Response: { success, data: requests[], requests: requests[] }
    const requests = response.data.data || response.data.requests || [];

    return {
      success: true,
      message: 'Requests loaded',
      data: requests,
    };
  }

  /**
   * POST /api/resident/requests
   * Create a new service request
   */
  async createRequest(data: {
    title: string;
    serviceType: string;
    description?: string;
    scheduledFor?: string;
    priority?: 'routine' | 'urgent';
    locationLabel?: string;
  }): Promise<ApiResponse<any>> {
    const response = await this.client.post('/resident/requests', data);
    return response.data;
  }

  // ====================================================================
  // PROVIDER DASHBOARD ENDPOINTS (matching website provider routes)
  // ====================================================================

  /**
   * GET /api/provider/requests
   * Get provider's incoming requests, accepted bookings, and stats
   * Website uses this for provider dashboard
   * Requires: providerId or email as query param
   * FILTERS BY PROVIDER ID - returns only that provider's bookings
   */
  async getProviderRequests(providerId?: string, email?: string): Promise<ProviderDashboardData> {
    try {
      const params: any = {};
      if (providerId) params.providerId = providerId;
      if (email) params.email = email;

      // console.log('📡 Calling /provider/requests with params:', params);
      const response = await this.client.get('/provider/requests', { params });
      // console.log('📡 /provider/requests response:', response.data);

      // Return the complete dashboard data structure
      return response.data;
    } catch (error: any) {
      console.log('Provider requests fetch failed:', error?.message || '');
      // Return minimal valid ProviderDashboardData structure on error
      return {
        success: false,
        provider: {
          id: '',
          name: '',
          email: '',
          phone: '',
          services: [],
          rating: 0,
          totalReviews: 0,
        },
        stats: {
          pendingRequests: 0,
          acceptedBookings: 0,
          completedBookings: 0,
          totalEarnings: 0,
          monthlyEarnings: 0,
        },
        pendingRequests: [],
        acceptedBookings: [],
      };
    }
  }

  /**
   * GET /api/provider/bookings
   * Get provider's bookings filtered by status
   */
  async getProviderBookings(status?: string): Promise<ApiResponse<Booking[]>> {
    const params = status ? { status } : {};
    const response = await this.client.get('/provider/bookings', { params });
    return response.data;
  }

  /**
   * GET /api/provider/stats
   * Get provider statistics
   */
  async getProviderStats(): Promise<ApiResponse<any>> {
    const response = await this.client.get('/provider/stats');
    return response.data;
  }

  /**
   * GET /api/provider/earnings
   * Get provider earnings with period filter
   */
  async getProviderEarnings(period?: 'week' | 'month' | 'year'): Promise<ApiResponse<any>> {
    const params = period ? { period } : {};
    const response = await this.client.get('/provider/earning', { params });
    return response.data;
  }

  /**
   * GET /api/provider/profile
   * Get provider's own profile
   */
  async getProviderOwnProfile(): Promise<ApiResponse<ServiceProvider>> {
    const response = await this.client.get('/provider/profile');
    return response.data;
  }

  /**
   * PATCH /api/provider/profile
   * Update provider's own profile
   */
  async updateProviderProfile(data: Partial<ServiceProvider>): Promise<ApiResponse<ServiceProvider>> {
    const response = await this.client.patch('/provider/profile', data);
    return response.data;
  }

  /**
   * GET /api/provider/bank-details
   * Get provider's bank details
   */
  async getBankDetails(): Promise<ApiResponse<{
    hasBankDetails: boolean;
    accountNumber: string | null;
    ifscCode: string | null;
    bankName: string | null;
    verified: boolean;
    verifiedAt: string | null;
  }>> {
    const response = await this.client.get('/provider/bank-details');
    return response.data;
  }

  /**
   * POST /api/provider/bank-details
   * Update provider's bank details
   */
  async updateBankDetails(data: {
    accountNumber: string;
    ifscCode: string;
    bankName?: string;
  }): Promise<ApiResponse<{
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    verified: boolean;
  }>> {
    const response = await this.client.post('/provider/bank-details', data);
    return response.data;
  }

  // ====================================================================
  // UPLOAD ENDPOINTS
  // ====================================================================

  // ====================================================================
  // NOTIFICATION ENDPOINTS
  // ====================================================================

  /**
   * GET /api/notifications
   * Get notifications for the authenticated user
   */
  async getNotifications(userId: string): Promise<ApiResponse<any[]>> {
    try {
      const response = await this.client.get('/notifications', {
        params: { userId }
      });

      // Response: { success, notifications: [], meta: {} }
      const notifications = response.data.notifications || [];

      return {
        success: true,
        message: 'Notifications loaded',
        data: notifications,
        meta: response.data.meta
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to load notifications',
        data: [],
      };
    }
  }

  /**
   * POST /api/call-requests
   * Create a call request for support
   */
  async createCallRequest(phoneNumber: string): Promise<ApiResponse> {
    const response = await this.client.post('/call-requests', { phoneNumber });
    return response.data;
  }

  // ====================================================================
  // UPLOAD ENDPOINTS
  // ====================================================================

  async uploadAvatar(base64Image: string): Promise<ApiResponse> {
    console.log('🔐 Uploading avatar...');
    const response = await this.client.post('/profile/avatar', {
      image: base64Image // Backend expects { image: "data:image/jpeg;base64,..." }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      withCredentials: true, // Explicitly ensure credentials are sent
    });
    console.log('✅ Avatar upload successful');
    return response.data;
  }

  async uploadProviderAvatar(base64Image: string): Promise<ApiResponse> {
    console.log('🔐 Uploading provider avatar...');
    // Try provider-specific endpoint first
    try {
      const response = await this.client.post('/provider/profile/avatar', {
        image: base64Image
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        withCredentials: true,
      });
      console.log('✅ Provider avatar upload successful');
      return response.data;
    } catch (error: any) {
      console.warn('⚠️ /provider/profile/avatar failed, trying fallback to /profile/avatar', error.message);
      // Fallback to generic endpoint if specific one fails (for backward compatibility)
      return this.uploadAvatar(base64Image);
    }
  }

  // Debug endpoint for testing
  async getAllBookingsDebug(): Promise<ApiResponse<Booking[]>> {
    const response = await this.client.get('/debug/bookings');
    return response.data;
  }

  // ====================================================================
  // ADDRESS MANAGEMENT ENDPOINTS
  // ====================================================================

  /**
   * GET /api/homeowner/addresses
   * Get all saved addresses for the current user
   */
  async getSavedAddresses(): Promise<ApiResponse<Address[]>> {
    try {
      const response = await this.client.get('/homeowner/addresses');
      return {
        success: true,
        message: 'Addresses loaded',
        data: response.data.data || response.data.addresses || [],
      };
    } catch (error: any) {
      console.error('Error fetching addresses:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to load addresses',
        data: [],
      };
    }
  }

  /**
   * POST /api/homeowner/addresses
   * Add a new address
   */
  async addAddress(address: Omit<Address, '_id' | 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Address>> {
    try {
      const response = await this.client.post('/homeowner/addresses', address);
      return {
        success: true,
        message: 'Address added successfully',
        data: response.data.data || response.data.address,
      };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * PUT /api/homeowner/addresses/[id]
   * Update an existing address
   */
  async updateAddress(addressId: string, address: Partial<Address>): Promise<ApiResponse<Address>> {
    try {
      const response = await this.client.put(`/homeowner/addresses/${addressId}`, address);
      return {
        success: true,
        message: 'Address updated successfully',
        data: response.data.data || response.data.address,
      };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * DELETE /api/homeowner/addresses/[id]
   * Delete an address
   */
  async deleteAddress(addressId: string): Promise<ApiResponse> {
    try {
      await this.client.delete(`/homeowner/addresses/${addressId}`);
      return {
        success: true,
        message: 'Address deleted successfully',
      };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * PUT /api/homeowner/addresses/[id]/primary
   * Set an address as primary
   */
  async setPrimaryAddress(addressId: string): Promise<ApiResponse> {
    try {
      await this.client.put(`/homeowner/addresses/${addressId}/primary`);
      return {
        success: true,
        message: 'Primary address updated',
      };
    } catch (error: any) {
      throw error;
    }
  }

  // ====================================================================
  // WALLET ENDPOINTS
  // ====================================================================

  /**
   * GET /api/wallet
   * Get wallet balance and transaction history
   */
  async getWalletBalance(page: number = 1, limit: number = 20): Promise<ApiResponse<{
    balance: number;
    currency: string;
    transactions: any[];
    meta?: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasMore: boolean;
    };
  }>> {
    const response = await this.client.get('/wallet', {
      params: { page, limit }
    });
    return response.data;
  }

  /**
   * POST /api/wallet/topup
   * Create Razorpay order for wallet topup
   */
  async createWalletTopupOrder(amount: number): Promise<ApiResponse> {
    const response = await this.client.post('/wallet/topup', { amount });
    return response.data;
  }

  /**
   * POST /api/wallet/topup/verify
   * Verify wallet topup payment
   */
  async verifyWalletTopup(data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<ApiResponse> {
    const response = await this.client.post('/wallet/topup/verify', data);
    return response.data;
  }

  /**
   * POST /api/bookings/pay-with-wallet
   * Create booking and pay with wallet balance
   */
  async createBookingWithWallet(bookingData: any): Promise<ApiResponse<Booking>> {
    const response = await this.client.post('/bookings/pay-with-wallet', bookingData);
    return response.data;
  }

  /**
   * GET /api/wallet/refund
   * Check for failed transactions that can be refunded
   */
  async getFailedTransactions(): Promise<ApiResponse<{ refundableTransactions: any[]; totalRefundable: number }>> {
    const response = await this.client.get('/wallet/refund');
    return response.data;
  }

  /**
   * POST /api/wallet/refund
   * Request automatic refund for failed transactions
   */
  async requestAutoRefund(): Promise<ApiResponse<{ refundAmount: number; transactionCount: number; newBalance: number }>> {
    const response = await this.client.post('/wallet/refund');
    return response.data;
  }

  /**
   * POST /api/bookings/pay-initial
   * Pay the initial 25% payment after partner accepts (for wallet payments)
   */
  async payInitialAmount(bookingId: string): Promise<ApiResponse<{
    amount: number;
    newBalance: number;
    bookingId: string;
    serviceName: string;
  }>> {
    const response = await this.client.post('/bookings/pay-initial', {
      bookingId,
      paymentMethod: 'wallet'
    });
    return response.data;
  }

  /**
   * POST /api/bookings/complete-payment
   * Pay the remaining 75% after job completion (for wallet payments)
   */
  async payCompletionAmount(bookingId: string): Promise<ApiResponse<{
    amount: number;
    newBalance: number;
    bookingId: string;
    serviceName: string;
    totalPaid: number;
  }>> {
    const response = await this.client.post('/bookings/complete-payment', { bookingId });
    return response.data;
  }

  /**
   * GET /api/wallet/withdraw
   * Get withdrawal info for providers (limits, commission rate, etc)
   */
  async getWithdrawalInfo(): Promise<ApiResponse<{
    balance: number;
    hasBankDetails: boolean;
    bankAccount: string | null;
    bankName: string | null;
    withdrawalConfig: {
      commissionRate: number;
      minAmount: number;
      maxAmount: number;
      autoApproveLimit: number;
      processingDays: number;
    };
  }>> {
    const response = await this.client.get('/wallet/withdraw');
    return response.data;
  }

  /**
   * POST /api/wallet/withdraw
   * Request withdrawal for partner (with commission deduction)
   */
  async requestWithdrawal(amount: number): Promise<ApiResponse<{
    requestedAmount: number;
    commissionRate: number;
    commissionAmount: number;
    netAmount: number;
    newBalance: number;
    status: 'completed' | 'pending';
    autoApproved: boolean;
    processingDays: number;
    bankAccount: string;
  }>> {
    const response = await this.client.post('/wallet/withdraw', { amount });
    return response.data;
  }

  // ====================================================================
  // PUSH NOTIFICATION ENDPOINTS
  // ====================================================================

  /**
   * POST /api/user/push-token
   * Save push notification token for the current user
   */
  async savePushToken(pushToken: string, userType: 'homeowner' | 'provider' = 'homeowner'): Promise<ApiResponse> {
    const response = await this.client.post('/user/push-token', {
      pushToken,
      userType  // Backend requires this field
    });
    return response.data;
  }


  /**
   * POST /api/user/report
   * Report a user (provider) for inappropriate content/behavior
   */
  async reportUser(data: {
    reportedId: string;
    reason: string;
    description?: string;
    bookingId?: string;
  }): Promise<ApiResponse> {
    const response = await this.client.post('/user/report', data);
    return response.data;
  }

  /**
   * POST /api/user/block
   * Block a user (provider)
   */
  async blockUser(blockedId: string): Promise<ApiResponse> {
    const response = await this.client.post('/user/block', { blockedId });
    return response.data;
  }

  // ====================================================================
  // PROVIDER SERVICE MANAGEMENT ENDPOINTS
  // ====================================================================

  /**
   * POST /api/provider/add-service
   * Add new service(s) to provider profile (requires admin approval)
   */
  async addProviderService(data: {
    providerId: string;
    services: string[];
    serviceRates: Array<{ serviceName: string; price: number }>;
    driverServiceDetails?: any;
  }): Promise<ApiResponse<{
    provider: any;
    addedServices: string[];
    previousStatus: string;
  }>> {
    const response = await this.client.post('/provider/add-service', data);
    return response.data;
  }

  // ====================================================================
  // AADHAAR VERIFICATION ENDPOINTS
  // ====================================================================

  /**
   * POST /api/aadhaar/initiate
   * Initiate Aadhaar verification via Meon DigiLocker
   */
  async initiateAadhaarVerification(data: {
    userId: string;
    userType: 'homeowner' | 'provider';
    aadhaarNumber: string;
    redirectUrl?: string;
  }): Promise<ApiResponse<{ verificationUrl: string; requestId: string; expiresAt: string }>> {
    const response = await this.client.post('/aadhaar/initiate', data);
    return response.data;
  }

  /**
   * GET /api/aadhaar/status
   * Check Aadhaar verification status
   */
  async getAadhaarStatus(): Promise<ApiResponse<{
    userType: string;
    aadhaarVerified: boolean;
    aadhaarPhone: string | null;
    aadhaarVerifiedAt: string | null;
    adminApproved?: boolean;
    adminApprovedAt?: string | null;
  }>> {
    const response = await this.client.get('/aadhaar/status');
    return response.data;
  }


  // ====================================================================
  // JOB SESSION OTP ENDPOINTS
  // ====================================================================

  /**
   * POST /api/job/start-otp
   * Generate start OTP for customer when provider clicks "Start Job"
   */
  async generateStartOTP(bookingId: string, providerId: string): Promise<ApiResponse<{
    jobSessionId: string;
    otp: string;
    expiresIn: number;
    customerName: string;
    customerPhone: string;
  }>> {
    const response = await this.client.post('/job/start-otp', {
      bookingId,
      providerId
    });
    return response.data;
  }

  /**
   * POST /api/job/verify-start
   * Verify start OTP entered by provider and start timer
   */
  async verifyStartOTP(jobSessionId: string, otp: string, providerId: string): Promise<ApiResponse<{
    startTime: string;
    expectedDuration: number;
    status: string;
  }>> {
    const response = await this.client.post('/job/verify-start', {
      jobSessionId,
      otp,
      providerId
    });
    return response.data;
  }

  /**
   * POST /api/job/end-otp
   * Generate end OTP for customer when provider clicks "End Job"
   */
  async generateEndOTP(jobSessionId: string, providerId: string): Promise<ApiResponse<{
    otp: string;
    expiresIn: number;
    currentDuration: number;
    expectedDuration: number;
  }>> {
    const response = await this.client.post('/job/end-otp', {
      jobSessionId,
      providerId
    });
    return response.data;
  }

  /**
   * POST /api/job/verify-end
   * Verify end OTP, calculate duration and overtime, process payment
   */
  async verifyEndOTP(jobSessionId: string, otp: string, providerId: string): Promise<ApiResponse<{
    endTime: string;
    duration: number;
    expectedDuration: number;
    overtimeDuration: number;
    overtimeCharge: number;
    totalCharge: number;
    status: string;
  }>> {
    const response = await this.client.post('/job/verify-end', {
      jobSessionId,
      otp,
      providerId
    });
    return response.data;
  }

  /**
   * POST /api/auth/request-call-otp
   * Request OTP via phone call
   */
  async requestCallOTP(identifier: string): Promise<ApiResponse> {
    const response = await this.client.post('/auth/request-call-otp', {
      identifier
    });
    return response.data;
  }

  /**
   * GET /api/bookings/[id]
   * Get job session details for a booking
   */
  async getJobSession(bookingId: string): Promise<ApiResponse<{
    jobSession: any;
    booking: Booking;
  }>> {
    const response = await this.client.get(`/bookings/${bookingId}`); // Fixed regex error
    return response.data;
  }

  // ====================================================================
  // REVIEW ENDPOINTS
  // ====================================================================

  /**
   * POST /api/reviews
   * Create a review for a completed booking
   */
  async createReview(data: {
    bookingId: string;
    rating: number;
    comment?: string;
    photos?: string[];
  }): Promise<ApiResponse<{ reviewId: string; rating: number; providerRating: number; providerTotalReviews: number }>> {
    const response = await this.client.post('/reviews', data);
    return response.data;
  }

  /**
   * GET /api/reviews/provider/:id
   * Get all reviews for a specific provider
   */
  async getProviderReviews(providerId: string): Promise<ApiResponse<{
    reviews: any[];
    stats: {
      totalReviews: number;
      averageRating: number;
      ratingDistribution: { [key: number]: number };
    };
  }>> {
    const response = await this.client.get(`/reviews/provider/${providerId}`);
    return response.data;
  }

  /**
   * GET /api/reviews/pending
   * Get bookings that can be rated by the authenticated user
   */
  async getPendingRatings(): Promise<ApiResponse<any[]>> {
    const response = await this.client.get('/reviews/pending');
    return response.data;
  }

  /**
   * GET /api/favorites
   * Get user's favorite providers
   */
  async getFavorites(): Promise<ApiResponse<ServiceProvider[]>> {
    const response = await this.client.get('/favorites');
    return response.data;
  }

  /**
   * POST /api/favorites
   * Add provider to favorites
   */
  async addToFavorites(providerId: string): Promise<ApiResponse<ServiceProvider[]>> {
    const response = await this.client.post('/favorites', { providerId });
    return response.data;
  }

  /**
   * DELETE /api/favorites/[providerId]
   * Remove provider from favorites
   */
  async removeFromFavorites(providerId: string): Promise<ApiResponse<ServiceProvider[]>> {
    const response = await this.client.delete(`/favorites/${providerId}`);
    return response.data;
  }

  /**
   * PATCH /api/provider/profile
   * Update provider availability (Online=active, Offline=inactive)
   * Backend now properly accepts and persists the status field
   */
  async updateProviderAvailability(isAvailable: boolean, providerId?: string): Promise<ApiResponse> {
    const status = isAvailable ? 'active' : 'inactive';

    try {
      // 1. Fetch current profile to check for lost services (from previous workaround)
      if (isAvailable) {
        try {
          const profile = await this.getProviderOwnProfile();
          const currentBio = profile.data?.bio || '';

          // Check if we have backup data in bio
          const match = currentBio.match(/<!--OFFLINE_DATA:(.*?)-->/);
          if (match && match[1] && (!profile.data?.services || profile.data?.services.length === 0)) {
            console.log('🛠️ Found backup services in bio, restoring...');
            try {
              const data = JSON.parse(match[1]);
              const restoredServices = data.s || [];
              const restoredRates = data.r || [];

              if (restoredServices.length > 0) {
                // Clean the bio (remove tag)
                const cleanBio = currentBio.replace(/<!--OFFLINE_DATA:.*?-->/g, '').replace(/ \[OFFLINE\]/g, '').trim();

                // Restore services + Update status
                const response = await this.client.patch('/provider/profile', {
                  status,
                  services: restoredServices,
                  serviceRates: restoredRates,
                  bio: cleanBio
                });
                console.log('✅ Restored services and updated status');
                return response.data;
              }
            } catch (e) {
              console.error('Failed to parse backup', e);
            }
          }
        } catch (err) {
          console.error('Error in auto-restore check', err);
        }
      }

      const response = await this.client.patch('/provider/profile', { status });
      console.log(`✅ Provider status updated to: ${status}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to update provider status:', error);
      throw error;
    }
  }

  // ====================================================================
  // LOCATION SERVICES (Google Places API Proxy)
  // ====================================================================

  /**
   * GET /api/location/autocomplete
   * Search for places using Google Places Autocomplete
   */
  async searchPlaces(input: string, location?: { latitude: number; longitude: number }): Promise<ApiResponse<any[]>> {
    try {
      const params: any = { input };
      if (location) {
        params.latitude = location.latitude;
        params.longitude = location.longitude;
      }

      const response = await this.client.get('/location/autocomplete', { params });
      return {
        success: true,
        message: 'Places found',
        data: response.data.predictions || response.data.data || [],
      };
    } catch (error: any) {
      console.error('Place search error:', error);
      return {
        success: false,
        message: 'Search failed',
        data: [],
      };
    }
  }

  /**
   * GET /api/location/details
   * Get place details including coordinates
   */
  async getPlaceDetails(placeId: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.get('/location/details', { params: { placeId } });
      return {
        success: true,
        message: 'Place details retrieved',
        data: response.data.result || response.data.data,
      };
    } catch (error: any) {
      console.error('Place details error:', error);
      throw error;
    }
  }

  /**
   * GET /api/location/reverse-geocode
   * Convert coordinates to address
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<ApiResponse<string>> {
    try {
      const response = await this.client.get('/location/reverse-geocode', {
        params: { latitude, longitude }
      });
      return {
        success: true,
        message: 'Address found',
        data: response.data.address || response.data.data,
      };
    } catch (error: any) {
      console.error('Reverse geocode error:', error);
      return {
        success: false,
        message: 'Address not found',
        data: 'Unknown location',
      };
    }
  }

  /**
   * GET /api/location/directions
   * Get route coordinates from origin to destination
   */
  async getDirections(origin: string, destination: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.get('/location/directions', {
        params: { origin, destination }
      });
      return {
        success: true,
        message: 'Directions found',
        data: response.data.routes || response.data.data,
      };
    } catch (error: any) {
      console.error('Directions error:', error);
      return {
        success: false,
        message: 'Failed to fetch directions',
        data: [],
      };
    }
  }
  /**
   * POST /api/admin/notifications/send
   * Send admin push notification
   */
  async sendAdminNotification(payload: {
    title: string;
    message: string;
    target: 'all' | 'user' | 'provider';
    recipientId?: string;
    priority?: string;
    data?: any;
  }): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.post('/admin/notifications/send', payload);
      return {
        success: true,
        message: 'Notification sent',
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: getErrorMessage(error),
      };
    }
  }
}

export const apiService = new ApiService();

