const catchAsync = require('../../shared/utils/catchAsync');
const AWS = require('aws-sdk');
const mongoose = require('mongoose'); // Import mongoose for ObjectId conversion

// Initialize S3 client with explicit configuration
const s3 = new AWS.S3({
    apiVersion: '2006-03-01',
    region: process.env.AWS_REGION,
    signatureVersion: 'v4'
});

// Debug function to verify AWS configuration
const verifyAwsConfig = () => {
    console.log('🔑 AWS Configuration Check:');
    console.log('- Region:', process.env.AWS_REGION);
    console.log('- Bucket:', process.env.AWS_S3_BUCKET);
    console.log('- Access Key ID:', process.env.AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing');
    console.log('- Secret Access Key:', process.env.AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing');
};

// Handle pre-signed URL generation
const getPresignedUrls = catchAsync(async (req, res) => {
    // Verify AWS configuration on each request during testing
    verifyAwsConfig();
    
    console.log('📥 Received pre-signed URL request');
    console.log('- UserId:', req.params.userId);
    console.log('- Auth Header:', req.headers.authorization ? '✅ Present' : '❌ Missing');
    
    const { userId } = req.params;

    try {
        // Find user and verify they are in pending status
        console.log('🔍 Looking up user in database...');
        
        // Check if req.db is available (from middleware)
        if (!req.db) {
            console.log('❌ Database connection not attached to request');
            return res.status(500).json({
                success: false,
                message: 'Database connection error'
            });
        }

        // Convert string ID to MongoDB ObjectId
        let userObjectId;
        try {
            userObjectId = new mongoose.Types.ObjectId(userId);
        } catch (error) {
            console.log('❌ Invalid user ID format:', userId);
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const user = await req.db.collection('users').findOne({ _id: userObjectId });
        console.log('👤 User lookup result:', {
            found: !!user,
            userId: userId,
            status: user?.verificationStatus,
            hasUploadedPhoto: !!user?.uploadedPhoto,
            hasAadhaarPhoto: !!user?.aadhaarPhoto
        });

        if (!user) {
            console.log('❌ User not found with ID:', userId);
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.verificationStatus !== 'pending') {
            console.log('⚠️ User not in pending status:', user.verificationStatus);
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
                // Don't fail the entire request if one URL generation fails
            }
        } else {
            console.log('ℹ️ No uploaded photo found for user');
        }

        // Generate URL for aadhaar photo if it exists
        if (user.aadhaarPhoto) {
            console.log('📑 Generating signed URL for aadhaar photo:', user.aadhaarPhoto);
            try {
                urls.aadhaarPhoto = await s3.getSignedUrlPromise('getObject', {
                    Bucket: process.env.AWS_S3_BUCKET,
                    Key: user.aadhaarPhoto,
                    Expires: 300 // 5 minutes
                });
                console.log('✅ Successfully generated aadhaar photo URL');
            } catch (error) {
                console.error('❌ Error generating aadhaar photo URL:', error);
                // Don't fail the entire request if one URL generation fails
            }
        } else {
            console.log('ℹ️ No aadhaar photo found for user');
        }

        console.log('📤 Sending response:', {
            hasUploadedPhotoUrl: !!urls.uploadedPhoto,
            hasAadhaarPhotoUrl: !!urls.aadhaarPhoto
        });

        res.json({
            success: true,
            urls,
            user: {
                id: user._id,
                fullName: user.fullName,
                verificationStatus: user.verificationStatus
            }
        });
    } catch (error) {
        console.error('💥 Unexpected error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Export the controller function as an object - this matches how it's imported in user.routes.js
module.exports = {
    getPresignedUrls
};