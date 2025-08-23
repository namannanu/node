# API Testing Guide

## Presigned URLs Endpoint Testing

### Endpoint Details
- Base URL: `https://correct-eight.vercel.app`
- Endpoint: `/api/users/:userId/presigned-urls`
- Method: `GET`
- Authentication: Bearer Token Required

### Test Cases

1. **MongoDB ID Lookup**
   ```
   GET /api/users/68a9902e4f0701bb871e1f3e/presigned-urls
   ```
   - Expected: Returns user's presigned URLs
   - Validates: MongoDB ID lookup functionality

2. **User ID Lookup**
   ```
   GET /api/users/user-rgdr58npg-meo33m5p/presigned-urls
   ```
   - Expected: Returns user's presigned URLs
   - Validates: Custom userId lookup functionality

3. **Invalid MongoDB ID**
   ```
   GET /api/users/invalid-id/presigned-urls
   ```
   - Expected: Returns 400 Bad Request
   - Validates: ID validation

4. **Non-existent User**
   ```
   GET /api/users/nonexistent-user/presigned-urls
   ```
   - Expected: Returns 404 Not Found
   - Validates: User existence check

5. **Authentication Check**
   ```
   GET /api/users/68a9902e4f0701bb871e1f3e/presigned-urls
   # No Authorization header
   ```
   - Expected: Returns 401 Unauthorized
   - Validates: Authentication middleware

### Sample Successful Response
```json
{
    "success": true,
    "images": [
        {
            "url": "https://nfacialimagescollections.s3.ap-south-1.amazonaws.com/public/user-id-example",
            "originalUrl": "https://nfacialimagescollections.s3.ap-south-1.amazonaws.com/public/user-id-example",
            "filename": "user-id-example",
            "isPublic": true,
            "uploadedAt": "2025-08-23T09:56:36.127Z"
        }
    ],
    "user": {
        "_id": "68a9902e4f0701bb871e1f3e",
        "userId": "user-rgdr58npg-meo33m5p",
        "verificationStatus": "pending"
    }
}
```

### Running Tests

1. Make the script executable:
   ```bash
   chmod +x test/api-test.sh
   ```

2. Run the tests:
   ```bash
   ./test/api-test.sh
   ```

### Troubleshooting

1. **401 Unauthorized**
   - Check if JWT token is valid and not expired
   - Verify token format in Authorization header

2. **404 Not Found**
   - Verify user ID exists in database
   - Check both MongoDB ID and custom userId formats

3. **500 Internal Server Error**
   - Check MongoDB connection
   - Verify AWS credentials and S3 bucket configuration

### Environment Requirements

- `JWT_TOKEN`: Valid JWT token for authentication
- MongoDB connection
- AWS S3 configuration:
  - AWS_REGION
  - AWS_ACCESS_KEY_ID
  - AWS_SECRET_ACCESS_KEY
  - AWS_S3_BUCKET
