# Shipment Details UI Component Implementation Guide

## Quick Start

### 1. Import the new components
```tsx
import { 
  ShipmentTimeline, 
  ServiceTierBadge, 
  InfoCard 
} from '@/components/shipment';
```

### 2. Replace existing components

---

## OrderDetails.tsx (Seller Modal) - Implementation Guide

### Problem Areas to Replace:
1. **Lines 50-75**: 7-column metadata table
2. **Lines 90-110**: Payment section layout
3. **Lines 180+**: Business section

### Solution Example:

```tsx
// BEFORE (Current - problematic table)
{/* Details Table - Built like your Recent Transactions */}
<div className="bg-white rounded-2xl overflow-hidden">
  <table className="w-full">
    <thead>
      <tr className="border-b border-slate-100 bg-slate-50/30">
        {/* 7 column headers - breaks on mobile */}
        <th>Field Name</th>
        <th>Value</th>
        <th>Field Name</th>
        <th>Value</th>
        <th>Field Name</th>
        <th>Value</th>
        <th>Field Name</th>
      </tr>
    </thead>
    {/* ... table body ... */}
  </table>
</div>

// AFTER (Proposed - responsive grid)
<div className="space-y-6">
  {/* Section 1: Quick Overview */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
    <InfoCard 
      icon={<Package className="h-5 w-5" />}
      label="Package Weight"
      value={`${data?.weight} kg`}
      subtext={data?.packageType}
    />
    <InfoCard 
      icon={<MapPin className="h-5 w-5" />}
      label="Distance"
      value={`${data?.distance?.toFixed(0)} km`}
    />
    <InfoCard 
      icon={<Clock className="h-5 w-5" />}
      label="Status"
      value={data?.status}
    />
  </div>

  {/* Section 2: Service Tier */}
  <div>
    <p className="text-xs font-medium text-muted-foreground mb-2">SERVICE TIER</p>
    <ServiceTierBadge 
      rateCardName={data?.rateCard?.name}
      baseRate={data?.baseRate}
    />
  </div>

  {/* Section 3: Your Earnings */}
  <div className="p-4 rounded-xl bg-green-50 border-2 border-green-200">
    <p className="text-xs font-medium text-green-600 uppercase">Your Earnings</p>
    <p className="text-3xl font-bold text-green-700 mt-2">
      PKR {(data?.codAmount + data?.actualRate * 0.9)?.toFixed(0)}
    </p>
    <p className="text-xs text-green-600 mt-1">After 10% platform commission</p>
  </div>

  {/* Section 4: Metadata Grid */}
  <div className="bg-white rounded-2xl p-6 border border-slate-100">
    <p className="text-sm font-bold mb-4">Additional Information</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <p className="text-xs text-slate-400 font-medium">Actual Rate</p>
        <p className="font-medium text-slate-700">{data?.actualRate || "—"}</p>
      </div>
      <div>
        <p className="text-xs text-slate-400 font-medium">Expected Rate</p>
        <p className="font-medium text-slate-700">{data?.expectedRate || "—"}</p>
      </div>
      <div>
        <p className="text-xs text-slate-400 font-medium">Created At</p>
        <p className="font-medium text-slate-700">{new Date(data?.createdAt).toLocaleDateString()}</p>
      </div>
      <div>
        <p className="text-xs text-slate-400 font-medium">Dimensions</p>
        <p className="font-medium text-slate-700">{data?.dimensions || "Not specified"}</p>
      </div>
    </div>
  </div>
}
```

---

## business/shipments/[id]/page.tsx - Implementation Guide

### Current Issues:
- Missing distance/duration display at top
- Timeline activities scattered
- Driver assignment in separate modal
- Commission breakdown confusing

### Required Changes:

#### 1. Add to header section (after existing header):
```tsx
// Add after line ~180 (after header)
<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
  <InfoCard 
    icon={<MapPin className="h-5 w-5" />}
    label="Distance"
    value={`${shipment.distance?.toFixed(1)} km`}
  />
  <InfoCard 
    icon={<Clock className="h-5 w-5" />}
    label="Duration"
    value={`${Math.ceil((shipment.duration || 0) / 60)} mins`}
  />
  <InfoCard 
    icon={<Truck className="h-5 w-5" />}
    label="Status"
    value={shipment.status.replace(/_/g, ' ')}
  />
  <InfoCard 
    icon={<Zap className="h-5 w-5" />}
    label="Service Tier"
    value={shipment.rateCard?.name || 'Standard'}
  />
</div>

{/* Service Tier Badge */}
<div className="mb-6">
  <p className="text-xs font-medium text-muted-foreground mb-2">SERVICE TIER</p>
  <ServiceTierBadge 
    rateCardName={shipment.rateCard?.name}
    baseRate={shipment.baseRate}
    size="lg"
  />
</div>
```

#### 2. Replace timeline section (find scattered timeline code and replace):
```tsx
<Card>
  <CardHeader title="Delivery Progress" />
  <CardContent>
    <ShipmentTimeline 
      activities={shipment.activities} 
      currentStatus={shipment.status}
    />
  </CardContent>
</Card>
```

#### 3. Replace driver assignment section:
```tsx
{shipment.status === 'PENDING' && !shipment.assignment && (
  <Card className="border-2 border-accent">
    <CardHeader title="🚗 Ready for Assignment" />
    <CardContent className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Select an available driver to start this delivery.
      </p>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {availableDrivers.map((driver) => (
          <button
            key={driver.id}
            onClick={() => {
              setSelectedDriver(driver.id);
              handleAssignDriver();
            }}
            className="w-full p-3 text-left rounded-lg border border-border hover:border-accent hover:bg-accent/5 transition-all flex justify-between items-center"
          >
            <div>
              <p className="font-semibold text-foreground">{driver.user.name}</p>
              <p className="text-xs text-muted-foreground">
                {driver.vehicleType} • ⭐ {driver.rating}
              </p>
            </div>
            <p className="text-xs font-medium text-muted-foreground">
              {driver.totalDeliveries} deliveries
            </p>
          </button>
        ))}
      </div>
    </CardContent>
  </Card>
)}
```

#### 4. Improve commission breakdown:
```tsx
<Card>
  <CardHeader title="Revenue Breakdown" />
  <CardContent className="space-y-4">
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">Delivery Fee (Total)</span>
      <span className="text-lg font-bold">PKR {shipment.actualRate.toFixed(2)}</span>
    </div>

    <div className="pl-4 space-y-2 border-l-2 border-accent">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Your Commission (10%)</span>
        <span className="font-medium text-accent">
          PKR {(shipment.actualRate * 0.1).toFixed(2)}
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Driver Payout (80%)</span>
        <span className="font-medium">
          PKR {(shipment.actualRate * 0.8).toFixed(2)}
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Platform Fee (10%)</span>
        <span className="font-medium">
          PKR {(shipment.actualRate * 0.1).toFixed(2)}
        </span>
      </div>
    </div>
  </CardContent>
</Card>
```

---

## driver/orders/[id]/page.tsx - Implementation Guide

### Current Problems:
- Minimal information layout
- No delivery instructions display
- No route guidance
- COD amount not highlighted

### Required Changes:

#### 1. Add delivery progress header:
```tsx
<div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/20">
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-lg font-bold">Delivery Progress</h2>
    <span className="px-3 py-1 rounded-full bg-accent/20 text-accent text-sm font-semibold">
      {shipment.status.replace(/_/g, ' ')}
    </span>
  </div>
  <ShipmentTimeline 
    activities={shipment.activities}
    currentStatus={shipment.status}
  />
</div>
```

#### 2. Add logistics cards:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
  <InfoCard 
    icon={<MapPin className="h-5 w-5" />}
    label="Distance"
    value={`${shipment.distance?.toFixed(1)} km`}
    subtext={`Est: ${Math.ceil((shipment.duration || 3600) / 300)} mins`}
    variant="highlight"
  />
  <InfoCard 
    icon={<DollarSign className="h-5 w-5" />}
    label="Your Earning"
    value={`PKR ${((shipment.actualRate || 0) * 0.8).toFixed(0)}`}
    subtext="80% of delivery fee"
    variant="success"
  />
</div>
```

#### 3. Replace address section with route cards:
```tsx
<Card>
  <CardHeader title="📍 Route Details" />
  <CardContent className="space-y-4">
    {/* Pickup */}
    <div className="p-4 rounded-lg border-l-4 border-l-blue-500 bg-blue-50">
      <p className="text-xs font-semibold text-blue-600 uppercase">Pickup Location</p>
      <p className="font-semibold text-foreground mt-2">{shipment.pickupAddress}</p>
      <p className="text-sm text-muted-foreground mt-1">
        {shipment.pickupCity}, {shipment.pickupState}
      </p>
      <Button 
        onClick={() => openMaps(shipment.pickupLatitude, shipment.pickupLongitude)}
        size="sm"
        variant="outline"
        className="mt-3"
      >
        Open in Maps →
      </Button>
    </div>

    {/* Divider */}
    <div className="flex items-center gap-2 text-muted-foreground">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs">{shipment.distance?.toFixed(1)} km</span>
      <div className="flex-1 h-px bg-border" />
    </div>

    {/* Delivery */}
    <div className="p-4 rounded-lg border-l-4 border-l-green-500 bg-green-50">
      <p className="text-xs font-semibold text-green-600 uppercase">Delivery Location</p>
      <p className="font-semibold text-foreground mt-2">{shipment.deliveryAddress}</p>
      <p className="text-sm text-muted-foreground mt-1">
        {shipment.deliveryCity}, {shipment.deliveryState}
      </p>
      <Button 
        onClick={() => openMaps(shipment.deliveryLatitude, shipment.deliveryLongitude)}
        size="sm"
        variant="outline"
        className="mt-3"
      >
        Open in Maps →
      </Button>
    </div>
  </CardContent>
</Card>
```

#### 4. Highlight COD and instructions:
```tsx
<Card>
  <CardHeader title="👤 Recipient Details" />
  <CardContent className="space-y-4">
    <InfoCard 
      icon={<User className="h-5 w-5" />}
      label="Name"
      value={shipment.deliveryName}
    />
    <InfoCard 
      icon={<Phone className="h-5 w-5" />}
      label="Phone"
      value={shipment.deliveryPhone}
      action={
        <a href={`tel:${shipment.deliveryPhone}`} className="text-accent hover:underline">
          Call
        </a>
      }
    />

    {/* Delivery Instructions */}
    {shipment.deliveryInstructions && (
      <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
        <p className="text-xs font-semibold text-yellow-700 uppercase mb-2">📝 Instructions</p>
        <p className="text-sm text-yellow-900">{shipment.deliveryInstructions}</p>
      </div>
    )}

    {/* COD Highlight */}
    {shipment.paymentMethod === 'COD' && (
      <div className="p-4 rounded-lg bg-red-50 border-2 border-red-300">
        <p className="text-xs font-semibold text-red-700 uppercase mb-2">💰 COLLECT ON DELIVERY</p>
        <p className="text-2xl font-bold text-red-900">PKR {shipment.codAmount?.toFixed(0)}</p>
        <p className="text-xs text-red-700 mt-2">⚠️ Confirm receipt before leaving</p>
      </div>
    )}
  </CardContent>
</Card>
```

#### 5. Make action contextual:
```tsx
const getNextAction = () => {
  switch(shipment.status) {
    case 'ASSIGNED':
      return { 
        label: '▶️ Start Delivery', 
        action: 'IN_TRANSIT', 
        color: 'bg-blue-600 hover:bg-blue-700' 
      };
    case 'IN_TRANSIT':
      return { 
        label: '✓ Complete Delivery', 
        action: 'DELIVERED', 
        color: 'bg-green-600 hover:bg-green-700' 
      };
    default:
      return null;
  }
};

const nextAction = getNextAction();
{nextAction && (
  <Button 
    onClick={() => handleStatusChange(nextAction.action)}
    className={`w-full py-4 text-lg font-bold ${nextAction.color}`}
    isLoading={isUpdating}
  >
    {nextAction.label}
  </Button>
)}
```

---

## Testing Checklist

- [ ] Mobile responsive (test on iPhone 12 and below)
- [ ] All InfoCards render correctly
- [ ] ServiceTierBadge displays for all tier types
- [ ] ShipmentTimeline shows all statuses
- [ ] Links open correctly (tel:, maps)
- [ ] Buttons trigger correct actions
- [ ] No console errors
- [ ] No layout shifts
- [ ] Meets accessibility standards (a11y)

---

## Migration Path

1. **Day 1**: Create components, verify imports work
2. **Day 2**: Update OrderDetails.tsx (lowest risk)
3. **Day 3**: Update business/shipments/[id]
4. **Day 4**: Update driver/orders/[id]
5. **Day 5**: Testing & bug fixes
6. **Day 6**: Rollout to production

---

## Rollback Plan

If issues arise:
```bash
# Revert components
git revert <components-commit>

# Revert page updates (one at a time)
git revert <seller-update-commit>
git revert <business-update-commit>
git revert <driver-update-commit>
```

Each change is isolated for easy rollback.
