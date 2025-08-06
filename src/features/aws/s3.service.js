const { s3 } = require('../../config/aws-robust');

// Dynamic import of AWS SDK commands based on version
let PutObjectCommand, DeleteObjectCommand, GetObjectCommand, getSignedUrl;

try {
  // Try AWS SDK v3 commands
  const s3Commands = require('@aws-sdk/client-s3');
  const presigner = require('@aws-sdk/s3-request-presigner');
  PutObjectCommand = s3Commands.PutObjectCommand;
  DeleteObjectCommand = s3Commands.DeleteObjectCommand;
  GetObjectCommand = s3Commands.GetObjectCommand;
  getSignedUrl = presigner.getSignedUrl;
} catch (error) {
  console.log('AWS SDK v3 S3 commands not available, using v2 compatibility');
}

const bucketName = process.env.S3_BUCKET_NAME || 'nfacialimagescollections';

const s3Service = {
  async uploadFile(fileBuffer, fileName, contentType = 'image/jpeg') {
    const key = `face-images/${Date.now()}-${fileName}`;
    
    try {
      // AWS SDK v3
      if (s3.send && PutObjectCommand) {
        const command = new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: fileBuffer,
          ContentType: contentType,
          ACL: 'public-read'
        });
        await s3.send(command);
      }
      // AWS SDK v2
      else if (s3.upload) {
        await s3.upload({
          Bucket: bucketName,
          Key: key,
          Body: fileBuffer,
          ContentType: contentType,
          ACL: 'public-read'
        }).promise();
      }
      // Fallback
      else {
        return { success: false, error: 'AWS S3 not available' };
      }

      const url = `https://${bucketName}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${key}`;
      
      return {
        url,
        key,
        bucket: bucketName,
        region: process.env.AWS_REGION || 'ap-south-1'
      };
    } catch (error) {
      console.error('S3 Upload Error:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteFile(key) {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key
    });

    try {
      await s3.send(command);
      return { success: true };
    } catch (error) {
      console.error('S3 Delete Error:', error);
      throw new Error(`Failed to delete file from S3: ${error.message}`);
    }
  },

  async getSignedUrl(key, expiresIn = 3600) {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key
    });

    try {
      const signedUrl = await getSignedUrl(s3, command, { expiresIn });
      return signedUrl;
    } catch (error) {
      console.error('S3 Signed URL Error:', error);
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  },

  async getFileUrl(key) {
    return `https://${bucketName}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${key}`;
  }
};

module.exports = s3Service; 