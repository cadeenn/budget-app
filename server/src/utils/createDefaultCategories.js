const mongoose = require('mongoose');
const User = require('../models/user.model');
const Category = require('../models/category.model');
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

// Create default categories for a user
const createDefaultCategoriesForUser = async (userId) => {
  console.log(`Creating default categories for user ${userId}`);
  
  // Check if user already has categories
  const existingCategories = await Category.find({ user: userId });
  
  if (existingCategories.length > 0) {
    console.log(`User ${userId} already has ${existingCategories.length} categories. Skipping.`);
    return;
  }
  
  // Create default categories
  const categoryPromises = defaultCategories.map(category => 
    new Category({
      ...category,
      user: userId
    }).save()
  );
  
  await Promise.all(categoryPromises);
  console.log(`Created ${defaultCategories.length} default categories for user ${userId}`);
};

// Main function
const createDefaultCategoriesForAllUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users`);
    
    // Create default categories for each user
    for (const user of users) {
      await createDefaultCategoriesForUser(user._id);
    }
    
    console.log('Finished creating default categories for all users');
    process.exit(0);
  } catch (error) {
    console.error('Error creating default categories:', error);
    process.exit(1);
  }
};

// Run the script
createDefaultCategoriesForAllUsers(); 