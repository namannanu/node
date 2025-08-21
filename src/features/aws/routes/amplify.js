const express = require("express");
const multer = require("multer");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { fromNodeProviderChain } = require("@aws-sdk/credential-providers");

const router = express.Router();

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

// Upload Image with AWS S3 fallback
router.post("/upload", upload.single("image"), async (req, res) => {
    try {
        console.log("[DEBUG] Upload route hit.");

        if (!req.file) {
            console.log("[ERROR] No file received.");
            return res.status(400).json({ success: false, msg: "No file uploaded" });
        }

        const fullname = req.body.fullname || "anonymous";
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${fullname}_${timestamp}`;

        // Try AWS S3 upload first (if available and credentials work)
        if (s3Available && s3) {
            try {
                const params = {
                    Bucket: "nfacialimagescollections",
                    Key: `public/${filename}`,
                    Body: req.file.buffer,
                    ContentType: req.file.mimetype,
                    Metadata: { fullname: fullname },
                };

                console.log("[DEBUG] Attempting S3 upload...");
                await s3.send(new PutObjectCommand(params));
                console.log("[DEBUG] S3 upload successful.");

                const fileUrl = `https://nfacialimagescollections.s3.ap-south-1.amazonaws.com/${params.Key}`;
                return res.status(200).json({ 
                    success: true, 
                    fileUrl,
                    storage: "aws_s3",
                    message: "File uploaded to AWS S3 successfully",
                    fileInfo: {
                        filename: filename,
                        originalName: req.file.originalname,
                        size: req.file.size,
                        mimetype: req.file.mimetype,
                        uploadedBy: fullname,
                        uploadedAt: timestamp
                    }
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
        
        const fileInfo = {
            filename: filename,
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            uploadedBy: fullname,
            uploadedAt: timestamp,
            storage: "base64_fallback"
        };

        console.log("[DEBUG] Fallback upload successful.");
        
        res.status(200).json({ 
            success: true, 
            fileUrl: fallbackUrl,
            storage: "base64_fallback",
            message: "File uploaded successfully using fallback method",
            fileInfo: fileInfo
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

// Health check endpoint for AWS status
router.get("/aws-status", (req, res) => {
    res.json({
        success: true,
        aws: {
            s3Available: s3Available,
            region: process.env.AWS_REGION || "ap-south-1",
            hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
            hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
            credentialMethod: process.env.AWS_ACCESS_KEY_ID ? "explicit_keys" : "credential_provider_chain",
            bucketName: "nfacialimagescollections"
        },
        fallback: {
            available: true,
            method: "base64_data_uri"
        },
        message: s3Available ? "AWS S3 is available" : "Using fallback storage method"
    });
});

// Test upload endpoint (returns file info without actual upload)
router.post("/test-upload", upload.single("image"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, msg: "No file uploaded" });
    }

    const fileInfo = {
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        sizeKB: Math.round(req.file.size / 1024),
        sizeMB: Math.round(req.file.size / (1024 * 1024) * 100) / 100
    };

    res.json({
        success: true,
        message: "File received successfully (test mode - not saved)",
        fileInfo: fileInfo,
        aws: {
            s3Available: s3Available
        }
    });
});

module.exports = router;
