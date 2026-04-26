const Match = require('../models/Match');

const getMatches = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const matches = await Match.find(filter).sort({ date: 1 });
    res.json(matches);
  } catch (error) {
    next(error);
  }
};

const getMatchById = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: 'Match not found' });
    res.json(match);
  } catch (error) {
    next(error);
  }
};

module.exports = { getMatches, getMatchById };
