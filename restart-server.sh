#!/bin/bash

echo "🔄 Restarting Node.js server with database connection fix..."

# Navigate to project directory
cd /Users/mrmad/adminthrill/nodejscopy

# Stop any existing Node.js processes
echo "🛑 Stopping existing server processes..."
pkill -f "node.*server.js" 2>/dev/null || echo "No existing server found"
pkill -f "npm.*start" 2>/dev/null || echo "No npm start process found"

# Wait for processes to stop
sleep 2

# Test database connection first
echo "🧪 Testing database connection..."
node test-db-connection.js

if [ $? -eq 0 ]; then
    echo "✅ Database connection test passed!"
    echo "🚀 Starting server..."
    npm start
else
    echo "❌ Database connection test failed!"
    echo "Please check your MongoDB connection and config.env file"
    exit 1
fi
