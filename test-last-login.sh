#!/bin/bash

echo "🔧 Testing Last Login Functionality"
echo "=================================="

API_BASE="http://localhost:3000/api"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "\n${BLUE}1. Testing user login with ROHIT account${NC}"
echo "Logging in user: rohit@gmail.com"

# Login request
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "rohit@gmail.com",
    "password": "password123"
  }')

echo "Login Response:"
echo "$LOGIN_RESPONSE" | jq '.'

# Extract token from response
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // empty')

if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    echo -e "\n${GREEN}✅ Login successful! Token extracted.${NC}"
    
    echo -e "\n${BLUE}2. Getting current user profile with lastLogin info${NC}"
    
    # Get current user
    PROFILE_RESPONSE=$(curl -s -X GET "$API_BASE/auth/me" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json")
    
    echo "User Profile Response:"
    echo "$PROFILE_RESPONSE" | jq '.'
    
    # Check if lastLogin is present
    LAST_LOGIN=$(echo "$PROFILE_RESPONSE" | jq -r '.data.user.lastLogin // empty')
    
    if [ -n "$LAST_LOGIN" ] && [ "$LAST_LOGIN" != "null" ]; then
        echo -e "\n${GREEN}✅ Last login timestamp found: $LAST_LOGIN${NC}"
    else
        echo -e "\n${YELLOW}⚠️  Last login timestamp not found in response${NC}"
    fi
    
    echo -e "\n${BLUE}3. Testing another login to update timestamp${NC}"
    
    # Wait a moment then login again
    sleep 2
    
    LOGIN_RESPONSE_2=$(curl -s -X POST "$API_BASE/auth/login" \
      -H "Content-Type: application/json" \
      -d '{
        "email": "rohit@gmail.com",
        "password": "password123"
      }')
    
    echo "Second Login Response:"
    echo "$LOGIN_RESPONSE_2" | jq '.'
    
    # Extract new token and check lastLogin
    TOKEN_2=$(echo "$LOGIN_RESPONSE_2" | jq -r '.token // empty')
    LAST_LOGIN_2=$(echo "$LOGIN_RESPONSE_2" | jq -r '.data.user.lastLogin // empty')
    
    if [ -n "$LAST_LOGIN_2" ] && [ "$LAST_LOGIN_2" != "null" ]; then
        echo -e "\n${GREEN}✅ Updated last login timestamp: $LAST_LOGIN_2${NC}"
        
        # Compare timestamps
        if [ "$LAST_LOGIN" != "$LAST_LOGIN_2" ]; then
            echo -e "${GREEN}✅ Last login timestamp was updated successfully!${NC}"
        else
            echo -e "${YELLOW}⚠️  Last login timestamp appears unchanged${NC}"
        fi
    else
        echo -e "\n${YELLOW}⚠️  Last login timestamp not found in second login${NC}"
    fi
    
    echo -e "\n${BLUE}4. Testing getAllUsers endpoint to see lastLogin in user list${NC}"
    
    # Get all users
    USERS_RESPONSE=$(curl -s -X GET "$API_BASE/users" \
      -H "Content-Type: application/json")
    
    echo "Users List Response:"
    echo "$USERS_RESPONSE" | jq '.'
    
    # Check if any user has lastLogin data
    HAS_LAST_LOGIN=$(echo "$USERS_RESPONSE" | jq -r '.data.users[] | select(.lastLogin != null) | .lastLogin' | head -1)
    
    if [ -n "$HAS_LAST_LOGIN" ]; then
        echo -e "\n${GREEN}✅ Found users with lastLogin data in the list!${NC}"
        echo "Sample lastLogin: $HAS_LAST_LOGIN"
    else
        echo -e "\n${YELLOW}⚠️  No users with lastLogin data found in the list${NC}"
    fi
    
else
    echo -e "\n${RED}❌ Login failed! Cannot extract token.${NC}"
    echo "Response: $LOGIN_RESPONSE"
fi

echo -e "\n${BLUE}5. Testing server status${NC}"

# Health check
HEALTH_RESPONSE=$(curl -s -X GET "$API_BASE/health" || echo "Health endpoint not available")

echo "Health Check:"
echo "$HEALTH_RESPONSE"

echo -e "\n=================================="
echo -e "${GREEN}🏁 Last Login Test Complete!${NC}"
echo "=================================="
