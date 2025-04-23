const { validationResult } = require('express-validator');
const Category = require('../models/category.model');

/**
 * Get all categories for the current user
 * @route GET /api/categories
 * @access Private
 */
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({ user: req.user._id });
    
        res.json({categories});
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get category by ID
 * @route GET /api/categories/:id
 * @access Private
 */
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.json(category);
  } catch (error) {
    console.error('Get category by ID error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Create a new category
 * @route POST /api/categories
 * @access Private
 */
exports.createCategory = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, icon, color } = req.body;
    
    // Check if category already exists for this user
    const existingCategory = await Category.findOne({
      name,
      user: req.user._id
    });
    
    if (existingCategory) {
      return res.status(400).json({ message: 'Category already exists' });
    }
    
    // Create new category
    const category = new Category({
      name,
      icon: icon || 'default-icon',
      color: color || '#6200ee',
      user: req.user._id
    });
    
    await category.save();
    
    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update a category
 * @route PUT /api/categories/:id
 * @access Private
 */
exports.updateCategory = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, icon, color } = req.body;
    
    // If name is being changed, check if it already exists
    if (name) {
      const existingCategory = await Category.findOne({
        name,
        user: req.user._id,
        _id: { $ne: req.params.id }
      });
      
      if (existingCategory) {
        return res.status(400).json({ message: 'Category name already exists' });
      }
    }
    
    // Find category and update
    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { name, icon, color },
      { new: true }
    );
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.json(category);
  } catch (error) {
    console.error('Update category error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete a category
 * @route DELETE /api/categories/:id
 * @access Private
 */
exports.deleteCategory = async (req, res) => {
  try {
    // Check if it's a default category
    const category = await Category.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    if (category.isDefault) {
      return res.status(400).json({ message: 'Cannot delete default categories' });
    }
    
    await Category.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get default categories
 * @route GET /api/categories/defaults
 * @access Public
 */
exports.getDefaultCategories = async (req, res) => {
  try {
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
    
    res.json({ categories: defaultCategories });
  } catch (error) {
    console.error('Get default categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 
