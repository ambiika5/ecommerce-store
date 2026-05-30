const express = require('express');
const path = require('path');
const sequelize = require('./db');
require('./models'); // Load models and relationships
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));

// Serve Static Assets
app.use(express.static(path.join(__dirname, 'public')));

// Catch-all route to serve the frontend SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Sync database and start server
const startServer = async () => {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Sync database schemas
    await sequelize.sync(); 
    
    app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`  E-Commerce Server running on port ${PORT}`);
      console.log(`  Local URL: http://localhost:${PORT}`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

startServer();
