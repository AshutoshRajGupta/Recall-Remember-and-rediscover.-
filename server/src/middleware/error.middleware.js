import { AppError } from '../utils/AppError.js';

// Centralized error handler. Must be registered last, after all routes.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // Known, "expected" errors (validation, bad upstream fetch, etc) carry their
  // own safe message and status code - surface those as-is.
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Malformed JSON bodies from express.json()
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  // Anything else is unexpected - don't leak internals to the client.
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}
