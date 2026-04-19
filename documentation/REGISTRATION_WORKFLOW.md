# Approval-Based Registration Workflow

## Overview

This system implements a two-stage registration process where drivers and businesses must be approved by admins before completing their account setup.

## Workflow Stages

### Stage 1: Application Submission
**Endpoint:** `POST /api/register/driver/apply` or `POST /api/register/business/apply`

**What happens:**
1. User fills out application form with:
   - Basic info (name, email, phone)
   - Type-specific info (licenses for drivers, company details for businesses)
2. System checks for duplicates/conflicts
3. Creates `Approval` record with status `PENDING`
4. User receives confirmation message with `approvalId`

**Example Request - Driver:**
```json
POST /api/register/driver/apply
{
  "email": "john@example.com",
  "phone": "+923001234567",
  "name": "John Driver",
  "licenseNumber": "DL-2023-123456",
  "licenseExpiry": "2025-12-31",
  "vehicleType": "Bike",
  "vehicleNumber": "KR-123-456"
}
```

**Example Request - Business:**
```json
POST /api/register/business/apply
{
  "email": "admin@logistics.com",
  "phone": "+923009876543",
  "companyName": "FastLogistics Inc",
  "businessType": "Courier Service",
  "operatingRegion": "Sindh"
}
```

---

### Stage 2: Admin Review & Approval
**Endpoint:** `PATCH /api/admin/approvals/{id}`

**What happens:**
1. Admin sees pending applications in `/admin/approvals`
2. Reviews applicant details
3. Clicks **Approve** or **Reject**
4. System updates approval status
5. Applicant gets notified (email integration)

**Admin Approval Request:**
```json
PATCH /api/admin/approvals/approval-id-123
{
  "status": "APPROVED"
}
```

**Admin Rejection Request:**
```json
PATCH /api/admin/approvals/approval-id-123
{
  "status": "REJECTED",
  "rejectionReason": "License document not clear"
}
```

---

### Stage 3: Status Check (Before Completion)
**Endpoint:** `GET /api/register/check-approval?email=john@example.com&type=DRIVER`

**What happens:**
1. User enters their email
2. System checks approval status
3. Returns: `APPROVED`, `PENDING`, or `REJECTED`
4. If approved, provides `approvalId` to proceed

**Response Examples:**

**Approved:**
```json
{
  "status": "APPROVED",
  "message": "Your application has been approved! You can now complete your registration.",
  "approvalId": "approval-id-123",
  "data": {
    "id": "approval-id-123",
    "status": "APPROVED",
    "approvedAt": "2024-04-18T10:30:00Z",
    "name": "John Driver"
  }
}
```

**Pending:**
```json
{
  "status": "PENDING",
  "message": "Your application is being reviewed. Please check back soon.",
  "submittedAt": "2024-04-17T15:22:00Z"
}
```

**Rejected:**
```json
{
  "status": "REJECTED",
  "message": "Your application has been rejected.",
  "reason": "License document not clear"
}
```

---

### Stage 4: Complete Registration
**Endpoint:** `POST /api/register/driver/complete` or `POST /api/register/business/complete`

**What happens:**
1. User receives approval notification (email)
2. Clicks link to complete registration
3. Sets password
4. System creates:
   - User account (with verified status)
   - Driver/Business record (with verified status)
   - Wallet for financial transactions
5. Account is immediately active

**Complete Registration Request:**
```json
POST /api/register/driver/complete
{
  "approvalId": "approval-id-123",
  "password": "SecurePassword123!"
}
```

**Success Response:**
```json
{
  "message": "Driver account created successfully!",
  "driverId": "driver-id-456"
}
```

---

## Database Flow

```
User Submits Application
    ↓
[Approval record created with status=PENDING]
    ↓
Admin Reviews in /admin/approvals
    ↓
Admin Approves (APPROVED) or Rejects (REJECTED)
    ↓
[If APPROVED]
    ├─→ User checks status: GET /register/check-approval
    ├─→ Gets approvalId in response
    ├─→ Completes registration: POST /register/driver/complete
    ├─→ [User account created]
    ├─→ [Driver record created with isVerified=true]
    ├─→ [Wallet created]
    └─→ Ready to use account immediately
    
[If REJECTED]
    └─→ User sees rejection reason
    └─→ Can reapply later
```

---

## Key Features

### ✅ Duplicate Prevention
- Checks email uniqueness per application type
- Prevents duplicate applications for same email

### ✅ Account Linking
- Approval stores email/phone before account creation
- Links to User/Driver/Business after completion
- Maintains audit trail

### ✅ Automatic Verification
- Approved applicants get immediate verification
- Drivers: `isVerified = true`
- Businesses: `isActive = true`

### ✅ Rejection Tracking
- Stores rejection reason
- Allows reapplication later

### ✅ Audit Trail
- All approvals logged with timestamps
- Admin ID recorded for approvals
- Rejection reasons stored

---

## Frontend Implementation Tips

### Application Submission Page
```typescript
// pages/register/driver/apply
1. Form for driver application
2. Submit to POST /api/register/driver/apply
3. Show approvalId on success
4. Advise to check status later
```

### Status Check Page
```typescript
// pages/register/check-status
1. Input: email and registration type
2. Query GET /api/register/check-approval
3. Show result:
   - APPROVED → Show "Complete Registration" button → /register/driver/complete
   - PENDING → Show "Check again later" message
   - REJECTED → Show reason, offer reapplication
   - NOT_FOUND → Show "No application found"
```

### Complete Registration Page
```typescript
// pages/register/driver/complete?approvalId=...
1. Confirm application details (read-only)
2. Password field
3. Submit to POST /api/register/driver/complete
4. Redirect to login on success
```

---

## Error Handling

### Application Submission
- ❌ Email already registered → 400
- ❌ Phone already registered → 400
- ❌ Application pending for this email → 400

### Status Check
- ❌ No application found → 404
- ✅ Returns status: APPROVED/PENDING/REJECTED

### Complete Registration
- ❌ Approval not found → 404
- ❌ Status not APPROVED → 400
- ❌ Already completed → 400
- ✅ Creates account and returns ID

---

## Testing the Workflow

```bash
# 1. Submit driver application
curl -X POST http://localhost:3000/api/register/driver/apply \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@test.com",
    "phone": "+923001234567",
    "name": "John Driver",
    "licenseNumber": "DL-123",
    "licenseExpiry": "2025-12-31",
    "vehicleType": "Bike",
    "vehicleNumber": "KR-123"
  }'

# Response: { approvalId: "abc-123", message: "..." }

# 2. As admin, approve the application
curl -X PATCH http://localhost:3000/api/admin/approvals/abc-123 \
  -H "Content-Type: application/json" \
  -d '{ "status": "APPROVED" }'

# 3. User checks status
curl http://localhost:3000/api/register/check-approval?email=john@test.com&type=DRIVER

# 4. User completes registration
curl -X POST http://localhost:3000/api/register/driver/complete \
  -H "Content-Type: application/json" \
  -d '{
    "approvalId": "abc-123",
    "password": "SecurePass123!"
  }'

# Response: { message: "Driver account created!", driverId: "dr-456" }
```

---

## Next Steps

1. **Create Frontend Pages:**
   - `/register/driver/apply` - Application form
   - `/register/check-status` - Status checker
   - `/register/driver/complete` - Password setup
   - Same for businesses

2. **Email Notifications:**
   - On application submission confirmation
   - On approval (with complete registration link)
   - On rejection (with reason)

3. **Admin Dashboard:**
   - Already implemented in `/admin/approvals`
   - Shows all pending/approved/rejected applications
   - One-click approve/reject with reason

4. **Enhanced Validation:**
   - Document uploads (license, business registration)
   - Phone verification via OTP
   - Email verification
