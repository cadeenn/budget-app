const mongoose = require('mongoose');
const Category = require('../models/category.model');
const User = require('../models/user.model');
require('dotenv').config();

// Default categories
const defaultCategories = [
  { name: 'Food & Dining', icon: 'restaurant', color: '#FF5722', isDefault: true },
  { name: 'Transportation', icon: 'directions_car', color: '#2196F3', isDefault: true },
  { name: 'Housing', icon: 'home', color: '#4CAF50', isDefault: true },
  { name: 'Entertainment', icon: 'movie', color: '#9C27B0', isDefault: true },
  { name: 'Shopping', icon: 'shopping_cart', color: '#E91E63', isDefault: true },
  { name: 'Utilities', icon: 'power', color: '#FFC107', isDefault: true },
  { name: 'Healthcare', icon: 'local_hospital', color: '#00BCD4', isDefault: true },
  { name: 'Personal Care', icon: 'face', color: '#795548', isDefault: true },
  { name: 'Education', icon: 'school', color: '#607D8B', isDefault: true },
  { name: 'Other', icon: 'more_horiz', color: '#9E9E9E', isDefault: true }
];

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('MongoDB connected for initialization');
  
  try {
    // Create a demo user
    const demoUser = await User.findOne({ email: 'demo@example.com' });
    
    if (!demoUser) {
      console.log('Creating demo user...');
      const newUser = new User({
        name: 'Demo User',
        email: 'demo@example.com',
        password: 'password123',
        isVerified: true
      });
      
      await newUser.save();
      console.log('Demo user created successfully');
      
      // Create default categories for the demo user
      console.log('Creating default categories for demo user...');
      const categoryPromises = defaultCategories.map(category => 
        new Category({
          ...category,
          user: newUser._id
        }).save()
      );
      
      await Promise.all(categoryPromises);
      console.log('Default categories created successfully');
    } else {
      console.log('Demo user already exists');
    }
    
    console.log('Database initialization complete');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
}); 