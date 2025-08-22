const AWS = require('aws-sdk');
const express = require('express');
const router = express.Router();

// Test AWS credentials
router.get('/test-aws', async (req, res) => {
    try {
        const s3 = new AWS.S3();
        const buckets = await s3.listBuckets().promise();
        
        res.json({
            success: true,
            message: 'AWS credentials are working',
            bucketCount: buckets.Buckets.length,
            region: process.env.AWS_REGION,
            bucketName: process.env.AWS_S3_BUCKET
        });
    } catch (error) {
        console.error('AWS Test Error:', error);
        res.status(500).json({
            success: false,
            message: 'AWS credentials test failed',
            error: error.message
        });
    }
});

module.exports = router;
