# Cost breakdown

> All numbers are from each vendor's published pricing page as of July 2026. Verify before signing up — pricing changes.

## TL;DR

**At 0–100 concurrent students**: **$0/month** (all services on free tier)

**At ~1,000 concurrent students**: ~$60/month

**At ~10,000 concurrent students**: ~$250/month

---

## Per-service breakdown

### 1. MongoDB Atlas — **Free** at small scale

| Tier | Storage | RAM | Concurrent | Price |
|---|---|---|---|---|
| M0 (free) | 512 MB | shared | ~100 concurrent | **$0** |
| M10 | 10 GB | 2 GB dedicated | ~500 concurrent | $9/mo |
| M20 | 20 GB | 4 GB dedicated | ~1,000 concurrent | $25/mo |
| M30 | 40 GB | 8 GB dedicated | ~5,000 concurrent | $57/mo |

**What you store**: 1,060 questions (~5 MB), 6 modules + 53 sections + 159 items (~1 MB), per-user progress (~50 KB per user). 1k users ≈ 50 MB. **Free tier lasts a long time.**

**Watch out**: 100 RPU/s on free tier can throttle under burst. Production should use M10+.

### 2. Vercel — **Free** at small scale

| Tier | Bandwidth | Serverless exec | Edge | Price |
|---|---|---|---|---|
| Hobby (free) | 100 GB/mo | 100 GB-hours/mo | ✓ | **$0** |
| Pro | 1 TB/mo | 1000 GB-hours/mo | ✓ | $20/mo |
| Enterprise | custom | custom | ✓ | custom |

**Hobby limits**: 10s max function duration (so SSE streams must be 10s — fine for heartbeat, may be too short for long-lived sessions).

**Pro is required if**: you need >10s SSE streams, custom domains, password protection, or >100 GB bandwidth.

### 3. Vercel KV (Upstash Redis) — **Free** at small scale

| Tier | Commands/day | Storage | Price |
|---|---|---|---|
| Free | 10,000 | 256 MB | **$0** |
| Pay-as-you-go | unlimited | 256 MB | $0.20 per 100k commands |

**What you store**: live presence heartbeats (10s TTL, ~10s write per user = 8.6k writes/min for 1k users = 12.4M/day). **Exceeds free tier at ~80 concurrent users.**

**Estimate**: 1k concurrent → $0.75/day → $22/mo in KV alone. 10k concurrent → $220/mo.

### 4. Mux — **Free** at small scale

| Tier | Stored video | Mux minutes watched | Price |
|---|---|---|---|
| Free | 1,000 min stored | 1,000 min watched/mo | **$0** |
| Pay-as-you-go | $0.005/min stored | $0.005/min watched | per use |

**53 videos × ~10 min = 530 min stored** (under free tier).

**Watch-time**: 1k users × 5 min/day × 30 days = 150k min/mo = $750/mo. **This is the biggest cost.**

**Mitigation**:
- Use Mux's `plan: "baseline"` (free) for low-quality preview, charge full price for HD
- Set `max_resolution: 720p` for school-bandwidth scenarios
- Cache popular videos on Cloudflare Stream as a backup

### 5. Cloudinary — **Free** at small scale

| Tier | Storage | Bandwidth | Transformations | Price |
|---|---|---|---|---|
| Free | 25 GB | 25 GB/mo | 25k/mo | **$0** |
| Plus | 100 GB | 100 GB/mo | 50k/mo | $99/mo |
| Advanced | 200 GB | 200 GB/mo | 100k/mo | $224/mo |

**What you store**: anomaly screenshots (320×240 JPG ≈ 30 KB each, 100/day = 1 GB/mo), video posters, video captions.

**1k users with 5 anomalies/day = 150k screenshots/mo = 4.5 GB** — under free tier for a while.

### 6. Resend — **Free** at small scale

| Tier | Emails/mo | Price |
|---|---|---|
| Free | 3,000 | **$0** |
| Pro | 50,000 | $20/mo |

**100 viva approvals/day × 30 days = 3,000/month**. **At the free tier ceiling.**

**Mitigation**:
- Only send transactional emails (viva approved/rejected), not every quiz submit
- Batch daily digest emails for non-critical notifications

### 7. samagama.in OAuth — **Free** (you own it)

You're the IdP. No cost. Just need to expose 3 endpoints.

### 8. Domain name — **$10–15/year**

- `swadhyaya.app` via Namecheap / Cloudflare Registrar / Porkbun ≈ $10–15/yr
- Vercel gives you a free `swadhyaya.vercel.app` subdomain if you don't want to buy

### 9. SSL — **Free** (Vercel + Cloudflare provide)

### 10. NextAuth — **Free** (open source)

---

## Total monthly cost scenarios

| Scenario | Concurrent users | Monthly cost | Notes |
|---|---|---|---|
| **Pilot** (1 instructor, <50 students) | 20 | **$0** | All free tiers |
| **Single school** (200 students) | 100 | **$0** | Mux free, KV free |
| **Multiple schools** (2,000 students) | 500 | ~$60 | Vercel Pro $20 + KV $22 + Mux $15 (capped) |
| **State-wide** (10,000 students) | 2,500 | ~$250 | Vercel Pro $20 + Mongo M30 $57 + KV $110 + Mux $60 + Cloudinary $0 + Resend $20 |
| **National** (50,000+ students) | 10,000+ | $1,000+ | All paid tiers, contact sales |

---

## What's required to launch at $0

You need:
1. **MongoDB Atlas M0** (free) — 2 minutes to set up
2. **Vercel Hobby** (free) — already configured via `vercel.json`
3. **Vercel KV** (free) — but **only 80 concurrent users** before overage charges
4. **Mux** (free) — 1,000 min watched/mo (≈ 200 students × 5 min/day × 30 days = enough for a class)
5. **Cloudinary** (free) — 25 GB
6. **Resend** (free) — 3,000 emails/mo
7. **samagama.in** — your own IdP, just expose 3 endpoints
8. **Domain** (optional) — `swadhyaya.vercel.app` is free

**Total: $0/month** for a pilot with up to 200 students.

---

## Cost-reduction strategies

1. **Use Cloudflare Stream** instead of Mux ($1/1000 min vs Mux $5/1000 min)
2. **Self-host Postgres** instead of MongoDB (free forever on a $5/mo VPS)
3. **Use Upstash Redis** directly (cheaper than Vercel KV at scale)
4. **Skip Cloudinary** — store screenshots in MongoDB GridFS (free)
5. **Use Resend only for critical emails** — digest notifications in-app instead
6. **Vercel Edge for read paths, Node only for writes** (Edge free tier is more generous)

---

## Self-hosting alternative (full $0 if you have a server)

A single Hetzner CPX21 (€8.50/mo ~ $9) can run:
- Next.js (via `next start` or PM2)
- MongoDB
- Redis
- Mux Self-hosted replacement (Jellyfin + ffmpeg, or use Mux free for live)
- Cloudinary replacement (sharp + local nginx)

**Total**: $9/mo for 1000+ concurrent students, no vendor lock-in.
