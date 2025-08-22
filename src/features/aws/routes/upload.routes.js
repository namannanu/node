const express = require("express");
const multer = require("multer");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const User = require('../../users/user.model');
const { verifyToken, updateUserAfterUpload } = require('../aws.middleware');

const router = express.Router();

// Initialize S3 client
const s3 = new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// Configure multer for memory storage
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
router.post("/upload", [verifyToken, upload.single("image")], async (req, res) => {
    try {
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
        
        const sanitizedFullname = fullname.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').trim();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${userId}_${sanitizedFullname}_${timestamp}`;

        // Upload to S3
        try {
            const params = {
                Bucket: "nfacialimagescollections",
                Key: `public/${filename}`,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
                Metadata: { 
                    fullname: sanitizedFullname,
                    userId: userId,
                    uploadedAt: timestamp
                },
            };

            await s3.send(new PutObjectCommand(params));
            const fileUrl = `https://nfacialimagescollections.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/public/${filename}`;

            // Update user record with the photo URL
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
                    throw new Error(`No user found with userId: ${userId}`);
                }

                return res.status(200).json({
                    success: true,
                    fileUrl,
                    storage: "aws_s3",
                    message: "File uploaded and user record updated successfully",
                    uploadInfo: {
                        filename,
                        originalName: req.file.originalname,
                        size: req.file.size,
                        sizeMB: Math.round(req.file.size / (1024 * 1024) * 100) / 100,
                        uploadedBy: sanitizedFullname,
                        userId,
                        uploadedAt: timestamp
                    },
                    user: {
                        userId: updatedUser.userId,
                        name: updatedUser.name,
                        uploadedPhoto: updatedUser.uploadedPhoto,
                        verificationStatus: updatedUser.verificationStatus
                    }
                });
            } catch (dbError) {
                console.error('❌ Error updating user record:', dbError);
                return res.status(500).json({
                    success: false,
                    message: "File uploaded but failed to update user record",
                    error: dbError.message
                });
            }
        } catch (s3Error) {
            console.error('❌ S3 upload error:', s3Error);
            return res.status(500).json({
                success: false,
                message: "Failed to upload file to S3",
                error: s3Error.message
            });
        }
    } catch (error) {
        console.error('❌ Upload handler error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});

module.exports = router;
