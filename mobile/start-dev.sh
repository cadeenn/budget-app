#!/bin/bash

# Start-dev script for budget app
# This script starts both the backend server and the Expo mobile app in tunnel mode

# Make sure the script is executable (run chmod +x start-dev.sh first)

echo "🚀 Starting Budget Tracker Development Environment"
echo "------------------------------------------------"

# Start the backend server
echo "📡 Starting backend server..."
cd ../server
node src/index.js > server.log 2>&1 &
SERVER_PID=$!
echo "✅ Server started with PID: $SERVER_PID"

# Wait for server to start
echo "🕒 Waiting for server to start..."
sleep 3

# Start Expo in tunnel mode
echo "📱 Starting Expo mobile app in tunnel mode..."
cd ../mobile
echo "⚙️ Using tunnel mode for cross-network connection"
npm run tunnel

# Handle script termination
cleanup() {
  echo "🛑 Shutting down services..."
  kill $SERVER_PID
  echo "👋 Development environment stopped"
  exit 0
}

# Set up trap for SIGINT (Ctrl+C)
trap cleanup SIGINT

# Wait for processes
wait 