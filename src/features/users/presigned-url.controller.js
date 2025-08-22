const AWS = require('aws-sdk');
const { catchAsync } = require('../../shared/utils/catchAsync');

// Initialize S3 client
const s3 = new AWS.S3();

exports.getPresignedUrls = catchAsync(async (req, res) => {
    console.log('📥 Received pre-signed URL request for userId:', req.params.userId);
    const { userId } = req.params;

    // Find user and verify they are in pending status
    console.log('🔍 Looking up user in database...');
    const user = await req.db.collection('users').findOne({ _id: userId });
    console.log('👤 User found:', user ? 'Yes' : 'No');
    
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    if (user.verificationStatus !== 'pending') {
        return res.status(400).json({
            success: false,
            message: 'Pre-signed URLs are only generated for pending users'
        });
    }

    const urls = {
        uploadedPhoto: null,
        aadhaarPhoto: null
    };

    // Generate URL for uploaded photo if it exists
    if (user.uploadedPhoto) {
        console.log('📸 Generating signed URL for uploaded photo:', user.uploadedPhoto);
        try {
            urls.uploadedPhoto = await s3.getSignedUrlPromise('getObject', {
                Bucket: process.env.AWS_S3_BUCKET,
                Key: user.uploadedPhoto,
                Expires: 300 // 5 minutes
            });
            console.log('✅ Successfully generated uploaded photo URL');
        } catch (error) {
            console.error('❌ Error generating uploaded photo URL:', error);
        }
    } else {
        console.log('ℹ️ No uploaded photo found for user');
    }

    // Generate URL for aadhaar photo if it exists
    if (user.aadhaarPhoto) {
        try {
            urls.aadhaarPhoto = await s3.getSignedUrlPromise('getObject', {
                Bucket: process.env.AWS_S3_BUCKET,
                Key: user.aadhaarPhoto,
                Expires: 300 // 5 minutes
            });
        } catch (error) {
            console.error('Error generating aadhaar photo URL:', error);
        }
    }

    res.json({
        success: true,
        urls
    });
});
