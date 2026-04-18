// NAFA Marketplace — TypeScript Types

export type UserRole = 'client' | 'vendor' | 'admin';

export type Currency = 'FCFA' | 'EUR' | 'USD' | 'CEDIS';

export type Language = 'fr' | 'en';

export interface User {
  uid: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  region: string;
  language: Language;
  currency: Currency;
  avatarUrl?: string;
  createdAt: string;
  followers: number;
  following: string[];
}

export interface Vendor extends User {
  shopName: string;
  shopDescription: string;
  coverPhotoUrl?: string;
  isVerified: boolean;
  isSuspended: boolean;
  rating: number;
  totalSales: number;
  totalRevenue: number;
}

export interface Product {
  id: string;
  vendorId: string;
  vendorName?: string;
  title: string;
  description: string;
  price: number;
  currency: Currency;
  images: string[];
  category: string;
  stock: number;
  estimatedDeliveryToWarehouse?: string;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'preparing'
  | 'in_transit_warehouse'
  | 'at_warehouse'
  | 'delivering'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod = 'orange_money' | 'moov_money' | 'card';

export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
}

export interface DeliveryAddress {
  street: string;
  city: string;
  region: string;
  country: string;
}

export interface StatusHistoryEntry {
  status: OrderStatus;
  timestamp: string;
  updatedBy: string;
}

export interface Order {
  id: string;
  clientId: string;
  clientName?: string;
  clientPhone?: string;
  vendorId: string;
  vendorName?: string;
  vendorPhone?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  currency: Currency;
  deliveryAddress: DeliveryAddress;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  statusHistory: StatusHistoryEntry[];
  createdAt: string;
}

export interface Review {
  id: string;
  fromUserId: string;
  fromUserName?: string;
  toUserId: string;
  orderId: string;
  rating: number;
  comment: string;
  type: 'client_to_vendor' | 'vendor_to_client';
  createdAt: string;
}

export type NotificationType =
  | 'order_update' | 'order_status' | 'order_delivered' | 'order_cancelled'
  | 'new_order' | 'low_stock' | 'account_verified' | 'account_suspended'
  | 'promo' | 'review' | 'system';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  linkedOrderId?: string;
  createdAt: string;
}

export interface Withdrawal {
  amount: number;
  method: PaymentMethod;
  status: 'pending' | 'completed' | 'failed';
  date: string;
}

export interface Wallet {
  vendorId: string;
  balance: number;
  withdrawals: Withdrawal[];
}

export type AlertType =
  | 'vendor_inactive'
  | 'delivery_late'
  | 'payment_failed'
  | 'high_cancellation';

export type AlertSeverity = 'warning' | 'critical';

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  relatedOrderId?: string;
  relatedVendorId?: string;
  description: string;
  isResolved: boolean;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
  vendorId: string;
  vendorName?: string;
  stock: number;
}

export interface CheckoutStep {
  id: number;
  label: string;
  completed: boolean;
}
