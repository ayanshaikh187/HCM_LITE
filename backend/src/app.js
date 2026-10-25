const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoute');
const employeeRoutes = require('./routes/employeeRoute');
const attendanceRoutes = require('./routes/attendanceRoute');
const leaveRoutes = require('./routes/leaveRoute');
const payrollRoutes = require('./routes/payrollRoute');
const aiRoutes = require('./routes/aiRoute');
const dashboardRoutes = require('./routes/dashboardRoute');

const app = express();
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(v => v.trim());

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS.'));
  },
  credentials: true
}));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 200, standardHeaders: true, legacyHeaders: false }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok', message: 'HCM Lite API is running' }));
app.use('/api', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/hr/leaves', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', dashboardRoutes);
app.use('/api/hr', dashboardRoutes);
app.use('/api/employee', dashboardRoutes);
app.use('/api/comms', dashboardRoutes);

app.use((req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` }));
app.use((err, req, res, next) => {
  console.error('API error:', err.message);
  if (res.headersSent) return next(err);
  const status = err.status || (err.message.includes('CORS') ? 403 : 500);
  return res.status(status).json({ message: status === 500 ? 'Internal server error.' : err.message });
});

module.exports = app;
