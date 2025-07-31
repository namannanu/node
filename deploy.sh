#!/bin/bash

echo "🚀 Starting Vercel Deployment Process..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Installing now..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel..."
    vercel login
fi

# Deploy to Vercel
echo "📦 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment completed!"
echo "📋 Don't forget to set up your environment variables in the Vercel dashboard:"
echo "   - MONGO_URI"
echo "   - JWT_SECRET"
echo "   - JWT_EXPIRES_IN"
echo "   - JWT_COOKIE_EXPIRES_IN"
echo "   - AWS_REGION"
echo "   - COGNITO_IDENTITY_POOL_ID"
echo "   - COGNITO_USER_POOL_ID"
echo "   - COGNITO_APP_CLIENT_ID"
echo "   - S3_BUCKET_NAME"
echo "   - S3_BUCKET_REGION"
echo "   - AWS_ROLE_ARN" 