#!/bin/bash

###############################################################################
# KOSHPAL BACKEND - MASTER START SCRIPT
# Runs the NestJS server and all BullMQ workers
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
LOG_DIR="./logs"
PID_DIR="./pids"

# Create directories if they don't exist
mkdir -p "$LOG_DIR"
mkdir -p "$PID_DIR"

# Function to print colored messages
print_msg() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check if process is running
is_running() {
    local pid=$1
    if [ -z "$pid" ]; then
        return 1
    fi
    ps -p "$pid" > /dev/null 2>&1
    return $?
}

# Function to stop all processes
cleanup() {
    print_msg "$YELLOW" "\n🛑 Stopping all processes..."
    
    if [ -f "$PID_DIR/server.pid" ]; then
        local server_pid=$(cat "$PID_DIR/server.pid")
        if is_running "$server_pid"; then
            print_msg "$CYAN" "   Stopping server (PID: $server_pid)..."
            kill "$server_pid" 2>/dev/null || true
        fi
        rm -f "$PID_DIR/server.pid"
    fi
    
    if [ -f "$PID_DIR/upload-worker.pid" ]; then
        local worker_pid=$(cat "$PID_DIR/upload-worker.pid")
        if is_running "$worker_pid"; then
            print_msg "$MAGENTA" "   Stopping upload worker (PID: $worker_pid)..."
            kill "$worker_pid" 2>/dev/null || true
        fi
        rm -f "$PID_DIR/upload-worker.pid"
    fi
    
    if [ -f "$PID_DIR/insights-worker.pid" ]; then
        local insights_pid=$(cat "$PID_DIR/insights-worker.pid")
        if is_running "$insights_pid"; then
            print_msg "$YELLOW" "   Stopping insights worker (PID: $insights_pid)..."
            kill "$insights_pid" 2>/dev/null || true
        fi
        rm -f "$PID_DIR/insights-worker.pid"
    fi
    
    if [ -f "$PID_DIR/consultation-worker.pid" ]; then
        local consultation_pid=$(cat "$PID_DIR/consultation-worker.pid")
        if is_running "$consultation_pid"; then
            print_msg "$GREEN" "   Stopping consultation worker (PID: $consultation_pid)..."
            kill "$consultation_pid" 2>/dev/null || true
        fi
        rm -f "$PID_DIR/consultation-worker.pid"
    fi
    
    print_msg "$GREEN" "✅ All processes stopped\n"
    exit 0
}

# Trap SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM

# Function to start a process
start_process() {
    local name=$1
    local color=$2
    local command=$3
    local log_file="$LOG_DIR/${name}.log"
    local pid_file="$PID_DIR/${name}.pid"
    
    print_msg "$color" "🚀 Starting ${name}..."
    
    # Start the process in background and redirect output to log file
    eval "$command" > "$log_file" 2>&1 &
    local pid=$!
    
    # Save PID
    echo "$pid" > "$pid_file"
    
    # Wait a moment to check if process started successfully
    sleep 2
    
    if is_running "$pid"; then
        print_msg "$color" "   ✅ ${name} started (PID: $pid, Log: $log_file)"
    else
        print_msg "$RED" "   ❌ Failed to start ${name}. Check $log_file for errors"
        cleanup
        exit 1
    fi
}

# Function to monitor processes
monitor_processes() {
    local check_interval=5
    
    while true; do
        sleep "$check_interval"
        
        # Check server
        if [ -f "$PID_DIR/server.pid" ]; then
            local server_pid=$(cat "$PID_DIR/server.pid")
            if ! is_running "$server_pid"; then
                print_msg "$RED" "❌ Server crashed! Check logs/server.log"
                cleanup
                exit 1
            fi
        fi
        
        # Check upload worker
        if [ -f "$PID_DIR/upload-worker.pid" ]; then
            local worker_pid=$(cat "$PID_DIR/upload-worker.pid")
            if ! is_running "$worker_pid"; then
                print_msg "$RED" "❌ Upload worker crashed! Check logs/upload-worker.log"
                cleanup
                exit 1
            fi
        fi
        
        # Check insights worker
        if [ -f "$PID_DIR/insights-worker.pid" ]; then
            local insights_pid=$(cat "$PID_DIR/insights-worker.pid")
            if ! is_running "$insights_pid"; then
                print_msg "$RED" "❌ Insights worker crashed! Check logs/insights-worker.log"
                cleanup
                exit 1
            fi
        fi
        
        # Check consultation worker
        if [ -f "$PID_DIR/consultation-worker.pid" ]; then
            local consultation_pid=$(cat "$PID_DIR/consultation-worker.pid")
            if ! is_running "$consultation_pid"; then
                print_msg "$RED" "❌ Consultation worker crashed! Check logs/consultation-worker.log"
                cleanup
                exit 1
            fi
        fi
    done
}

# Main execution
print_msg "$CYAN" "
╔════════════════════════════════════════════════════════════════╗
║                    KOSHPAL BACKEND MASTER                      ║
║              Starting Server + All Workers                     ║
╚════════════════════════════════════════════════════════════════╝
"

# Check if Redis is running
print_msg "$BLUE" "🔍 Checking prerequisites..."
if ! redis-cli ping > /dev/null 2>&1; then
    print_msg "$YELLOW" "⚠️  Warning: Redis is not running. Workers need Redis for BullMQ."
    print_msg "$YELLOW" "   Start Redis with: redis-server"
    read -p "   Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    print_msg "$GREEN" "   ✅ Redis is running"
fi

# Check if PostgreSQL is accessible
if ! psql $DATABASE_URL -c "SELECT 1" > /dev/null 2>&1; then
    print_msg "$YELLOW" "⚠️  Warning: Cannot connect to PostgreSQL database"
    print_msg "$YELLOW" "   Check your DATABASE_URL in .env"
    read -p "   Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    print_msg "$GREEN" "   ✅ PostgreSQL is accessible"
fi

echo ""

# Determine environment (dev or prod)
MODE="${1:-dev}"

if [ "$MODE" = "prod" ]; then
    print_msg "$CYAN" "📦 Running in PRODUCTION mode\n"
    
    # Start server
    start_process "server" "$CYAN" "npm run start:prod"
    
    # Start workers
    start_process "upload-worker" "$MAGENTA" "npm run worker:prod"
    start_process "insights-worker" "$YELLOW" "npm run insights-worker:prod"
    start_process "consultation-worker" "$GREEN" "npm run consultation-worker:prod"
    
else
    print_msg "$CYAN" "🔧 Running in DEVELOPMENT mode\n"
    
    # Start server
    start_process "server" "$CYAN" "npm run start:dev"
    
    # Start workers
    start_process "upload-worker" "$MAGENTA" "npm run worker:dev"
    start_process "insights-worker" "$YELLOW" "npm run insights-worker:dev"
    start_process "consultation-worker" "$GREEN" "npm run consultation-worker:dev"
fi

echo ""
print_msg "$GREEN" "
╔════════════════════════════════════════════════════════════════╗
║                   ✅ ALL SERVICES STARTED                      ║
╚════════════════════════════════════════════════════════════════╝

📊 Process Status:
   • Server:                http://localhost:3000
   • Upload Worker:         Processing employee uploads
   • Insights Worker:       Processing monthly summaries
   • Consultation Worker:   Processing booking emails

📁 Logs: ./logs/
📋 PIDs: ./pids/

Press Ctrl+C to stop all services
"

# Monitor all processes
monitor_processes
