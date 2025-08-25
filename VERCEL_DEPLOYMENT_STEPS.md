# Deploying to Vercel - Quick Guide

This guide will help you deploy the updated API with image status checking and deletion functionality to Vercel.

## Prerequisites

1. A Vercel account
2. Git repository with your code
3. Environment variables ready (see `.env.example`)

## Deployment Steps

### 1. Connect Your Repository to Vercel

- Go to [Vercel Dashboard](https://vercel.com/dashboard)
- Click "New Project"
- Import your Git repository
- Select the repository with your code

### 2. Configure Project Settings

- **Framework Preset**: Select "Other"
- **Root Directory**: Leave as is (/)
- **Build Command**: None (leave empty)
- **Output Directory**: None (leave empty)

### 3. Add Environment Variables

Add all required environment variables from the `.env.example` file, especially:

- `MONGO_URI` - Your MongoDB connection string
- `JWT_SECRET` - Secret for JWT token generation
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_REGION` - AWS region (e.g., "ap-south-1")
- `NODE_ENV` - Set to "production"

### 4. Deploy

- Click "Deploy"
- Wait for the deployment to complete

### 5. Update Flutter App Configuration

Make sure your Flutter app is pointing to the new Vercel URL:

```dart
static const String baseUrl = 'https://your-vercel-app-url.vercel.app';
```

## Testing After Deployment

1. Test the JWT token generation endpoint
2. Test image upload functionality
3. Test image status checking
4. Test image deletion

## Troubleshooting

If you encounter any issues:

1. Check Vercel deployment logs
2. Verify all environment variables are set correctly
3. Test endpoints with Postman using the provided collection
4. Check MongoDB connection is properly configured

## Important Notes

- The API now supports both old and new image status/deletion endpoints for compatibility
- The Flutter app has been updated to try the new endpoints first with fallbacks to old ones
- For enhanced security, consider updating the JWT_SECRET in production
