const AWS = require('aws-sdk');

// Configure AWS S3 with credentials
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || "ap-south-1"
});

/**
 * Generate a signed URL for accessing an S3 object
 * @param {string} key - The S3 object key (e.g., "public/user-uxf4qav4y-memrdvmn_rohit")
 * @param {number} expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns {Promise<string>} - Signed URL
 */
const getSignedImageUrl = async (key, expiresIn = 60 * 60) => {
  try {
    const signedUrl = await s3.getSignedUrlPromise('getObject', {
      Bucket: "nfacialimagescollections",
      Key: key,
      Expires: expiresIn
    });
    
    console.log(`[DEBUG] Generated signed URL for key: ${key}`);
    return signedUrl;
  } catch (error) {
    console.error(`[ERROR] Failed to generate signed URL for key ${key}:`, error.message);
    throw error;
  }
};

/**
 * Check if an S3 object exists
 * @param {string} key - The S3 object key
 * @returns {Promise<boolean>} - True if object exists
 */
const checkObjectExists = async (key) => {
  try {
    await s3.headObject({
      Bucket: "nfacialimagescollections",
      Key: key
    }).promise();
    return true;
  } catch (error) {
    if (error.code === 'NotFound') {
      return false;
    }
    throw error;
  }
};

/**
 * Generate multiple signed URLs for different expiration times
 * @param {string} key - The S3 object key
 * @returns {Promise<Object>} - Object with different expiration URLs
 */
const getMultipleSignedUrls = async (key) => {
  try {
    const [shortUrl, mediumUrl, longUrl] = await Promise.all([
      getSignedImageUrl(key, 15 * 60), // 15 minutes
      getSignedImageUrl(key, 60 * 60), // 1 hour
      getSignedImageUrl(key, 24 * 60 * 60) // 24 hours
    ]);

    return {
      short: { url: shortUrl, expiresIn: '15 minutes' },
      medium: { url: mediumUrl, expiresIn: '1 hour' },
      long: { url: longUrl, expiresIn: '24 hours' }
    };
  } catch (error) {
    console.error(`[ERROR] Failed to generate multiple signed URLs for key ${key}:`, error.message);
    throw error;
  }
};

module.exports = {
  getSignedImageUrl,
  checkObjectExists,
  getMultipleSignedUrls,
  s3
};
