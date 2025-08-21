const express = require("express");
const multer = require("multer");
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { fromNodeProviderChain } = require("@aws-sdk/credential-providers");
const jwt = require('jsonwebtoken');

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
    const { userId, fullname } = req.body;
    
    if (!userId || !fullname) {
        return res.status(400).json({ 
            success: false, 
            message: 'userId and fullname are required' 
        });
    }

    const token = jwt.sign(
        { userId, fullname },
        JWT_SECRET,
        { expiresIn: '24h' }
    );

    res.json({
        success: true,
        token,
        expiresIn: '24h',
        user: { userId, fullname }
    });
});

// Initialize S3 client with proper error handling
let s3;
let s3Available = false;

try {
    const awsConfig = {
        region: process.env.AWS_REGION || "ap-south-1"
    };

    // Use explicit credentials if provided, otherwise fallback to credential chain
    if (process.env.ACCESS_KEY_ID && process.env.SECRET_ACCESS_KEY) {
        awsConfig.credentials = {
            accessKeyId: process.env.ACCESS_KEY_ID,
            secretAccessKey: process.env.SECRET_ACCESS_KEY
        };
        console.log("[DEBUG] Using explicit AWS credentials");
    } else {
        // Fallback to credential provider chain (IAM roles, etc.)
        awsConfig.credentials = fromNodeProviderChain();
        console.log("[DEBUG] Using AWS credential provider chain");
    }

    s3 = new S3Client(awsConfig);
    s3Available = true;
    console.log("[DEBUG] S3 client initialized successfully");
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
        if (file.mimetype === "image/jpeg" || file.mimetype === "image/png" ) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type. Only JPEG and PNG are allowed."), false);
        }
    }
});

// Upload Image with AWS S3 fallback (Protected Route)
router.post("/upload", verifyToken, upload.single("image"), async (req, res) => {
    try {
        console.log("[DEBUG] Upload route hit.");

        if (!req.file) {
            console.log("[ERROR] No file received.");
            return res.status(400).json({ success: false, msg: "No file uploaded" });
        }

        const userId = req.user.userId;
        const fullname = req.user.fullname;
        
        // Check if user already has an uploaded image
        if (userUploads.has(userId)) {
            return res.status(400).json({ 
                success: false, 
                message: "You have already uploaded an image. Delete the existing image first.",
                existingUpload: userUploads.get(userId)
            });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${userId}_${timestamp}`;

        // Try AWS S3 upload first (if available and credentials work)
        if (s3Available && s3) {
            try {
                const params = {
                    Bucket: "nfacialimagescollections",
                    Key: `public/${filename}`,
                    Body: req.file.buffer,
                    ContentType: req.file.mimetype,
                    Metadata: { 
                        fullname: fullname,
                        userId: userId 
                    },
                };

                console.log("[DEBUG] Attempting S3 upload...");
                await s3.send(new PutObjectCommand(params));
                console.log("[DEBUG] S3 upload successful.");

                const fileUrl = `https://nfacialimagescollections.s3.ap-south-1.amazonaws.com/${params.Key}`;
                
                const uploadData = {
                    filename: filename,
                    originalName: req.file.originalname,
                    size: req.file.size,
                    mimetype: req.file.mimetype,
                    uploadedBy: fullname,
                    userId: userId,
                    uploadedAt: timestamp,
                    storage: "aws_s3",
                    fileUrl: fileUrl,
                    s3Key: params.Key
                };

                // Store user upload info
                userUploads.set(userId, uploadData);

                return res.status(200).json({ 
                    success: true, 
                    fileUrl,
                    storage: "aws_s3",
                    message: "File uploaded to AWS S3 successfully",
                    fileInfo: uploadData
                });

            } catch (s3Error) {
                console.warn("[WARN] S3 upload failed, using fallback storage:", s3Error.message);
                // Mark S3 as unavailable for future requests in this session
                s3Available = false;
                // Continue to fallback below
            }
        }

        // Fallback: Base64 data URI (works without AWS credentials)
        console.log("[DEBUG] Using fallback storage (base64 data URI)...");
        
        // Store the base64 data but return a simple URL-like identifier
        const base64Data = req.file.buffer.toString('base64');
        const fallbackUrl = `fallback://uploaded/${filename}.${req.file.mimetype.split('/')[1]}`;
        
        const uploadData = {
            filename: filename,
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            uploadedBy: fullname,
            userId: userId,
            uploadedAt: timestamp,
            storage: "base64_fallback",
            fileUrl: fallbackUrl,
            base64Data: base64Data // Store for potential retrieval
        };

        // Store user upload info
        userUploads.set(userId, uploadData);

        console.log("[DEBUG] Fallback upload successful.");
        
        res.status(200).json({ 
            success: true, 
            fileUrl: fallbackUrl,
            storage: "base64_fallback",
            message: "File uploaded successfully using fallback method",
            fileInfo: uploadData
        });

    } catch (err) {
        console.error("[ERROR] Upload Failed:", err);
        
        res.status(500).json({ 
            success: false, 
            msg: "Upload failed", 
            error: process.env.NODE_ENV === 'development' ? err.message : "Internal server error"
        });
    }
});

// Delete user's uploaded image (Protected Route)
router.delete("/delete", verifyToken, async (req, res) => {
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
    const userId = req.user.userId;
    
    if (!userUploads.has(userId)) {
        return res.status(404).json({ 
            success: false, 
            message: "No uploaded image found for this user" 
        });
    }

    const uploadData = userUploads.get(userId);
    
    // Remove sensitive data before sending
    const safeUploadData = {
        ...uploadData,
        base64Data: uploadData.base64Data ? '[BASE64_DATA_HIDDEN]' : undefined
    };

    res.status(200).json({ 
        success: true, 
        uploadInfo: safeUploadData
    });
});

// Get user's image data (for fallback storage retrieval)
router.get("/retrieve-image", verifyToken, (req, res) => {
    const userId = req.user.userId;
    
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
    } else if (uploadData.storage === "base64_fallback" && uploadData.base64Data) {
        const dataUri = `data:${uploadData.mimetype};base64,${uploadData.base64Data}`;
        return res.status(200).json({ 
            success: true, 
            fileUrl: dataUri,
            storage: "base64_fallback",
            message: "Image retrieved from fallback storage"
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

// Health check endpoint for AWS status
router.get("/aws-status", (req, res) => {
    res.json({
        success: true,
        aws: {
            s3Available: s3Available,
            region: process.env.AWS_REGION || "ap-south-1",
            hasAccessKey: !!process.env.ACCESS_KEY_ID,
            hasSecretKey: !!process.env.SECRET_ACCESS_KEY,
            credentialMethod: process.env.ACCESS_KEY_ID ? "explicit_keys" : "credential_provider_chain",
            bucketName: "nfacialimagescollections"
        },
        fallback: {
            available: true,
            method: "base64_data_uri"
        },
        authentication: {
            required: true,
            method: "JWT Bearer Token"
        },
        userRestrictions: {
            oneImagePerUser: true,
            totalActiveUploads: userUploads.size
        },
        message: s3Available ? "AWS S3 is available" : "Using fallback storage method"
    });
});

// Test upload endpoint (Protected Route - returns file info without actual upload)
router.post("/test-upload", verifyToken, upload.single("image"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, msg: "No file uploaded" });
    }

    const fileInfo = {
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        sizeKB: Math.round(req.file.size / 1024),
        sizeMB: Math.round(req.file.size / (1024 * 1024) * 100) / 100,
        user: {
            userId: req.user.userId,
            fullname: req.user.fullname
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

module.exports = router;
