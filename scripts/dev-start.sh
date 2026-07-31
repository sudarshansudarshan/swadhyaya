#!/bin/bash
# Start Swadhyaya local dev environment — $0 cost
# Auto-detects: Docker → brew mongod → in-memory

set -e
cd "$(dirname "$0")/.."

# Copy .env.local if .env doesn't exist
if [ ! -f .env ] && [ -f .env.local ]; then
  cp .env.local .env
  echo "✓ Created .env from .env.local"
fi

# Load env vars
set -a; source .env 2>/dev/null || true; set +a

echo "🚀 Swadhyaya local dev starting..."

# 1. Database — auto-detect
if [ -z "$DATABASE_URL" ]; then
  if nc -z 127.0.0.1 27017 2>/dev/null; then
    export DATABASE_URL="mongodb://127.0.0.1:27017/swadhyaya?directConnection=true"
    echo "📦 Using brew MongoDB on 27017"
  elif nc -z 127.0.0.1 27018 2>/dev/null; then
    export DATABASE_URL="mongodb://127.0.0.1:27018/swadhyaya?directConnection=true"
    echo "📦 Using Docker MongoDB on 27018"
  else
    echo "⚠️  No MongoDB detected — start one and re-run"
    exit 1
  fi
fi
echo "📦 DATABASE_URL: $DATABASE_URL"

# 2. Push schema (creates collections on first run)
echo "🗄️  Syncing Prisma schema..."
echo "DATABASE_URL=$DATABASE_URL" > .env.db
npx prisma db push --skip-generate 2>&1 | tail -3

# 3. Seed if database is empty
SEEDED=$(node --input-type=module -e "
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const c = await p.question.count();
console.log(c > 0 ? 'yes' : 'no');
await p.\$disconnect();
" 2>/dev/null || echo "no")

if [ "$SEEDED" != "yes" ]; then
  echo "🌱 Seeding database (this takes ~30 seconds for 1060 questions)..."
  DATABASE_URL=$DATABASE_URL pnpm seed 2>&1 | tail -10
else
  echo "✓ Database already seeded (1060 questions present)"
fi

# 6. Start dev server
echo ""
echo "🎉 Starting Next.js dev server..."
echo ""
echo "   📍 App:           http://localhost:3000"
echo "   🔐 Sign in as:    admin@iitrpr.ac.in (auto-promoted to ADMIN)"
echo "   💾 Database:      mongodb://127.0.0.1:27018/swadhyaya"
echo "   💰 Cost:          \$0/month"
echo ""
echo "   Try these URLs after the server starts:"
echo "   • http://localhost:3000              (homepage)"
echo "   • http://localhost:3000/login        (sign in)"
echo "   • http://localhost:3000/dashboard    (your dashboard)"
echo "   • http://localhost:3000/admin        (admin console)"
echo "   • http://localhost:3000/admin/live   (live view)"
echo "   • http://localhost:3000/admin/users  (user search)"
echo "   • http://localhost:3000/learn        (learn flow)"
echo "   • http://localhost:3000/teacher/viva (teacher viva queue)"
echo ""
echo "💡 Tip: set header 'x-dev-user: admin@iitrpr.ac.in' to bypass login in dev mode"
echo ""

pnpm dev
