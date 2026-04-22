import { z } from 'zod';

// --- ELITE REUSABLE UTILS ---

/**
 * REQ 6: Elite String Normalization
 * Trims, collapses multiple spaces into one, and enforces length
 */
const eliteString = (max = 255) => 
  z.string()
    .transform(val => val.trim().replace(/\s+/g, ' ')) 
    .pipe(z.string().min(1, "Field cannot be empty").max(max));

/**
 * REQ 7: ISO Date Guard
 * Ensures coercion doesn't produce 'Invalid Date' objects
 */
const isoDate = z.coerce.date().refine(d => !isNaN(d.getTime()), {
  message: "Invalid ISO date format"
});

// --- SCHEMAS ---

/**
 * REQ 3, 4, & 5: Hardened Pagination
 * Rejects unknown query keys and prevents deep-offset DoS
 */
export const paginationSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    status: z.string()
      .optional()
      .transform(val => val ? val.split(',') : ['upcoming', 'live'])
      // Validate every status in the comma-separated list
      .refine(val => val.every(s => ['upcoming', 'live', 'completed', 'cancelled'].includes(s)), {
        message: "Invalid status filter detected"
      })
  })
  .strict("Unknown query parameters detected") // REQ 5: Global rejection
  .refine(data => (data.page * data.limit) <= 10000, {
    message: "Requested offset is too deep (DoS protection)", // REQ 4
    path: ["page"]
  })
});

export const matchSchemas = {
  
  /**
   * REQ 1 & 2: Logical Integrity for Match Creation
   */
  createMatch: z.object({
    body: z.object({
      homeTeam: z.object({ name: eliteString(100) }),
      awayTeam: z.object({ name: eliteString(100) }),
      startTime: isoDate,
      bettingCutoffTime: isoDate
    })
    .strict()
    .refine(data => data.homeTeam.name.toLowerCase() !== data.awayTeam.name.toLowerCase(), {
      message: "Home team and Away team cannot be the same", // REQ 1
      path: ["awayTeam"]
    })
    .refine(data => data.startTime > new Date(), {
      message: "Match start time must be in the future", // REQ 2
      path: ["startTime"]
    })
    .refine(data => data.bettingCutoffTime < data.startTime, {
      message: "Betting must close before the match starts",
      path: ["bettingCutoffTime"]
    })
  }),

  updateScore: z.object({
    params: z.object({ matchId: z.string().uuid() }).strict(),
    body: z.object({
      home: z.coerce.number().int().nonnegative().max(1000),
      away: z.coerce.number().int().nonnegative().max(1000)
    }).strict()
  }),

  changeStatus: z.object({
    params: z.object({ matchId: z.string().uuid() }).strict(),
    body: z.object({
      status: z.enum(['upcoming', 'live', 'completed', 'cancelled']),
      reason: eliteString(200).default("Administrative update")
    }).strict()
  }),

  suspendMarket: z.object({
    params: z.object({ matchId: z.string().uuid() }).strict()
  })
};

/**
 * REQ 9: Advanced Error Formatter with Error Codes
 * Maps Zod errors to a standardized JSON structure for the frontend
 */
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params
  });

  if (!result.success) {
    const formattedErrors = result.error.errors.map(err => ({
      code: "VALIDATION_ERROR", // REQ 9
      field: err.path.join('.'),
      message: err.message
    }));

    return res.status(400).json({
      success: false,
      data: null,
      error: {
        message: "Invalid request data",
        details: formattedErrors
      }
    });
  }

  // Replace req data with validated/transformed data (crucial for normalization)
  req.body = result.data.body || req.body;
  req.query = result.data.query || req.query;
  req.params = result.data.params || req.params;
  
  next();
};