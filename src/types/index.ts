// Type definitions for Yann Care Mobile App

export interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role?: 'homeowner' | 'provider';
  isVerified?: boolean;
  aadhaarVerified?: boolean;
  preferences?: string[];
  savedProviders?: string[];
  addressBook?: Address[];
  lastLoginAt?: Date;
  profileImage?: string; // For providers and uniform access
  // Provider-specific fields
  services?: string[];
  serviceRates?: Record<string, number> | ServiceRate[];
  status?: 'active' | 'inactive' | 'pending';
  rating?: number;
  totalReviews?: number;
  experience?: number;
  bio?: string;
  hasLateStarts?: boolean; // Indicates if provider has a history of late starts
}

export interface Address {
  _id?: string;
  id?: string;
  label: 'Home' | 'Work' | 'Other';
  name: string; // Contact name
  phone: string; // Contact phone
  apartment?: string; // Apartment/Flat/Unit number
  building?: string; // Building/Society name
  street: string;
  city: string;
  state: string;
  postalCode: string;
  fullAddress: string; // Complete formatted address
  latitude?: number;
  longitude?: number;
  isPrimary?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ServiceProvider {
  _id: string;
  name: string;
  email: string;
  phone: string;
  profileImage?: string;
  experience: number;
  services: string[];
  serviceRates: ServiceRate[];
  selectedCategories?: string[];
  workingHours?: {
    startTime: string;
    endTime: string;
  };
  status: 'active' | 'inactive' | 'pending';
  rating: number;
  totalReviews: number;
  bio?: string;
  hasLateStarts?: boolean; // Indicates if provider has a history of late starts
  // UI helper fields
  type?: string;
  specialty?: string;
  avgTime?: string;
  about?: string;
  avatar?: string;
  priceForService?: number; // Helper for service detail screen
  reviews?: any[]; // Helper field for reviews
}

export interface ServiceRate {
  serviceName: string;
  price: number;
}

export interface Booking {
  _id: string;
  serviceId: number;
  serviceName: string;
  serviceCategory: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  // Location coordinates for map navigation
  latitude?: number;
  longitude?: number;
  bookingDate: Date;
  bookingTime: string;
  basePrice: number;
  extras?: Extra[];
  totalPrice: number;
  paymentMethod: 'cash' | 'upi' | 'card' | 'online' | 'wallet';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'partial';
  billingType: 'one-time' | 'monthly' | 'hourly' | 'daily';
  quantity: number;
  notes?: string;
  driverDetails?: DriverDetails;
  assignedProvider?: string;
  providerName?: string;
  residentRequest?: string;
  status: 'pending' | 'awaiting_response' | 'pending_payment' | 'accepted' | 'in_progress' | 'rejected' | 'awaiting_completion_payment' | 'completed' | 'cancelled' | 'expired';
  negotiation?: Negotiation;
  createdAt: Date;
  updatedAt: Date;
  hasBeenRated?: boolean;
  completedAt?: Date;
  walletPaymentStage?: 'none' | 'initial_25_held' | 'initial_25_released' | 'completion_75_pending' | 'awaiting_completion_payment' | 'completed';
  escrowDetails?: {
    initialAmount?: number;
    completionAmount?: number;
    initialPaidAt?: Date;
    completionPaidAt?: Date;
    isInitialPaid?: boolean;
    isCompletionPaid?: boolean;
  };
}

export interface Extra {
  serviceId: number;
  serviceName: string;
  price: number;
}

export interface DriverDetails {
  startTime: string;
  endTime: string;
  totalHours: number;
  baseHours: number;
  hourlyRate: number;
  overtimeHours: number;
  overtimeRate: number;
  overtimeMultiplier: number;
  baseCost: number;
  overtimeCost: number;
}

export interface Negotiation {
  isActive: boolean;
  proposedAmount?: number;
  providerId?: string;
  providerName?: string;
  note?: string;
  status: 'idle' | 'pending' | 'accepted' | 'declined' | 'cancelled';
  respondedAt?: Date;
  createdAt?: Date;
}

export interface Service {
  id: number;
  title: string;
  description: string;
  category: string;
  price: string;
  icon: string | any;
  popular?: boolean;
  isNew?: boolean;
  isComingSoon?: boolean; // Whether service is coming soon (not yet available)
  partnerCount?: number; // Number of active partners for this service
  features: string[];
  profileRequirements?: string[]; // Optional requirements for providers
  hasOvertimeCharges?: boolean; // Whether service requires start & end time input (default: false)
  gstRate?: number; // GST rate (0 to 1, e.g., 0.18 for 18%) (default: 0.18)
  platformCommission?: number; // Platform commission rate (e.g., 0.10 for 10%) (default: 0.10)
  pricingModel?: 'hourly' | 'fixed'; // Pricing model: hourly for time-based services, fixed for one-time services
  gstPercentage?: number; // GST percentage (0 to 100, e.g., 18 for 18%)
  experiencePriceLimits?: {
    minYears: number;
    maxYears?: number;
    maxPrice: number;
  }[];
  maxPrice?: number;
}

export interface Homeowner {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  preferences?: string[];
  savedProviders?: string[];
  addressBook?: Address[];
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
  homeowner?: Homeowner;
  audience?: 'homeowner' | 'provider';
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    service?: string;
    serviceName?: string;
  };
  service?: Service;
  earnings?: any; // For provider earnings screen
  // Payment specific fields
  orderId?: string;
  keyId?: string;
  amount?: number;
  currency?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

// Provider list item (from /api/providers and /api/provider/by-service)
export interface ServiceProviderListItem {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  experience: number;
  rating: number;
  totalReviews: number;
  price?: number; // Price for specific service (from by-service endpoint)
  services?: string[];
  serviceRates?: ServiceRate[];
  workingHours?: {
    startTime: string;
    endTime: string;
  } | null;
  profileImage: string;
  status?: string;
}

// Service count data (from /api/provider/service-counts)
export interface ServiceCount {
  service: string;
  providerCount: number;
  avgRating?: number;
}

// Provider dashboard data (from /api/provider/requests)
export interface ProviderDashboardData {
  success: boolean;
  provider: {
    id: string;
    name: string;
    email: string;
    phone: string;
    services: string[];
    rating: number;
    totalReviews: number;
  };
  stats: {
    pendingRequests: number;
    acceptedBookings: number;
    completedBookings: number;
    totalEarnings: number;
    monthlyEarnings: number;
  };
  pendingRequests: PendingRequest[];
  acceptedBookings: AcceptedBooking[];
}

export interface PendingRequest {
  id: string;
  serviceName: string;
  serviceCategory: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  bookingDate: string;
  bookingTime: string;
  formattedDate?: string;
  basePrice: number;
  extras?: Extra[];
  totalPrice: number;
  paymentMethod: string;
  notes?: string;
  createdAt: string;
  isPujari?: boolean;
  driverDetails?: DriverDetails | null;
  negotiation?: Negotiation | null;
}

export interface AcceptedBooking {
  id: string;
  serviceName: string;
  customerName: string;
  customerPhone: string;
  bookingDate: string;
  bookingTime: string;
  formattedDate?: string;
  totalPrice: number;
  status: string;
  driverDetails?: DriverDetails | null;
  negotiation?: Negotiation | null;
}

// Homeowner profile (from /api/homeowner/me)
export interface HomeownerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  preferences: string[];
  savedProviders: string[];
  addressBook: Address[];
  createdAt?: string;
  lastLoginAt?: string;
}

// Service request (from /api/resident/requests)
export interface ServiceRequest {
  id: string;
  title: string;
  serviceType: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  scheduledFor: string | null;
  priority: 'routine' | 'urgent';
  locationLabel: string;
  createdAt: string;
  updatedAt: string;
  bookingId: string | null;
  negotiation?: {
    isActive: boolean;
    proposedAmount?: number;
    providerId?: string;
    providerName?: string;
    note?: string;
    status: string;
    updatedAt?: string;
  };
}
