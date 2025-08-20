const express = require("express");

const multer = require("multer");

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const { fromNodeProviderChain } = require("@aws-sdk/credential-providers");



const router = express.Router();



// Initialize S3 client with proper error handling

let s3;

try {

    s3 = new S3Client({

        region: "ap-south-1",

        credentials: fromNodeProviderChain(),

    });

    console.log("[DEBUG] S3 client initialized successfully");

} catch (s3Error) {

    console.error("[ERROR] S3 client initialization failed:", s3Error);

}



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



        if (!s3) {

            return res.status(500).json({ 

                success: false, 

                msg: "S3 client not initialized",

                error: "AWS credentials not configured properly"

            });

        }



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

        

        // More specific error handling

        if (err.name === 'AccessDenied') {

            res.status(403).json({ 

                success: false, 

                msg: "AWS Access Denied. Check IAM permissions.",

                error: "S3 bucket access denied"

            });

        } else if (err.name === 'NoSuchBucket') {

            res.status(404).json({ 

                success: false, 

                msg: "S3 bucket not found",

                error: "Bucket does not exist"

            });

        } else {

            res.status(500).json({ 

                success: false, 

                msg: "Server Error", 

                error: err.message // Don't expose full stack trace in production

            });

        }

    }

});



// Test S3 connection endpoint

router.get("/test-s3", async (req, res) => {

    try {

        if (!s3) {

            return res.status(500).json({ 

                success: false, 

                msg: "S3 client not initialized" 

            });

        }



        // Try to list objects to test permissions

        const listParams = {

            Bucket: "nfacialimagescollections",

            MaxKeys: 1

        };



        await s3.send(new (require("@aws-sdk/client-s3").ListObjectsV2Command)(listParams));

        

        res.status(200).json({ 

            success: true, 

            msg: "S3 connection successful" 

        });

    } catch (error) {

        console.error("[ERROR] S3 test failed:", error);

        res.status(500).json({ 

            success: false, 

            msg: "S3 test failed",

            error: error.message 

        });

    }

});



module.exports = router;