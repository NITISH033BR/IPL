const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
    predictedWinner: { type: String, required: true },
    predictedTeam1Score: { type: String, default: '' },
    predictedTeam2Score: { type: String, default: '' },
    isCorrect: { type: Boolean, default: null },
    points: { type: Number, default: 0 },
  },
  { timestamps: true }
);

predictionSchema.index({ user: 1, match: 1 }, { unique: true });

module.exports = mongoose.model('Prediction', predictionSchema);
