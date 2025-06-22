import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

import authRoutes from './routes/auth';
import problemRoutes from './routes/problems';
import { errorHandler } from './middleware/errorHandler';
import { initDatabase } from './config/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    await initDatabase();
    console.log('Database initialized successfully');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Frontend should be available at http://localhost:3000`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    console.log('\n⚠️  Database connection failed. Please check:');
    console.log('1. PostgreSQL is installed and running');
    console.log('2. Database credentials in backend/.env are correct');
    console.log('3. Database "polyhedron" exists');
    console.log('\nTo create the database, run:');
    console.log('createdb polyhedron');
    console.log('psql -d polyhedron -f backend/database/init.sql\n');
    
    // Start server without database for development
    console.log('Starting server without database connection...');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} (without database)`);
      console.log(`Frontend available at http://localhost:3000`);
    });
  }
}

startServer();
