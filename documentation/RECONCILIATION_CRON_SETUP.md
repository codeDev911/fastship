# Vercel Cron Job Setup Guide - Reconciliation

## Overview
The reconciliation system now includes automatic cleanup to prevent database bloat. A scheduled cron job runs every 6 hours to:
1. ✅ Check all wallets for balance mismatches
2. 🚨 Create alerts for any discrepancies
3. 🗑️ Delete old clean records to keep the database lean
4. 📊 Generate reconciliation summary

## Setup Instructions

### 1. Set Environment Variables

Create or update `.env.local` in your `apps/api` directory:

```env
# Cron Job Security - REQUIRED for Vercel
CRON_SECRET=your-secure-random-string-here
```

For production/Vercel:
- Go to Vercel Project Settings → Environment Variables
- Add `CRON_SECRET=your-secure-random-string-here`
- Apply to all environments (Production, Preview, Development)

**Generate a secure secret:**
```bash
openssl rand -base64 32
```

### 2. Cron Job Configuration

The cron job is already configured in `apps/api/vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/reconciliation",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

**Schedule Explanation:**
- `0 */6 * * *` = Every 6 hours at minute 0
- Runs at: 00:00, 06:00, 12:00, 18:00 UTC
- Adjust schedule as needed using cron syntax

### 3. Cron Endpoint

The endpoint is located at:
```
POST /api/cron/reconciliation
```

**Request:**
- Method: `GET` or `POST`
- Header: `Authorization: Bearer YOUR_CRON_SECRET`
- Vercel automatically sets this header

**Response:**
```json
{
  "timestamp": "2026-04-22T10:30:00Z",
  "duration": "2450ms",
  "reconciliation": {
    "ok": 145,
    "mismatches": 2,
    "errors": 0,
    "total": 147
  },
  "alerts": {
    "before": {
      "total": 5,
      "bySeverity": { "CRITICAL": 1, "HIGH": 2, "MEDIUM": 2, "LOW": 0 },
      "byStatus": { "NEW": 3, "ACKNOWLEDGED": 2, "RESOLVED": 0 },
      "requiresAction": 5
    },
    "after": {
      "total": 5,
      "bySeverity": { "CRITICAL": 1, "HIGH": 2, "MEDIUM": 2, "LOW": 0 },
      "byStatus": { "NEW": 3, "ACKNOWLEDGED": 2, "RESOLVED": 0 },
      "requiresAction": 5
    }
  },
  "cleanup": {
    "logsDeleted": 145,
    "alertsDeleted": 8,
    "message": "Cleanup complete: Deleted 145 old reconciliation logs and 8 old resolved alerts"
  },
  "nextRun": "2026-04-22T16:30:00Z"
}
```

## Data Retention Policy

### Reconciliation Logs
| Status | Retention |
|--------|-----------|
| `OK` | 1 day (then deleted) |
| `RECONCILED` | 1 day (then deleted) |
| `MISMATCH_ALERT` | Forever (for forensics) |
| `BANK_MISMATCH` | Forever (for forensics) |
| `ERROR` | Forever (for debugging) |

### Reconciliation Alerts
| Status | Retention |
|--------|-----------|
| `NEW` | Forever (until acknowledged/resolved) |
| `ACKNOWLEDGED` | Forever (until resolved) |
| `RESOLVED` | 7 days (then deleted) |

**Why?**
- ✅ Keeps database lean (remove noise)
- ✅ Preserves critical data (problems, issues)
- ✅ Maintains audit trail (7 days of resolved issues)

## Testing

### Test Locally
```typescript
// In your app
import { reconciliationService } from "@/lib/services/financial.engine";

// Manual run
const result = await reconciliationService.runScheduledReconciliation();
console.log(result);

// Check DB size
const stats = await reconciliationService.getReconciliationDbStats();
console.log(stats);
```

### Test on Vercel
```bash
# Trigger the cron manually (Vercel Pro+ only)
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-domain.vercel.app/api/cron/reconciliation
```

## Monitoring

### Dashboard Stats
```typescript
const stats = await reconciliationService.getAlertStats();
// {
//   total: 10,
//   bySeverity: { CRITICAL: 1, HIGH: 2, MEDIUM: 3, LOW: 4 },
//   byStatus: { NEW: 5, ACKNOWLEDGED: 3, RESOLVED: 2 },
//   requiresAction: 8
// }
```

### Database Size
```typescript
const dbStats = await reconciliationService.getReconciliationDbStats();
// {
//   reconciliationLogs: { count: 1245, sizeBytes: 256789, sizeMB: "0.25" },
//   reconciliationAlerts: { count: 23, sizeBytes: 45123, sizeMB: "0.04" }
// }
```

### View Logs
- Vercel Console: Project Settings → Functions → View Logs
- Search for `[CRON]` prefix to find reconciliation job logs
- Check CloudWatch/logs for error tracking

## Troubleshooting

### Cron Not Running
1. Verify `CRON_SECRET` is set in Vercel Environment Variables
2. Check Vercel project is on "Hobby" plan or higher (Crons require paid plans)
3. Verify `vercel.json` has correct crons configuration
4. Check Function Logs in Vercel dashboard

### Authorization Errors
- ❌ Error: "Unauthorized"
- ✅ Solution: Verify `CRON_SECRET` matches in Vercel env vars and code

### Database Bloat Not Decreasing
- ❌ Problem: Old records still in database
- ✅ Check: Run `getReconciliationDbStats()` to verify cleanup is working
- ✅ Verify: Status field has correct values (OK/RECONCILED for logs, RESOLVED for alerts)

### Missing Data After Cleanup
- ❌ Deleted records you needed?
- ✅ This shouldn't happen - only "clean" status records are deleted
- ✅ MISMATCH_ALERT, ERROR, and NEW alerts are kept forever

## Customization

### Change Cleanup Schedule
Edit `apps/api/vercel.json`:
```json
{
  "path": "/api/cron/reconciliation",
  "schedule": "0 0 * * *"  // Daily at midnight UTC
}
```

### Change Retention Period
Edit `financial.engine.ts` `cleanupOldReconciliations()`:
```typescript
const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Change duration here
const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Change here
```

### Disable Cleanup
In `runScheduledReconciliation()`, comment out:
```typescript
// const cleanup = await this.cleanupOldReconciliations();
```

## Architecture

```
Vercel Cron (every 6 hours)
    ↓
GET /api/cron/reconciliation
    ↓
reconciliationService.runScheduledReconciliation()
    ↓
[1] reconcileAllWallets()
    - Loop through all wallets
    - Compare ledger_cents vs balance_cents
    - Create alerts on mismatch
    ↓
[2] getAlertStats() - Before
    ↓
[3] cleanupOldReconciliations()
    - Delete OK/RECONCILED logs older than 1 day
    - Delete RESOLVED alerts older than 7 days
    ↓
[4] getAlertStats() - After
    ↓
Return summary + cleanup results
```

## Database Queries

### View Reconciliation Alerts
```sql
SELECT id, severity, type, status, message, created_at
FROM "ReconciliationAlert"
WHERE status != 'RESOLVED'
ORDER BY severity DESC, created_at DESC;
```

### View Problem Records (never deleted)
```sql
SELECT id, status, message, created_at
FROM "ReconciliationLog"
WHERE status IN ('MISMATCH_ALERT', 'BANK_MISMATCH', 'ERROR')
ORDER BY created_at DESC;
```

### Check Cleanup Impact
```sql
SELECT
  COUNT(*) total,
  SUM(CASE WHEN status = 'OK' THEN 1 ELSE 0 END) ok_records,
  SUM(CASE WHEN status = 'MISMATCH_ALERT' THEN 1 ELSE 0 END) mismatch_records
FROM "ReconciliationLog";
```

## Next Steps

1. ✅ Deploy `financial.engine.ts` changes
2. ✅ Deploy `/api/cron/reconciliation` endpoint
3. ✅ Set `CRON_SECRET` in Vercel environment
4. ✅ Commit and push to trigger Vercel build
5. ✅ Verify cron in Vercel dashboard after 6 hours
6. 🔍 Monitor first few runs to ensure cleanup works
7. 📊 Create dashboard to display reconciliation alerts to finance team
