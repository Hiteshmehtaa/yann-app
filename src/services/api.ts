import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_BASE_URL } from '../utils/constants';
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

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // Increased for Vercel cold starts
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      withCredentials: true, // Enable cookies for session-based auth (same as website)
    });


    // Request interceptor - add JWT token for mobile auth
    this.client.interceptors.request.use(
      async (config) => {
        // For mobile app, we need to send the JWT token in Authorization header
        // since React Native doesn't support httpOnly cookies
        try {
          const token = await storage.getToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
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
        }

        // Enhance error with user-friendly message
        error.message = getErrorMessage(error);
        throw error;
      }
    );
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
    try {
      await this.client.post('/auth/logout');
    } catch (error: any) {
      console.log('Logout error (non-critical):', error?.message || '');
      // Silently handle - local cleanup will happen anyway
    }
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
  async getProvidersByService(serviceName: string): Promise<ApiResponse<ServiceProviderListItem[]>> {
    try {
      const response = await this.client.get('/provider/by-service', {
        params: { service: serviceName },
      });

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
    bookingDate: string;
    bookingTime: string;
    providerId: string; // REQUIRED - get from selected provider
    paymentMethod?: string;
    billingType?: string;
    quantity?: number;
    notes?: string;
    extras?: any[];
    driverDetails?: any;
    basePrice?: number;
    totalPrice?: number;
  }): Promise<ApiResponse<Booking>> {
    if (!bookingData.providerId) {
      throw new Error('providerId is required - select a provider first');
    }

    // Sanitize booking data - remove undefined/null non-required fields
    const cleanedData = {
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
      driverDetails: bookingData.driverDetails || null,
      basePrice: bookingData.basePrice || 0,
      totalPrice: bookingData.totalPrice || 0,
    };

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

  // ====================================================================
  // HOMEOWNER/RESIDENT ENDPOINTS (matching website routes)
  // ====================================================================

  /**
   * GET /api/homeowner/me
   * Get current authenticated homeowner profile
   * Website uses this for user dashboard
   */
  async getProfile(): Promise<{ user: User }> {
    const response = await this.client.get('/homeowner/me');

    // Website response: { success, homeowner: {...} }
    const userData = response.data.homeowner || response.data.user || response.data.data;

    return { user: userData };
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
  async verifyIdentity(userId: string, userType: 'homeowner' | 'provider'): Promise<{ success: boolean; url: string; message?: string }> {
    const response = await this.client.post('/verification/initiate', {
      userId,
      userType
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

      const response = await this.client.get('/provider/requests', { params });

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
    const response = await this.client.get('/provider/earnings', { params });
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
      console.log('Notification fetch failed:', error?.message || '');
      return {
        success: false,
        message: 'Failed to load notifications',
        data: [],
      };
    }
  }

  // ====================================================================
  // UPLOAD ENDPOINTS
  // ====================================================================

  async uploadAvatar(base64Image: string): Promise<ApiResponse> {
    console.log('🔐 Uploading avatar with credentials...');
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
  async getWalletBalance(): Promise<ApiResponse<{ balance: number; currency: string; transactions: any[] }>> {
    const response = await this.client.get('/wallet');
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
   * GET /api/bookings/[id]
   * Get job session details for a booking
   */
  async getJobSession(bookingId: string): Promise<ApiResponse<{
    jobSession: any;
    booking: Booking;
  }>> {
    const response = await this.client.get(/bookings/);
    return response.data;
  }
}

export const apiService = new ApiService();

