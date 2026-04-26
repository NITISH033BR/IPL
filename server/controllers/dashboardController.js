const Prediction = require('../models/Prediction');
const Match = require('../models/Match');

const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const predictions = await Prediction.find({ user: userId }).populate('match');
    const totalPredictions = predictions.length;
    const correctPredictions = predictions.filter((p) => p.isCorrect === true).length;
    const totalPoints = predictions.reduce((sum, p) => sum + (p.points || 0), 0);
    const accuracy =
      totalPredictions > 0 ? Math.round((correctPredictions / totalPredictions) * 100) : 0;

    const recentPredictions = predictions.slice(0, 5);

    const upcomingMatches = await Match.find({ status: 'upcoming' }).sort({ date: 1 }).limit(5);
    const liveMatches = await Match.find({ status: 'live' }).limit(5);

    res.json({
      stats: { totalPredictions, correctPredictions, totalPoints, accuracy },
      recentPredictions,
      upcomingMatches,
      liveMatches,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard };
