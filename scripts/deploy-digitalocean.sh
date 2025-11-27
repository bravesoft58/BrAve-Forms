#!/bin/bash
# BrAve Forms - DigitalOcean Deployment Script
# Usage: ./scripts/deploy-digitalocean.sh [command]
#
# Commands:
#   setup     - Initial setup (first deployment)
#   deploy    - Build and deploy latest code
#   update    - Pull latest code and redeploy
#   logs      - View all service logs
#   status    - Show service status
#   backup    - Backup database
#   restore   - Restore database from backup
#   shell     - Open shell in backend container
#   stop      - Stop all services
#   start     - Start all services
#   restart   - Restart all services
#   clean     - Remove unused Docker resources

set -e

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"
BACKUP_DIR="$HOME/backups"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_env() {
    if [ ! -f "$PROJECT_DIR/$ENV_FILE" ]; then
        log_error "Environment file not found: $ENV_FILE"
        log_info "Copy .env.production.example to .env.production and fill in your values"
        exit 1
    fi
}

# Commands
cmd_setup() {
    log_info "Starting initial setup..."

    check_env

    # Create backup directory
    mkdir -p "$BACKUP_DIR"

    # Build images
    log_info "Building Docker images..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build

    # Start services
    log_info "Starting services..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    sleep 30

    # Run migrations
    log_info "Running database migrations..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T backend npx prisma migrate deploy

    # Seed templates
    log_info "Seeding templates..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T backend npx prisma db seed || true

    log_info "Setup complete!"
    cmd_status
}

cmd_deploy() {
    log_info "Deploying BrAve Forms..."

    check_env

    # Build images
    log_info "Building Docker images..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build

    # Deploy with zero downtime
    log_info "Starting services..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

    log_info "Deployment complete!"
    cmd_status
}

cmd_update() {
    log_info "Updating BrAve Forms..."

    # Backup database first
    cmd_backup

    # Pull latest code
    log_info "Pulling latest code..."
    git pull origin master

    # Deploy
    cmd_deploy

    # Run migrations
    log_info "Running database migrations..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T backend npx prisma migrate deploy

    log_info "Update complete!"
}

cmd_logs() {
    service=${1:-""}
    if [ -n "$service" ]; then
        docker compose -f "$COMPOSE_FILE" logs -f "$service"
    else
        docker compose -f "$COMPOSE_FILE" logs -f
    fi
}

cmd_status() {
    log_info "Service Status:"
    echo ""
    docker compose -f "$COMPOSE_FILE" ps
    echo ""

    log_info "Resource Usage:"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
    echo ""

    log_info "Disk Usage:"
    df -h /
    echo ""

    log_info "Docker Disk Usage:"
    docker system df
}

cmd_backup() {
    log_info "Backing up database..."

    mkdir -p "$BACKUP_DIR"
    DATE=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/db_$DATE.sql.gz"

    docker compose -f "$COMPOSE_FILE" exec -T postgres \
        pg_dump -U brave brave_forms | gzip > "$BACKUP_FILE"

    log_info "Backup saved to: $BACKUP_FILE"

    # Keep only last 7 days
    find "$BACKUP_DIR" -name "db_*.sql.gz" -mtime +7 -delete

    log_info "Backup complete!"
}

cmd_restore() {
    if [ -z "$1" ]; then
        log_info "Available backups:"
        ls -la "$BACKUP_DIR"/db_*.sql.gz 2>/dev/null || echo "No backups found"
        echo ""
        log_error "Usage: $0 restore <backup_file>"
        exit 1
    fi

    BACKUP_FILE="$1"

    if [ ! -f "$BACKUP_FILE" ]; then
        log_error "Backup file not found: $BACKUP_FILE"
        exit 1
    fi

    log_warn "This will overwrite the current database!"
    read -p "Are you sure? (yes/no): " confirm

    if [ "$confirm" != "yes" ]; then
        log_info "Restore cancelled"
        exit 0
    fi

    log_info "Restoring database from: $BACKUP_FILE"

    gunzip -c "$BACKUP_FILE" | docker compose -f "$COMPOSE_FILE" exec -T postgres \
        psql -U brave -d brave_forms

    log_info "Restore complete!"
}

cmd_shell() {
    service=${1:-"backend"}
    log_info "Opening shell in $service container..."
    docker compose -f "$COMPOSE_FILE" exec "$service" /bin/sh
}

cmd_stop() {
    log_info "Stopping all services..."
    docker compose -f "$COMPOSE_FILE" down
    log_info "Services stopped"
}

cmd_start() {
    log_info "Starting all services..."
    check_env
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    log_info "Services started"
}

cmd_restart() {
    log_info "Restarting all services..."
    docker compose -f "$COMPOSE_FILE" restart
    log_info "Services restarted"
}

cmd_clean() {
    log_warn "This will remove unused Docker resources!"
    read -p "Are you sure? (yes/no): " confirm

    if [ "$confirm" != "yes" ]; then
        log_info "Clean cancelled"
        exit 0
    fi

    log_info "Cleaning up..."
    docker system prune -af
    docker volume prune -f
    log_info "Cleanup complete!"
}

cmd_help() {
    echo "BrAve Forms - DigitalOcean Deployment Script"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  setup     - Initial setup (first deployment)"
    echo "  deploy    - Build and deploy latest code"
    echo "  update    - Pull latest code and redeploy"
    echo "  logs      - View all service logs (or: logs backend)"
    echo "  status    - Show service status"
    echo "  backup    - Backup database"
    echo "  restore   - Restore database from backup"
    echo "  shell     - Open shell in backend container"
    echo "  stop      - Stop all services"
    echo "  start     - Start all services"
    echo "  restart   - Restart all services"
    echo "  clean     - Remove unused Docker resources"
    echo "  help      - Show this help message"
}

# Main
cd "$PROJECT_DIR"

case "${1:-help}" in
    setup)   cmd_setup ;;
    deploy)  cmd_deploy ;;
    update)  cmd_update ;;
    logs)    cmd_logs "$2" ;;
    status)  cmd_status ;;
    backup)  cmd_backup ;;
    restore) cmd_restore "$2" ;;
    shell)   cmd_shell "$2" ;;
    stop)    cmd_stop ;;
    start)   cmd_start ;;
    restart) cmd_restart ;;
    clean)   cmd_clean ;;
    help)    cmd_help ;;
    *)
        log_error "Unknown command: $1"
        cmd_help
        exit 1
        ;;
esac
