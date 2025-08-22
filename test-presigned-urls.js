const fetch = require('node-fetch');

// Configuration
const API_URL = 'https://correct-eight.vercel.app';
const TEST_USER_ID = '68a8571f4bc1651c29c1b39e'; // Your test user ID
const AUTH_TOKEN = process.env.AUTH_TOKEN || localStorage.getItem('authToken');

async function testEndpoint() {
    console.log('🔍 Testing Pre-signed URLs Endpoint');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
        // 1. Test basic connectivity
        console.log('1️⃣ Testing API connectivity...');
        const testResponse = await fetch(`${API_URL}/api/users/test`);
        if (testResponse.ok) {
            console.log('✅ Basic API connectivity working');
        } else {
            console.log('❌ Basic API connectivity failed:', testResponse.status);
        }
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // 2. Test pre-signed URLs endpoint
        console.log('2️⃣ Testing pre-signed URLs endpoint...');
        console.log('Request details:', {
            url: `${API_URL}/api/users/${TEST_USER_ID}/presigned-urls`,
            hasAuthToken: !!AUTH_TOKEN
        });

        const response = await fetch(
            `${API_URL}/api/users/${TEST_USER_ID}/presigned-urls`,
            {
                headers: {
                    'Authorization': `Bearer ${AUTH_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers.raw());

        const responseText = await response.text();
        try {
            const data = JSON.parse(responseText);
            console.log('Response data:', JSON.stringify(data, null, 2));

            if (data.success) {
                console.log('✅ Pre-signed URLs generated successfully');
                if (data.urls) {
                    console.log('📸 Uploaded photo URL:', data.urls.uploadedPhoto ? 'Present' : 'Not present');
                    console.log('📄 Aadhaar photo URL:', data.urls.aadhaarPhoto ? 'Present' : 'Not present');
                }
            } else {
                console.log('❌ Failed to generate pre-signed URLs');
                console.log('Error message:', data.message);
            }
        } catch (parseError) {
            console.log('❌ Failed to parse JSON response');
            console.log('Raw response:', responseText);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Get auth token from command line argument if provided
const args = process.argv.slice(2);
if (args[0]) {
    process.env.AUTH_TOKEN = args[0];
}

// Run the test
console.log('🚀 Starting tests...');
console.log('Auth token:', AUTH_TOKEN ? '✅ Present' : '❌ Missing');
testEndpoint()
    .then(() => {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🏁 Test completed');
    })
    .catch(error => {
        console.error('💥 Test failed with error:', error);
    });
