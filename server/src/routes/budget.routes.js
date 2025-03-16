const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budget.controller');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// GET /api/budgets - Get all budgets for a user
router.get('/', budgetController.getBudgets);

// GET /api/budgets/progress - Get progress for all active budgets
router.get('/progress', budgetController.getAllBudgetsProgress);

// GET /api/budgets/:id - Get a single budget by ID
router.get('/:id', budgetController.getBudgetById);

// GET /api/budgets/:id/progress - Get progress for a specific budget
router.get('/:id/progress', budgetController.getBudgetProgress);

// POST /api/budgets - Create a new budget
router.post('/', budgetController.createBudget);

// PUT /api/budgets/:id - Update a budget
router.put('/:id', budgetController.updateBudget);

// DELETE /api/budgets/:id - Delete a budget
router.delete('/:id', budgetController.deleteBudget);

module.exports = router; 