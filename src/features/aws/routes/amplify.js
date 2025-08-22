const express = require("express");
const multer = require("multer");
const { S3Client, PutObjectCommand, DeleteObjectCommand, ListBucketsCommand } = require("@aws-sdk/client-s3");
const { fromNodeProviderChain } = require("@aws-sdk/credential-providers");
const jwt = require('jsonwebtoken');

// Import S3 signed URL service
const { getSignedImageUrl, checkObjectExists, getMultipleSignedUrls } = require('../s3-signed-url.service');

const router = express.Router();

// In-memory storage for user uploads (in production, use a database)
const userUploads = new Map();

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Access token is required' 
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ 
            success: false, 
            message: 'Invalid or expired token' 
        });
    }
};

// Generate token endpoint
router.post("/generate-token", (req, res) => {
    const { userId } = req.body;
    
    if (!userId) {
        return res.status(400).json({ 
            success: false, 
            message: 'userId is required' 
        });
    }

    const token = jwt.sign(
        { userId },
        JWT_SECRET,
        { expiresIn: '24h' }
    );

    res.json({
        success: true,
        token,
        expiresIn: '24h',
        user: { userId },
        note: "fullname will be provided during upload from Aadhar API"
    });
});

// Initialize S3 client with proper error handling
let s3;
let s3Available = false;

try {
    const awsConfig = {
        region: process.env.AWS_REGION || "ap-south-1"
    };

    // Check for Vercel environment variables first
    // Vercel uses different naming conventions sometimes
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY;
    
    if (accessKeyId && secretAccessKey) {
        awsConfig.credentials = {
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey
        };
        console.log("[DEBUG] Using explicit AWS credentials from environment variables");
    } else {
        // Fallback to credential provider chain (for local development)
        try {
            awsConfig.credentials = fromNodeProviderChain();
            console.log("[DEBUG] Using AWS credential provider chain");
        } catch (credError) {
            console.warn("[WARN] No AWS credentials found in environment or credential chain");
            s3Available = false;
        }
    }

    if (awsConfig.credentials) {
        s3 = new S3Client(awsConfig);
        s3Available = true;
        console.log("[DEBUG] S3 client initialized successfully");
    }
} catch (s3Error) {
    console.error("[ERROR] S3 client initialization failed:", s3Error.message);
    s3Available = false;
}

// Use Memory Storage for all environments
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "image/jpeg" || file.mimetype === "image/png" || file.mimetype === "image/jpg") {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type. Only JPEG, JPG and PNG are allowed."), false);
        }
    }
});

// Upload Image with AWS S3 (Protected Route)
router.post("/upload", verifyToken, upload.single("image"), async (req, res) => {
    try {
        console.log("[DEBUG] Upload route hit.");

        if (!req.file) {
            console.log("[ERROR] No file received.");
            return res.status(400).json({ success: false, msg: "No file uploaded" });
        }

        const userId = req.user.userId; // Get from JWT token
        const fullname = req.body.fullname; // Get from request body (will be from Aadhar API later)
        
        // Validate required fields
        if (!fullname) {
            return res.status(400).json({ 
                success: false, 
                message: "fullname is required in request body" 
            });
        }
        
        // Additional validation for fullname
        if (fullname.trim().length < 2) {
            return res.status(400).json({ 
                success: false, 
                message: "fullname must be at least 2 characters long" 
            });
        }
        
        if (fullname.length > 50) {
            return res.status(400).json({ 
                success: false, 
                message: "fullname cannot exceed 50 characters" 
            });
        }
        
        // Sanitize fullname (remove special characters that might cause issues in filename)
        const sanitizedFullname = fullname.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
        
        if (sanitizedFullname.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: "fullname contains only invalid characters" 
            });
        }
        
        // Check if user already has an uploaded image
        if (userUploads.has(userId)) {
            const existingUpload = userUploads.get(userId);
            return res.status(409).json({ // 409 Conflict is more appropriate than 400
                success: false, 
                message: "You have already uploaded an image. Delete the existing image first to upload a new one.",
                error: "DUPLICATE_UPLOAD_BLOCKED",
                existingUpload: {
                    filename: existingUpload.filename,
                    uploadedBy: existingUpload.uploadedBy,
                    uploadedAt: existingUpload.uploadedAt,
                    fileUrl: existingUpload.fileUrl
                },
                actions: {
                    deleteExisting: `DELETE ${req.protocol}://${req.get('host')}/api/delete`,
                    viewExisting: `GET ${req.protocol}://${req.get('host')}/api/my-upload`
                }
            });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${userId}_${sanitizedFullname.replace(/\s+/g, '_')}`; // Format: userid_sanitized_fullname

        // AWS S3 upload only - no fallback
        if (!s3Available || !s3) {
            return res.status(503).json({ 
                success: false, 
                message: "S3 service unavailable. Please check AWS credentials.",
                error: "S3_UNAVAILABLE"
            });
        }

        try {
            const params = {
                Bucket: "nfacialimagescollections",
                Key: `public/${filename}`,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
                Metadata: { 
                    fullname: sanitizedFullname,
                    originalFullname: fullname,
                    userId: userId,
                    uploadedAt: timestamp
                },
            };

            console.log("[DEBUG] Attempting S3 upload...");
            await s3.send(new PutObjectCommand(params));
            console.log("[DEBUG] S3 upload successful.");

            const fileUrl = `https://nfacialimagescollections.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/public/${filename}`;
            
            const uploadData = {
                filename: filename,
                originalName: req.file.originalname,
                size: req.file.size,
                sizeMB: Math.round(req.file.size / (1024 * 1024) * 100) / 100,
                mimetype: req.file.mimetype,
                uploadedBy: sanitizedFullname,
                originalFullname: fullname,
                userId: userId,
                uploadedAt: timestamp,
                storage: "aws_s3",
                fileUrl: fileUrl,
                s3Key: `public/${filename}`,
                restrictions: {
                    oneImagePerUser: true,
                    maxSizeMB: 10,
                    allowedTypes: ["image/jpeg", "image/png", "image/jpg"]
                }
            };

            // Store user upload info
            userUploads.set(userId, uploadData);

            return res.status(200).json({ 
                success: true, 
                fileUrl,
                storage: "aws_s3",
                message: "File uploaded to AWS S3 successfully",
                uploadInfo: {
                    filename: filename,
                    originalName: req.file.originalname,
                    size: req.file.size,
                    sizeMB: Math.round(req.file.size / (1024 * 1024) * 100) / 100,
                    uploadedBy: sanitizedFullname,
                    userId: userId,
                    uploadedAt: timestamp
                },
                restrictions: {
                    note: "One image per user policy enforced",
                    toUploadAgain: "Delete existing image first using DELETE /api/delete"
                },
                fileInfo: uploadData
            });

        } catch (s3Error) {
            console.error("[ERROR] S3 upload failed:", s3Error.message);
            
            return res.status(500).json({ 
                success: false, 
                message: "Failed to upload to S3",
                error: process.env.NODE_ENV === 'development' ? s3Error.message : "S3_UPLOAD_FAILED"
            });
        }

    } catch (err) {
        console.error("[ERROR] Upload Failed:", err);
        
        res.status(500).json({ 
            success: false, 
            msg: "Upload failed", 
            error: process.env.NODE_ENV === 'development' ? err.message : "Internal server error"
        });
    }
});

// Check if user can upload (Protected Route)
router.get("/can-upload", verifyToken, (req, res) => {
    const userId = req.user.userId;
    
    const hasExistingUpload = userUploads.has(userId);
    const existingUpload = hasExistingUpload ? userUploads.get(userId) : null;
    
    res.json({
        success: true,
        canUpload: !hasExistingUpload,
        userId: userId,
        status: hasExistingUpload ? "HAS_EXISTING_UPLOAD" : "CAN_UPLOAD",
        message: hasExistingUpload ? 
            "You already have an uploaded image. Delete it first to upload a new one." : 
            "You can upload an image.",
        existingUpload: existingUpload ? {
            filename: existingUpload.filename,
            uploadedBy: existingUpload.uploadedBy,
            uploadedAt: existingUpload.uploadedAt,
            fileUrl: existingUpload.fileUrl,
            sizeMB: existingUpload.sizeMB || Math.round(existingUpload.size / (1024 * 1024) * 100) / 100
        } : null,
        actions: {
            upload: hasExistingUpload ? null : `POST /api/upload`,
            delete: hasExistingUpload ? `DELETE /api/delete` : null,
            view: hasExistingUpload ? `GET /api/my-upload` : null
        },
        systemInfo: {
            oneImagePerUser: true,
            maxSizeMB: 10,
            allowedTypes: ["image/jpeg", "image/png", "image/jpg"]
        }
    });
});

// Delete user's uploaded image (Protected Route)
router.delete("/delete", verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId; // Get from JWT token
        
        // Check if user has an uploaded image
        if (!userUploads.has(userId)) {
            return res.status(404).json({ 
                success: false, 
                message: "No uploaded image found for this user" 
            });
        }

        const uploadData = userUploads.get(userId);

        // If stored in S3, delete from S3
        if (uploadData.storage === "aws_s3" && s3Available && uploadData.s3Key) {
            try {
                const deleteParams = {
                    Bucket: "nfacialimagescollections",
                    Key: uploadData.s3Key
                };

                console.log("[DEBUG] Attempting S3 delete...");
                await s3.send(new DeleteObjectCommand(deleteParams));
                console.log("[DEBUG] S3 delete successful.");
            } catch (s3Error) {
                console.warn("[WARN] S3 delete failed:", s3Error.message);
                // Continue with local deletion even if S3 fails
            }
        }

        // Remove from local storage
        userUploads.delete(userId);

        res.status(200).json({ 
            success: true, 
            message: "Image deleted successfully",
            deletedFile: {
                filename: uploadData.filename,
                uploadedAt: uploadData.uploadedAt
            }
        });

    } catch (err) {
        console.error("[ERROR] Delete Failed:", err);
        
        res.status(500).json({ 
            success: false, 
            message: "Delete failed", 
            error: process.env.NODE_ENV === 'development' ? err.message : "Internal server error"
        });
    }
});

// Get user's uploaded image info (Protected Route)
router.get("/my-upload", verifyToken, (req, res) => {
    const userId = req.user.userId; // Get from JWT token
    
    if (!userUploads.has(userId)) {
        return res.status(404).json({ 
            success: false, 
            message: "No uploaded image found for this user" 
        });
    }

    const uploadData = userUploads.get(userId);

    res.status(200).json({ 
        success: true, 
        uploadInfo: uploadData
    });
});

// Get user's image data (S3 URL only)
router.get("/retrieve-image", verifyToken, (req, res) => {
    const userId = req.user.userId; // Get from JWT token
    
    if (!userUploads.has(userId)) {
        return res.status(404).json({ 
            success: false, 
            message: "No uploaded image found for this user" 
        });
    }

    const uploadData = userUploads.get(userId);
    
    if (uploadData.storage === "aws_s3") {
        return res.status(200).json({ 
            success: true, 
            fileUrl: uploadData.fileUrl,
            storage: "aws_s3",
            message: "Image available via S3 URL"
        });
    }

    res.status(500).json({ 
        success: false, 
        message: "Image data not available" 
    });
});

// List all users with uploads (Admin endpoint - no auth for demo)
router.get("/admin/uploads", (req, res) => {
    const uploads = Array.from(userUploads.entries()).map(([userId, data]) => ({
        userId,
        filename: data.filename,
        originalName: data.originalName,
        size: data.size,
        uploadedBy: data.uploadedBy,
        uploadedAt: data.uploadedAt,
        storage: data.storage
    }));

    res.json({
        success: true,
        totalUploads: uploads.length,
        uploads: uploads
    });
});

// Clear all user uploads (Admin endpoint for testing - no auth for demo)
router.delete("/admin/clear-all-uploads", async (req, res) => {
    try {
        const uploadCount = userUploads.size;
        
        // Clear the in-memory storage
        userUploads.clear();
        
        res.json({
            success: true,
            message: `Cleared ${uploadCount} upload records from memory`,
            note: "S3 files are not deleted - only local records cleared"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to clear uploads",
            error: error.message
        });
    }
});

// Health check endpoint for AWS status
router.get("/aws-status", (req, res) => {
    res.json({
        success: true,
        aws: {
            s3Available: s3Available,
            region: process.env.AWS_REGION || "ap-south-1",
            hasAccessKey: !!(process.env.AWS_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID),
            hasSecretKey: !!(process.env.AWS_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY),
            bucketName: "nfacialimagescollections",
            // Debug info
            accessKeyLength: process.env.ACCESS_KEY_ID ? process.env.ACCESS_KEY_ID.length : (process.env.AWS_ACCESS_KEY_ID ? process.env.AWS_ACCESS_KEY_ID.length : 0),
            secretKeyLength: process.env.SECRET_ACCESS_KEY ? process.env.SECRET_ACCESS_KEY.length : (process.env.AWS_SECRET_ACCESS_KEY ? process.env.AWS_SECRET_ACCESS_KEY.length : 0),
            credentialSource: process.env.ACCESS_KEY_ID ? "ACCESS_KEY_ID" : (process.env.AWS_ACCESS_KEY_ID ? "AWS_ACCESS_KEY_ID" : "none")
        },
        authentication: {
            required: true,
            method: "JWT Bearer Token"
        },
        userRestrictions: {
            oneImagePerUser: true,
            totalActiveUploads: userUploads.size
        },
        message: s3Available ? "AWS S3 is available and ready for uploads" : "S3 unavailable - check credentials"
    });
});

// Test S3 connection endpoint
router.get("/test-s3-connection", async (req, res) => {
    if (!s3Available) {
        return res.status(503).json({
            success: false,
            message: "S3 client not available",
            error: "Check AWS credentials and configuration"
        });
    }

    try {
        // Try to list buckets to test connection
        const command = new ListBucketsCommand({});
        const data = await s3.send(command);
        
        res.json({
            success: true,
            message: "S3 connection successful",
            bucketCount: data.Buckets ? data.Buckets.length : 0,
            region: process.env.AWS_REGION || "ap-south-1"
        });
    } catch (error) {
        console.error("[ERROR] S3 connection test failed:", error.message);
        
        res.status(500).json({
            success: false,
            message: "S3 connection test failed",
            error: process.env.NODE_ENV === 'development' ? error.message : "Connection error",
            code: error.name
        });
    }
});

// Test upload endpoint (Protected Route - returns file info without actual upload)
router.post("/test-upload", verifyToken, upload.single("image"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, msg: "No file uploaded" });
    }

    const { fullname } = req.body;
    
    if (!fullname) {
        return res.status(400).json({ 
            success: false, 
            message: "fullname is required in request body" 
        });
    }

    const fileInfo = {
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        sizeKB: Math.round(req.file.size / 1024),
        sizeMB: Math.round(req.file.size / (1024 * 1024) * 100) / 100,
        user: {
            userId: req.user.userId,
            fullname: fullname
        }
    };

    const hasExistingUpload = userUploads.has(req.user.userId);

    res.json({
        success: true,
        message: "File received successfully (test mode - not saved)",
        fileInfo: fileInfo,
        userStatus: {
            hasExistingUpload: hasExistingUpload,
            canUpload: !hasExistingUpload
        },
        aws: {
            s3Available: s3Available
        }
    });
});

// Get signed URL for user's image (Protected Route)
router.get("/signed-url/:userId", verifyToken, async (req, res) => {
    try {
        const userId = req.params.userId;
        const requestingUserId = req.user.userId;
        
        // Optional: Allow users to access their own images or implement access control
        if (requestingUserId !== userId) {
            return res.status(403).json({
                success: false,
                message: "You can only access your own image URLs"
            });
        }
        
        // Check if user has an uploaded image
        if (!userUploads.has(userId)) {
            return res.status(404).json({
                success: false,
                message: "No uploaded image found for this user"
            });
        }
        
        const uploadData = userUploads.get(userId);
        const s3Key = uploadData.s3Key; // e.g., "public/user-uxf4qav4y-memrdvmn_rohit"
        
        // Check if the object exists in S3
        const objectExists = await checkObjectExists(s3Key);
        if (!objectExists) {
            return res.status(404).json({
                success: false,
                message: "Image file not found in S3 storage",
                error: "S3_OBJECT_NOT_FOUND"
            });
        }
        
        // Generate signed URL (default 1 hour expiration)
        const signedUrl = await getSignedImageUrl(s3Key);
        
        res.json({
            success: true,
            signedUrl: signedUrl,
            expires: "1 hour",
            imageInfo: {
                filename: uploadData.filename,
                uploadedBy: uploadData.uploadedBy,
                uploadedAt: uploadData.uploadedAt,
                size: uploadData.size,
                sizeMB: uploadData.sizeMB
            },
            message: "Signed URL generated successfully"
        });
        
    } catch (error) {
        console.error("[ERROR] Failed to generate signed URL:", error.message);
        
        res.status(500).json({
            success: false,
            message: "Failed to generate signed URL",
            error: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
        });
    }
});

// Get multiple signed URLs with different expiration times (Protected Route)
router.get("/signed-urls/:userId", verifyToken, async (req, res) => {
    try {
        const userId = req.params.userId;
        const requestingUserId = req.user.userId;
        
        // Access control: users can only access their own images
        if (requestingUserId !== userId) {
            return res.status(403).json({
                success: false,
                message: "You can only access your own image URLs"
            });
        }
        
        // Check if user has an uploaded image
        if (!userUploads.has(userId)) {
            return res.status(404).json({
                success: false,
                message: "No uploaded image found for this user"
            });
        }
        
        const uploadData = userUploads.get(userId);
        const s3Key = uploadData.s3Key;
        
        // Check if the object exists in S3
        const objectExists = await checkObjectExists(s3Key);
        if (!objectExists) {
            return res.status(404).json({
                success: false,
                message: "Image file not found in S3 storage",
                error: "S3_OBJECT_NOT_FOUND"
            });
        }
        
        // Generate multiple signed URLs with different expiration times
        const multipleUrls = await getMultipleSignedUrls(s3Key);
        
        res.json({
            success: true,
            urls: multipleUrls,
            imageInfo: {
                filename: uploadData.filename,
                uploadedBy: uploadData.uploadedBy,
                uploadedAt: uploadData.uploadedAt,
                size: uploadData.size,
                sizeMB: uploadData.sizeMB
            },
            message: "Multiple signed URLs generated successfully"
        });
        
    } catch (error) {
        console.error("[ERROR] Failed to generate multiple signed URLs:", error.message);
        
        res.status(500).json({
            success: false,
            message: "Failed to generate signed URLs",
            error: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
        });
    }
});

// Get signed URL for current authenticated user (Simplified Protected Route)
router.get("/my-signed-url", verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // Check if user has an uploaded image
        if (!userUploads.has(userId)) {
            return res.status(404).json({
                success: false,
                message: "No uploaded image found for this user"
            });
        }
        
        const uploadData = userUploads.get(userId);
        const s3Key = uploadData.s3Key;
        
        // Check if the object exists in S3
        const objectExists = await checkObjectExists(s3Key);
        if (!objectExists) {
            return res.status(404).json({
                success: false,
                message: "Image file not found in S3 storage",
                error: "S3_OBJECT_NOT_FOUND"
            });
        }
        
        // Generate signed URL with custom expiration if provided
        const expirationHours = parseInt(req.query.expires) || 1;
        const expirationSeconds = Math.min(expirationHours * 60 * 60, 24 * 60 * 60); // Max 24 hours
        
        const signedUrl = await getSignedImageUrl(s3Key, expirationSeconds);
        
        res.json({
            success: true,
            signedUrl: signedUrl,
            expires: `${Math.floor(expirationSeconds / 3600)} hour(s)`,
            expiresAt: new Date(Date.now() + expirationSeconds * 1000).toISOString(),
            imageInfo: {
                filename: uploadData.filename,
                uploadedBy: uploadData.uploadedBy,
                uploadedAt: uploadData.uploadedAt,
                size: uploadData.size,
                sizeMB: uploadData.sizeMB
            },
            usage: {
                note: "Use this signed URL to access your image directly",
                queryParams: "Add ?expires=<hours> to customize expiration (max 24 hours)"
            }
        });
        
    } catch (error) {
        console.error("[ERROR] Failed to generate user's signed URL:", error.message);
        
        res.status(500).json({
            success: false,
            message: "Failed to generate signed URL",
            error: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
        });
    }
});

module.exports = router;