const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const portfolioRoutes = require('./routes/portfolio');
const dividendRoutes = require('./routes/dividends');
const transactionRoutes = require('./routes/transactions');
const fileRoutes = require('./routes/files');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dividend-dashboard', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/dividends', dividendRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/files', fileRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
