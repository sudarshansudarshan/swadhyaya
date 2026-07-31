# Swadhyaya

An online learning platform that combines proctored videos, interactive activities, and conceptual quizzes with teacher-led viva approval — built for IIT-grade linear algebra at scale.

## Features

- **Courses** organized as Module → Section → Item (Video, Activity, Quiz)
- **Proctored learning** with face detection, voice detection, motion detection, tab switching, anti-cheat
- **Live admin dashboard** showing 247+ concurrent users with real-time activity
- **Teacher viva approval** with meeting link sharing
- **Admin score reset** and **instructor question cancellation**
- **Granular permissions** for instructors (admin-controlled)
- **Real-time updates** via Server-Sent Events (SSE) + Vercel KV
- **Heat maps, charts, and full drill-down** for every student

## Tech Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind v4 + shadcn/ui
- Prisma 7 + MongoDB Atlas
- NextAuth.js v5 with samagama.in OAuth
- Mux (video), Cloudinary (screenshots)
- Vercel Edge + Vercel KV

## Setup

```bash
pnpm install
cp .env.example .env
pnpm prisma generate
pnpm seed
pnpm dev
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full roadmap.
