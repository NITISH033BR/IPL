const Prediction = require('../models/Prediction');

const getLeaderboard = async (req, res, next) => {
  try {
    const leaderboard = await Prediction.aggregate([
      {
        $group: {
          _id: '$user',
          totalPredictions: { $sum: 1 },
          correctPredictions: { $sum: { $cond: ['$isCorrect', 1, 0] } },
          totalPoints: { $sum: '$points' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          username: '$userInfo.username',
          email: '$userInfo.email',
          totalPredictions: 1,
          correctPredictions: 1,
          totalPoints: 1,
          accuracy: {
            $cond: [
              { $gt: ['$totalPredictions', 0] },
              {
                $round: [
                  { $multiply: [{ $divide: ['$correctPredictions', '$totalPredictions'] }, 100] },
                  1,
                ],
              },
              0,
            ],
          },
        },
      },
      { $sort: { totalPoints: -1, accuracy: -1 } },
    ]);
    res.json(leaderboard);
  } catch (error) {
    next(error);
  }
};

module.exports = { getLeaderboard };
