import express from 'express';

// 1. Controllers
import { 
  createMatch, 
  getActiveMatches, 
  updateScore, 
  changeStatus, 
  suspendMarket 
} from '../controllers/matchController.js';

// 2. Validation, Security & Headers
import { validate, matchSchemas, validateParam } from '../middleware/validate.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { sanitizeNoSql } from '../middleware/sanitize.js';
import { setApiVersionHeader, methodNotAllowed } from '../middleware/headers.js'; // 🚨 REQ 6 & 7

// 3. Rate Limiters & Idempotency
import { 
  userIpScoreLimiter, 
  userIpStatusLimiter, 
  userIpCreateLimiter, 
  publicIpLimiter 
} from '../middleware/rateLimiter.js';
import { idempotencyGuard } from '../middleware/idempotency.js'; // 🚨 REQ 3: Network-level deduplication

// 4. Observability & Audit
import { attachRequestId } from '../middleware/tracing.js';
import { fireAndForgetAuditLog } from '../middleware/audit.js'; // 🚨 REQ 5: Non-blocking audit
import { routeMetrics } from '../middleware/metrics.js';

// 5. Resilience & Performance
import { routeGracefulTimeout } from '../middleware/timeout.js'; // 🚨 REQ 1: Attaches req.abortSignal for DB queries
import { healthAwareCircuitBreaker } from '../middleware/circuitBreaker.js'; // 🚨 REQ 8: Auto-resetting breaker
import { resilientCacheActiveMatches, setCacheHeaders } from '../middleware/cache.js'; // 🚨 REQ 2: Handled in controller/service, fallback in middleware
import { checkFeatureFlag } from '../middleware/featureFlags.js';

// 6. Utils
import { asyncHandler } from '../utils/apiHooks.js'; 

const router = express.Router();

// ==========================================
// 🛡️ GLOBAL ROUTER MIDDLEWARE
// ==========================================
router.use(express.json({ limit: '10kb' })); 
router.use(setApiVersionHeader('v1'));       // 🚨 REQ 6: X-API-Version header on all responses
router.use(routeMetrics);                    
router.use(attachRequestId);                 
router.use(routeGracefulTimeout(5000));      // 🚨 REQ 1: Generates req.abortSignal to pass to Mongoose session.startTransaction({ signal: req.abortSignal })
router.use(sanitizeNoSql);                   

// ==========================================
// 🗺️ CENTRALIZED ROUTE CONFIG
// ==========================================

const routes = [
  // --- STATIC ROUTES ---
  {
    method: 'get',
    path: '/',
    middlewares: [
      publicIpLimiter,
      setCacheHeaders,            
      resilientCacheActiveMatches, 
      asyncHandler(getActiveMatches)
    ]
  },
  {
    method: 'post',
    path: '/',
    middlewares: [
      verifyToken,
      requireRole(['SUPER_ADMIN', 'TRADER']),
      idempotencyGuard,                            // 🚨 REQ 3: Locks Idempotency-Key header early
      fireAndForgetAuditLog('CREATE_MATCH'),       // 🚨 REQ 5: Wraps in process.nextTick() to never block
      userIpCreateLimiter,                 
      healthAwareCircuitBreaker('write_ops'),      // 🚨 REQ 8: Tuned with resetTimeout and volume thresholds
      validate(matchSchemas.createMatch),
      asyncHandler(createMatch)
    ]
  },
  
  // --- DYNAMIC ROUTES ---
  {
    method: 'put',
    path: '/:matchId/score',
    middlewares: [
      verifyToken,
      requireRole(['SUPER_ADMIN', 'TRADER']),
      validateParam('matchId'),           
      idempotencyGuard,                            // 🚨 REQ 3: Network-level deduplication
      fireAndForgetAuditLog('UPDATE_SCORE'),  
      userIpScoreLimiter,                 
      healthAwareCircuitBreaker('write_ops'),                
      validate(matchSchemas.updateScore),
      asyncHandler(updateScore)
    ]
  },
  {
    method: 'patch',
    path: '/:matchId/status',
    middlewares: [
      verifyToken,
      requireRole(['SUPER_ADMIN']),       
      validateParam('matchId'),           
      idempotencyGuard,                            // 🚨 REQ 3: Protects status transitions
      fireAndForgetAuditLog('CHANGE_STATUS'), 
      userIpStatusLimiter,                
      healthAwareCircuitBreaker('write_ops'),                
      validate(matchSchemas.changeStatus),
      asyncHandler(changeStatus)
    ]
  },
  {
    method: 'patch',
    path: '/:matchId/suspend',
    middlewares: [
      // 🚨 REQ 4: Explicit fail-open/fail-closed behavior defined in config
      checkFeatureFlag('SUSPEND_MARKET_API', { fallback: 'closed' }), 
      verifyToken,
      requireRole(['SUPER_ADMIN', 'TRADER']),
      validateParam('matchId'),               
      idempotencyGuard,
      fireAndForgetAuditLog('SUSPEND_MARKET'),    
      userIpStatusLimiter,
      healthAwareCircuitBreaker('write_ops'),
      validate(matchSchemas.suspendMarket),
      asyncHandler(suspendMarket)
    ]
  }
];

// ==========================================
// 🚀 AUTO-BIND ROUTES
// ==========================================
const boundPaths = new Set();

routes.forEach((route) => {
  router[route.method](route.path, ...route.middlewares);
  boundPaths.add(route.path);
});

// ==========================================
// 🚫 STRICT METHOD WHITELISTING (🚨 REQ 7)
// ==========================================
// Ensure any unsupported HTTP method on a bound path returns 405 Method Not Allowed
// rather than falling through to a 404 Not Found.
boundPaths.forEach((path) => {
  router.all(path, methodNotAllowed);
});

export default router;
