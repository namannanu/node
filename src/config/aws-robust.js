// AWS SDK configuration with multiple fallback strategies
let s3, rekognition, cognito;

// Try AWS SDK v3 first
try {
  const { S3Client } = require('@aws-sdk/client-s3');
  const { RekognitionClient } = require('@aws-sdk/client-rekognition');
  const { CognitoIdentityProviderClient } = require('@aws-sdk/client-cognito-identity-provider');

  const awsConfig = {
    region: process.env.AWS_REGION || 'ap-south-1',
    ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && {
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    })
  };

  s3 = new S3Client(awsConfig);
  rekognition = new RekognitionClient(awsConfig);
  cognito = new CognitoIdentityProviderClient(awsConfig);
  
  console.log('AWS SDK v3 initialized successfully');

} catch (v3Error) {
  console.warn('AWS SDK v3 failed, trying v2:', v3Error.message);
  
  // Fallback to AWS SDK v2
  try {
    const AWS = require('aws-sdk');
    
    AWS.config.update({
      region: process.env.AWS_REGION || 'ap-south-1',
      ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      })
    });

    s3 = new AWS.S3();
    rekognition = new AWS.Rekognition();
    cognito = new AWS.CognitoIdentityServiceProvider();
    
    console.log('AWS SDK v2 initialized successfully as fallback');

  } catch (v2Error) {
    console.warn('AWS SDK v2 also failed, using mock clients:', v2Error.message);
    
    // Final fallback to mock clients
    const mockClient = {
      send: async () => ({ success: false, error: 'AWS SDK not available in this environment' }),
      upload: () => ({ promise: async () => ({ success: false, error: 'AWS SDK not available' }) }),
      detectFaces: () => ({ promise: async () => ({ success: false, error: 'AWS SDK not available' }) }),
      listUsers: () => ({ promise: async () => ({ success: false, error: 'AWS SDK not available' }) })
    };
    
    s3 = mockClient;
    rekognition = mockClient;
    cognito = mockClient;
  }
}

module.exports = {
  rekognition,
  s3,
  cognito
};
