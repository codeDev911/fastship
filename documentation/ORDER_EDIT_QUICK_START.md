# Order Edit Feature - Quick Start Guide

## What's New

Sellers can now **edit their orders** while they are in `PENDING` or `ASSIGNED` status. The same order creation form is reused for editing, making it seamless and familiar.

## How to Use

### Method 1: From Orders List (Recommended)
1. Go to `/seller/orders`
2. Find the order you want to edit
3. Click the blue **"Edit"** button (appears only for PENDING and ASSIGNED orders)
4. The order details will load automatically
5. Make your changes
6. Click **"Update Shipment"** to save

### Method 2: Direct URL Access
Navigate to the edit URL with your shipment ID:
```
/seller/orders/create?isEdit=true&shipmentId={SHIPMENT_ID}
```

Replace `{SHIPMENT_ID}` with the actual shipment ID you want to edit.

## What Can Be Edited

✅ **All of these can be updated:**
- Pickup information (name, phone, address, city, state, zip)
- Delivery information (name, phone, address, city, state, zip)
- Package details (weight, dimensions, package type, description)
- Payment method (PREPAID / COD)
- COD amount
- Expected and actual rate
- Priority (STANDARD / EXPRESS)
- Additional notes

✅ **In-City Delivery:**
- Switch between in-city and city-to-city delivery
- Update in-city locations using the interactive map
- Distance is recalculated automatically

✅ **Distance Calculation:**
- City-to-city orders: Distance recalculates based on selected cities
- In-city orders: Use the map to select exact pickup and delivery points

❌ **Cannot be changed:**
- Order status (PENDING/ASSIGNED status is preserved)
- Seller ID

## Status Restrictions

### Can Edit (Show Edit Button)
- ✅ PENDING - Order waiting to be assigned
- ✅ ASSIGNED - Order assigned to driver but not yet picked up

### Cannot Edit (No Edit Button)
- ❌ PICKUP - Ready for pickup
- ❌ PICKED_UP - Already picked up by driver
- ❌ IN_TRANSIT - In transit to destination
- ❌ DELIVERED - Successfully delivered
- ❌ FAILED - Delivery failed
- ❌ CANCELLED - Order cancelled
- ❌ RETURNED - Order returned

## User Experience

### Edit Mode Indicators
- Page title changes to: **"Edit Order (PENDING)"** or **"Edit Order (ASSIGNED)"**
- Subtitle explains you're updating an order
- **Back button** appears in top-left for easy navigation
- **Submit button** shows **"Update Shipment"** instead of "Create Shipment"
- **Cancel button** appears next to submit button

### Auto-Load
- Shipment details load automatically when edit page opens
- In-city delivery data is fully restored (if applicable)
- Form is ready to edit immediately

### Validation
- Same validation as create (all required fields must be filled)
- In-city delivery still requires location selection from map
- Distance must be calculated before submitting

## Technical Details

### Files Modified
1. **`app/api/sellers/orders/[shipmentId]/route.ts`** (NEW)
   - GET endpoint to fetch shipment data
   - PATCH endpoint to update shipment

2. **`app/seller/orders/create/page.tsx`**
   - Added edit mode support
   - Fetches shipment data based on query params
   - Handles both create and update flows

3. **`components/seller/RecentOrdersTable.tsx`**
   - Added Edit button to actions column
   - Shows only for PENDING and ASSIGNED statuses

4. **`app/seller/orders/page.tsx`**
   - Added edit handler to navigate to edit page
   - Passes shipment ID via URL params

### API Endpoints

**GET `/api/sellers/orders/[shipmentId]`**
- Fetches shipment details for editing
- Returns 404 if not found
- Returns 400 if status is not editable

**PATCH `/api/sellers/orders/[shipmentId]`**
- Updates shipment details
- Recalculates distance
- Returns updated shipment

## Examples

### Example: Edit from Orders Page
```typescript
// Click Edit button on order row
// URL automatically becomes:
/seller/orders/create?isEdit=true&shipmentId=abc123xyz

// Form loads with order data
// User modifies pickup address
// Clicks "Update Shipment"
// Order is updated, redirects to /seller/orders
```

### Example: Navigate Programmatically
```typescript
import { useRouter } from 'next/navigation';

const router = useRouter();
const shipmentId = 'abc123xyz';

router.push(`/seller/orders/create?isEdit=true&shipmentId=${shipmentId}`);
```

### Example: Add Custom Edit Link
```jsx
<Link href={`/seller/orders/create?isEdit=true&shipmentId=${order.id}`}>
  Edit Order
</Link>
```

## Validation & Error Handling

**Auto-Validation:**
- ✅ Checks shipment exists
- ✅ Checks status is PENDING or ASSIGNED
- ✅ Shows user-friendly error messages
- ✅ Redirects if cannot edit

**Form Validation:**
- Same rules as create (weight, cities, etc.)
- In-city delivery requires exact location selection
- Clear error messages on submit

**Network Errors:**
- Retryable error messages
- Form stays open for retry
- Clear feedback to user

## Before & After

### Before (Create Only)
```
Orders List
├─ View (details view)
├─ Find Courier (if PENDING)
```

### After (Create + Edit)
```
Orders List
├─ Edit (if PENDING or ASSIGNED) ← NEW
├─ View (details view)
├─ Find Courier (if PENDING)
```

## Workflow Example: Correction Scenario

**Scenario:** Seller accidentally entered wrong phone number when creating order (still PENDING)

1. Open `/seller/orders` page
2. Find the order with wrong phone
3. Click **Edit** button
4. Phone number field is pre-filled with old number
5. Correct the phone number
6. Click **Update Shipment**
7. Success! Order is updated
8. Returns to orders list

## Future Enhancements

Possible improvements:
- [ ] Edit order from OrderDetails sheet
- [ ] Email notification when order is edited
- [ ] Audit log showing what was changed
- [ ] Undo recent changes
- [ ] Bulk edit multiple orders
- [ ] Edit restrictions based on driver progress

## Troubleshooting

### Issue: No Edit Button Showing
- **Cause:** Order status is not PENDING or ASSIGNED
- **Solution:** Only PENDING and ASSIGNED orders can be edited

### Issue: "Cannot edit shipment in [STATUS] status"
- **Cause:** Tried to access edit page for non-editable order
- **Solution:** Only edit PENDING or ASSIGNED orders

### Issue: Form not loading, showing spinner
- **Cause:** Fetching shipment data from server
- **Solution:** Wait a moment, the form will load automatically

### Issue: "Shipment not found" error
- **Cause:** Invalid shipment ID in URL
- **Solution:** Check the shipment ID is correct

### Issue: Changes not saved
- **Cause:** Might not have clicked "Update Shipment" button
- **Solution:** Make sure to click the blue "Update Shipment" button (not Cancel)

---

## Summary

The order edit feature provides a complete workflow for sellers to update orders in PENDING and ASSIGNED statuses, with full validation, error handling, and a familiar user interface that reuses the existing order creation form.
