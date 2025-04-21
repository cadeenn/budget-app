const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budget.controller');
const auth = require('../middleware/auth');

// All
router.use(auth);

// GET
router.get('/', budgetController.getBudgets);

// GET
router.get('/selectable', budgetController.getSelectableBudgets); 

// GET
router.get('/progress', budgetController.getAllBudgetsProgress);

// GET
router.get('/:id', budgetController.getBudgetById);

// GET
router.get('/:id/progress', budgetController.getBudgetProgress);

// POST
router.post('/', budgetController.createBudget);

// PUT
router.put('/:id', budgetController.updateBudget);

// DELETE
router.delete('/:id', budgetController.deleteBudget);

module.exports = router;