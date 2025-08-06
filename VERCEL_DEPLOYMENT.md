# Environment Variables for Vercel Deployment

## Required Environment Variables

Add these environment variables to your Vercel project:

### Database
- `MONGO_URI` - Your MongoDB connection string
- `DB_NAME` - Your database name (optional)

### JWT Authentication
- `JWT_SECRET` - Secret key for JWT token generation
- `JWT_EXPIRE` - Token expiration time (e.g., "7d")

### AWS Configuration (Optional - for S3/Rekognition features)
- `AWS_REGION` - AWS region (e.g., "ap-south-1")
- `AWS_ACCESS_KEY_ID` - Your AWS access key
- `AWS_SECRET_ACCESS_KEY` - Your AWS secret key
- `S3_BUCKET_NAME` - S3 bucket name for file uploads

### Other
- `NODE_ENV` - Set to "production"
- `PORT` - Set to "3000" (though Vercel manages this)

## How to Add Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings > Environment Variables
4. Add each variable with its value
5. Make sure to add them for Production, Preview, and Development environments

## Example .env.local for local testing
```
MONGO_URI=mongodb+srv://your-connection-string
JWT_SECRET=your-super-secret-key-here
JWT_EXPIRE=7d
AWS_REGION=ap-south-1
NODE_ENV=development
```

Note: Never commit actual environment values to your repository!
