const express = require("express");
const multer = require("multer");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { fromNodeProviderChain } = require("@aws-sdk/credential-providers");

const router = express.Router();

// Initialize S3 client with IAM Role credentials
const s3 = new S3Client({
    region: "ap-south-1",
    credentials: fromNodeProviderChain(),
});

// Use Memory Storage Instead of Disk
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type. Only JPEG and PNG are allowed."), false);
        }
    }
});

// Upload Image to S3
router.post("/upload", upload.single("image"), async (req, res) => {
    try {
        console.log("[DEBUG] Upload route hit.");

        if (!req.file) {
            console.log("[ERROR] No file received.");
            return res.status(400).json({ success: false, msg: "No file uploaded" });
        }

        const fullname = req.body.fullname || "default_filename";

        const params = {
            Bucket: "nfacialimagescollections",
            Key: `public/${fullname}`,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
            Metadata: { fullname: fullname },
        };

        console.log("[DEBUG] Uploading to S3...");
        await s3.send(new PutObjectCommand(params));
        console.log("[DEBUG] Upload successful.");

        const fileUrl = `https://${"nfacialimagescollections"}.s3.${"ap-south-1"}.amazonaws.com/${params.Key}`;
        res.status(200).json({ success: true, fileUrl });

    } catch (err) {
        console.error("[ERROR] Upload Failed:", err);
        res.status(500).json({ success: false, msg: "Server Error", error: err.stack });
    }
});

module.exports = router;



