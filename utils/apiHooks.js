/**
 * 1. ASYNC WRAPPER (asyncHandler)
 * Eliminates the need for try/catch blocks in controllers.
 * It automatically catches errors and passes them to the global error middleware.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * 2. STANDARDIZED RESPONSE HELPER (sendResponse)
 * Ensures every single API response has the same shape.
 * * Shape:
 * {
 * success: true,
 * data: { ... },
 * meta: { requestId: '...', latency: '...' }
 * }
 */
export const sendResponse = (res, statusCode, data, meta = {}) => {
  const response = {
    success: true,
    data: data || null,
  };

  // Only attach meta if it contains data
  if (Object.keys(meta).length > 0) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

/**
 * 3. PAGINATION HELPER (Optional Elite Utility)
 * Standardizes metadata for list-based responses
 */
export const getPaginationMeta = (totalItems, page, limit) => {
  return {
    totalItems,
    totalPages: Math.ceil(totalItems / limit),
    currentPage: parseInt(page),
    limit: parseInt(limit),
  };
};