#!/bin/bash

# Mobile Testing Helper Script
# Usage: ./test-mobile-auth.sh

set -e

echo "🔧 Fishek Mobile Authentication Test Helper"
echo "============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.mobile exists
if [ ! -f .env.mobile ]; then
    echo -e "${RED}Error: .env.mobile not found${NC}"
    exit 1
fi

# Read API URL from .env.mobile
API_URL=$(grep NEXT_PUBLIC_API_URL .env.mobile | cut -d '=' -f2)
echo -e "${GREEN}Backend URL:${NC} $API_URL"
echo ""

# Test credentials
TEST_EMAIL="mobile-test@fishek.app"
TEST_PASSWORD="TestPassword123!"
TEST_NAME="Mobile Test User"

echo "📋 Test Options:"
echo "  1) Test backend connectivity"
echo "  2) Register new test user"
echo "  3) Test login with test user"
echo "  4) Full test (register + login)"
echo "  5) Switch to local backend"
echo "  6) Switch to production backend"
echo ""
read -p "Choose option (1-6): " option

case $option in
    1)
        echo ""
        echo "🔍 Testing backend connectivity..."
        if curl -s -f -o /dev/null "$API_URL/api/auth/mobile" -X OPTIONS; then
            echo -e "${GREEN}✅ Backend is reachable${NC}"
        else
            echo -e "${RED}❌ Backend is not reachable${NC}"
            exit 1
        fi
        ;;
    
    2)
        echo ""
        echo "📝 Registering test user..."
        echo "Email: $TEST_EMAIL"
        echo "Password: $TEST_PASSWORD"
        echo ""
        
        response=$(curl -s -X POST "$API_URL/api/auth/register" \
            -H "Content-Type: application/json" \
            -d "{\"name\":\"$TEST_NAME\",\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
        
        if echo "$response" | grep -q "error"; then
            echo -e "${YELLOW}⚠️  Response: $response${NC}"
            echo -e "${YELLOW}User may already exist or there's an error${NC}"
        else
            echo -e "${GREEN}✅ User registered successfully${NC}"
        fi
        ;;
    
    3)
        echo ""
        echo "🔐 Testing login..."
        echo "Email: $TEST_EMAIL"
        echo "Password: $TEST_PASSWORD"
        echo ""
        
        response=$(curl -s -X POST "$API_URL/api/auth/mobile" \
            -H "Content-Type: application/json" \
            -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
        
        if echo "$response" | grep -q "accessToken"; then
            echo -e "${GREEN}✅ Login successful!${NC}"
            echo ""
            echo "Response:"
            echo "$response" | jq . 2>/dev/null || echo "$response"
        else
            echo -e "${RED}❌ Login failed${NC}"
            echo "Response: $response"
            exit 1
        fi
        ;;
    
    4)
        echo ""
        echo "🚀 Running full test (register + login)..."
        echo ""
        
        # Register
        echo "📝 Step 1: Registering..."
        curl -s -X POST "$API_URL/api/auth/register" \
            -H "Content-Type: application/json" \
            -d "{\"name\":\"$TEST_NAME\",\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" > /dev/null
        
        sleep 1
        
        # Login
        echo "🔐 Step 2: Testing login..."
        response=$(curl -s -X POST "$API_URL/api/auth/mobile" \
            -H "Content-Type: application/json" \
            -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
        
        if echo "$response" | grep -q "accessToken"; then
            echo -e "${GREEN}✅ Full test passed!${NC}"
            echo ""
            echo "📱 Use these credentials in the mobile app:"
            echo "   Email: $TEST_EMAIL"
            echo "   Password: $TEST_PASSWORD"
        else
            echo -e "${RED}❌ Test failed${NC}"
            echo "Response: $response"
            exit 1
        fi
        ;;
    
    5)
        echo ""
        echo "🏠 Switching to local backend..."
        read -p "Enter your local IP (e.g., 192.168.1.100): " LOCAL_IP
        
        if [ -z "$LOCAL_IP" ]; then
            echo -e "${RED}Error: IP address required${NC}"
            exit 1
        fi
        
        echo "NEXT_PUBLIC_API_URL=http://$LOCAL_IP:3000" > .env.mobile
        echo -e "${GREEN}✅ Updated .env.mobile${NC}"
        echo ""
        echo "Next steps:"
        echo "  1. pnpm dev (start local server)"
        echo "  2. pnpm run build:mobile"
        echo "  3. pnpm run cap:run:ios"
        ;;
    
    6)
        echo ""
        echo "☁️  Switching to production backend..."
        echo "NEXT_PUBLIC_API_URL=https://fishek.coolify.fennaver.tech" > .env.mobile
        echo -e "${GREEN}✅ Updated .env.mobile${NC}"
        echo ""
        echo "Next steps:"
        echo "  1. pnpm run build:mobile"
        echo "  2. pnpm run cap:run:ios"
        ;;
    
    *)
        echo -e "${RED}Invalid option${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}Done!${NC}"
