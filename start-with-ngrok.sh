#!/bin/bash

echo "Starting services..."

# Create a directory for logs
mkdir -p logs

# Start the Next.js frontend
npm run dev > logs/frontend.log 2>&1 &
FRONTEND_PID=$!

# Start the backend server (using pushd/popd for directory change)
pushd server > /dev/null
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
popd > /dev/null

# Wait for servers to start
echo "Waiting for servers to start..."
sleep 5

echo "Starting ngrok tunnels..."

# Start both tunnels using the config file
ngrok start --all --config=ngrok.yml > logs/ngrok.log 2>&1 &
NGROK_PID=$!

# Function to cleanup processes on exit
cleanup() {
    echo "Cleaning up..."
    kill $FRONTEND_PID 2>/dev/null
    kill $BACKEND_PID 2>/dev/null
    kill $NGROK_PID 2>/dev/null
}

# Set up cleanup on script exit
trap cleanup EXIT

echo "Waiting for ngrok tunnels to be ready..."
sleep 5

# Function to get ngrok URL
get_tunnel_url() {
    local tunnel_name=$1
    local retries=0
    local max_retries=5
    local url=""
    
    while [ -z "$url" ] && [ $retries -lt $max_retries ]; do
        url=$(curl -s http://localhost:4040/api/tunnels | grep -o "\"public_url\":\"[^\"]*\"" | grep -o 'https://[^"]*' | grep "${tunnel_name}" || true)
        if [ ! -z "$url" ]; then
            echo "$url"
            return 0
        fi
        retries=$((retries + 1))
        [ $retries -lt $max_retries ] && sleep 2
    done
    return 1
}

# Get URLs with retries
echo "Getting ngrok URLs..."
BACKEND_URL=$(get_tunnel_url "backend")
FRONTEND_URL=$(get_tunnel_url "frontend")

if [ -z "$BACKEND_URL" ] || [ -z "$FRONTEND_URL" ]; then
    echo "Error: Could not get ngrok URLs. Make sure ngrok is properly configured."
    echo "Checking ngrok logs..."
    cat logs/ngrok.log
    exit 1
fi

# Update the environment variable with the backend ngrok URL
echo "NEXT_PUBLIC_SOCKET_URL=$BACKEND_URL" > .env.local

echo "==================================="
echo "Game is ready!"
echo "Share this URL with your friend:"
echo "$FRONTEND_URL"
echo ""
echo "Backend URL (for debugging):"
echo "$BACKEND_URL"
echo "==================================="

# Keep the script running and show logs
echo "Showing logs (Ctrl+C to exit)..."
tail -f logs/frontend.log logs/backend.log logs/ngrok.log 