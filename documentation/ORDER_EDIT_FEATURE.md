# Order Edit/Update Feature Documentation

## Overview
Sellers can now edit orders that are in `PENDING` or `ASSIGNED` status using the same order creation form with edit mode enabled.

## How It Works

### 1. **Edit Mode URL**
To edit an existing order, use the following URL pattern:
```
/seller/orders/create?isEdit=true&shipmentId={SHIPMENT_ID}
```

**Parameters:**
- `isEdit=true` - Enables edit mode
- `shipmentId` - The ID of the shipment to edit

**Example:**
```
/seller/orders/create?isEdit=true&shipmentId=cm1q2w3e4r5t6y7u8i9o0p
```

### 2. **Features**

#### Auto-Load Shipment Data
- When edit mode is enabled, the form automatically fetches the shipment details
- All fields are populated with existing data
- In-city delivery data (if applicable) is restored including:
  - Pickup and delivery locations
  - Calculated distance
  - Route information

#### Form Behavior
- **Header** changes to show: `Edit Order ({Status})`
- **Back button** appears for easy navigation
- **Subtitle** changes to reflect update context
- All form fields remain editable

#### Submit Button Behavior
- Changes text to `Update Shipment` instead of `Create Shipment`
- Loading state shows `Updating...`
- Cancel button appears next to submit button
- Same validation rules apply (in-city orders require location selection)

#### Status Restrictions
- Only orders in `PENDING` or `ASSIGNED` status can be edited
- If user tries to edit a shipment in other statuses (PICKUP, PICKED_UP, IN_TRANSIT, DELIVERED, FAILED, CANCELLED, RETURNED), an error message appears
- User is redirected back to the orders page

### 3. **API Endpoints**

#### GET `/api/sellers/orders/[shipmentId]`
Fetches a shipment for editing.

**Response (Success):**
```json
{
  "id": "shipment-id",
  "pickupName": "John Doe",
  "pickupPhone": "+92...",
  "pickupAddress": "123 Main St",
  "pickupCity": "Peshawar",
  "pickupState": "KP",
  "pickupZipCode": "25000",
  "pickupLatitude": 34.015,
  "pickupLongitude": 71.525,
  "deliveryName": "Jane Smith",
  "deliveryPhone": "+92...",
  "deliveryAddress": "456 Oak St",
  "deliveryCity": "Peshawar",
  "deliveryState": "KP",
  "deliveryZipCode": "25100",
  "deliveryLatitude": 34.025,
  "deliveryLongitude": 71.535,
  "weight": 5.5,
  "distance": 12.5,
  "dimensions": "10x10x10",
  "packageType": "Box",
  "isInCityDelivery": true,
  "description": "Package contents",
  "paymentMethod": "PREPAID",
  "codAmount": null,
  "expectedRate": 500,
  "actualRate": 450,
  "status": "PENDING",
  "priority": "STANDARD",
  "notes": "Handle with care",
  "createdAt": "2025-04-17T10:00:00Z",
  "updatedAt": "2025-04-17T10:00:00Z"
}
```

**Error Responses:**
- `400` - Shipment ID is required
- `404` - Shipment not found
- `400` - Cannot edit shipment in {STATUS} status

#### PATCH `/api/sellers/orders/[shipmentId]`
Updates an existing shipment.

**Request Body:**
```json
{
  "sellerId": "seller-id",
  "pickupName": "Updated Name",
  "pickupPhone": "+92...",
  "pickupAddress": "New Address",
  "pickupCity": "Peshawar",
  "pickupState": "KP",
  "pickupZipCode": "25000",
  "deliveryName": "Updated Recipient",
  "deliveryPhone": "+92...",
  "deliveryAddress": "New Delivery Address",
  "deliveryCity": "Peshawar",
  "deliveryState": "KP",
  "deliveryZipCode": "25100",
  "weight": 5.5,
  "dimensions": "10x10x10",
  "packageType": "Box",
  "isInCityDelivery": true,
  "pickupLatitude": 34.015,      // Required for in-city delivery
  "pickupLongitude": 71.525,      // Required for in-city delivery
  "deliveryLatitude": 34.025,     // Required for in-city delivery
  "deliveryLongitude": 71.535,    // Required for in-city delivery
  "inCityDistance": 12.5,         // Required for in-city delivery
  "description": "Updated description",
  "paymentMethod": "PREPAID",
  "codAmount": 0,
  "expectedRate": 500,
  "actualRate": 450,
  "priority": "STANDARD",
  "notes": "Updated notes"
}
```

**Response (Success):**
```json
{
  // Returns updated shipment object (same as GET response)
}
```

**Error Responses:**
- `400` - Missing required fields
- `400` - Shipment ID is required
- `400` - Cannot edit shipment in {STATUS} status
- `404` - Shipment not found
- `500` - Server error

### 4. **Distance Calculation**

#### City-to-City Delivery
- Distance is automatically recalculated using existing distance calculation logic
- Coordinates are fetched from cities.json based on city/state

#### In-City Delivery
- Distance must be provided (calculated using OpenRoute API on the frontend)
- All 4 coordinates (pickup lat/lng, delivery lat/lng) are required
- Using the same interactive map picker as create mode

### 5. **Form Validation**

**Required Fields:**
- Weight (numeric)
- Pickup city, state
- Delivery city, state
- All in-city delivery fields if `isInCityDelivery` is true

**In-City Specific Validation:**
- If `isInCityDelivery` is enabled, requires:
  - Pickup latitude, longitude
  - Delivery latitude, longitude
  - In-city distance (calculated distance)

### 6. **Usage Examples**

#### Example 1: Navigate to Edit Page
```typescript
// In a seller orders list component
const handleEditClick = (shipmentId: string) => {
  router.push(`/seller/orders/create?isEdit=true&shipmentId=${shipmentId}`);
};
```

#### Example 2: Display Edit Link in Orders List
```jsx
<a href={`/seller/orders/create?isEdit=true&shipmentId=${order.id}`}>
  Edit Order
</a>
```

#### Example 3: Back Button Navigation
```typescript
// The edit form already includes a back button that uses router.back()
// Or you can redirect to orders list after successful update:
router.push('/seller/orders');
```

### 7. **Business Logic**

**Editable Statuses:**
- `PENDING` - Order not yet assigned to driver
- `ASSIGNED` - Order assigned to driver but not picked up

**Non-Editable Statuses:**
- `PICKUP` - Ready for pickup
- `PICKED_UP` - Already picked up
- `IN_TRANSIT` - In transit to destination
- `DELIVERED` - Already delivered
- `FAILED` - Delivery failed
- `CANCELLED` - Order cancelled
- `RETURNED` - Order returned

**Data Updates:**
- When updating, all editable fields are refreshed
- Distance is recalculated based on new cities (or in-city locations)
- Coordinates are updated
- Status field is preserved (cannot be changed through this form)
- `updatedAt` timestamp is automatically updated

### 8. **Error Handling**

**User-Friendly Errors:**
1. Shipment not found → "Error fetching shipment" (redirects to back)
2. Non-editable status → Shows specific error message (redirects to back)
3. Missing fields → "Missing required fields: ..." (shows message, stays on form)
4. Network error → "Error processing shipment" (stays on form for retry)

**Developer Errors:**
- All error responses include specific error messages
- HTTP status codes follow REST conventions
- Server logs include detailed error information

### 9. **UI Indicators**

**Edit Mode Specific UI:**
- "Edit Order ({Status})" in header instead of "New Order"
- Back button in top-left
- Cancel button next to submit button
- All status validation happens during load (before form displays)

### 10. **Future Enhancements**

**Possible improvements:**
- Add version history tracking for edited orders
- Email notifications when order is edited
- Audit logs for who edited what and when
- Bulk edit functionality
- Edit restrictions based on driver assignment progress
- Add "edited" indicator on orders list

---

## Implementation Details

**Files Created:**
- `app/api/sellers/orders/[shipmentId]/route.ts` - API endpoint for GET and PATCH

**Files Modified:**
- `app/seller/orders/create/page.tsx` - Added edit mode support

**Key Features:**
1. Uses `useSearchParams` to read query parameters
2. Uses `useRouter` for navigation
3. Conditional rendering for loading state
4. Reuses all existing form logic (validation, in-city picker, etc.)
5. Automatic distance recalculation
6. Proper error handling and user feedback

---

## Testing Checklist

- [ ] Navigate to edit page with valid shipmentId
- [ ] Form loads with shipment data
- [ ] Header shows "Edit Order ({Status})"
- [ ] Can edit all form fields
- [ ] In-city delivery data loads correctly
- [ ] Can recalculate distance for in-city delivery
- [ ] Submit button updates shipment
- [ ] Success message appears and redirects
- [ ] Trying to edit non-editable status shows error
- [ ] Invalid shipmentId shows error
- [ ] Network error shows appropriate message
- [ ] Back button navigates correctly
- [ ] Cancel button works
