const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'ap-south-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

// Create AWS services
const rekognition = new AWS.Rekognition();
const s3 = new AWS.S3();
const cognito = new AWS.CognitoIdentityServiceProvider();

module.exports = {
  rekognition,
  s3,
  cognito,
  AWS
};
