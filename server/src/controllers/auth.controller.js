const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/user.model');
const Category = require('../models/category.model');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// Create default categories for new user
const createDefaultCategories = async (userId) => {
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

  const categoryPromises = defaultCategories.map(category => 
    new Category({
      ...category,
      user: userId
    }).save()
  );

  await Promise.all(categoryPromises);
};

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
exports.register = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password
    });

    await user.save();
    
    // Create default categories for the user
    await createDefaultCategories(user._id);

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
exports.login = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get current user profile
 * @route GET /api/auth/me
 * @access Private
 */
exports.getCurrentUser = async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 