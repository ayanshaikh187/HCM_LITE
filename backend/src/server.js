require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const PORT = Number(process.env.PORT || 5000);
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function start() {
  if (!MONGO_URI) throw new Error('MONGO_URI (or MONGODB_URI) is missing in backend/.env');
  if (!(process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET)) throw new Error('JWT_SECRET is missing in backend/.env');
  await mongoose.connect(MONGO_URI);
  console.log('MongoDB connected');
  const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

  const shutdown = async signal => {
    console.log(`${signal} received; shutting down...`);
    server.close(async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch(error => {
  console.error('Startup failed:', error.message);
  process.exit(1);
});
