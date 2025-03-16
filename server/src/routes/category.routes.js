const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const categoryController = require('../controllers/category.controller');

// Routes
// Get all categories
router.get('/', auth, categoryController.getAllCategories);

// Get default categories
router.get('/defaults', categoryController.getDefaultCategories);

// Get category by ID
router.get('/:id', auth, categoryController.getCategoryById);

// Create new category
router.post('/', auth, categoryController.createCategory);

// Update category
router.put('/:id', auth, categoryController.updateCategory);

// Delete category
router.delete('/:id', auth, categoryController.deleteCategory);

module.exports = router; 