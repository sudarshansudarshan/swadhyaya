# Swadhyaya — Architecture Roadmap, User Flows & Workflow

> **Vision:** An online learning platform that combines proctored videos, interactive activities, and conceptual quizzes with teacher-led viva approval — built for IIT-grade linear algebra at scale.

## 1. System Overview

| Layer | Choice |
|---|---|
| Frontend | Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui |
| State | Zustand + React Query |
| Offline | IndexedDB via `idb` |
| Database | MongoDB Atlas (M10+) via Prisma 7 |
| Auth | NextAuth.js v5 with **samagama.in OAuth** (SSO) |
| Video | Mux (HLS, adaptive bitrate) |
| Images / Screenshots | Cloudinary |
| Real-time | Vercel KV + Server-Sent Events |
| Email | Resend (with ICS attachments) |
| Live tool | Jitsi Meet (default) |
| Hosting | Vercel (Edge + Serverless) |
| CI/CD | GitHub Actions → Vercel |

## 2. Hierarchy (Vibe parity)

```
Course (1: Linear Algebra)
  └─ Module (6: Module 1..6, names null → display "Module N")
       └─ Section (53: derived from conceptual.md Q1.1..Q6.3)
            └─ Item (3, sequential, locked-by-completion):
                 ├─ Order 1: VIDEO
                 ├─ Order 2: ACTIVITY
                 └─ Order 3: QUIZ
```

## 3. Roles

| Role | Logged in via | Can do |
|---|---|---|
| STUDENT | samagama.in OAuth | Learning flow, book viva, view own progress |
| INSTRUCTOR | samagama.in OAuth → mapped to Instructor record | Per-permission (admin-controlled): viva approve, score reset, cancel questions, view student detail |
| ADMIN | samagama.in OAuth (or magic-link fallback) | Full CRUD on everything |

## 4. Student User Flow

```
1. Login via samagama.in
   └─ First time: User record created
        └─ EthicsConsent required before any content
             └─ /learn → course list → "Linear Algebra"
                  └─ Module picker (6 modules)
                       └─ Section picker (16, 7, 15, 7, 5, 3 sections)
                            └─ Topic hub (3 items: video, activity, quiz)
                                 ├─ Step 1: VIDEO (proctored)
                                 │    ├─ EthicsConsent modal (first time)
                                 │    ├─ MediaRegistry.grab({video, audio})
                                 │    ├─ ProctorPanel mounts (10 detection hooks)
                                 │    ├─ Grace period 10s
                                 │    ├─ Auto-play (Mux HLS)
                                 │    ├─ pauseVid on anomaly / rewindVid on motion
                                 │    ├─ Upsert watch time every 15s
                                 │    └─ On END → POST /api/progress/video-watched
                                 ├─ Step 2: ACTIVITY (proctored, same panel)
                                 │    ├─ iframe /activities/{slug}.html
                                 │    ├─ postMessage on completion
                                 │    └─ POST /api/progress/activity-complete
                                 └─ Step 3: QUIZ (proctored)
                                      ├─ ProctoredQuiz wrapper
                                      ├─ 20 conceptual MCQs (topic-locked)
                                      ├─ Mixed in with cancelled questions
                                      ├─ On 3 flags → quiz restart
                                      ├─ On penalty ≥ 50 → eject
                                      ├─ EmotionPicker → ProctorReport
                                      └─ POST /api/progress/quiz-submit
                                           └─ Pass → next topic unlocks
   └─ All topics in module done?
        └─ VivaBookingModal opens
             ├─ Pick instructor (radio)
             ├─ Pick slot (calendar)
             └─ Submit → VivaBooking (status=PENDING)
                  └─ Instructor approves → meetingUrl set
                       └─ Student sees status in real-time (SSE)
                       └─ Email + ICS attachment
```

## 5. Instructor User Flow

```
Login via samagama.in → mapped to Instructor record
  └─ /teacher dashboard
       ├─ KPIs: pending vivas, students, today's sessions
       ├─ Recent activity feed
       └─ Pending Viva queue (gated by viva.view_pending)
            └─ Click booking → full learner detail
                 ├─ Profile + cohort
                 ├─ Module progress (all topics)
                 ├─ Watch time per topic
                 ├─ Quiz scores
                 ├─ Proctor sessions (with screenshots)
                 ├─ Emotion responses
                 └─ Actions (gated by permission):
                      ├─ viva.approve → set meetingUrl, send ICS
                      ├─ viva.reject → set reason, free slot
                      ├─ viva.reschedule → move to new slot
                      ├─ students.reset_score → reset module/quiz
                      ├─ students.cancel_question → cancel specific Q
                      └─ students.view_xxx → read-only drill-downs
```

## 6. Admin User Flow

```
Login via samagama.in (role=ADMIN)
  └─ /admin overview
       ├─ KPI tiles: active users, videos, quizzes, anomalies, pending vivas
       ├─ Live view (247 active users)
       ├─ Recent activity feed
       └─ Module completion progress (live)
  └─ /admin/live — real-time user grid with tile colorization
  └─ /admin/activity — chronological event log
  └─ /admin/system — Vercel/Mux/Cloudinary metrics
  └─ /admin/users
       ├─ Global search (top bar)
       ├─ Filterable list (cohort, course, completion, anomaly)
       └─ Per-user detail (14 tabs):
            ├─ Overview — profile + aggregate KPIs
            ├─ Timeline — chronological event log
            ├─ Heat Map — GitHub-style activity (hour × week)
            ├─ Progress — per course/module/section
            ├─ Quiz — scores over time + per-question
            ├─ Video — watch time + rewinds + FFs
            ├─ Proctor — all sessions + screenshots
            ├─ Vivas — bookings with same meetingUrl as instructor
            ├─ Anomalies — chronological with screenshots
            ├─ Consent — ethics consent record
            ├─ Activity — full ActivityLog for this user
            ├─ Audit — who has viewed this user
            ├─ Notes — admin private notes
            └─ Export — CSV / PDF / ZIP
  └─ /admin/courses — full CRUD
  └─ /admin/modules / sections / items — drag-reorder, inline edit
  └─ /admin/items/quiz — Question Bank editor
       ├─ List (filterable, search)
       ├─ Bulk import (.md parser)
       └─ QuestionEditor (single)
  └─ /admin/instructors
       ├─ Create / edit / deactivate
       ├─ Permission matrix (granular per-permission)
       ├─ Module assignment
       ├─ Validity period (with auto-revoke)
       └─ Activity log (who did what)
  └─ /admin/viva
       ├─ Viva slots (drag-create calendar)
       ├─ Bookings (filterable)
       ├─ Instructors
       └─ Slot types
  └─ /admin/proctor
       ├─ Live grid (SSE)
       ├─ All sessions
       ├─ Anomalies
       ├─ Ejection policies
       └─ Audit
  └─ /admin/cohorts — bulk CSV import + assign
```

## 7. Admin Score Reset + Question Cancellation

### Reset score
```
Admin → /admin/users/[userId] → quiz/video/progress tab
  → "Reset Score" button
  → Modal: scope (question | quiz | module | course | global)
  → Stages (video | activity | quiz)
  → Reason (mandatory)
  → Optional: notify student
  → Confirm → transaction:
       - ScoreReset record (audit)
       - TopicProgress flags → false
       - QuizAttempt → cancelled (kept for audit)
       - VideoWatch → completed=false
       - VivaBooking → cancelled if affected
       - ModuleProgress → recalculated
       - ActivityLog → score.reset
       - Student → SSE + email
```

### Question cancellation
```
Admin or instructor → /admin/users/[userId] → quiz tab
  → Click attempt → see per-question rows
  → Click [Cancel] on Q2
  → Modal: reason
  → Confirm →
       - QuestionInvalidation record
       - QuizAttempt.answers[2].invalidated = true
       - Score recalculated
       - TopicProgress.quizCompleted = false
       - Student must re-answer that question
       - Re-grading logic on next submit
```

## 8. Real-time Architecture

```
Client (every 10s)
  └─ POST /api/heartbeat (Edge)
       └─ Cache in Vercel KV
       └─ Broadcast on SSE channel admin-live
       └─ SSE channel user-{userId}

Cron every 30s
  └─ Flush KV heartbeats to LiveSession table

Admin UI /admin/live
  └─ Subscribe to admin-live channel
       └─ Render active user tiles (auto-refresh)

Admin UI /admin/users/[userId]
  └─ Subscribe to user-{userId} channel
       └─ Live drill-down

Viva approval
  └─ Teacher clicks Approve
       └─ SSE broadcast to viva-{userId}
       └─ Student dashboard live update
```

## 9. Load Balancing

```
Client → Vercel Edge (250ms P50 worldwide)
  ├─ /api/sse/* (Edge, persistent)
  ├─ /api/heartbeat (Edge, fast)
  └─ /api/quiz/next (Edge, read-only)

Client → Vercel Serverless (auto-scaled)
  ├─ /api/progress/* (write)
  ├─ /api/admin/* (write)
  └─ /api/proctor/* (write)

Vercel KV (Redis) — buffers, presence, activity feed
MongoDB Atlas — persistence (multi-region, M10+)
Mux — video (CDN, no server bandwidth)
Cloudinary — screenshots (CDN, no server bandwidth)
```

**Capacity at 10k concurrent users: ~$250/month**

## 10. Implementation Phases

| # | Phase | Time |
|---|---|---|
| 1 | Bootstrap (Next.js 16 + Tenali scaffold + deps + .env) | 1h |
| 2 | Prisma schema + seed (1 course, 6 modules, 53 sections, 159 items, 6 instructors) | 1h |
| 3 | Question bank (parse 1060 conceptual Qs from .md → JSON → DB) | 30m |
| 4 | Auth + admin/teacher layouts (NextAuth + samagama.in OAuth) | 1h |
| 5 | Real-time infra (SSE + Vercel KV + heartbeat batching) | 1h |
| 6 | Admin CRUD (courses/modules/sections/items, drag-reorder) | 3h |
| 7 | Admin question editor + bulk import | 1.5h |
| 8 | Admin instructor management + RBAC + permission matrix | 2h |
| 9 | Student learn flow (locked-by-completion) | 2h |
| 10 | Item: Video (Mux player with proctoring) | 2h |
| 11 | Item: Activity (iframe wrapper + postMessage) | 1h |
| 12 | Item: Quiz (conceptual bank + re-grading logic) | 2h |
| 13 | Proctoring (10 detection hooks + Web Workers) | 4.5h |
| 14 | Admin live view + activity feed | 2h |
| 15 | Student search + detail (14 tabs + heat maps + charts) | 3h |
| 16 | Teacher viva queue + approval + meeting link | 2h |
| 17 | Score reset + question cancellation | 2h |
| 18 | Viva booking (student calendar + ICS) | 1.5h |
| 19 | Deployment (Vercel + env vars + smoke test) | 30m |
| | **Total** | **~38.5h** |

## 11. P0 / P1 / P2 Priority

If time runs short, ship in this order:

**P0 (must ship)** — phases 1–6, 9–14
**P1 (should ship)** — phases 7, 8, 16, 17, 18
**P2 (nice to have)** — phases 15, 19 polish

## 12. Repo Structure

```
swadhyaya/
├── apps/web/                    # Next.js 16 app
│   ├── app/
│   │   ├── (auth)/login/
│   │   ├── (app)/
│   │   │   ├── dashboard/
│   │   │   ├── learn/
│   │   │   ├── teacher/
│   │   │   ├── admin/
│   │   │   ├── viva/
│   │   │   └── profile/
│   │   └── api/
│   │       ├── auth/
│   │       ├── realtime/[channel]/
│   │       ├── heartbeat/
│   │       ├── proctor/
│   │       ├── progress/
│   │       ├── quiz/
│   │       ├── viva/
│   │       ├── admin/
│   │       └── webhooks/
│   ├── components/
│   │   ├── proctor/
│   │   ├── video/
│   │   ├── activity/
│   │   ├── quiz/
│   │   ├── viva/
│   │   ├── teacher/
│   │   ├── admin/
│   │   ├── ethics/
│   │   ├── learn/
│   │   ├── realtime/
│   │   └── ui/
│   ├── lib/
│   ├── store/
│   ├── hooks/
│   ├── workers/
│   ├── public/activities/      # 37 hi/ HTML files
│   └── prisma/
├── packages/
│   ├── questions/              # 1060 conceptual Q JSON
│   └── types/
├── docs/
│   ├── ARCHITECTURE.md         # this file
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── ADMIN.md
└── scripts/
    ├── seed.ts
    └── convert-md-to-json.ts
```

## 13. Source Mapping

| Source | Provides |
|---|---|
| `vicharanashala/vibe` | proctoring architecture, video player pattern, FloatingVideo, EmotionSelector, hooks (useTranscriber, useWorker, useEmotion), learn/ components (FloatingVideo, ProctorAlertOverlay, AwayOverlay, CourseDrawer, InitialWebcamPopup) |
| `vicharanashala/tenali` | ProctorPanel, ProctoredQuiz, EthicsConsent, EmotionPicker, ProctorReport, 10 detection hooks, /linear route pattern, /proctor admin dashboard |
| `Tenali_Mudit` (local) | Next.js 16 scaffolding, Prisma 7, Tailwind v4, Zustand, idb, lucide-react, framer-motion, recharts |
| `~/Documents/Developer/hi/` (37 files) | Activity HTML files for matrix-mystics flow |
| `~/Downloads/conceptual question/mission_{1..6}.md` | 1060 conceptual MCQs (53 topics × 20 questions) |
| `https://sudarshansudarshan.github.io/codershigh/matrixmystics/` | Module structure (1..6, no names) + section prompts |

## 14. Branching Strategy

**Single linear branch with descriptive commits per phase/feature.**

```
main
├── phase-1: bootstrap
├── phase-2: schema and seed
├── phase-3: question bank
├── phase-4: auth
├── phase-5: realtime
├── phase-6: admin CRUD
├── phase-7: question editor
├── phase-8: instructor RBAC
├── phase-9: learn flow
├── phase-10: video
├── phase-11: activity
├── phase-12: quiz
├── phase-13: proctoring
├── phase-14: live view
├── phase-15: student detail
├── phase-16: viva approval
├── phase-17: score reset
├── phase-18: viva booking
└── phase-19: deployment
```

Each commit is a single feature/function change with a descriptive message.

## 15. Environment Variables

```env
# Database
DATABASE_URL=mongodb+srv://...

# NextAuth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://swadhyaya.app

# samagama.in OAuth
SAMAGAMA_CLIENT_ID=...
SAMAGAMA_CLIENT_SECRET=...
SAMAGAMA_ISSUER=https://samagama.in

# Mux
MUX_TOKEN_ID=...
MUX_TOKEN_SECRET=...
MUX_SIGNING_KEY_ID=...
MUX_SIGNING_KEY_PRIVATE=...

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_UPLOAD_PRESET=...

# Vercel KV
KV_URL=...
KV_REST_API_URL=...
KV_REST_API_TOKEN=...

# Resend
RESEND_API_KEY=...

# Admin
SWADHYAYA_ADMIN_EMAILS=sudarshan@iitrpr.ac.in
```
