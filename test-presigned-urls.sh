#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Testing Pre-signed URLs API${NC}"
echo "================================="

# Install dependencies if needed
if ! node -e "require('node-fetch')" 2>/dev/null; then
    echo -e "${YELLOW}Installing required dependencies...${NC}"
    npm install node-fetch@2 dotenv --save-dev
fi

# Run the test
echo -e "${GREEN}Running tests...${NC}"
node src/features/users/test-presigned-urls.js
