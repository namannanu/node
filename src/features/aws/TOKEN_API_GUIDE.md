# Token-Based Upload API Guide

## Overview
This API now uses JWT tokens for authentication and enforces a one-image-per-user policy.

## API Endpoints

### 1. Generate Token (Public)
**POST** `/api/generate-token`

**Body:**
```json
{
  "userId": "user123",
  "fullname": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h",
  "user": {
    "userId": "user123",
    "fullname": "John Doe"
  }
}
```

### 2. Upload Image (Protected)
**POST** `/api/upload`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data
```

**Form Data:**
- `image`: Image file (JPEG/PNG, max 10MB)

**Response:**
```json
{
  "success": true,
  "fileUrl": "fallback://uploaded/user123_2025-08-21T15-30-45-123Z.jpeg",
  "storage": "base64_fallback",
  "message": "File uploaded successfully using fallback method",
  "fileInfo": {
    "filename": "user123_2025-08-21T15-30-45-123Z",
    "originalName": "photo.jpg",
    "userId": "user123",
    "uploadedBy": "John Doe"
  }
}
```

### 3. Delete Image (Protected)
**DELETE** `/api/delete`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "message": "Image deleted successfully",
  "deletedFile": {
    "filename": "user123_2025-08-21T15-30-45-123Z",
    "uploadedAt": "2025-08-21T15-30-45-123Z"
  }
}
```

### 4. Get My Upload Info (Protected)
**GET** `/api/my-upload`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "uploadInfo": {
    "filename": "user123_2025-08-21T15-30-45-123Z",
    "originalName": "photo.jpg",
    "size": 34717,
    "uploadedBy": "John Doe",
    "storage": "base64_fallback"
  }
}
```

### 5. Retrieve Image Data (Protected)
**GET** `/api/retrieve-image`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "fileUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA...",
  "storage": "base64_fallback",
  "message": "Image retrieved from fallback storage"
}
```

### 6. Admin: List All Uploads (Public for demo)
**GET** `/api/admin/uploads`

**Response:**
```json
{
  "success": true,
  "totalUploads": 2,
  "uploads": [
    {
      "userId": "user123",
      "filename": "user123_2025-08-21T15-30-45-123Z",
      "originalName": "photo.jpg",
      "size": 34717,
      "uploadedBy": "John Doe",
      "storage": "base64_fallback"
    }
  ]
}
```

### 7. System Status (Public)
**GET** `/api/aws-status`

## Usage Flow

1. **Get Token**: Call `/api/generate-token` with userId and fullname
2. **Upload Image**: Use the token to upload one image via `/api/upload`
3. **Manage Image**: View with `/api/my-upload`, retrieve with `/api/retrieve-image`, or delete with `/api/delete`
4. **Re-upload**: After deletion, user can upload a new image

## Key Features

- ✅ **JWT Authentication**: All upload/delete operations require valid token
- ✅ **One Image Per User**: Each userId can only have one active upload
- ✅ **Token Expiry**: Tokens expire after 24 hours
- ✅ **Fallback Storage**: Works without AWS credentials using base64 encoding
- ✅ **S3 Integration**: Automatically uses AWS S3 when credentials are available
- ✅ **Delete Protection**: Users can only delete their own uploads

## Error Responses

```json
{
  "success": false,
  "message": "You have already uploaded an image. Delete the existing image first.",
  "existingUpload": { ... }
}
```

```json
{
  "success": false,
  "message": "Access token is required"
}
```

```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```
