# Swadhyaya

An online learning platform that combines **proctored videos**, **interactive activities**, and **conceptual quizzes** with **teacher-led viva approval** — built for IIT-grade linear algebra at scale.

> Single linear branch with descriptive commits. See `docs/ARCHITECTURE.md` for the full roadmap, `docs/COSTS.md` for the deployment cost breakdown, and `docs/LOCAL.md` for a $0 local-dev guide.

---

## Features

- **Course hierarchy** — Course → Module → Section → Item (Video · Activity · Quiz), locked by completion
- **Proctored learning** — face detection, voice detection, motion detection, blur detection, tab-switch detection, anti-cheat (right-click · copy/paste · devtools) with a 5-second fail countdown and a 3-strike right-click rule
- **Quiz summary card** — Vibe-style "Quiz Completed!" screen with score, pass/fail badge, Question Details, and Rewatch Video / Next Lesson buttons
- **Live admin dashboard** — real-time activity feed, live proctor grid, online-user tiles
- **Teacher viva approval** — booking flow + ICS email + meeting link
- **Admin score reset** + per-student question invalidation
- **Granular instructor permissions** with 4 presets (lead / TA / reviewer / viva-only)
- **Real-time updates** via SSE + Vercel KV (or in-process EventEmitter in local dev)
- **Heat maps, charts, full drill-down** for every student (14-tab UserDetail)

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind v4 + lucide-react |
| Database | MongoDB via Prisma 6 (M10+ on Atlas, local Mongo OK) |
| Auth | NextAuth v5 with samagama.in OAuth (dev header bypass available) |
| Video | Mux (HLS) |
| Images / screenshots | Cloudinary |
| Real-time | Vercel KV + SSE (in-process EventEmitter in dev) |
| Email | Resend (with ICS attachments) |
| Live tool | Jitsi Meet |
| Proctoring | face-api.js + browser MediaStream APIs |
| Hosting | Vercel (Edge + Serverless) |

---

## Environment Setup

### Prerequisites

- **Node.js 20+** and **pnpm 9+** (`npm i -g pnpm`)
- **MongoDB 7+** running locally or a MongoDB Atlas cluster
- Optional (production): Mux account, Cloudinary account, Resend account, Vercel KV, samagama.in OAuth credentials

### 1. Clone and install

```bash
git clone https://github.com/sudarshansudarshan/swadhyaya.git
cd swadhyaya
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

`.env` has three modes — pick one:

#### A. **Local development (free, no external accounts)**

```bash
# .env
DATABASE_URL="mongodb://127.0.0.1:27017/swadhyaya?directConnection=true"
SWADHYAYA_DEV_AUTH=1            # bypass samagama.in OAuth
USE_IN_PROCESS_PUBSUB=1         # in-process SSE, no Vercel KV
RESEND_LOG_ONLY=1               # emails → /tmp/swadhyaya-emails/
CLOUDINARY_LOG_ONLY=1           # uploads → /tmp/swadhyaya-uploads/
```

Spin up MongoDB with one of:

```bash
brew services start mongodb-community     # macOS Homebrew
docker run -d -p 27017:27017 mongo:7      # Docker
```

Or use `scripts/dev-start.sh` — it auto-detects brew / Docker MongoDB, syncs the Prisma schema, and seeds the database.

#### B. **Staging (real services, dev auth still on)**

```bash
DATABASE_URL="mongodb+srv://user:pass@cluster.mongodb.net/swadhyaya"
SWADHYAYA_DEV_AUTH=1
KV_URL="redis://..."                       # Upstash Redis REST URL
KV_REST_API_TOKEN="..."
RESEND_API_KEY="re_..."
```

#### C. **Production**

```bash
DATABASE_URL="mongodb+srv://..."
NEXTAUTH_SECRET="$(openssl rand -hex 32)"
NEXTAUTH_URL="https://swadhyaya.example.com"
MUX_TOKEN_ID="..."
MUX_TOKEN_SECRET="..."
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
RESEND_API_KEY="re_..."
KV_URL="..."
KV_REST_API_TOKEN="..."
NEXT_PUBLIC_SITE_URL="https://swadhyaya.example.com"
```

### 3. Database setup

```bash
pnpm prisma generate
pnpm seed          # 1 course / 6 modules / 53 sections / 159 items / 1060 questions
```

### 4. Run

```bash
pnpm dev           # → http://localhost:3000
```

Production build:

```bash
pnpm build
pnpm start
```

### 5. Dev-auth login (local mode)

With `SWADHYAYA_DEV_AUTH=1`, send an `x-dev-user` header with any seeded email:

```bash
# As a student
curl -H "x-dev-user: mudit@iitrpr.ac.in" http://localhost:3000/learn

# As an admin
curl -H "x-dev-user: admin@iitrpr.ac.in" http://localhost:3000/admin
```

Or just open `http://localhost:3000` and pick a profile — the dev header is set automatically when `SWADHYAYA_DEV_AUTH=1`.

---

## User Workflows

### Student — taking a course

```
1. Sign in
   └─ /login → samagama.in OAuth (or x-dev-user header in dev)
       │
2. Dashboard  ─────────────────────────────────────────────┐
   └─ /dashboard                                              │
       • current course progress                              │
       • upcoming viva                                         │
       • recent activity                                       │
                                                              │
3. Browse courses                                              │
   └─ /learn → /learn/[courseId]                              │
       │                                                      │
4. Pick a module                                              │
   └─ /learn/[courseId]/[moduleId]                            │
       │                                                      │
5. Pick a section                                             │
   └─ /learn/[courseId]/[moduleId]/[sectionId]                │
       • see item list with lock indicators                   │
       │                                                      │
6. Open an item ─────────────────────────────────────────────┘
   └─ /learn/[courseId]/[moduleId]/[sectionId]/[itemId]

   First time on video/quiz items → Ethics Consent modal
   (scroll-to-enable, persisted via /api/ethics/sign)

7. VIDEO item
   • MuxVideoPlayer renders the HLS stream
   • Proctoring begins: webcam + mic + screen-activity hooks
   • Floating camera preview (left-edge) shows live feed + LIVE/ALERT badge
   • On ended → POST /api/progress/video-stop → jump to next item

   ⚠ Proctoring violations:
   ┌──────────────────────────┬────────────────────────────────┐
   │ Right-click ×3 in session │ IMMEDIATE jump back (no wait)  │
   │ Tab switch / no face      │ 5s countdown → if persists,    │
   │ / blur / motion / voice   │ jump back to section video     │
   │ Other detectors           │ countdown, cancel if OK        │
   └──────────────────────────┴────────────────────────────────┘
   • On proctor fail → POST /api/progress/section-reset
     → resets ALL items in the section → jumps to video

8. ACTIVITY item
   • ActivityFrame iframes the activity HTML page
   • Minimum dwell time enforced
   • postMessage 'complete' event marks it done
   • POST /api/progress/activity-complete → jump to next item

9. QUIZ item
   • QuizApp shows questions one at a time (Fisher–Yates shuffle)
   • Submit → reveal correct/incorrect + explanation
   • After last question → POST /api/progress/quiz-submit

   Pass (≥ quizPassThreshold):
     • "Quiz Completed!" summary card:
       - Score X/Y, You scored N%
       - 🎉 Passed! badge / Perfect Score badge
       - Rewatch Video · Next Lesson buttons
       - Question Details list (per-Q Correct/Incorrect + your answer + correct answer + explanation)

   Fail (< quizPassThreshold):
     • "Quiz Completed!" card with Attempt Unsuccessful badge
     • 10s auto-redirect countdown → section video
     • Section video progress reset by the server

10. After last item of a section
    → next module's first section's first item
    → next course's first item
    → /learn landing page when the course is done

11. Viva booking (optional)
    /viva → module picker → instructor filter → slot grid
    POST /api/viva/book (requires module-complete)
    Teacher approves / rejects via /teacher/viva
    Email + ICS calendar invite sent via Resend
```

### Admin — managing the platform

```
1. /admin
   • live          → tile grid of online students (LiveView)
   • activity      → live activity log feed
   • users         → search + per-student 14-tab UserDetail
   • proctor       → live ProctorSession grid
   • courses       → module / section / item management
   • instructors   → permission matrix + presets
   • items/quiz    → question bank + bulk import
   • viva          → booking queue
   • system        → KV live count + external service links

2. Score reset
   /admin/users/[userId] → "Reset" tab
   POST /api/admin/score-reset
   scope: question | quiz | item | module | course | global

3. Question invalidation
   POST /api/admin/question-invalidate
   Cancels a specific question for a specific student
   (skipped during grading, must still be answered)
```

### Teacher — viva approval

```
1. /teacher
   • viva queue link
2. /teacher/viva
   • pending bookings list
3. /teacher/viva/[bookingId]
   • student details + module + slot
   • Approve / Reject buttons
   POST /api/viva/approve | /api/viva/reject
   Student is notified by email + ICS
```

### Instructor — content + permissions

```
/admin/instructors
  • list          → permission summaries
  • new           → create with a preset
  • [id]          → permission matrix (24 permissions)
                    presets: lead / TA / reviewer / viva-only
```

---

## API Routes

### Progress
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/progress/video-stop` | Mark video watched |
| POST | `/api/progress/activity-complete` | Mark activity done |
| POST | `/api/progress/quiz-submit` | Submit quiz, get score + redirectTo |
| POST | `/api/progress/section-reset` | Clear all section progress (proctor fail) |

### Proctoring
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/proctor/start` | Begin ProctorSession |
| POST | `/api/proctor/event` | Append anomaly event |
| POST | `/api/proctor/end` | Close session |

### Real-time
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/realtime/[channel]` | SSE stream |
| POST | `/api/heartbeat` | Online presence ping |

### Admin
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/admin/score-reset` | Score reset (scope-based) |
| POST | `/api/admin/question-invalidate` | Cancel a question for a student |
| GET / POST | `/api/admin/users/search` | Autocomplete |
| GET / PATCH | `/api/admin/sections/[id]` | Section edits |
| GET / PATCH | `/api/admin/items/[id]` | Item edits |
| GET / POST | `/api/admin/instructors` | Instructor CRUD |

### Viva
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/viva/book` | Student books a slot |
| POST | `/api/viva/approve` | Teacher approves |
| POST | `/api/viva/reject` | Teacher rejects |

### Auth
| Method | Path | Purpose |
|---|---|---|
| * | `/api/auth/[...nextauth]` | NextAuth handler |
| POST | `/api/ethics/sign` | Record consent |

### Cron (Vercel cron)
| Schedule | Path | Purpose |
|---|---|---|
| every 1 min | `/api/cron/flush-heartbeats` | KV → LiveSession |
| every 5 min | `/api/cron/cleanup-live` | Drop stale sessions |
| daily 03:00 | `/api/cron/cleanup-activity` | Drop > 90d logs |

---

## Scripts

```bash
pnpm dev              # Next.js dev server
pnpm build            # production build
pnpm start            # production server
pnpm lint             # ESLint
pnpm typecheck        # tsc --noEmit
pnpm seed             # seed the database
pnpm convert-questions # parse conceptual.md → JSON
```

## Project structure

```
src/
  app/
    (app)/                  # authenticated segment
      admin/                # admin pages
      teacher/              # teacher pages
      learn/                # learn flow
      viva/                 # student viva dashboard
      dashboard/            # post-login landing
      profile/              # user profile
    (auth)/login/           # OAuth login page
    api/
      progress/             # video-stop / activity-complete / quiz-submit / section-reset
      proctor/              # start / event / end
      admin/                # score-reset / question-invalidate / sections / items / instructors
      viva/                 # book / approve / reject
      realtime/[channel]/   # SSE
      cron/                 # flush-heartbeats / cleanup-live / cleanup-activity
      auth/[...nextauth]/   # NextAuth
      ethics/sign/          # consent persistence
  components/
    quiz/                   # QuizApp
    video/                  # MuxVideoPlayer
    activity/               # ActivityFrame
    ethics/                 # EthicsConsent
    layout/                 # Topbar, Sidebar
    proctor/                # ProctorProvider, ProctorPanel, FloatingVideo, hooks/
    learn/                  # CourseShell, CourseDrawer
    admin/                  # AdminUserSearch, UserDetail, QuestionBank, ...
    teacher/                # VivaApprovalClient
    viva/                   # StudentVivaDashboard
  hooks/
    useLiveChannel.ts
    useLiveHeartbeat.ts
  lib/
    prisma.ts               # Prisma client singleton
    auth.ts                 # NextAuth config
    auth-helpers.ts         # requireUser / requireAdmin / requireInstructor
    permissions.ts          # server-side permissions
    permissions-shared.ts   # client-side types
    realtime.ts             # Vercel KV + in-process EventEmitter
    activity-log.ts         # logActivity()
    proctor/                # proctorEvents (client) + server helpers
    email.ts                # Resend + ICS
  types/
    proctor.ts              # ProctorEventType, ProctorAnomaly

prisma/schema.prisma        # MongoDB schema (24 models)
packages/questions/         # question bank (1060 MCQs)
public/activities/          # 37 activity HTML files
public/models/              # face-api.js weights
scripts/
  seed.ts                   # seed database
  convert-md-to-json.ts     # .md → question JSON
  dev-start.sh              # $0 local dev helper
docs/
  ARCHITECTURE.md
  COSTS.md
  LOCAL.md
```

## License

Private — IIT Ropar course material.
