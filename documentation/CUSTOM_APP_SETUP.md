# 🛍️ Custom App Setup - Quick Reference

## The Problem (What You Encountered)

When you saw the error: **"This content is blocked. Contact the site owner to fix the issue."** with an iframe loading at `https://admin.shopify.com/store/pharmapro01/apps/fastship-7`, this meant:

- ❌ You created a **Public App** (loads inside Shopify admin as iframe)
- ❌ Our code was trying to redirect to OAuth callback (breaks out of iframe)
- ❌ Shopify blocked the redirect → iframe error

## The Solution: Use Custom App Instead

Custom App is **simpler for MVP** because:
- ✅ No OAuth redirects
- ✅ Direct API credentials
- ✅ Works perfectly for testing
- ✅ No iframe issues

---

## Step-by-Step: Create & Connect Custom App

### Step 1: Delete the Old Public App

1. Go to **Shopify Admin**
2. **Settings → Apps and integrations → Develop apps**
3. Find **"FastShip-7"** (or your app)
4. Click it
5. **Settings → General**
6. Click **"Delete app"** → Confirm

### Step 2: Create a Custom App

1. **Settings → Apps and integrations → Develop apps**
2. Click **"Create an app"**
3. **Name**: `FastShip` (or your choice)
4. **App type**: Select `Custom app`
5. Click **"Create app"**

### Step 3: Enable Required Scopes

1. Go to **Configuration** tab
2. Under **Admin API scopes**, find and enable:
   - ✅ `read_orders` 
   - ✅ `write_orders`
3. Click **"Save"**
4. A popup will ask to **install** → Click **"Install"**

### Step 4: Copy Credentials

1. Go to **API credentials** tab
2. You'll see **"Admin API access tokens"**
3. **Copy these two values**:
   - 📋 **API access token** (starts with `shpua_`)
   - 📋 **API secret key** (starts with `shpss_`)

⚠️ **Important**: The "API secret key" is NOT your API Secret. Copy the **second field** that starts with `shpss_`

### Step 5: Update .env.local

```env
SHOPIFY_API_KEY=shpua_xxxxxxxxxxxx    # Paste your API access token
SHOPIFY_API_SECRET=shpss_xxxxxxxxxxxx  # Paste your API secret key
ENCRYPTION_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
JWT_SECRET=your_existing_jwt_secret
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Example:**
```env
SHOPIFY_API_KEY=shpua_1234567890abcdefghijk
SHOPIFY_API_SECRET=shpss_abcdefghij1234567890
ENCRYPTION_KEY=a7e8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8
JWT_SECRET=e87623ukhdI*AHdjH@98hDKh298y23oiHhasd89Y@Hkh
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Step 6: Run Database Migration

```bash
npx prisma migrate dev --name "add-shopify-integration-tables"
```

### Step 7: Test in FastShip

1. Start your server: `npm run dev`
2. Go to `/seller/integrations`
3. Click **"Connect Store"** button
4. **Select "Custom App (Easy)" tab**
5. **Fill in the form:**
   - Store URL: `pharmapro01.myshopify.com`
   - API Access Token: `shpua_...` (paste your token)
   - API Secret: `shpss_...` (paste your secret)
6. Click **"Connect Custom App"**

✅ **If successful**: You'll see your store listed as "Connected"

---

## Verify It Works

### Test Order Import

1. In FastShip: **Integrations → Click your store**
2. Click **"Sync Orders"** button
3. You should see a modal with orders from your Shopify store
4. Select a test order and click **"Import"**
5. Check `/seller/orders` to confirm shipment was created

### Check Database

```bash
npx prisma studio
```

Navigate to **Integration** table → verify your store is listed with:
- `shopifyStoreUrl`: pharmapro01.myshopify.com
- `apiKey`: (encrypted)
- `isActive`: true

---

## What Each Variable Means

| Variable | Source | Example |
|----------|--------|---------|
| `SHOPIFY_API_KEY` | Shopify Admin → Configuration → **API access token** | `shpua_1234...` |
| `SHOPIFY_API_SECRET` | Shopify Admin → Configuration → **API secret key** | `shpss_abcd...` |
| `ENCRYPTION_KEY` | Generate yourself (min 32 chars) | `a7e8b9c0d1...` |
| `JWT_SECRET` | Already in your .env | `e87623ukhdI*...` |
| `NEXT_PUBLIC_BASE_URL` | Your app's URL | `http://localhost:3000` |

---

## Troubleshooting

### "Invalid API credentials or store URL"
- Double-check API token (starts with `shpua_`)
- Double-check API secret (starts with `shpss_`)
- Copy directly from Shopify without extra spaces
- Verify store URL format: `storename.myshopify.com`

### "No orders available to import"
- Create test orders in your Shopify store first
- Orders must be in "Draft" or "Pending" status (unshipped)
- Wait a few seconds and try again

### Still seeing iframe error?
- You may still have the old Public App
- Check **Settings → Apps and integrations** for any "FastShip" apps
- Delete all of them
- Create a fresh Custom App following steps above

### Can't find API credentials in Shopify?
- Make sure you're in **Configuration** tab (not **App setup**)
- Scroll down to **"Admin API access tokens"**
- Look for fields that start with `shpua_` and `shpss_`

---

## Next Steps

✅ **After Custom App is connected:**
1. Sync orders from your Shopify store
2. Test order import and transformation
3. Create test shipments to verify address mapping
4. Test tracking sync back to Shopify

🚀 **When ready to scale to multiple sellers:**
- Switch to Public App OAuth flow
- The code already supports both!
