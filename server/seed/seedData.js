require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Match = require('../models/Match');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ipl_prediction';

const matches = [
  {
    team1: 'Mumbai Indians',
    team2: 'Chennai Super Kings',
    venue: 'Wankhede Stadium, Mumbai',
    date: new Date('2024-03-22T14:00:00Z'),
    status: 'completed',
    team1Score: '189/4 (20)',
    team2Score: '178/6 (20)',
    winner: 'Mumbai Indians',
    odds: { team1Win: 1.75, team2Win: 2.1, draw: 12.0 },
  },
  {
    team1: 'Royal Challengers Bangalore',
    team2: 'Kolkata Knight Riders',
    venue: 'M. Chinnaswamy Stadium, Bengaluru',
    date: new Date('2024-03-23T14:00:00Z'),
    status: 'completed',
    team1Score: '204/7 (20)',
    team2Score: '207/4 (19.2)',
    winner: 'Kolkata Knight Riders',
    odds: { team1Win: 1.85, team2Win: 1.95, draw: 11.0 },
  },
  {
    team1: 'Rajasthan Royals',
    team2: 'Delhi Capitals',
    venue: 'Sawai Mansingh Stadium, Jaipur',
    date: new Date('2024-03-24T10:00:00Z'),
    status: 'completed',
    team1Score: '185/5 (20)',
    team2Score: '165/8 (20)',
    winner: 'Rajasthan Royals',
    odds: { team1Win: 1.8, team2Win: 2.0, draw: 13.0 },
  },
  {
    team1: 'Punjab Kings',
    team2: 'Sunrisers Hyderabad',
    venue: 'Punjab Cricket Association Stadium, Mohali',
    date: new Date('2024-03-25T14:00:00Z'),
    status: 'completed',
    team1Score: '176/6 (20)',
    team2Score: '179/3 (18.4)',
    winner: 'Sunrisers Hyderabad',
    odds: { team1Win: 1.9, team2Win: 1.9, draw: 12.0 },
  },
  {
    team1: 'Gujarat Titans',
    team2: 'Lucknow Super Giants',
    venue: 'Narendra Modi Stadium, Ahmedabad',
    date: new Date('2024-03-26T14:00:00Z'),
    status: 'completed',
    team1Score: '193/9 (20)',
    team2Score: '190/7 (20)',
    winner: 'Gujarat Titans',
    odds: { team1Win: 1.85, team2Win: 1.95, draw: 11.5 },
  },
  {
    team1: 'Mumbai Indians',
    team2: 'Royal Challengers Bangalore',
    venue: 'Wankhede Stadium, Mumbai',
    date: new Date('2024-03-28T14:00:00Z'),
    status: 'live',
    team1Score: '145/3 (15)',
    team2Score: '',
    winner: null,
    odds: { team1Win: 1.6, team2Win: 2.3, draw: 14.0 },
  },
  {
    team1: 'Chennai Super Kings',
    team2: 'Rajasthan Royals',
    venue: 'MA Chidambaram Stadium, Chennai',
    date: new Date('2024-03-29T10:00:00Z'),
    status: 'upcoming',
    team1Score: '',
    team2Score: '',
    winner: null,
    odds: { team1Win: 1.7, team2Win: 2.1, draw: 12.5 },
  },
  {
    team1: 'Kolkata Knight Riders',
    team2: 'Delhi Capitals',
    venue: 'Eden Gardens, Kolkata',
    date: new Date('2024-03-30T14:00:00Z'),
    status: 'upcoming',
    team1Score: '',
    team2Score: '',
    winner: null,
    odds: { team1Win: 1.75, team2Win: 2.05, draw: 13.0 },
  },
  {
    team1: 'Sunrisers Hyderabad',
    team2: 'Gujarat Titans',
    venue: 'Rajiv Gandhi International Stadium, Hyderabad',
    date: new Date('2024-03-31T14:00:00Z'),
    status: 'upcoming',
    team1Score: '',
    team2Score: '',
    winner: null,
    odds: { team1Win: 1.9, team2Win: 1.9, draw: 12.0 },
  },
  {
    team1: 'Lucknow Super Giants',
    team2: 'Punjab Kings',
    venue: 'BRSABV Ekana Cricket Stadium, Lucknow',
    date: new Date('2024-04-01T14:00:00Z'),
    status: 'upcoming',
    team1Score: '',
    team2Score: '',
    winner: null,
    odds: { team1Win: 1.85, team2Win: 1.95, draw: 11.5 },
  },
  {
    team1: 'Rajasthan Royals',
    team2: 'Mumbai Indians',
    venue: 'Sawai Mansingh Stadium, Jaipur',
    date: new Date('2024-04-03T14:00:00Z'),
    status: 'upcoming',
    team1Score: '',
    team2Score: '',
    winner: null,
    odds: { team1Win: 2.0, team2Win: 1.8, draw: 12.0 },
  },
  {
    team1: 'Delhi Capitals',
    team2: 'Royal Challengers Bangalore',
    venue: 'Arun Jaitley Stadium, Delhi',
    date: new Date('2024-04-04T14:00:00Z'),
    status: 'upcoming',
    team1Score: '',
    team2Score: '',
    winner: null,
    odds: { team1Win: 1.95, team2Win: 1.85, draw: 12.5 },
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    await Match.deleteMany({});
    await Match.insertMany(matches);
    console.log(`Seeded ${matches.length} matches`);
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
