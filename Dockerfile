# ============================================================
# Stage 1: Build Frontend (Next.js standalone)
# ============================================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/web

COPY web/package.json ./
RUN npm install --legacy-peer-deps

COPY web/ .
RUN npm run build

# ============================================================
# Stage 2: Build Backend (Go static binary)
# ============================================================
FROM golang:alpine AS backend-builder
WORKDIR /app

COPY go.mod go.sum ./
COPY vendor/ ./vendor/
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build \
    -mod=vendor \
    -ldflags="-s -w" \
    -o dashboard \
    cmd/dashboard/main.go

# ============================================================
# Stage 3: Final image — nginx + node + go binary
# ============================================================
FROM node:20-alpine
WORKDIR /app

# nginx + tini + kubectl + kubectl-node-shell
RUN apk add --no-cache nginx tini curl && \
    mkdir -p /tmp/nginx /var/log/nginx /var/lib/nginx/tmp && \
    \
    # kubectl — lấy version stable
    KUBECTL_VERSION=$(curl -fsSL https://dl.k8s.io/release/stable.txt) && \
    curl -fsSL "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/amd64/kubectl" \
         -o /usr/local/bin/kubectl && \
    chmod +x /usr/local/bin/kubectl && \
    \
    # kubectl-node-shell plugin
    curl -fsSL "https://github.com/kvaps/kubectl-node-shell/raw/master/kubectl-node_shell" \
         -o /usr/local/bin/kubectl-node_shell && \
    chmod +x /usr/local/bin/kubectl-node_shell && \
    \
    # Verify
    kubectl version --client --short 2>/dev/null || kubectl version --client && \
    kubectl node-shell --version

# nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Backend
COPY --from=backend-builder /app/dashboard ./dashboard
COPY --from=backend-builder /app/internal/assets ./internal/assets

# Frontend (standalone)
COPY --from=frontend-builder /app/web/.next/standalone ./web/
COPY --from=frontend-builder /app/web/.next/static ./web/.next/static
COPY --from=frontend-builder /app/web/public ./web/public

# Start script: backend + frontend + nginx
RUN printf '#!/bin/sh\nset -e\n\n# Go backend :8080\nPORT=8080 ./dashboard &\n\n# Next.js frontend :3000\nHOSTNAME=0.0.0.0 PORT=3000 node web/server.js &\n\n# Wait for services to start\nsleep 1\n\n# nginx reverse proxy :80 (handles HTTP + WebSocket)\nnginx -g "daemon off;"\n' > /app/start.sh && chmod +x /app/start.sh

# Chỉ expose 1 port duy nhất
EXPOSE 80

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/app/start.sh"]
