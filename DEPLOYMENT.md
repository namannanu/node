# Vercel Deployment Guide

## Prerequisites
1. Install Vercel CLI: `npm i -g vercel`
2. Make sure you have a Vercel account at [vercel.com](https://vercel.com)

## Environment Variables Setup

Before deploying, you need to set up your environment variables in Vercel:

### Required Environment Variables:
- `MONGO_URI`: Your MongoDB connection string
- `JWT_SECRET`: Your JWT secret key
- `JWT_EXPIRES_IN`: JWT expiration time (e.g., "90d")
- `JWT_COOKIE_EXPIRES_IN`: Cookie expiration time (e.g., "90")
- `AWS_REGION`: Your AWS region (e.g., "ap-south-1")
- `COGNITO_IDENTITY_POOL_ID`: Your AWS Cognito Identity Pool ID
- `COGNITO_USER_POOL_ID`: Your AWS Cognito User Pool ID
- `COGNITO_APP_CLIENT_ID`: Your AWS Cognito App Client ID
- `S3_BUCKET_NAME`: Your S3 bucket name
- `S3_BUCKET_REGION`: Your S3 bucket region
- `AWS_ROLE_ARN`: Your AWS IAM role ARN

## Deployment Steps

### Option 1: Deploy via Vercel CLI
1. Login to Vercel: `vercel login`
2. Deploy: `vercel`
3. Follow the prompts to link to your Vercel project

### Option 2: Deploy via GitHub Integration
1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Vercel will automatically deploy on every push

### Option 3: Deploy via Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure environment variables
5. Deploy

## Environment Variables Configuration

In your Vercel dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add each required environment variable from the list above

## Important Notes

1. **Database**: Make sure your MongoDB Atlas cluster allows connections from anywhere (0.0.0.0/0) or add Vercel's IP ranges
2. **AWS Services**: Ensure your AWS IAM roles and policies allow access from Vercel's servers
3. **CORS**: The application is configured to handle CORS for various origins
4. **File Uploads**: If you're using file uploads, consider using Vercel's serverless functions or external storage

## Testing Your Deployment

After deployment, test these endpoints:
- `GET /` - Should return "Hello, World!"
- `GET /api/health` - Health check endpoint
- `GET /api/public/events` - Public events endpoint
- `GET /api/public/users` - Public users endpoint

## Troubleshooting

1. **Build Errors**: Check the build logs in Vercel dashboard
2. **Environment Variables**: Ensure all required env vars are set
3. **Database Connection**: Verify MongoDB connection string and network access
4. **AWS Permissions**: Check IAM roles and policies for AWS services

## Production Considerations

1. **Security**: Update JWT secrets and other sensitive values for production
2. **Performance**: Consider implementing caching strategies
3. **Monitoring**: Set up logging and monitoring for production
4. **Backup**: Ensure your database has proper backup strategies 