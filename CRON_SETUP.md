# ⏰ CRON JOB SETUP

## Purpose

Automatically enforce escrow deadlines so no transaction stays in limbo forever.

---

## What It Does

The deadline enforcement cron job:

1. **Checks all active escrows** every hour
2. **Identifies expired deadlines** (acceptance, funding, review)
3. **Auto-transitions state** based on timeout rules:
   - `PENDING_ACCEPTANCE` (7 days) → `AUTO_CANCELLED`
   - `ACCEPTED_WAITING_FUNDING` (3 days) → `AUTO_CANCELLED`
   - `DELIVERED_REVIEW` (7 days) → `AUTO_APPROVED`
4. **Logs all transitions** for audit trail
5. **Sends notifications** (TODO: implement email/push)

---

## Files Created

| File | Purpose |
|------|---------|
| `src/lib/cron/deadlines.ts` | Deadline enforcement logic |
| `src/lib/cron/index.ts` | Cron job registry |
| `CRON_SETUP.md` | This guide |

---

## Setup Options

### **Option 1: OpenClaw Gateway Cron (Recommended)**

Add to your OpenClaw gateway configuration:

```json
{
  "cron": {
    "jobs": [
      {
        "name": "flint-deadline-enforcement",
        "schedule": {
          "kind": "every",
          "everyMs": 3600000  // 1 hour
        },
        "payload": {
          "kind": "systemEvent",
          "text": "npx ts-node src/lib/cron/index.ts"
        },
        "sessionTarget": "isolated",
        "workdir": "/mnt/data/openclaw/workspace/.openclaw/workspace/flint"
      }
    ]
  }
}
```

**Benefits:**
- ✅ Integrated with OpenClaw
- ✅ Logs visible in gateway
- ✅ Easy to monitor/debug
- ✅ Automatic retries

---

### **Option 2: Vercel Cron (Production)**

Create `api/cron/deadlines/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { enforceDeadlines } from '@/lib/cron/deadlines';

export async function GET(req: NextRequest) {
  // Verify cron secret (prevent unauthorized access)
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const result = await enforceDeadlines();
  
  return NextResponse.json({
    success: result.errors.length === 0,
    checked: result.checked,
    transitioned: result.transitioned,
    errors: result.errors,
  });
}
```

Then use Vercel Cron:

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/deadlines",
      "schedule": "0 * * * *"
    }
  ]
}
```

**Benefits:**
- ✅ Runs on Vercel infrastructure
- ✅ No additional setup
- ✅ Scales automatically

---

### **Option 3: Manual Testing**

Run manually to test:

```bash
cd /mnt/data/openclaw/workspace/.openclaw/workspace/flint
npx ts-node src/lib/cron/deadlines.ts
```

Or run all jobs:

```bash
npx ts-node src/lib/cron/index.ts
```

---

## Monitoring

### **Check Logs**

```bash
# View recent cron runs
openclaw cron runs --job flint-deadline-enforcement
```

### **Expected Output**

```
⏰ Starting deadline enforcement... 2026-05-07T00:00:00.000Z
📋 Found 15 active escrows to check
⏳ Escrow abc123: 5 days left
⏳ Escrow def456: 2 days left
⚠️  Escrow ghi789 expired! Transitioning to AUTO_CANCELLED
✅ Escrow ghi789 auto-transitioned to AUTO_CANCELLED
✅ Deadline enforcement complete. Transitioned: 1
```

---

## Environment Variables

Add to `.env.local`:

```bash
# Required for cron jobs
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Optional: Cron secret for Vercel
CRON_SECRET=generate_random_secret_here
```

---

## Testing

### **Create Test Escrow**

1. Create an escrow via `/api/escrow/create`
2. Note the `acceptance_deadline` (7 days from now)
3. Manually update deadline to past:

```sql
UPDATE escrows 
SET acceptance_deadline = (EXTRACT(EPOCH FROM NOW() - INTERVAL '1 day') * 1000)
WHERE id = 'your_test_escrow_id';
```

4. Run cron job:

```bash
npx ts-node src/lib/cron/deadlines.ts
```

5. Verify state changed to `AUTO_CANCELLED`

---

## Alerts (TODO)

Future enhancement: Set up alerts for:

- ❌ More than 10 auto-transitions in 1 hour (possible issue)
- ⚠️ Cron job fails to run for 6+ hours
- ⚠️ Database connection errors

---

## Next Steps

1. ✅ Create cron job files
2. ⏳ Set up OpenClaw gateway cron OR Vercel cron
3. ⏳ Test with manual run
4. ⏳ Monitor first week of automatic runs
5. ⏳ Add email notifications on auto-transition

---

**Questions?** See `FOUNDATION_PLAN.md` for full roadmap.
