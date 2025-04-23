const express = require('express');
const { check } = require('express-validator');
const expenseController = require('../controllers/expense.controller');
const auth = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(auth);

// @route   GET /api/expenses
// @desc    Get all expenses for the current user
// @access  Private
router.get('/', expenseController.getExpenses);

// @route   GET /api/expenses/stats
// @desc    Get expense statistics
// @access  Private
router.get('/stats', expenseController.getExpenseStats);

// @route   GET /api/expenses/:id
// @desc    Get expense by ID
// @access  Private
router.get('/:id', expenseController.getExpenseById);

// @route   POST /api/expenses
// @desc    Create a new expense
// @access  Private
router.post(
  '/',
  [
    check('amount', 'Amount is required and must be a positive number')
      .isNumeric()
      .custom(value => value > 0),
    check('description', 'Description is required').not().isEmpty(),
    check('budget', 'Budget is required').isMongoId()  ],
  expenseController.createExpense
);

// @route   PUT /api/expenses/:id
// @desc    Update an expense
// @access  Private
router.put(
  '/:id',
  [
    check('amount', 'Amount must be a positive number if provided')
      .optional()
      .isNumeric()
      .custom(value => value > 0),
    check('category', 'Category must be a valid ID if provided')
      .optional()
      .isMongoId()
  ],
  expenseController.updateExpense
);

// @route   DELETE /api/expenses/:id
// @desc    Delete an expense
// @access  Private
router.delete('/:id', expenseController.deleteExpense);

module.exports = router; 
