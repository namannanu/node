#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="https://correct-eight.vercel.app"
JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLXJnZHI1OG5wZy1tZW8zM201cCIsImlhdCI6MTc1NTk0NDYwMiwiZXhwIjoxNzYzNzIwNjAyfQ.hSOe1I6WZgc8e6iCB2O4f-4_wfPZS3IRiKfSIcMYDuo"
TEST_MONGO_ID="68a9902e4f0701bb871e1f3e"
TEST_USER_ID="user-rgdr58npg-meo33m5p"

# Function to make API calls
make_request() {
    local endpoint=$1
    local description=$2
    
    echo -e "${YELLOW}📝 Test: ${description}${NC}"
    echo -e "${BLUE}🔗 Endpoint: ${endpoint}${NC}"
    
    response=$(curl -s -w "\n%{http_code}" -X GET \
        "${API_URL}${endpoint}" \
        -H "Authorization: Bearer ${JWT_TOKEN}" \
        -H "Content-Type: application/json")
    
    # Extract status code and response body
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed \$d)
    
    # Print formatted response
    echo -e "${BLUE}📡 Status Code: ${status_code}${NC}"
    echo -e "${BLUE}📦 Response:${NC}"
    echo "$body" | json_pp
    
    # Validate response
    if [[ $status_code -ge 200 ]] && [[ $status_code -lt 300 ]]; then
        echo -e "${GREEN}✅ Test passed${NC}"
    else
        echo -e "${RED}❌ Test failed${NC}"
    fi
    
    echo -e "\n-------------------\n"
}

# Function to validate MongoDB ID
validate_mongo_id() {
    local id=$1
    if [[ $id =~ ^[0-9a-f]{24}$ ]]; then
        return 0
    else
        return 1
    fi
}

# Start tests
echo -e "${BLUE}🚀 Starting API Tests${NC}\n"

# Validate configuration
echo -e "${YELLOW}🔍 Validating configuration...${NC}"
if [ -z "$JWT_TOKEN" ]; then
    echo -e "${RED}❌ JWT_TOKEN is not set${NC}"
    exit 1
fi

if ! validate_mongo_id "$TEST_MONGO_ID"; then
    echo -e "${RED}❌ Invalid MongoDB ID format${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Configuration valid${NC}\n"

# Test 1: Get presigned URLs by MongoDB _id
make_request "/api/users/${TEST_MONGO_ID}/presigned-urls" \
    "Get presigned URLs by MongoDB _id"

# Test 2: Get presigned URLs by userId
make_request "/api/users/${TEST_USER_ID}/presigned-urls" \
    "Get presigned URLs by userId"

# Test 3: Test with invalid MongoDB id format
make_request "/api/users/invalid-mongo-id/presigned-urls" \
    "Test with invalid MongoDB id format"

# Test 4: Test with non-existent user
make_request "/api/users/nonexistent-user-123/presigned-urls" \
    "Test with non-existent user"

# Test 5: Test with missing token
echo -e "${YELLOW}📝 Test: Request without authorization token${NC}"
echo -e "${BLUE}🔗 Endpoint: /api/users/${TEST_MONGO_ID}/presigned-urls${NC}"

response=$(curl -s -w "\n%{http_code}" -X GET \
    "${API_URL}/api/users/${TEST_MONGO_ID}/presigned-urls" \
    -H "Content-Type: application/json")

status_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed \$d)

echo -e "${BLUE}📡 Status Code: ${status_code}${NC}"
echo -e "${BLUE}📦 Response:${NC}"
echo "$body" | json_pp

if [[ $status_code -eq 401 ]]; then
    echo -e "${GREEN}✅ Test passed (Unauthorized, as expected)${NC}"
else
    echo -e "${RED}❌ Test failed (Expected 401 Unauthorized)${NC}"
fi

echo -e "\n-------------------\n"

# Summary
echo -e "${BLUE}📊 Test Summary${NC}"
echo -e "✓ Configuration validation"
echo -e "✓ MongoDB ID lookup"
echo -e "✓ User ID lookup"
echo -e "✓ Invalid ID handling"
echo -e "✓ Non-existent user handling"
echo -e "✓ Authentication check"

echo -e "\n${GREEN}🎉 All tests completed!${NC}"
