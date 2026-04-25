import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
  homeTeam: { type: String, required: true },
  awayTeam: { type: String, required: true },
  matchDate: { type: Date, required: true },
  venue: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['UPCOMING', 'LIVE', 'COMPLETED', 'SUSPENDED'], 
    default: 'UPCOMING' 
  }
}, { timestamps: true }); 

export default mongoose.model('Match', matchSchema);