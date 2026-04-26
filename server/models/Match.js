const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema(
  {
    team1: { type: String, required: true },
    team2: { type: String, required: true },
    venue: { type: String, required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ['upcoming', 'live', 'completed'], default: 'upcoming' },
    team1Score: { type: String, default: '' },
    team2Score: { type: String, default: '' },
    winner: { type: String, default: null },
    odds: {
      team1Win: { type: Number, default: 1.9 },
      team2Win: { type: Number, default: 1.9 },
      draw: { type: Number, default: 10.0 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Match', matchSchema);
