// backend/routes/matchRoutes.js

import express from 'express';
import {
  getActiveMatches,
  createMatch,
  updateScore,
  changeStatus,
  suspendMarket
} from '../controllers/matchController.js';

const router = express.Router();

// GET /api/v1/matches
router.get('/', getActiveMatches);

// POST /api/v1/matches
router.post('/', createMatch);

// PUT /api/v1/matches/:matchId/score
router.put('/:matchId/score', updateScore);

// PUT /api/v1/matches/:matchId/status
router.put('/:matchId/status', changeStatus);

// PUT /api/v1/matches/:matchId/suspend
router.put('/:matchId/suspend', suspendMarket);

export default router;