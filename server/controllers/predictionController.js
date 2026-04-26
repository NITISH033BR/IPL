const Prediction = require('../models/Prediction');
const Match = require('../models/Match');

const createPrediction = async (req, res, next) => {
  try {
    const { matchId, predictedWinner, predictedTeam1Score, predictedTeam2Score } = req.body;
    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ message: 'Match not found' });
    if (match.status === 'completed') {
      return res.status(400).json({ message: 'Cannot predict on a completed match' });
    }
    const existing = await Prediction.findOne({ user: req.user._id, match: matchId });
    if (existing) return res.status(400).json({ message: 'Prediction already submitted for this match' });

    const prediction = await Prediction.create({
      user: req.user._id,
      match: matchId,
      predictedWinner,
      predictedTeam1Score,
      predictedTeam2Score,
    });
    await prediction.populate('match');
    res.status(201).json(prediction);
  } catch (error) {
    next(error);
  }
};

const getMyPredictions = async (req, res, next) => {
  try {
    const predictions = await Prediction.find({ user: req.user._id })
      .populate('match')
      .sort({ createdAt: -1 });
    res.json(predictions);
  } catch (error) {
    next(error);
  }
};

const getPredictionsByMatch = async (req, res, next) => {
  try {
    const predictions = await Prediction.find({ match: req.params.matchId })
      .populate('user', 'username')
      .sort({ createdAt: -1 });
    res.json(predictions);
  } catch (error) {
    next(error);
  }
};

module.exports = { createPrediction, getMyPredictions, getPredictionsByMatch };
