import * as S3 from '@aws-sdk/client-s3';
import { awsCredentialsProvider } from '@vercel/functions/oidc';
 
const AWS_REGION = process.env.AWS_REGION;
const AWS_ROLE_ARN = process.env.AWS_ROLE_ARN;
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;

if (!AWS_REGION || !AWS_ROLE_ARN || !S3_BUCKET_NAME) {
  throw new Error("Missing required environment variables.");
}


// Initialize the S3 Client
const s3client = new S3.S3Client({
  region: AWS_REGION,
  // Use the Vercel AWS SDK credentials provider
  credentials: awsCredentialsProvider({
    roleArn: AWS_ROLE_ARN,
  }),
});
 
export async function GET() {
  const result = await s3client.send(
    new S3.ListObjectsV2Command({
      Bucket: S3_BUCKET_NAME,
    }),
  );
  return result?.Contents?.map((object) => object.Key) ?? [];
}