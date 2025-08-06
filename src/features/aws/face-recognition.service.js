const { rekognition } = require('../../config/aws-robust');
const { 
  IndexFacesCommand, 
  SearchFacesByImageCommand, 
  CreateCollectionCommand,
  DeleteFacesCommand,
  DetectFacesCommand
} = require('@aws-sdk/client-rekognition');

const collectionId = process.env.REKOGNITION_COLLECTION_ID || 'face-recognition-collection';


const faceRecognitionService = {
  async createCollection() {
    try {
      const command = new CreateCollectionCommand({
        CollectionId: collectionId
      });
      
      const result = await rekognition.send(command);
      return { success: true, collectionArn: result.CollectionARN };
    } catch (error) {
      if (error.name === 'ResourceAlreadyExistsException') {
        console.log(`Collection ${collectionId} already exists`);
        return { success: true, collectionArn: `arn:aws:rekognition:${process.env.AWS_REGION}:*:collection/${collectionId}` };
      }
      throw error;
    }
  },

  async indexFace(imageBuffer, externalImageId) {
    try {
      const command = new IndexFacesCommand({
        CollectionId: collectionId,
        Image: {
          Bytes: imageBuffer
        },
        ExternalImageId: externalImageId,
        DetectionAttributes: ['ALL']
      });

      const result = await rekognition.send(command);
      return result;
    } catch (error) {
      console.error('Face Indexing Error:', error);
      throw new Error(`Failed to index face: ${error.message}`);
    }
  },

  async searchFaces(imageBuffer, similarityThreshold = 90) {
    try {
      const command = new SearchFacesByImageCommand({
        CollectionId: collectionId,
        Image: {
          Bytes: imageBuffer
        },
        MaxFaces: 10,
        FaceMatchThreshold: similarityThreshold
      });

      const result = await rekognition.send(command);
      return result;
    } catch (error) {
      console.error('Face Search Error:', error);
      throw new Error(`Failed to search faces: ${error.message}`);
    }
  },

  async deleteFace(faceId) {
    try {
      const command = new DeleteFacesCommand({
        CollectionId: collectionId,
        FaceIds: [faceId]
      });

      const result = await rekognition.send(command);
      return { success: true, deletedFaces: result.DeletedFaces };
    } catch (error) {
      console.error('Face Deletion Error:', error);
      throw new Error(`Failed to delete face: ${error.message}`);
    }
  },

  async detectFaces(imageBuffer) {
    try {
      const command = new DetectFacesCommand({
        Image: {
          Bytes: imageBuffer
        },
        Attributes: ['ALL']
      });

      const result = await rekognition.send(command);
      return result;
    } catch (error) {
      console.error('Face Detection Error:', error);
      throw new Error(`Failed to detect faces: ${error.message}`);
    }
  }
};

module.exports = faceRecognitionService; 