require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const os = require('os');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const expenseRoutes = require('./routes/expense.routes');
const incomeRoutes = require('./routes/income.routes');
const budgetRoutes = require('./routes/budget.routes');
const categoryRoutes = require('./routes/category.routes');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Enhanced CORS configuration for Expo app
app.use(cors({
  origin: '*', // Allow all origins for development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(morgan('dev'));


// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://caden:caden@budget-tracker.nnehz.mongodb.net/?retryWrites=true&w=majority&appName=Budget-Tracker', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  console.log('Running in development mode without database connection');
});


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/incomes', incomeRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/categories', categoryRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Budget Tracker API' });
});

// Health check endpoint for mobile app
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Server is running'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});

// Helper function to get all local IP addresses
function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }

  return addresses;
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Local server URL: http://localhost:${PORT}`);
  
  // Print all local network addresses to help with mobile connection
  const localIPs = getLocalIpAddresses();
  console.log('Available on your network at:');
  localIPs.forEach(ip => {
    console.log(`http://${ip}:${PORT}`);
  });
  
  console.log('\nIMPORTANT: For connecting from an Expo mobile app');
  console.log('1. Use tunnel mode: npm run tunnel');
  console.log('2. Make sure your server is accessible from your network');
  console.log('3. Try one of the network URLs above with your mobile app');
});

module.exports = app; // For testing purposes 