const { S3Client } = require('@aws-sdk/client-s3');
const { RekognitionClient } = require('@aws-sdk/client-rekognition');
const { CognitoIdentityProviderClient } = require('@aws-sdk/client-cognito-identity-provider');
const { fromNodeProviderChain } = require('@aws-sdk/credential-providers');

// Configure AWS SDK v3 clients
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: fromNodeProviderChain()
});

const rekognition = new RekognitionClient({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: fromNodeProviderChain()
});

const cognito = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: fromNodeProviderChain()
});

module.exports = {
  rekognition,
  s3,
  cognito
};
