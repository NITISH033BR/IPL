// backend/controllers/matchController.js
import Match from '../models/match.js'; // Adjust path if your model file is named differently

export const getActiveMatches = async (req, res) => {
  try {
    // Fetches all matches currently saved in your MongoDB database
    const matches = await Match.find();
    
    res.status(200).json({ 
      success: true, 
      count: matches.length,
      matches: matches 
    });
  } catch (error) {
    console.error("Error fetching matches:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch matches",
      error: error.message
    });
  }
};

export const createMatch = async (req, res) => {
  try {
    // Tells Mongoose to create a new document using the data from Postman
    const newMatch = await Match.create(req.body);

    // Sends back the success message PLUS the actual data saved in the DB
    res.status(201).json({ 
      success: true, 
      message: "Match created successfully",
      data: newMatch
    });
  } catch (error) {
    // Catches any validation errors or database connection issues
    console.error("Error creating match:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create match",
      error: error.message 
    });
  }
};

export const updateScore = async (req, res) => {
  const { matchId } = req.params;
  const { home, away } = req.body;
  
  // Clean, basic update logic without the Redis Lua scripts
  res.status(200).json({ 
    success: true, 
    message: `Score for match ${matchId} updated to Home: ${home}, Away: ${away}` 
  });
};

export const changeStatus = async (req, res) => {
  const { matchId } = req.params;
  const { status } = req.body;

  res.status(200).json({
    success: true,
    message: `Match ${matchId} status changed to ${status}`
  });
};

export const suspendMarket = async (req, res) => {
  const { matchId } = req.params;

  res.status(200).json({
    success: true,
    message: `Market suspended for match ${matchId}`
  });
};