const express = require('express');
const { check } = require('express-validator');
const expenseController = require('../controllers/expense.controller');
const auth = require('../middleware/auth.middleware'); 

const router = express.Router();

// All 
router.use(auth);

// GET 
router.get('/', expenseController.getExpenses);

// GET 
router.get('/stats', expenseController.getExpenseStats);

// GET 
router.get('/:id', expenseController.getExpenseById);

// POST 
router.post(
  '/',
  [
    check('amount', 'Amount is required and must be a positive number')
      .isNumeric()
      .custom(value => parseFloat(value) > 0),
    check('description', 'Description is required').not().isEmpty().trim(),
    check('category', 'Category must be a valid ID if provided')
        .optional({ checkFalsy: true }) 
        .isMongoId(),
    check('date', 'Date must be a valid ISO 8601 date').optional({ checkFalsy: true }).isISO8601().toDate(),
    // Validate budgetId is provided and is MongoID
    check('budgetId', 'Budget must be selected')
        .not().isEmpty() 
        .withMessage('Budget selection is required.')
        .isMongoId() 
        .withMessage('Invalid Budget ID format.')
  ],
  expenseController.createExpense 
);

// PUT
router.put(
  '/:id',
  [
    // Keep existing validation, add budgetId check if needed for updates
    check('amount', 'Amount must be a positive number if provided')
      .optional()
      .isNumeric()
      .custom(value => parseFloat(value) > 0),
    check('description', 'Description cannot be empty if provided')
      .optional()
      .not().isEmpty().trim(),
    check('category', 'Category must be a valid ID if provided')
      .optional({ checkFalsy: true })
      .isMongoId(),
    check('date', 'Date must be a valid date if provided')
      .optional({ checkFalsy: true })
      .isISO8601().toDate(),
    // Validate budgetId if provided during update
    check('budgetId', 'Budget must be a valid ID if provided')
      .optional({ checkFalsy: true }) 
      .isMongoId()
  ],
  expenseController.updateExpense 
);

// DELETE
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;