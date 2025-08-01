# Face Recognition API Testing Guide

## 🚀 Quick Start

### Prerequisites
1. **Server Running**: `npm start` (should be on http://localhost:3000)
2. **Environment Variables**: Make sure all AWS and database variables are set
3. **Test Image**: Create a `test.jpg` file in the project root for upload tests

## 📋 API Endpoints Overview

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/health` | Health check | No |
| POST | `/api/auth/signup` | Register user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/face-recognition` | Get all face images | Yes |
| POST | `/api/face-recognition/upload` | Upload face image | Yes |
| POST | `/api/face-recognition/search` | Search face | Yes |
| GET | `/api/face-recognition/search?name=...` | Search by name | Yes |
| GET | `/api/face-recognition/:id` | Get by ID | Yes |
| GET | `/api/face-recognition/rekognition/:id` | Get by Rekognition ID | Yes |
| GET | `/api/face-recognition/image/:key` | Get S3 image | Yes |
| PATCH | `/api/face-recognition/:id` | Update face image | Yes |
| DELETE | `/api/face-recognition/:id` | Delete face image | Yes |

## 🧪 Testing Methods

### 1. Terminal Testing (Shell Script)

#### Setup
```bash
# Make script executable
chmod +x test_api.sh

# Create a test image (optional)
# You can use any JPEG/PNG image and rename it to test.jpg
```

#### Run Tests
```bash
# Run all tests
./test_api.sh

# Expected output:
# 🚀 Starting Face Recognition API Tests...
# [INFO] Testing Health Check...
# [SUCCESS] Health check passed
# [INFO] Logging in to get JWT token...
# [SUCCESS] Login successful
# [SUCCESS] JWT token obtained
# [INFO] Testing Get All Face Images...
# [SUCCESS] Get all face images successful
# ... (more tests)
```

### 2. Postman Testing

#### Import Collection
1. Open Postman
2. Click "Import" button
3. Select `Face_Recognition_API.postman_collection.json`
4. The collection will be imported with all requests

#### Setup Environment
1. The collection uses variables automatically
2. After login, the JWT token is automatically saved
3. After upload, face image IDs are automatically saved

#### Test Flow
1. **Health Check** - Verify API is running
2. **Register User** - Create test account
3. **Login User** - Get JWT token (automatically saved)
4. **Upload Face Image** - Upload test image (IDs automatically saved)
5. **Search Face** - Test face recognition
6. **Get All Images** - List all uploaded images
7. **Other endpoints** - Test remaining functionality

## 📝 Individual Endpoint Tests

### Health Check
```bash
curl -X GET http://localhost:3000/api/health
```
**Expected**: `{"status":"success","message":"API is working!","timestamp":"..."}`

### Authentication
```bash
# Register
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Upload Face Image
```bash
curl -X POST http://localhost:3000/api/face-recognition/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@test.jpg" \
  -F "fullName=Test Person"
```

### Search Face
```bash
curl -X POST http://localhost:3000/api/face-recognition/search-face \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@test.jpg"
```

### Get All Images
```bash
curl -X GET http://localhost:3000/api/face-recognition \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔍 Expected Responses

### Successful Upload Response
```json
{
  "status": "success",
  "message": "Face image uploaded and indexed successfully",
  "data": {
    "faceImage": {
      "_id": "...",
      "rekognitionId": "...",
      "fullName": "Test Person",
      "imageUrl": "https://bucket.s3.region.amazonaws.com/...",
      "s3Key": "face-images/...",
      "confidence": 95.5,
      "user": "..."
    },
    "s3Url": "https://bucket.s3.region.amazonaws.com/...",
    "faceDetection": {
      "Confidence": 95.5,
      "BoundingBox": {...}
    }
  }
}
```

### Successful Search Response
```json
{
  "status": "success",
  "message": "Face match found",
  "data": {
    "matches": [
      {
        "Similarity": 95.5,
        "Face": {
          "FaceId": "...",
          "Confidence": 95.5
        }
      }
    ],
    "bestMatch": {
      "faceImage": {...},
      "confidence": 95.5,
      "faceId": "..."
    }
  }
}
```

## ⚠️ Error Scenarios

### Authentication Error (401)
```json
{
  "status": "error",
  "message": "You are not logged in! Please log in to get access."
}
```

### No Face Detected (400)
```json
{
  "status": "error",
  "message": "No face detected in the image. Please upload an image with a clear face."
}
```

### Invalid File Type (400)
```json
{
  "success": false,
  "message": "Invalid file type. Only JPEG and PNG are allowed."
}
```

## 🛠️ Troubleshooting

### Common Issues

1. **Server Not Running**
   ```bash
   npm start
   ```

2. **Environment Variables Missing**
   - Check `src/config/config.env`
   - Ensure AWS credentials are set

3. **Database Connection Issues**
   - Verify MongoDB connection string
   - Check network connectivity

4. **AWS Credentials Issues**
   - Verify AWS access keys
   - Check S3 bucket permissions
   - Ensure Rekognition collection exists

5. **File Upload Issues**
   - Ensure file is JPEG or PNG
   - Check file size (max 10MB)
   - Verify file has a clear face

### Debug Commands

```bash
# Check server logs
npm start

# Test database connection
curl http://localhost:3000/api/health

# Test authentication
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 📊 Test Coverage

The test files cover:

- ✅ **Authentication** (login/register)
- ✅ **Health checks**
- ✅ **File uploads** (valid and invalid)
- ✅ **Face recognition** (upload and search)
- ✅ **Database operations** (CRUD)
- ✅ **S3 integration** (upload and retrieval)
- ✅ **Error handling** (authentication, validation)
- ✅ **API responses** (success and error cases)

## 🎯 Next Steps

1. **Run the shell script**: `./test_api.sh`
2. **Import Postman collection**: Use the JSON file
3. **Create test images**: Add JPEG/PNG files for testing
4. **Monitor logs**: Watch server output for debugging
5. **Test edge cases**: Try invalid files, missing auth, etc.

## 📞 Support

If you encounter issues:
1. Check server logs for error messages
2. Verify environment variables are set correctly
3. Ensure AWS services are properly configured
4. Test with the provided shell script and Postman collection 