const express = require('express');
const faceImageController = require('./faceImage.controller');
const authMiddleware = require('../auth/auth.middleware');

const router = express.Router();

router.use(authMiddleware.protect);

router.route('/')
  .get(faceImageController.getAllFaceImages)
  .post(faceImageController.createFaceImage);

router.route('/:id')
  .get(faceImageController.getFaceImage)
  .patch(faceImageController.updateFaceImage)
  .delete(faceImageController.deleteFaceImage);

// Find by rekognition ID
router.get('/rekognition/:rekognitionId', faceImageController.findByRekognitionId);

// Search by name
router.get('/search', faceImageController.searchByName);

module.exports = router;
