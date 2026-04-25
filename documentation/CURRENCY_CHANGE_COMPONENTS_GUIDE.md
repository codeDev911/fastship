# Currency Change Components - Implementation Guide

## Overview

Currency selector components have been created and integrated into the Business, Driver, and Seller apps' settings pages. This allows users to change their preferred currency for displaying amounts and prices across the platform.

## 📦 Components Created

### 1. **CurrencySelector** 
- **Location**: `/packages/lib/components/CurrencySelector.tsx`
- **Purpose**: Reusable dropdown component for selecting from supported currencies
- **Supported Currencies**: USD, EUR, GBP, INR, AED, PKR, SGD, MYR, THB, IDR

```typescript
import { CurrencySelector } from '@fastship/lib/components';

<CurrencySelector
  value={Currency.USD}
  onChange={(curr) => setUserCurrency(curr)}
  label="Preferred Currency"
  showSymbol={true}
  showFullName={true}
/>
```

### 2. **CurrencySettings**
- **Location**: `/packages/lib/components/CurrencySettings.tsx`
- **Purpose**: Complete settings card for managing currency preferences with save functionality
- **Features**:
  - Fetches current user currency preference
  - Real-time preview of currency formatting
  - Save to database
  - Success/error notifications
  - Compact and full view modes

```typescript
import { CurrencySettings } from '@fastship/lib/components';

<CurrencySettings
  userId="user-123"
  userType="business"
  onCurrencyChange={(curr) => console.log('Changed to:', curr)}
  compact={false}
/>
```

### 3. **CurrencyDisplay**
- **Location**: `/packages/lib/components/CurrencyDisplay.tsx`
- **Purpose**: Display formatted currency amounts throughout the UI

```typescript
import { CurrencyDisplay, CurrencyBadge } from '@fastship/lib/components';

// Display amount with formatting
<CurrencyDisplay
  amount={1000.50}
  currency={Currency.EUR}
  showSymbol={true}
  showCode={true}
/>
// Output: €1,000.50 EUR

// Show currency badge
<CurrencyBadge currency={Currency.PKR} />
// Output: ₨ PKR
```

## 🎣 Hooks

### **useCurrencyPreference**
- **Location**: `/packages/lib/hooks/useCurrencyPreference.ts`
- **Purpose**: Hook to fetch and manage user's currency preference

```typescript
import { useCurrencyPreference } from '@fastship/lib';

export function MyComponent() {
  const { currency, setCurrency, isLoading, error } = useCurrencyPreference();
  
  return (
    <div>
      <p>Current: {currency}</p>
      <button onClick={() => setCurrency(Currency.EUR)}>Change to EUR</button>
    </div>
  );
}
```

### **useOnCurrencyChange**
- **Purpose**: Listen for currency changes across the app
- **Usage**: Re-render components when user changes currency elsewhere

```typescript
import { useOnCurrencyChange } from '@fastship/lib';

export function WalletDisplay() {
  useOnCurrencyChange((newCurrency) => {
    // Refetch or recalculate wallet balance in new currency
    console.log('Currency changed to:', newCurrency);
  });
  
  return <div>{/* Display wallet */}</div>;
}
```

## 🔌 API Endpoints

### **GET /api/user/currency**
Fetch user's current currency preference

```bash
curl GET "http://localhost:3000/api/user/currency?userId=user-123"

# Response
{
  "userId": "user-123",
  "email": "user@example.com",
  "preferredCurrency": "USD"
}
```

### **PATCH /api/user/currency**
Update user's currency preference

```bash
curl -X PATCH "http://localhost:3000/api/user/currency" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "preferredCurrency": "EUR"
  }'

# Response
{
  "success": true,
  "message": "Currency updated to EUR",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Doe",
    "preferredCurrency": "EUR"
  }
}
```

## 🚀 Integration in Apps

### Business App
**File**: `/packages/ui/business/SettingsPage.tsx`
- CurrencySettings added after User Information section
- Displays full card with preview
- Integrated seamlessly with existing settings layout

```typescript
<CurrencySettings
  userId={userId}
  userType="business"
/>
```

### Driver App
**File**: `/apps/driver/components/DriverSettings.tsx`
- CurrencySettings added after Notification Preferences section
- Maintains consistent styling with driver app UI
- Compact=false for full card display

```typescript
<CurrencySettings
  userType="driver"
  compact={false}
/>
```

### Seller App
**File**: `/apps/seller/app/(seller)/settings/page.tsx`
- CurrencySettings added at the end of settings page
- Integrated with existing seller settings layout
- Full card display for consistency

```typescript
<CurrencySettings
  userType="seller"
  compact={false}
/>
```

## 💾 Database Changes

The `preferredCurrency` field was already added to the User model in the Prisma schema:

```prisma
model User {
  // ... other fields ...
  preferredCurrency Currency @default(USD)
}
```

This field stores the user's selected currency preference.

## 🎯 Usage Patterns

### Pattern 1: Let User Change Currency in Settings
```typescript
<CurrencySettings
  userId={userId}
  userType="business"
  onCurrencyChange={(newCurrency) => {
    // Optionally handle currency change
    console.log('User changed to:', newCurrency);
  }}
/>
```

### Pattern 2: Display Amount in User's Currency
```typescript
import { CurrencyDisplay } from '@fastship/lib/components';
import { useCurrencyPreference } from '@fastship/lib';

export function WalletBalance() {
  const { currency } = useCurrencyPreference();
  const balance = 1000;
  
  return (
    <CurrencyDisplay
      amount={balance}
      currency={currency}
      showSymbol={true}
      showCode={true}
    />
  );
}
```

### Pattern 3: Use Currency in Compact Mode (Dashboard)
```typescript
<CurrencySettings
  compact={true}
  onCurrencyChange={() => {
    // Refresh wallet, transactions, etc.
    window.location.reload();
  }}
/>
```

### Pattern 4: Listen for Global Currency Changes
```typescript
import { useOnCurrencyChange } from '@fastship/lib';

export function TransactionsList() {
  const [transactions, setTransactions] = useState([]);
  
  // Re-fetch transactions when currency changes
  useOnCurrencyChange(async (newCurrency) => {
    const res = await fetch(`/api/transactions?currency=${newCurrency}`);
    setTransactions(await res.json());
  });
  
  return <TransactionTable data={transactions} />;
}
```

## 🛠️ Customization

### Change Supported Currencies
Edit `/packages/lib/components/CurrencySelector.tsx`:

```typescript
const SUPPORTED_CURRENCIES = [
  Currency.USD,
  Currency.EUR,
  Currency.GBP,
  // Add more as needed
];
```

### Customize Display Format
Edit `/packages/lib/components/CurrencyDisplay.tsx`:

```typescript
// Add custom formatting logic
const formattedAmount = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: decimalPlaces,
  maximumFractionDigits: decimalPlaces,
  style: 'currency',
  currency: currency,
}).format(amount);
```

### Change API Endpoint Validation
Edit `/apps/api/app/api/user/currency/route.ts`:

```typescript
const validCurrencies = [
  'USD',
  'EUR',
  'GBP',
  // Add more currencies here
];
```

## 📝 Component Props Reference

### CurrencySelector Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | Currency | - | Selected currency |
| onChange | (currency: Currency) => void | - | Callback on change |
| label | string | 'Currency' | Label text |
| disabled | boolean | false | Disable selector |
| className | string | '' | Custom CSS classes |
| showSymbol | boolean | true | Show currency symbol |
| showFullName | boolean | true | Show full currency name |

### CurrencySettings Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| userId | string | - | User ID (optional, fetches from localStorage) |
| userType | string | 'business' | Type of user (business/driver/seller) |
| onCurrencyChange | (currency: Currency) => void | - | Callback on save |
| compact | boolean | false | Show compact version |

### CurrencyDisplay Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| amount | number | - | Amount to display |
| currency | Currency | USD | Currency to use |
| showCode | boolean | true | Show currency code |
| showSymbol | boolean | true | Show currency symbol |
| decimalPlaces | number | 2 | Decimal places to show |
| className | string | '' | Custom CSS classes |

## 🧪 Testing

### Test 1: Change Currency in Settings
1. Go to Settings page in Business/Driver/Seller app
2. Scroll to Currency Preferences
3. Select different currency
4. Click "Save Currency Preference"
5. Verify success message
6. Reload page - currency should be saved

### Test 2: Display Currency in Components
```typescript
// In a component using currency
import { CurrencyDisplay } from '@fastship/lib/components';

<CurrencyDisplay
  amount={1500.50}
  currency={Currency.EUR}
/>
```

### Test 3: Listen for Currency Changes
```typescript
import { useOnCurrencyChange } from '@fastship/lib';

useOnCurrencyChange((newCurrency) => {
  console.log('Currency changed to:', newCurrency);
  // Verify this logs when user changes currency in settings
});
```

## 🔗 Files Modified

1. **Created**:
   - `/packages/lib/components/CurrencySelector.tsx` - Dropdown component
   - `/packages/lib/components/CurrencySettings.tsx` - Full settings card
   - `/packages/lib/components/CurrencyDisplay.tsx` - Display components
   - `/packages/lib/components/index.ts` - Component exports
   - `/packages/lib/hooks/useCurrencyPreference.ts` - Custom hooks
   - `/apps/api/app/api/user/currency/route.ts` - API endpoints

2. **Modified**:
   - `/packages/lib/hooks.ts` - Added currency hook exports
   - `/packages/ui/business/SettingsPage.tsx` - Added CurrencySettings
   - `/apps/driver/components/DriverSettings.tsx` - Added CurrencySettings
   - `/apps/seller/app/(seller)/settings/page.tsx` - Added CurrencySettings

## 🚀 Next Steps

1. **Test the components** in each app
2. **Verify API endpoints** work correctly
3. **Update transaction displays** to show amounts in user's currency
4. **Create dashboard widgets** that display balance in selected currency
5. **Add real-time updates** when currency changes across the app

## 📚 Additional Resources

- Currency Utilities: `/packages/lib/utils/currency.utils.ts`
- Prisma Schema: `/apps/api/lib/prisma/schema.prisma`
- Financial Service: `/apps/api/lib/services/financial.service.ts`
- Currency Service: `/apps/api/lib/services/currency.service.ts`
