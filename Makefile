# Makefile for EssentiElles
# Simplifies common development tasks

.PHONY: help install dev test lint clean build deploy

# Default target
help:
	@echo "EssentiElles - Available commands:"
	@echo "  make install     - Install all dependencies"
	@echo "  make dev         - Start development servers"
	@echo "  make test        - Run all tests"
	@echo "  make lint        - Run linters and formatters"
	@echo "  make clean       - Clean build artifacts"
	@echo "  make build       - Build Docker images"
	@echo "  make deploy      - Deploy to production"
	@echo "  make docker-up   - Start Docker containers"
	@echo "  make docker-down - Stop Docker containers"
	@echo "  make logs        - View Docker logs"

# Install dependencies
install:
	@echo "Installing backend dependencies..."
	cd backend && pip install -r requirements.txt
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "✅ Installation complete!"

# Start development servers
dev:
	@echo "Starting development servers..."
	@echo "Backend: http://localhost:8000"
	@echo "Frontend: http://localhost:19006"
	make -j2 dev-backend dev-frontend

dev-backend:
	cd backend && uvicorn server:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	cd frontend && npm start

# Run tests
test:
	@echo "Running backend tests..."
	cd backend && pytest --cov=. --cov-report=term
	@echo "Running frontend tests..."
	cd frontend && npm test -- --coverage
	@echo "✅ All tests passed!"

# Run linters and formatters
lint:
	@echo "Linting backend..."
	cd backend && black . && isort . && flake8 . && mypy .
	@echo "Linting frontend..."
	cd frontend && npm run lint && npm run typecheck
	@echo "✅ Linting complete!"

# Format code
format:
	@echo "Formatting backend code..."
	cd backend && black . && isort .
	@echo "Formatting complete!"

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".coverage" -exec rm -rf {} +
	find . -type d -name "htmlcov" -exec rm -rf {} +
	cd frontend && rm -rf node_modules/.cache
	@echo "✅ Clean complete!"

# Build Docker images
build:
	@echo "Building Docker images..."
	docker-compose build
	@echo "✅ Build complete!"

# Start Docker containers
docker-up:
	@echo "Starting Docker containers..."
	docker-compose up -d
	@echo "✅ Containers started!"
	@echo "Backend: http://localhost:8000"
	@echo "MongoDB: localhost:27017"
	@echo "Redis: localhost:6379"

# Stop Docker containers
docker-down:
	@echo "Stopping Docker containers..."
	docker-compose down
	@echo "✅ Containers stopped!"

# View Docker logs
logs:
	docker-compose logs -f

# Deploy to production
deploy:
	@echo "Deploying to production..."
	@echo "⚠️  Make sure you have configured production environment variables!"
	docker-compose -f docker-compose.prod.yml up -d --build
	@echo "✅ Deployment complete!"

# Setup environment files
setup-env:
	@echo "Setting up environment files..."
	cp .env.example .env
	cp frontend/.env.example frontend/.env
	@echo "✅ Environment files created!"
	@echo "⚠️  Please edit .env files with your configuration"

# Database backup
backup-db:
	@echo "Backing up MongoDB database..."
	docker exec -t essentielles_mongodb mongodump --out=/data/backup
	@echo "✅ Backup complete!"

# Database restore
restore-db:
	@echo "Restoring MongoDB database..."
	docker exec -t essentielles_mongodb mongorestore /data/backup
	@echo "✅ Restore complete!"

# Check system status
status:
	@echo "System Status:"
	@echo "\nDocker Containers:"
	@docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
	@echo "\nDisk Usage:"
	@docker system df
