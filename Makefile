# Variables
BINARY_NAME=dashboard
BACKEND_MAIN=cmd/dashboard/main.go
FRONTEND_DIR=web
PORT=8080

.PHONY: all build run clean help install build-frontend build-backend run-frontend run-backend docker-build test dev

all: help

## 🛠️ Installation
install: ## Install dependencies for both Backend and Frontend
	@echo "Installing Backend dependencies..."
	go mod download
	@echo "Installing Frontend dependencies..."
	cd $(FRONTEND_DIR) && npm install

## 🚀 Running (Development)
run-backend: ## Run Backend in dev mode
	@echo "Starting Backend on :$(PORT)..."
	go run $(BACKEND_MAIN)

run-frontend: ## Run Frontend in dev mode
	@echo "Starting Frontend on :3000..."
	cd $(FRONTEND_DIR) && npm run dev

dev: ## Run both Backend and Frontend in development mode (requires 'make -j2 dev')
	@$(MAKE) -j2 run-backend run-frontend

## 🏗️ Building
build-backend: ## Build Backend binary
	@echo "Building Backend..."
	go build -o $(BINARY_NAME) $(BACKEND_MAIN)

build-frontend: ## Build Frontend (Next.js static export)
	@echo "Building Frontend..."
	cd $(FRONTEND_DIR) && npm run build

build: build-backend build-frontend ## Build both Backend and Frontend

docker-build: ## Build Docker image
	@echo "Building Docker image: capi-dashboard:latest..."
	docker build -t capi-dashboard:latest .

## 🧪 Testing
test: ## Run Backend tests
	@echo "Running tests..."
	go test -v ./internal/...

## 🧹 Cleaning
clean: ## Remove built binaries and temporary files
	@echo "Cleaning up..."
	rm -f $(BINARY_NAME)
	rm -rf $(FRONTEND_DIR)/.next
	rm -rf $(FRONTEND_DIR)/out

## ℹ️ Help
help: ## Show this help message
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
