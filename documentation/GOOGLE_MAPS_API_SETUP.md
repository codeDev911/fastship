# Google Maps API Setup Guide

## Quick Start

1. **Create Google Cloud Project** (if you don't have one)
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Click "Select a Project" → "New Project"
   - Name: "FastShip Maps"
   - Create

2. **Enable Required APIs**
   - In Cloud Console, search for each API and enable it:
     - **Maps URLs API** - Required for URL generation
     - **Maps Embed API** - Optional, for embedded maps
     - **Maps JavaScript API** - For interactive features (future)
     - **Places API** - For location autocomplete (future)

3. **Create API Key**
   - Go to **Credentials** (left sidebar)
   - Click **+ Create Credentials** → **API Key**
   - Copy the key
   - Click the key to open settings

4. **Set API Key Restrictions**

   **Application restrictions:**
   - Select "HTTP referrers (websites)"
   - Add these patterns:
     - Development: `http://localhost:3000/*`
     - Staging: `https://staging.your-domain.com/*`
     - Production: `https://www.your-domain.com/*`

   **API restrictions:**
   - Select "Restrict key"
   - Check these APIs:
     - ✓ Maps URLs API
     - ✓ Maps Embed API
     - ✓ Maps JavaScript API
     - ✓ Places API

5. **Add to Environment**
   ```env
   # .env.local (development)
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE

   # Or in production environment variables:
   # Platform: Vercel, Netlify, etc.
   # Variable: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
   ```

6. **Restart Dev Server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

## Environment Variables

### Development (.env.local)

```env
# Never commit this file to git!
# Add to .gitignore if not already there
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyD_example_key_here_abc123
```

### Production (Vercel/Netlify)

1. **Vercel:**
   - Go to Project Settings → Environment Variables
   - Add: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` = `YOUR_KEY`
   - Redeploy

2. **Netlify:**
   - Site Settings → Build & Deploy → Environment
   - Add: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` = `YOUR_KEY`
   - Trigger new deploy

## Billing Setup

### Enable Billing

1. In Cloud Console, go to **Billing** (left sidebar)
2. Click **Create Billing Account**
3. Fill in payment information
4. Attach to your FastShip project

### Set Budget Alerts (Optional but Recommended)

1. Go to **Billing** → **Budgets and alerts**
2. Click **Create Budget**
3. Set budget: $100/month
4. Enable email alerts

### Pricing Information

**Maps URLs API** - **FREE** (no costs)
- Unlimited search URLs
- Unlimited direction URLs
- Unlimited place URLs

**Maps Embed API** - **FREE** (up to 14,000 loads/day)
- After that: $0.007 per load

**Maps JavaScript API** - $0.007 per 1,000 loads
**Places API** - $0.017 per 1,000 requests

**FastShip Usage (Estimated):**
- Maps URLs API: FREE (primary)
- Maps Embed API: ~$50/month (if using embedded maps for 1M+ page loads)
- JavaScript API: ~$20/month (if using interactive mapping)

## Troubleshooting

### "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not configured"

**Cause:** Environment variable not set

**Fix:**
1. Add to `.env.local`:
   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_KEY
   ```
2. Restart dev server: `npm run dev`

### "Maps requests blocked" Console Errors

**Cause:** API Key restrictions don't match your domain

**Fix:**
1. Go to Cloud Console → Credentials
2. Click your API key
3. Under "Restrictions" → "Application restrictions"
4. Verify your domain is listed (use wildcards for subdomains)
5. Example: `https://*.vercel.app/*` for Vercel deployments

### API Not Enabled

**Cause:** Required API is disabled

**Fix:**
1. Go to Cloud Console → APIs & Services → Enabled APIs
2. Search for "Maps URLs API"
3. Click it, then click "Enable"
4. Wait 1-2 minutes for activation

### "Billing Account Required"

**Cause:** Need billing to use this API

**Fix:**
- Maps URLs API doesn't require billing (it's free)
- Enable billing on your project first (as safety measure)
- Then enable Maps URLs API

## Security Best Practices

### 1. Never Commit Keys

```bash
# Ensure .env.local is in .gitignore
echo ".env.local" >> .gitignore
```

### 2. Use HTTP Referrers

- Always set API key restrictions to specific domains
- Don't use wildcard `*` in production
- Add both `http` and `https`

### 3. Rotate Keys Periodically

1. Create new API key
2. Update environment variables
3. Delete old key after testing

### 4. Monitor Usage

1. Cloud Console → APIs & Services → Quotas
2. Check Maps URLs API usage
3. Set up alerts if approaching limits

## Multiple Environments

### Setup for Dev/Staging/Prod

```env
# .env.local (local development)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyD_..._LOCAL

# Staging environment (example: Vercel)
# NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyD_..._STAGING

# Production environment (example: Vercel)
# NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyD_..._PROD
```

Each environment can have:
- Separate API keys
- Different HTTP referrer restrictions
- Independent quota limits

## Testing

### Test if API Key Works

```typescript
// In your dev tools console
const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
console.log('API Key configured:', key ? 'Yes' : 'No');

// Or import the validator
import { validateGoogleMapsConfig } from '@/lib/config/google-maps';
console.log('Valid:', validateGoogleMapsConfig());
```

### Manual URL Test

If API key is set, these URLs should work:
```
https://www.google.com/maps/search/coffee+near+me
https://www.google.com/maps/dir/New+York/Boston
```

## Google Cloud Cost Calculator

[Price calculator](https://cloud.google.com/products/calculator-legacy) to estimate your usage:

1. Add "Maps URLs API" (select)
2. Leave at default (free tier)
3. Add "Maps JavaScript API" for any interactive features
4. Estimate monthly requests
5. See projected cost

## Support

- **Google Cloud Support:** https://cloud.google.com/contact
- **FastShip Maps Docs:** See `GOOGLE_MAPS_IMPLEMENTATION.md`
- **Integration Examples:** See `MAPS_INTEGRATION_EXAMPLES.md`

## Checklist

Before deploying:

- [ ] API key created in Google Cloud Console
- [ ] APIs enabled (Maps URLs API, etc.)
- [ ] HTTP referrers configured (not using wildcard)
- [ ] Billing account activated
- [ ] `.env.local` added to `.gitignore`
- [ ] Production environment variables set (Vercel/Netlify)
- [ ] Tested in development (`npm run dev`)
- [ ] Tested in production (after deploy)
- [ ] Budget alerts set up
- [ ] Team notified of API key (if shared)

Happy mapping! 🗺️
