// User Types
export type UserRole = 'business' | 'driver';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
}

// Business Types
export interface Business {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  logo?: string;
  isActive: boolean;
  createdAt: Date;
}

// Driver Types
export type DriverStatus = 'ACTIVE' | 'INACTIVE' | 'ON_DELIVERY';

export interface Driver {
  id: string;
  userId: string;
  businessId: string;
 user:{
   name: string;
  email: string;
  phone: string;
 }
  licenseNumber: string;
  vehicleType:string;
  vehicleNumber:string;
  status: DriverStatus;
  totalDeliveries: number;
  totalEarnings: number;
  rating: number;
  createdAt: Date;
}

// Shipment Types
export type ShipmentStatus = 'PENDING' | 'PICKED_UP' | 'ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED';

export interface Product {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  weight: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface Shipment {
  id: string;
  businessId: string;
  driverId?: string;
  orderNumber: string;
  status: ShipmentStatus;
  customer: Customer;
  products: Product[];
  totalAmount: number;
  deliveryFee: number;
  notes?: string;
  source: 'manual' | 'shopify';
  shopifyOrderId?: string;
  estimatedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Delivery Types
export interface Delivery {
  id: string;
  shipmentId: string;
  driverId: string;
  status: ShipmentStatus;
  pickupTime?: Date;
  deliveryTime?: Date;
  deliveryProof?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Notification Types
export type NotificationType = 'shipment' | 'delivery' | 'payment' | 'system';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  relatedId?: string;
  createdAt: Date;
}

// Analytics Types
export interface DashboardStats {
  totalShipments: number;
  activeShipments: number;
  deliveredToday: number;
  revenue: number;
}

export interface DeliveryStats {
  totalDeliveries: number;
  completedDeliveries: number;
  pendingDeliveries: number;
  totalEarnings: number;
  averageRating: number;
}

export interface ShipmentAnalytics {
  totalShipments: number;
  pendingShipments: number;
  inTransitShipments: number;
  deliveredShipments: number;
  failedShipments: number;
  deliveryRate: number;
  averageDeliveryTime: number;
}

// Seller Dashboard Types
export interface SellerOrder {
  id: string;
  orderId: string;
  deliveryAddress: string;
  weight: number;
  status: 'PENDING' | 'BIDDING' | 'ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED';
  createdAt: string;
  finalCost?: number;
  assignedCourier?: string;
}

export interface CourierBid {
  id: string;
  businessName: string;
  rating: number;
  pickupTime: string;
  price: number;
  businessId: string;
  logoUrl?: string;
  reviewCount?: number;
  estimatedDeliveryTime?: string;
}

export interface LogisticsCompany {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  logo?: string;
  availableCities: string[];
  pricePerKg: number;
  estimatedDeliveryDays: number;
}

export interface SellerWallet {
  availableBalance: number;
  lockedInEscrow: number;
  totalBalance: number;
  currency: string;
  totalSpent: number;
  totalEarned: number;
  autoTopUpEnabled: boolean;
  autoTopUpThreshold: number;
  recentTransactions: WalletTransaction[];
}

export interface WalletTransaction {
  id: string;
  type: 'topup' | 'shipping-locked' | 'shipping-deducted' | 'refund';
  amount: number;
  description: string;
  date: string;
  orderReference?: string;
  status: 'completed' | 'pending' | 'failed';
}

// Rate Card Types
export interface ZoneMultiplier {
  id: string;
  zoneName: string;
  multiplierType: 'flat' | 'percentage';
  multiplierValue: number;
}

export interface RateCard {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  baseWeight: number;
  baseRate: number;
  incrementalPrice: number;
  zoneMultipliers: ZoneMultiplier[];
  codHandlingFee: number;
  codHandlingFeeType: 'percentage' | 'flat';
  insuranceFee: number;
  insuranceFeeType: 'percentage' | 'flat';
  codEnabled: boolean;
  insuranceEnabled: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Dispatch Board Types
export interface FleetDriver {
  id: string;
  name: string;
  phoneNumber: string;
  status: 'idle' | 'busy' | 'offline';
  distanceFromPickup: number;
  rating: number;
  totalDeliveries: number;
  vehicleType: 'bike' | 'car' | 'van' | 'truck';
  vehicleNumber: string;
}

export interface DispatchOrder {
  id: string;
  orderId: string;
  customerName: string;
  pickupAddress: string;
  deliveryAddress: string;
  destinationCity: string;
  weight: number;
  estimatedMarketplaceRate: number;
  status: 'pending' | 'assigned' | 'in-transit' | 'delivered';
  createdAt: string;
  assignedDriverId?: string;
}

export interface AutoDispatchSettings {
  businessId: string;
  autoBroadcastToMarketplace: boolean;
  autoBroadcastDelay: number;
  maxMarketplaceBidLimit: number;
}

// COD Debt Management Types
export interface DriverCODDebt {
  id: string;
  driverId: string;
  currentDebt: number;
  maxDebtLimit: number;
  collectedCash: number;
  lastSettlementDate?: string;
  status: 'active' | 'suspended';
  qrCodeUrl: string;
}

export interface CashSettlement {
  id: string;
  driverId: string;
  businessId: string;
  amountReceived: number;
  debtCleared: number;
  settlementDate: string;
  adminName: string;
}
