const express = require('express');
const { getMatches, getMatchById } = require('../controllers/matchController');

const router = express.Router();

router.get('/', getMatches);
router.get('/:id', getMatchById);

module.exports = router;
