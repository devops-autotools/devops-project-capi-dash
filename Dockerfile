# ============================================================
# Stage 1: Build Frontend (Next.js standalone)
# ============================================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/web

COPY web/package*.json ./
RUN npm ci --only=production=false

COPY web/ .
RUN npm run build
# output: 'standalone' tạo ra .next/standalone — không cần node_modules

# ============================================================
# Stage 2: Build Backend (Go static binary)
# ============================================================
FROM golang:alpine AS backend-builder
WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags="-s -w" \
    -o dashboard \
    cmd/dashboard/main.go
# -s -w: strip debug info → binary nhỏ hơn ~30%
# CGO_ENABLED=0: static binary, không phụ thuộc libc

# ============================================================
# Stage 3: Final image — node:alpine (cần cho Next.js standalone)
# ============================================================
FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache tini
# tini: proper PID 1, xử lý signal đúng khi chạy 2 process

# --- Backend ---
COPY --from=backend-builder /app/dashboard ./dashboard
COPY --from=backend-builder /app/internal/assets ./internal/assets

# --- Frontend (standalone mode — không cần node_modules) ---
COPY --from=frontend-builder /app/web/.next/standalone ./web/
COPY --from=frontend-builder /app/web/.next/static ./web/.next/static
COPY --from=frontend-builder /app/web/public ./web/public

# --- Start script: chạy cả backend & frontend ---
RUN printf '#!/bin/sh\nset -e\n\n# Start Go backend\n./dashboard &\nBACKEND_PID=$!\n\n# Start Next.js standalone server\nnode web/server.js &\nFRONTEND_PID=$!\n\n# Wait for either process to exit\nwait -n $BACKEND_PID $FRONTEND_PID\n' > /app/start.sh && chmod +x /app/start.sh

EXPOSE 8080 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/app/start.sh"]
