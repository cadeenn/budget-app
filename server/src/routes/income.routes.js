const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const incomeController = require('../controllers/income.controller');
const auth = require('../middleware/auth.middleware');

// All routes require authentication
router.use(auth);

// @route   GET /api/incomes
// @desc    Get all incomes for the current user
// @access  Private
router.get('/', incomeController.getIncomes);

// @route   GET /api/incomes/stats
// @desc    Get income statistics
// @access  Private
router.get('/stats', incomeController.getIncomeStats);

// @route   GET /api/incomes/:id
// @desc    Get income by ID
// @access  Private
router.get('/:id', incomeController.getIncomeById);

// @route   POST /api/incomes
// @desc    Create a new income
// @access  Private
router.post(
  '/',
  [
    check('amount', 'Amount is required and must be a positive number')
      .isNumeric()
      .custom(value => value > 0),
    check('source', 'Source is required').not().isEmpty()
  ],
  incomeController.createIncome
);

// @route   PUT /api/incomes/:id
// @desc    Update an income
// @access  Private
router.put(
  '/:id',
  [
    check('amount', 'Amount must be a positive number if provided')
      .optional()
      .isNumeric()
      .custom(value => value > 0)
  ],
  incomeController.updateIncome
);

// @route   DELETE /api/incomes/:id
// @desc    Delete an income
// @access  Private
router.delete('/:id', incomeController.deleteIncome);

module.exports = router; 