export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'agent' | 'viewer';
  is_active: boolean;
  can_create_bookings: boolean;
  can_edit_bookings: boolean;
  can_delete_bookings: boolean;
  can_manage_users: boolean;
  can_manage_templates: boolean;
  can_view_analytics: boolean;
  can_manage_resources: boolean;
  account_id: string;
  created_at: string;
  updated_at?: string;
}

export interface Customer {
  id: number;
  full_name: string;
  email?: string;
  phone?: string;
  country?: string;
  passport_number?: string;
  id_number?: string;
  address?: string;
  notes?: string;
  account_id: string;
  created_at: string;
  updated_at?: string;
}

export interface Car {
  id: number;
  registration_number: string;
  make: string;
  model: string;
  year?: number;
  color?: string;
  is_available: boolean;
  seating_capacity?: number;
  daily_rate?: number;
  notes?: string;
  account_id: string;
  created_at: string;
  updated_at?: string;
}

export interface Driver {
  id: number;
  full_name: string;
  phone: string;
  email?: string;
  license_number: string;
  is_available: boolean;
  languages?: string;
  daily_rate?: number;
  notes?: string;
  account_id: string;
  created_at: string;
  updated_at?: string;
}

export interface TourRep {
  id: number;
  full_name: string;
  phone: string;
  email?: string;
  is_active: boolean;
  region?: string;
  notes?: string;
  account_id: string;
  created_at: string;
  updated_at?: string;
}

export type FieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'datetime'
  | 'dropdown'
  | 'textarea'
  | 'checkbox'
  | 'file'
  | 'car_select'
  | 'driver_select'
  | 'customer_select'
  | 'tour_rep_select';

export interface TemplateField {
  id: number;
  template_id: number;
  field_name: string;
  field_label: string;
  field_type: FieldType;
  is_required: boolean;
  order: number;
  options?: string[];
  placeholder?: string;
  help_text?: string;
  created_at: string;
  updated_at?: string;
}

export interface Template {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  icon?: string;
  color?: string;
  fields: TemplateField[];
  account_id: string;
  created_at: string;
  updated_at?: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled';

export interface BookingFieldValue {
  id: number;
  field_name: string;
  field_value: string;
  created_at: string;
}

export interface BookingPhoto {
  id: number;
  file_path: string;
  file_name: string;
  photo_type?: string;
  description?: string;
  uploaded_at: string;
  uploaded_by: number;
}

export interface Booking {
  id: number;
  booking_number: string;
  template_id: number;
  template: Template;
  customer_id: number;
  customer: Customer;
  tour_rep_id: number;
  tour_rep: TourRep;
  car_id?: number;
  car?: Car;
  driver_id?: number;
  driver?: Driver;
  start_date: string;
  end_date: string;
  status: BookingStatus;
  total_amount?: number;
  paid_amount: number;
  currency: string;
  notes?: string;
  account_id: string;
  created_by: number;
  field_values: BookingFieldValue[];
  photos: BookingPhoto[];
  created_at: string;
  updated_at?: string;
}

export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'pos' | 'other';
export type PaymentStatus = 'pending' | 'completed' | 'refunded' | 'failed';

export interface Payment {
  id: number;
  booking_id: number;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  payment_date: string;
  receipt_number?: string;
  receipt_file_path?: string;
  transaction_reference?: string;
  notes?: string;
  account_id: string;
  recorded_by: number;
  created_at: string;
  updated_at?: string;
}

export interface DashboardStats {
  period: {
    start_date: string;
    end_date: string;
  };
  bookings: {
    total: number;
    by_status: Record<BookingStatus, number>;
  };
  revenue: {
    total: number;
    paid: number;
    outstanding: number;
  };
  top_performers: {
    tour_reps: Array<{
      id: number;
      name: string;
      booking_count: number;
      total_revenue: number;
    }>;
    cars: Array<{
      id: number;
      registration_number: string;
      name: string;
      booking_count: number;
    }>;
    drivers: Array<{
      id: number;
      name: string;
      booking_count: number;
    }>;
  };
  resources: {
    cars: {
      total: number;
      available: number;
    };
    drivers: {
      total: number;
      available: number;
    };
  };
  recent_bookings: Array<{
    id: number;
    booking_number: string;
    customer_name: string;
    tour_rep_name: string;
    status: BookingStatus;
    start_date: string;
    total_amount: number;
  }>;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}
