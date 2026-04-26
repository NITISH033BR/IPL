const express = require('express');
const {
  createPrediction,
  getMyPredictions,
  getPredictionsByMatch,
} = require('../controllers/predictionController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, createPrediction);
router.get('/my', protect, getMyPredictions);
router.get('/match/:matchId', getPredictionsByMatch);

module.exports = router;
