const express = require("express");
const multer = require("multer");
const { S3Client, PutObjectCommand, DeleteObjectCommand, ListBucketsCommand } = require("@aws-sdk/client-s3");
const { fromNodeProviderChain } = require("@aws-sdk/credential-providers");
const jwt = require('jsonwebtoken');

// Import S3 signed URL service
const { getSignedImageUrl, checkObjectExists, getMultipleSignedUrls } = require('../s3-signed-url.service');
const { updateUserAfterUpload } = require('../aws.middleware');

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

// Initialize S3 client with proper error handling
let s3;
let s3Available = false;

try {
    const awsConfig = {
        region: process.env.AWS_REGION || "ap-south-1"
    };

    // Check for Vercel environment variables first
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY;
    
    if (accessKeyId && secretAccessKey) {
        awsConfig.credentials = {
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey
        };
        console.log("[DEBUG] Using explicit AWS credentials from environment variables");
    } else {
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
router.post("/upload", verifyToken, upload.single("image"), updateUserAfterUpload, async (req, res) => {
    try {
        console.log("[DEBUG] Upload route hit.");

        if (!req.file) {
            console.log("[ERROR] No file received.");
            return res.status(400).json({ success: false, msg: "No file uploaded" });
        }

        const userId = req.user.userId;
        const fullname = req.body.fullname;
        
        if (!fullname) {
            return res.status(400).json({ 
                success: false, 
                message: "fullname is required in request body" 
            });
        }
        
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
        
        const sanitizedFullname = fullname.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
        
        if (sanitizedFullname.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: "fullname contains only invalid characters" 
            });
        }
        
        if (userUploads.has(userId)) {
            const existingUpload = userUploads.get(userId);
            return res.status(409).json({
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
        const filename = `${userId}_${sanitizedFullname.replace(/\s+/g, '_')}`;

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
                }
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

            userUploads.set(userId, uploadData);

            const User = require('../../users/user.model');
            try {
                const updatedUser = await User.findOneAndUpdate(
                    { userId: userId },
                    { 
                        $set: { 
                            uploadedPhoto: fileUrl,
                            updatedAt: new Date()
                        }
                    },
                    { new: true }
                );

                if (!updatedUser) {
                    console.log(`❌ No user found with userId: ${userId}`);
                    throw new Error('User not found');
                }

                console.log('✅ User record updated with photo URL:', fileUrl);
                
                return res.status(200).json({ 
                    success: true, 
                    fileUrl,
                    storage: "aws_s3",
                    message: "File uploaded to AWS S3 and user record updated successfully",
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
                    fileInfo: uploadData,
                    user: {
                        userId: updatedUser.userId,
                        name: updatedUser.name,
                        uploadedPhoto: updatedUser.uploadedPhoto,
                        verificationStatus: updatedUser.verificationStatus
                    }
                });

            } catch (dbError) {
                console.error('❌ Error updating user record:', dbError);
                return res.status(200).json({ 
                    success: true, 
                    fileUrl,
                    storage: "aws_s3",
                    message: "File uploaded to AWS S3 successfully but user record update failed",
                    warning: "Failed to update user record with new photo URL",
                    uploadInfo: {
                        filename: filename,
                        originalName: req.file.originalname,
                        size: req.file.size,
                        sizeMB: Math.round(req.file.size / (1024 * 1024) * 100) / 100,
                        uploadedBy: sanitizedFullname,
                        userId: userId,
                        uploadedAt: timestamp
                    },
                    fileInfo: uploadData
                });
            }

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
        return res.status(500).json({ 
            success: false, 
            msg: "Upload failed", 
            error: process.env.NODE_ENV === 'development' ? err.message : "Internal server error"
        });
    }
});

// [Rest of the routes remain unchanged...]

module.exports = router;
