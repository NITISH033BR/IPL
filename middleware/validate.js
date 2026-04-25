import { z } from 'zod';

// --- ELITE REUSABLE UTILS ---
const eliteString = (max = 255) => 
  z.string()
    .transform(val => val.trim().replace(/\s+/g, ' ')) 
    .pipe(z.string().min(1, "Field cannot be empty").max(max));

const isoDate = z.coerce.date().refine(d => !isNaN(d.getTime()), {
  message: "Invalid ISO date format"
});

// 🚨 FIX: Custom MongoDB ObjectId Validator
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ID format");

// --- SCHEMAS ---
export const paginationSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    status: z.string()
      .optional()
      .transform(val => val ? val.split(',') : ['upcoming', 'live'])
      .refine(val => val.every(s => ['upcoming', 'live', 'completed', 'cancelled'].includes(s)), {
        message: "Invalid status filter detected"
      })
  })
  .strict("Unknown query parameters detected") 
  .refine(data => (data.page * data.limit) <= 10000, {
    message: "Requested offset is too deep (DoS protection)", 
    path: ["page"]
  })
});

export const matchSchemas = {
  createMatch: z.object({
    body: z.object({
      homeTeam: z.object({ name: eliteString(100) }),
      awayTeam: z.object({ name: eliteString(100) }),
      startTime: isoDate,
      bettingCutoffTime: isoDate
    })
    .strict()
    .refine(data => data.homeTeam.name.toLowerCase() !== data.awayTeam.name.toLowerCase(), {
      message: "Home team and Away team cannot be the same", 
      path: ["awayTeam"]
    })
    .refine(data => data.startTime > new Date(), {
      message: "Match start time must be in the future", 
      path: ["startTime"]
    })
    .refine(data => data.bettingCutoffTime < data.startTime, {
      message: "Betting must close before the match starts",
      path: ["bettingCutoffTime"]
    })
  }),

  updateScore: z.object({
    params: z.object({ matchId: objectId }).strict(), // 🚨 FIX: Replaced .uuid()
    body: z.object({
      home: z.coerce.number().int().nonnegative().max(1000),
      away: z.coerce.number().int().nonnegative().max(1000)
    }).strict()
  }),

  changeStatus: z.object({
    params: z.object({ matchId: objectId }).strict(), // 🚨 FIX: Replaced .uuid()
    body: z.object({
      status: z.enum(['upcoming', 'live', 'completed', 'cancelled']),
      reason: eliteString(200).default("Administrative update")
    }).strict()
  }),

  suspendMarket: z.object({
    params: z.object({ matchId: objectId }).strict() // 🚨 FIX: Replaced .uuid()
  })
};

// --- MIDDLEWARE ---
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params
  });

  if (!result.success) {
    const formattedErrors = result.error.errors.map(err => ({
      code: "VALIDATION_ERROR", 
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

  req.body = result.data.body || req.body;
  req.query = result.data.query || req.query;
  req.params = result.data.params || req.params;
  
  next();
};

// 🚨 FIX: Exported validateParam to prevent the routing crash
// Since Zod already checks the param in the schemas above, this just acts as a safety pass-through
export const validateParam = (paramName) => (req, res, next) => {
  if (!req.params[paramName]) {
    return res.status(400).json({ success: false, error: `Missing parameter: ${paramName}` });
  }
  next();
};