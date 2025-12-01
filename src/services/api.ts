import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_BASE_URL } from '../utils/constants';
import { storage } from '../utils/storage';
import type { AuthResponse, ApiResponse, Booking, ServiceProvider, User } from '../types';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Important for cookie-based auth to work with web
    });

    // Request interceptor to add JWT token and handle cookies
    this.client.interceptors.request.use(
      async (config) => {
        const token = await storage.getToken();
        if (token && token !== 'cookie-based-auth') {
          config.headers.Authorization = `Bearer ${token}`;
        }
        // Log requests for debugging
        console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.url}`);
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
      async (error: AxiosError) => {
        console.error(`❌ API Error: ${error.config?.url} - ${error.message}`);
        if (error.response?.status === 401) {
          // Token expired or invalid
          await storage.clearAll();
          // You can emit an event here to logout user
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication
  async sendOTP(email: string): Promise<ApiResponse> {
    const response = await this.client.post('/auth/send-otp', { 
      email,
      audience: 'homeowner',
      intent: 'login'
    });
    return response.data;
  }

  async sendSignupOTP(email: string, metadata: { name: string; phone?: string }): Promise<ApiResponse> {
    const response = await this.client.post('/auth/send-otp', { 
      email,
      audience: 'homeowner',
      intent: 'signup',
      metadata
    });
    return response.data;
  }

  async registerProvider(data: any): Promise<ApiResponse> {
    console.log('🔵 Provider Registration Payload:', JSON.stringify(data, null, 2));
    const response = await this.client.post('/register', data);
    console.log('🟢 Provider Registration Response:', JSON.stringify(response.data, null, 2));
    console.log('✅ Provider should now be visible in admin panel with status:', data.status || 'pending');
    return response.data;
  }

  async verifyOTP(email: string, otp: string, intent: 'login' | 'signup' = 'login'): Promise<AuthResponse> {
    const response = await this.client.post('/auth/verify-otp', { 
      email, 
      otp,
      audience: 'homeowner',
      intent
    });
    return response.data;
  }

  async logout(): Promise<void> {
    await this.client.post('/auth/logout');
  }

  // User Profile
  async getProfile(): Promise<{ user: User }> {
    const response = await this.client.get('/homeowner/me');
    return response.data;
  }

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    const response = await this.client.put('/homeowner/profile', data);
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
    const response = await this.client.post('/bookings/create', bookingData);
    return response.data;
  }

  async getMyBookings(): Promise<ApiResponse<Booking[]>> {
    const response = await this.client.get('/resident/requests');
    return response.data;
  }

  async getBookingById(id: string): Promise<ApiResponse<Booking>> {
    const response = await this.client.get(`/resident/requests/${id}`);
    return response.data;
  }

  async negotiateBooking(bookingId: string, proposedAmount: number, note?: string): Promise<ApiResponse> {
    const response = await this.client.post('/bookings/negotiate', {
      bookingId,
      proposedAmount,
      note,
    });
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
}

export const apiService = new ApiService();
