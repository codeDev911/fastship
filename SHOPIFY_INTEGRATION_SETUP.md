# 🛍️ Shopify Integration Implementation Guide

## ✅ Implementation Complete

The complete Shopify integration system has been implemented with OAuth flow, order import, and bidirectional tracking sync. This document provides setup instructions and architectural overview.

---

## 🚀 Quick Setup

### 1. Environment Variables

Add these to your `.env.local`:

```env
# Shopify Credentials (from Custom App)
SHOPIFY_API_KEY=shpua_xxx  # API Access Token
SHOPIFY_API_SECRET=shpss_xxx  # API Secret

# Encryption for storing credentials
ENCRYPTION_KEY=your_32_character_encryption_key_min_32_chars

# JWT Secret (should already exist)
JWT_SECRET=your_jwt_secret_key

# Base URL for OAuth callbacks (not needed for Custom App, but recommended)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 2. Database Migration

Run the Prisma migration to create Integration and ShopifyOrder tables:

```bash
npx prisma migrate dev --name "add-shopify-integration-tables"
```

### 3. Create Shopify Custom App

Custom App is the **easiest option** for MVP testing. No OAuth redirects needed!

1. **Go to your Shopify Admin Dashboard**
2. **Settings → Apps and integrations → Develop apps**
3. **Create an app**
   - Name: `FastShip` (or your app name)
   - App type: `Private/Custom app`
4. **Go to Configuration tab**
5. **Admin API scopes** - Enable these:
   - `read_orders` - Read orders
   - `write_orders` - Update order metafields with tracking
6. **Save**
7. **Install app** (to your store)
8. **Reveal credentials** in the "Admin API access tokens" section:
   - Copy **API access token** → `SHOPIFY_API_KEY` in `.env.local`
   - Copy **API secret key** → `SHOPIFY_API_SECRET` in `.env.local`

### 4. Verify Setup

```bash
npm run dev
```

Navigate to `/seller/integrations` and test:
1. Click "Connect Store"
2. Choose **"Custom App (Easy)"** tab
3. Enter store URL: `pharmapro01.myshopify.com`
4. Paste API access token
5. Paste API secret key
6. Click "Connect Custom App"

✅ If successful, you'll see "pharmapro01.myshopify.com" in Connected Stores

---

## 📁 Files Created/Modified

### Database Schema
- **[prisma/schema.prisma](../prisma/schema.prisma)** ✅ Modified
  - Added `IntegrationType` enum (SHOPIFY, WOOCOMMERCE, BIGCOMMERCE, SQUARE)
  - Added `IntegrationSyncStatus` enum (IDLE, SYNCING, SUCCESS, FAILED)
  - Extended `Integration` model with OAuth fields, encryption fields, and Shopify-specific fields
  - Created new `ShopifyOrder` model for order mapping
  - Updated `Shipment` model with ShopifyOrder relation

### Utility Services
- **[lib/encryption.ts](../lib/encryption.ts)** ✅ New
  - Token encryption/decryption using AES-256-GCM
  - Ensures OAuth tokens are encrypted at rest

### Service Layer (Core Business Logic)
- **[lib/services/shopify.service.ts](../lib/services/shopify.service.ts)** ✅ New
  - Shopify API client wrapper
  - Methods: `fetchOrders()`, `fetchOrderDetails()`, `updateOrderMetafields()`, `addTrackingMetafield()`
  - Automatic token decryption and request signing

- **[lib/services/integration.service.ts](../lib/services/integration.service.ts)** ✅ New
  - Integration lifecycle management
  - Methods: `connectShopifyStore()`, `disconnectIntegration()`, `getActiveShopifyIntegration()`, `testConnection()`
  - Token encryption before storage

- **[lib/services/order-sync.service.ts](../lib/services/order-sync.service.ts)** ✅ New
  - Shopify order → FastShip shipment transformation
  - Methods: `syncShopifyOrders()`, `transformShopifyOrderToShipment()`, `getAvailableOrdersForImport()`
  - Duplicate detection and validation

- **[lib/services/order-update.service.ts](../lib/services/order-update.service.ts)** ✅ New
  - Shipment status → Shopify order metafield sync
  - Methods: `syncShipmentStatusToShop()`, `syncAllPendingUpdates()`
  - Bidirectional tracking integration

### API Routes
- **[app/api/auth/oauth/shopify/callback/route.ts](../app/api/auth/oauth/shopify/callback/route.ts)** ✅ New
  - OAuth callback handler
  - Receives auth code from Shopify, exchanges for access token
  - Stores encrypted token in Integration table

- **[app/api/integrations/shopify/connect/route.ts](../app/api/integrations/shopify/connect/route.ts)** ✅ New
  - OAuth initiation endpoint
  - Returns Shopify authorization URL
  - CSRF protection with state tokens

- **[app/api/integrations/shopify/sync/route.ts](../app/api/integrations/shopify/sync/route.ts)** ✅ New
  - POST: Trigger manual order import
  - GET: Check sync status
  - Body: `{ integrationId, orderIds?: string[] }`

- **[app/api/integrations/shopify/orders/route.ts](../app/api/integrations/shopify/orders/route.ts)** ✅ New
  - GET: Fetch available orders for import
  - Query: `?integrationId=xxx&page=1&limit=50`
  - Returns paginated order list

- **[app/api/integrations/[id]/route.ts](../app/api/integrations/[id]/route.ts)** ✅ New
  - GET: Fetch integration details with stats
  - DELETE: Disconnect integration

- **[app/api/sellers/integrations/route.ts](../app/api/sellers/integrations/route.ts)** ✅ Modified
  - Replaced mock data with real database queries
  - Returns seller's integrations with stats
  - Authentication: JWT verification

### Frontend Components
- **[components/seller/ShopifyConnectModal.tsx](../components/seller/ShopifyConnectModal.tsx)** ✅ New
  - Modal dialog for connecting Shopify
  - Input: Store URL
  - Initiates OAuth flow and redirects to Shopify

- **[components/seller/IntegrationCard.tsx](../components/seller/IntegrationCard.tsx)** ✅ New
  - Display integration status
  - Show sync stats (total orders, imported count)
  - Action buttons: Sync, Preview, Disconnect
  - Disconnect confirmation dialog

- **[components/seller/OrderSyncPreview.tsx](../components/seller/OrderSyncPreview.tsx)** ✅ New
  - Modal to preview available Shopify orders
  - Paginated table with order details
  - Multi-select checkbox for batch import
  - Shows shipping address and line items

- **[app/seller/integrations/page.tsx](../app/seller/integrations/page.tsx)** ✅ Modified
  - Complete refactor with real data
  - Sections: Connected Stores, Available Integrations
  - Modal triggers for connect/sync/preview
  - Loading and error states
  - Uses `useToast()` for notifications

---

## 🔄 Data Flow

### OAuth Connection Flow
```
Seller clicks "Connect Shopify"
  ↓
Open modal, enter store URL
  ↓
POST /api/integrations/shopify/connect
  ↓
Generate state token (CSRF protection)
  ↓
Construct Shopify authorization URL with scopes
  ↓
Redirect to Shopify OAuth login
  ↓
Seller authorizes FastShip in Shopify
  ↓
Shopify redirects to /api/auth/oauth/shopify/callback?code=xxx&state=xxx
  ↓
Exchange code for access token
  ↓
Encrypt token with AES-256-GCM
  ↓
Store in Integration table
  ↓
Redirect to dashboard with success message
```

### Order Import Flow
```
Seller navigates to Integrations page
  ↓
See connected Shopify stores
  ↓
Click "Sync Orders" or "Preview"
  ↓
If Preview:
  GET /api/integrations/shopify/orders?integrationId=xxx
  ↓
  Fetch unfulfilled orders from Shopify
  ↓
  Filter out already-imported orders
  ↓
  Display paginated table
  ↓
  Seller selects orders to import
  ↓
If Import:
  POST /api/integrations/shopify/sync
  Body: { integrationId, orderIds: [...] }
  ↓
  For each order:
    - Transform Shopify order → FastShip shipment
    - Validate address, phone, items
    - Create Shipment record
    - Create ShopifyOrder mapping
    - Track in audit trail
  ↓
  Return results: { imported, skipped, errors }
  ↓
  Show notification with results
```

### Tracking Sync Flow
```
Shipment status changes to DELIVERED (or other status)
  ↓
ShipmentActivity is logged
  ↓
Optional: Call OrderUpdateService.syncShipmentStatusToShop()
  ↓
Look up ShopifyOrder mapping
  ↓
Get integration & decrypt access token
  ↓
Create ShopifyService instance
  ↓
Map FastShip status → Shopify tracking status
  ↓
Build metafield payload:
  {
    namespace: "fulfillment_tracking",
    key: "tracking_number",
    value: "FS-xxx"
  }
  ↓
PUT /admin/api/2024-01/orders/{id}.json
  Body: { order: { metafields: [...] } }
  ↓
Shopify updates order page with tracking info
```

---

## 🔐 Security Features

### Token Encryption
- OAuth access tokens encrypted at rest using **AES-256-GCM**
- IV and auth tag stored with encrypted data
- Decrypted only when making Shopify API calls
- Environment variable `ENCRYPTION_KEY` required

### CSRF Protection
- State token generated for OAuth flow
- Stored in httpOnly, secure cookie
- Validated on callback
- State token expires in 10 minutes

### Authentication
- All integration endpoints require JWT verification
- Cookie-based authentication with `auth_token`
- Seller ID verified in JWT claims
- Authorization checks on all operations

### API Security
- Rate limiting recommended for `/api/integrations/shopify/sync` (5 req/min)
- CORS middleware protection (existing in codebase)
- Input validation on all routes

---

## 📊 Database Schema

### Integration Model
```prisma
model Integration {
  id                  String                @id @default(cuid())
  sellerId            String
  integrationType     IntegrationType       // SHOPIFY, WOOCOMMERCE, etc.
  
  // OAuth Credentials (encrypted)
  accessToken         String?               // Encrypted
  refreshToken        String?               // Encrypted for future use
  apiKey              String?               // For other platforms
  apiSecret           String?               // For other platforms
  
  // Shopify-specific
  shopifyStoreUrl     String?               // e.g., "mystore.myshopify.com"
  
  // Sync metadata
  lastSyncedAt        DateTime?
  syncStatus          IntegrationSyncStatus // IDLE|SYNCING|SUCCESS|FAILED
  lastSyncErrorMsg    String?
  
  isActive            Boolean               @default(true)
  metadata            String?               // JSON for extensibility
  
  createdAt           DateTime              @default(now())
  updatedAt           DateTime              @updatedAt

  seller              Seller
  shopifyOrders       ShopifyOrder[]

  @@unique([sellerId, integrationType])
}
```

### ShopifyOrder Model
```prisma
model ShopifyOrder {
  id                  String   @id @default(cuid())
  integrationId       String
  shopifyOrderId      String   // Shopify's order ID
  shopifyOrderNumber  String   // Human-readable "#1001"
  shipmentId          String?  // FastShip shipment (null if not imported)
  
  syncedAt            DateTime @default(now())
  lastStatusSyncAt    DateTime? // When tracking was synced to Shopify
  
  metadata            String?  // JSON: original Shopify order data
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  integration         Integration
  shipment            Shipment?

  @@unique([integrationId, shopifyOrderId])
}
```

---

## 🧪 Testing Checklist

### OAuth Flow
- [ ] Click "Connect Shopify Store"
- [ ] Enter store URL (e.g., "mystore.myshopify.com")
- [ ] Redirects to Shopify login
- [ ] Grant permissions
- [ ] Redirected back to dashboard with "connected" status
- [ ] Integration appears in Connected Stores section
- [ ] Token properly encrypted in database

### Order Import
- [ ] Create test orders in Shopify dev store
- [ ] Click "Sync Orders" on integration
- [ ] See preview modal with available orders
- [ ] Select orders to import
- [ ] Click "Import"
- [ ] See success notification
- [ ] Orders appear in FastShip as shipments
- [ ] Customer details properly mapped
- [ ] Addresses populated correctly

### Error Handling
- [ ] Disconnect store → try sync → error message
- [ ] Revoke Shopify permissions → try sync → error message
- [ ] Invalid store URL → error message
- [ ] Network error handling
- [ ] Duplicate import prevention

### Admin/Database
- [ ] Verify encrypted tokens in Integration table
- [ ] Verify ShopifyOrder mappings created
- [ ] Check ShipmentActivity audit trail
- [ ] Verify seller isolation (can't see other seller's integrations)

---

## 🔮 Next Steps (Phase 2)

### Webhook Support
- Create webhook endpoint for real-time order creation
- Implement webhook signature verification
- Auto-import orders as they're placed (optional manual sync)

### Status Sync
- Integrate with existing shipment status change handlers
- Auto-sync tracking to Shopify on DELIVERED, IN_TRANSIT, etc.
- Cron job for periodic status sync (failsafe)

### Additional Platforms
- WooCommerce: OAuth + REST API
- BigCommerce: OAuth + REST API
- Square: OAuth + REST API
- Extend `ShopifyService` pattern with platform-agnostic adapter

### Advanced Features
- Mapping for pickup address (store location)
- Weight/dimensions from Shopify product data
- Customer email notifications
- Order update logs in UI
- Bulk sync history

### Performance
- Pagination for large order lists
- Async job queue for bulk imports
- Caching of store metadata
- Batch Shopify API calls

---

## 🛠️ Development Tips

### Local Testing
```bash
# Run dev server
npm run dev

# Test OAuth locally (use ngrok or similar for HTTPS callback)
ngrok http 3000
# Update NEXT_PUBLIC_BASE_URL and Shopify redirect URI

# Check database
npx prisma studio
```

### Common Issues

**"ENCRYPTION_KEY not found"**
- Add `ENCRYPTION_KEY` to `.env.local` (min 32 characters)

**"Invalid OAuth state" or "This content is blocked" iframe error**
- You created a **Public App** which loads as an iframe in Shopify admin
- Use the **Custom App** setup instead (no OAuth redirect needed)
- Custom Apps don't load in Shopify admin - they authenticate directly with credentials

**"Invalid API credentials or store URL"**
- Verify API access token and secret are copied correctly from Shopify
- Ensure Custom App has `read_orders` and `write_orders` scopes enabled
- Check that store URL is correct (e.g., `pharmapro01.myshopify.com`)

**"Token decryption failed"**
- Ensure same `ENCRYPTION_KEY` used as when credentials were stored
- Check that credentials weren't corrupted in database

**"No orders available"**
- Orders must be in "unshipped" fulfillment status in Shopify
- Or use `status=any` to fetch all orders
- Create test orders in your Shopify store first

**"FastShip app loads in Shopify admin but shows iframe error"**
- This means you have a **Public App**, not a Custom App
- Delete this app from Shopify and create a new **Custom App** instead
- Custom Apps authenticate via API credentials, not OAuth

---

## 📚 Resources

- [Shopify OAuth Documentation](https://shopify.dev/docs/admin-api/2024-01/resources/oauth)
- [Shopify Admin API Reference](https://shopify.dev/docs/admin-api/2024-01)
- [Shopify Order API](https://shopify.dev/docs/admin-api/2024-01/resources/order)
- [OWASP Token Storage](https://owasp.org/www-project-mobile-top-10/2016-risks/m4-insecure-authentication)

---

## � Custom App vs Public App

The integration supports both Custom Apps and Public Apps:

### Custom App (Recommended for MVP)
**Best for**: Quick testing, MVP launch
- ✅ No OAuth flow - direct API credentials
- ✅ Simple setup - just paste API key and secret
- ✅ No redirect URIs or iframe handling needed
- ❌ Only for your own store
- **When to use**: Initial testing and MVP

### Public App (For Production Scale)
**Best for**: Multi-merchant platforms, Shopify App Store listing
- ✅ Scalable to any Shopify merchant
- ✅ Secure OAuth token-based access
- ❌ Complex OAuth flow with redirects
- ❌ Requires app shell and embed handling
- ❌ Shopify review process
- **When to use**: After MVP, when scaling to multiple sellers

**What you chose**: Custom App ✅ (Perfect for MVP!)

---

## 📝 Architecture Decisions

1. **Custom App for MVP**: Direct credentials, no OAuth complexity needed
2. **Token Encryption**: Secure at-rest encryption using AES-256-GCM
3. **Manual Sync MVP**: Simpler to launch; webhooks can be added later
4. **Service Layer Pattern**: Clean separation of concerns, easier to test and extend
5. **ShopifyOrder Mapping Table**: Prevents duplicates, enables audit trail
6. **Flexible Auth**: Code supports both Custom App and OAuth for future scaling

## 🎉 You're All Set!

The Shopify integration is ready to test. Follow the **Quick Setup** section above to configure environment variables and create your Shopify app, then start testing the OAuth flow and order import functionality.

**Questions?** Check the architecture overview or refer to the code comments in each service file.
