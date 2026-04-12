# Delivery Management Platform - Backend Implementation Guide

## Overview
This document outlines the complete backend implementation for the delivery management platform, including database schema, API routes, and service layer logic.

## Project Structure

### Database & ORM
- **Framework**: Prisma ORM
- **Database**: PostgreSQL
- **Location**: `/prisma/schema.prisma`

### API Routes
All API routes are located in `/app/api/` and follow REST conventions.

### Service Layer
Business logic implementations are in `/lib/services/`

---

## Database Schema

### Core Models

#### User
- Stores authentication and profile info for all user types (Seller, Driver, Business)
- Relationships: OneToMany with Seller, Driver, Business

#### Seller
- Represents E-commerce sellers who ship packages
- Fields: Company name, address, tax ID, bank details, ratings
- Relationships: HasOne Wallet, OneToMany Shipments

#### Driver
- Represents delivery drivers
- Fields: License info, vehicle details, location, status, earnings
- Relationships: HasOne Wallet, OneToMany Assignments

#### Business
- Represents logistics/courier companies
- Fields: Commission rate, operating region, insurance
- Relationships: HasOne Wallet, OneToMany RateCards, OneToMany Drivers

#### Shipment
- Core entity representing packages to be delivered
- Statuses: PENDING → ASSIGNED → PICKUP → PICKED_UP → IN_TRANSIT → DELIVERED
- Relationships: HasOne DriverAssignment, HasOne Payment, HasOne Tracking

#### DriverAssignment
- Links shipments to drivers for delivery
- Fields: Assignment status, pickup/delivery completion times
- Ensures one-to-one relationship between shipment and driver

#### Payment
- Handles financial transactions for shipments
- Supports both PREPAID and COD (Cash on Delivery)
- Calculates commission and driver payable amounts

#### Wallet
- Financial account for sellers, drivers, and businesses
- Fields: Balance, escrow balance for COD orders
- Relationships: HasMany Transactions

#### Transaction
- Records all wallet movements (credits, debits, commissions, settlements)
- Types: CREDIT, DEBIT, COMMISSION, SETTLEMENT
- Audit trail for financial operations

#### Settlement
- Batch settlement records for periodic payouts
- Calculates net amounts after commission deductions
- Links to period start/end dates

#### Tracking
- Real-time shipment location and status
- Fields: Current location, GPS coordinates, estimated delivery

#### ShipmentActivity
- Activity log for each shipment
- Timestamps every status change with location and description

#### Notification
- User notifications for important events
- Types: ORDER_CREATED, ASSIGNED, DELIVERED, PAYMENT_RECEIVED, etc.

---

## API Routes

### Authentication
```
POST   /api/auth/register          - User registration
POST   /api/auth/login             - User login
POST   /api/auth/logout            - User logout
```

### Shipments
```
GET    /api/shipments              - List shipments (filters: sellerId, status)
POST   /api/shipments              - Create new shipment
GET    /api/shipments/[id]         - Get shipment details
PATCH  /api/shipments/[id]         - Update shipment status/info
```

### Drivers
```
GET    /api/drivers                - List drivers (filters: isActive)
POST   /api/drivers                - Register new driver
GET    /api/drivers/[id]           - Get driver profile
PATCH  /api/drivers/[id]           - Update driver info
```

### Assignments
```
GET    /api/assignments            - List assignments (filters: driverId, businessId)
POST   /api/assignments            - Assign driver to shipment
GET    /api/assignments/[id]       - Get assignment details
```

### Rate Cards
```
GET    /api/rate-cards             - List rate cards (filters: businessId)
POST   /api/rate-cards             - Create rate card
PATCH  /api/rate-cards/[id]        - Update rate card
DELETE /api/rate-cards/[id]        - Deactivate rate card
```

### Wallets & Transactions
```
GET    /api/wallets                - Get wallet (filters: sellerId, driverId, businessId)
GET    /api/transactions           - List transactions (filters: walletId, type)
POST   /api/transactions           - Create transaction
```

### Settlements
```
GET    /api/settlements            - List settlements (filters: businessId, status)
POST   /api/settlements            - Create new settlement
PATCH  /api/settlements/[id]       - Update settlement status
```

### Notifications
```
GET    /api/notifications          - Get user notifications
PATCH  /api/notifications/[id]     - Mark as read
DELETE /api/notifications/[id]     - Delete notification
```

### Earnings
```
GET    /api/earnings               - List driver earnings
POST   /api/earnings               - Record earning
```

### Sellers
```
GET    /api/sellers                - List sellers
POST   /api/sellers                - Register seller
GET    /api/sellers/[id]           - Get seller profile
```

### Business
```
GET    /api/business               - Get business profile
POST   /api/business               - Create business
PATCH  /api/business/[id]          - Update business
```

---

## Service Layer

### shipmentService
**Location**: `/lib/services/shipment.service.ts`

Key functions:
- `getShipmentsByStatus()` - Filter by shipment status
- `calculateShipmentRate()` - Calculate shipping cost based on weight
- `processPickup()` - Handle package pickup workflow
- `processDelivery()` - Handle delivery completion with payment processing
- `failDelivery()` - Handle failed delivery attempts
- `cancelShipment()` - Cancel order with refund logic

### financialService
**Location**: `/lib/services/financial.service.ts`

Key functions:
- `createTransaction()` - Record wallet transaction
- `lockEscrow()` - Lock funds for COD orders
- `releaseEscrow()` - Release locked COD funds
- `processPayment()` - Handle shipment payment (PREPAID/COD)
- `settleDriverPayment()` - Payout driver earnings
- `processSettlement()` - Batch settlement with commission calculation
- `addCODDebt()` - Track driver COD collection debt
- `settleCODDebt()` - Settle driver's COD debt

---

## Frontend Integration

### Updated Hooks
All hooks in `/lib/hooks.ts` now use real APIs:

```typescript
// Shipments
const { shipments, isLoading, error, updateShipmentStatus, assignDriver, createShipment, deleteShipment } = useShipments(sellerId, status);

// Notifications
const { notifications, isLoading, markAsRead, deleteNotification, getUnreadCount } = useNotifications(userId);

// Drivers
const { drivers, isLoading, error, addEarnings } = useDrivers(businessId);
```

Each hook:
- Fetches data from corresponding API endpoint
- Manages loading and error states
- Provides callback functions for mutations
- Automatically refetches on dependency changes

---

## Financial Workflow

### Prepaid Orders
1. Seller creates shipment with PREPAID payment method
2. Payment created with status PENDING
3. Shipment assigned to driver
4. On delivery: Payment marked COMPLETED
5. Driver earning calculated and recorded
6. Earning included in next settlement

### COD (Cash on Delivery) Orders
1. Seller creates shipment with COD method
2. Funds locked in escrow
3. Driver collects cash on delivery
4. Payment marked COMPLETED on delivery
5. Funds released from escrow to seller wallet
6. Driver's COD debt tracked for settlement

### Commission Structure
- Platform commission: 10% (configurable per business)
- Tax: 10% on shipping cost
- Driver payable: Total - Commission - Tax

---

## Getting Started

### Prerequisites
```bash
npm install  # Install dependencies (includes Prisma)
```

### Setup Database
1. Create PostgreSQL database
2. Set `DATABASE_URL` in `.env.local`
3. Run migration:
```bash
npm run prisma:migrate
```

### Development
```bash
npm run dev           # Start dev server
npm run prisma:studio # Open Prisma Studio to view data
```

### Production Build
```bash
npm run build
npm run start
```

---

## Key Features Implemented

✅ Complete database schema with all entities
✅ REST APIs for all major operations
✅ Financial transaction tracking
✅ Wallet and escrow management
✅ Settlement and commission calculations
✅ Driver earnings tracking
✅ COD debt management
✅ Shipment status transitions
✅ Real-time tracking support
✅ Notification system
✅ Activity logging
✅ Frontend integration via hooks

---

## Next Steps

1. **Authentication**: Implement JWT-based auth in `/api/auth/*` routes
2. **Webhooks**: Add webhook support for third-party integrations
3. **Notifications**: Implement real-time notifications (WebSocket/SSE)
4. **Analytics**: Add detailed analytics endpoints for dashboards
5. **Reporting**: Create settlement reports and statements
6. **Testing**: Add comprehensive unit and integration tests
7. **Monitoring**: Add logging and error tracking

---

## Database Migrations

To create new migrations after schema changes:
```bash
npm run prisma:migrate
```

To reset database (development only):
```bash
npx prisma migrate reset
```

---

## API Documentation

Detailed API documentation with request/response examples is available in the individual route files. Each endpoint includes:
- Request validation with Zod
- Error handling
- Pagination support (where applicable)
- Filter options

For more information, refer to the specific route files in `/app/api/`.
