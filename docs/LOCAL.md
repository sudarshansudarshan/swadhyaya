# Local development — $0 cost

You can view **every feature of Swadhyaya locally without paying anything**.

## Prerequisites

You already have:
- ✅ **Node.js 18+** + **pnpm**
- ✅ **MongoDB** (via `brew install mongodb-community@8.2`) running on `127.0.0.1:27017`

That's it. No cloud accounts. No API keys. No domain.

## Start the dev server

```bash
cd ~/Documents/Developer/swadhyaya
./scripts/dev-start.sh
```

That's it. The script will:
1. Auto-detect your brew MongoDB (or Docker if you prefer)
2. Run `prisma db push` to create the schema
3. Run `pnpm seed` if the database is empty (1,060 questions + 252 slots + 3 instructors)
4. Start `next dev` on http://localhost:3000

**Output:**
```
🚀 Swadhyaya local dev starting...
📦 Using brew MongoDB on 27017
🗄️  Syncing Prisma schema...
✓ Database already seeded (1060 questions present)

🎉 Starting Next.js dev server...

   📍 App:           http://localhost:3000
   🔐 Sign in as:    admin@iitrpr.ac.in (auto-promoted to ADMIN)
   💾 Database:      mongodb://127.0.0.1:27017/swadhyaya
   💰 Cost:          $0/month
```

## How to log in (no password needed)

The dev mode bypasses samagama.in OAuth. Set the `x-dev-user` header to "log in":

```bash
# As admin
curl http://localhost:3000/dashboard -H "x-dev-user: admin@iitrpr.ac.in"

# As a student
curl http://localhost:3000/learn -H "x-dev-user: mudit@iitrpr.ac.in"

# As an instructor (must exist in DB)
curl http://localhost:3000/teacher -H "x-dev-user: ta.swadhyaya@iitrpr.ac.in"
```

The first time you use an email, a User record is auto-created. If the email contains "admin", they're promoted to ADMIN automatically.

## Browser: use a header injection extension

To use the dev auth in your browser, install a header-injection extension:

- **ModHeader** (Chrome) — https://modheader.com
- **Requestly** (Chrome/Firefox) — https://requestly.io
- Or write a small browser userscript

Set the request header:
```
Name:  x-dev-user
Value: admin@iitrpr.ac.in
```

Now visit http://localhost:3000/admin and you'll be logged in as admin.

## Try every feature

| URL | What you'll see |
|---|---|
| `/` | Marketing homepage with "Sign in with samagama.in" button |
| `/login` | Login page (use the dev header instead) |
| `/dashboard` | Role-aware dashboard (admin/instructor/student have different KPIs) |
| `/learn` | Course list (1 course: Linear Algebra) |
| `/learn/linear-algebra` | 6 modules (Module 1-6) |
| `/learn/linear-algebra/{moduleId}` | Sections (16, 7, 15, 7, 5, 3) |
| `/learn/linear-algebra/{moduleId}/{sectionId}` | 3 items (Video, Activity, Quiz) — gated by completion |
| `/learn/linear-algebra/{moduleId}/{sectionId}/{itemId}` | The actual content (consent modal → video/activity/quiz) |
| `/viva` | Student viva dashboard — complete all 16 topics in a module to unlock |
| `/teacher` | Instructor dashboard (viva queue + KPIs) |
| `/teacher/viva` | Pending viva approvals (admin sees all, instructor sees their own) |
| `/admin` | Admin console (8 sections: live, activity, users, courses, proctor, viva, instructors, system) |
| `/admin/live` | **Real-time live view** of all active users (requires 2 browser tabs to see the tiles populate) |
| `/admin/activity` | **Real-time activity feed** of all events |
| `/admin/users` | User search |
| `/admin/users/{userId}` | **14-tab user drill-down** (overview, timeline, heat map, progress, quiz, video, proctor, viva, anomalies, consent, activity, reset, notes, export) |
| `/admin/courses` | Course list |
| `/admin/courses/{courseId}/modules/{moduleId}/sections/{sectionId}` | Section editor with inline item editing |
| `/admin/instructors` | Instructor list with permission matrix |
| `/admin/instructors/new` | Create instructor with permission presets |
| `/admin/items/quiz` | Question bank with topic filter |
| `/admin/items/quiz/import` | Bulk import questions from .md files |
| `/admin/proctor` | Live proctor sessions grid |
| `/admin/viva` | All viva bookings with status filters |
| `/admin/system` | System metrics (KV live count, totals, external service links) |
| `/profile` | User profile |

## View the real-time features

To see SSE-based real-time features:

1. **Open 2 browser windows** with different `x-dev-user` headers
2. In window 1, sign in as a student and navigate to `/learn/linear-algebra/{m}/{s}/{i}` to trigger the proctor
3. In window 2, sign in as admin and go to `/admin/live`
4. You'll see window 1 appear as a tile in real time
5. Open `/admin/activity` in window 2 to see events from window 1

## View the score reset and question cancellation

1. As admin, open `/admin/users/{studentUserId}` and click the "Score Reset" tab
2. Choose a scope (question / quiz / module / course / global)
3. Confirm — the student's progress is reset, audit log entry created, activity broadcast fires
4. Same for "Question Cancel" — pick a question from a quiz attempt to invalidate

## View viva approval

1. As a student, complete all 16 topics in Module 1 (the proctor + activity + quiz for each)
2. Module becomes "complete" → viva booking unlocks
3. As a student, go to `/viva` → pick instructor → pick slot → book
4. As an instructor (or admin), go to `/teacher/viva` → click the booking → approve with a meeting URL
5. As the student, go to `/viva` → see status change to CONFIRMED with the meeting link

## What you DON'T see (requires paid service)

| Feature | Without paid service | With paid service |
|---|---|---|
| **Video playback** | Shows "No video uploaded" placeholder | Streams Mux video |
| **Email notifications** | Logs to `/tmp/swadhyaya-emails/` | Sent via Resend |
| **Anomaly screenshots** | Captured in memory only | Stored in Cloudinary |
| **Viva room** | Link shown but not opened | Live Jitsi/Zoom call |
| **Mux direct upload** | UI shows, no upload | Video uploaded to Mux |

## Production deployment

When you're ready to deploy, you need:
1. **MongoDB Atlas** (free tier) — set `DATABASE_URL`
2. **Vercel** (free Hobby) — `vercel --prod`
3. **Vercel KV** (free tier) — set `KV_*` env vars (replaces in-process pub/sub)
4. **samagama.in OAuth** — set `SAMAGAMA_*` env vars (replaces dev header)
5. **Optional**: Mux, Cloudinary, Resend, custom domain

See `docs/COSTS.md` for the full cost breakdown.

## Troubleshooting

### "ECONNREFUSED 127.0.0.1:27017"

MongoDB isn't running. Start it:
```bash
brew services start mongodb-community@8.2
```

### "Prisma needs to perform transactions" / "P2031"

MongoDB needs to be in replica set mode:
```bash
brew services stop mongodb-community@8.2
mongod --dbpath /tmp/swadhyaya-mongo-data --port 27017 --bind_ip 127.0.0.1 --replSet rs0 --logpath /tmp/swadhyaya-mongo-logs/mongod.log --pidfilepath /tmp/swadhyaya-mongo.pid &
sleep 3
mongosh "mongodb://127.0.0.1:27017/?directConnection=true" --eval "rs.initiate({_id: 'rs0', members: [{_id: 0, host: '127.0.0.1:27017'}]})"
```

### "EADDRINUSE :::3000"

Another dev server is running:
```bash
pkill -f "next dev"
```

### "Database is already in sync with the Prisma schema" but no data

Run seed:
```bash
pnpm seed
```

### Want to reset everything

```bash
mongosh "mongodb://127.0.0.1:27017/swadhyaya?directConnection=true" --eval "db.dropDatabase()"
pnpm prisma db push
pnpm seed
```
