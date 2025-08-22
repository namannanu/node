const catchAsync = require('../../shared/utils/catchAsync');
const AWS = require('aws-sdk');

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
        const user = await req.db.collection('users').findOne({ _id: userId });
        console.log('👤 User lookup result:', {
            found: !!user,
            status: user?.verificationStatus,
            hasUploadedPhoto: !!user?.uploadedPhoto,
            hasAadhaarPhoto: !!user?.aadhaarPhoto
        });

        if (!user) {
            console.log('❌ User not found');
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
            }
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
            }
        }

        console.log('📤 Sending response:', {
            hasUploadedPhotoUrl: !!urls.uploadedPhoto,
            hasAadhaarPhotoUrl: !!urls.aadhaarPhoto
        });

        res.json({
            success: true,
            urls
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

// Export the function directly (not as an object)
module.exports = getPresignedUrls;