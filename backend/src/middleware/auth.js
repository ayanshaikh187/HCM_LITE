const jwt = require('jsonwebtoken');

function getJwtSecret() {
  const secret = process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET;
  if (!secret || secret.length < 32) {
    const error = new Error('JWT_SECRET must be set and contain at least 32 characters.');
    error.status = 500;
    throw error;
  }
  return secret;
}

// ─── Core token verifier ────────────────────────────────────────────────────
const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Bearer token required.' });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    if (!decoded.id || !['Admin', 'HR', 'Employee'].includes(decoded.role)) {
      return res.status(401).json({ message: 'Invalid authentication token.' });
    }
    req.user = { ...decoded, id: String(decoded.id) };
    return next();
  } catch (error) {
    if (error.status === 500) {
      return res.status(500).json({ message: error.message });
    }
    return res.status(401).json({ message: 'Token is invalid or expired.' });
  }
};

// ─── Role Guards ─────────────────────────────────────────────────────────────

/** Only System Administrators may access this route. */
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }
  return next();
};

/** HR Officers and Administrators may access this route. */
const hrOrAdmin = (req, res, next) => {
  if (!req.user || !['Admin', 'HR'].includes(req.user.role)) {
    return res.status(403).json({ message: 'HR or Admin access required.' });
  }
  return next();
};

/** HR Officers only — Administrators are explicitly excluded.
 *  Use when a workflow is strictly within HR's operational domain. */
const hrOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'HR') {
    return res.status(403).json({ message: 'HR access required.' });
  }
  return next();
};

/** Employees only — HR and Admin are explicitly excluded.
 *  Use for self-service endpoints (e.g., personal profile edits). */
const employeeOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'Employee') {
    return res.status(403).json({ message: 'Employee access required.' });
  }
  return next();
};

/** Any non-Admin user (HR or Employee).
 *  Used to prevent Admin from performing employee-specific operations
 *  such as submitting leave applications or personal attendance check-in. */
const notAdmin = (req, res, next) => {
  if (!req.user || req.user.role === 'Admin') {
    return res.status(403).json({
      message: 'This operation is not available for Admin accounts.'
    });
  }
  return next();
};

module.exports = { authMiddleware, adminOnly, hrOrAdmin, hrOnly, employeeOnly, notAdmin };
