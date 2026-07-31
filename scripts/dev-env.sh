# Local development database (auto-spun-up mongodb-memory-server)
# No real MongoDB needed — this script starts an in-process MongoDB
# and updates DATABASE_URL before any Prisma call.

if [ -z "$DATABASE_URL" ]; then
  if [ -f /tmp/swadhyaya-mongo.pid ] && kill -0 $(cat /tmp/swadhyaya-mongo.pid) 2>/dev/null; then
    export DATABASE_URL="mongodb://127.0.0.1:27018/swadhyaya?directConnection=true"
  else
    # Try Docker first
    if docker info > /dev/null 2>&1; then
      docker run -d --name swadhyaya-mongo -p 27018:27017 mongo:7 > /dev/null 2>&1 && \
        echo 0 > /tmp/swadhyaya-mongo.pid
      sleep 2
      export DATABASE_URL="mongodb://127.0.0.1:27018/swadhyaya?directConnection=true"
    elif command -v mongod > /dev/null; then
      # Use local mongod
      mkdir -p /tmp/swadhyaya-mongo-data
      mongod --dbpath /tmp/swadhyaya-mongo-data --port 27018 --bind_ip 127.0.0.1 --fork --logpath /tmp/swadhyaya-mongo.log > /dev/null 2>&1
      echo $! > /tmp/swadhyaya-mongo.pid
      sleep 1
      export DATABASE_URL="mongodb://127.0.0.1:27018/swadhyaya?directConnection=true"
    else
      # Fall back to in-memory MongoDB (mongodb-memory-server)
      echo "Using in-memory MongoDB (no persistence between restarts)"
      export USE_IN_MEMORY_DB=1
    fi
  fi
fi

# Use local auth bypass (no samagama.in OAuth needed)
export SWADHYAYA_DEV_AUTH=1

# Optional: log emails to console instead of sending
export RESEND_LOG_ONLY=1

# Optional: log cloudinary uploads to local /tmp
export CLOUDINARY_LOG_ONLY=1

# Optional: log Mux uploads to local /tmp
export MUX_LOG_ONLY=1

# Optional: in-process SSE pub/sub (no Vercel KV needed)
export USE_IN_PROCESS_PUBSUB=1

echo ""
echo "✅ Swadhyaya local dev environment"
echo "   Database:  $DATABASE_URL"
echo "   Auth:      SWADHYAYA_DEV_AUTH=1 (no samagama.in needed)"
echo "   Email:     RESEND_LOG_ONLY=1 (logged to console)"
echo "   Uploads:   CLOUDINARY_LOG_ONLY=1, MUX_LOG_ONLY=1 (logged to /tmp)"
echo "   Real-time: USE_IN_PROCESS_PUBSUB=1 (in-process)"
echo ""
echo "💰 Total cost: \$0"
echo ""
