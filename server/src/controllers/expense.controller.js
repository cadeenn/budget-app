const { validationResult } = require('express-validator');
const Expense = require('../models/expense.model');
const Budget = require('../models/budget.model');

/**
 * Get all expenses for the current user
 * @route GET /api/expenses
 * @access Private
 */
exports.getExpenses = async (req, res) => {
  try {
    const { startDate, endDate, budget, minAmount, maxAmount, sort = '-date' } = req.query;

    const filter = { user: req.user._id };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    if (budget) filter.budget = budget;

    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = Number(minAmount);
      if (maxAmount) filter.amount.$lte = Number(maxAmount);
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const expenses = await Expense.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('budget', 'name icon color');

    const total = await Expense.countDocuments(filter);

    res.json({
      expenses,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('budget', 'name icon color');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json(expense);
  } catch (error) {
    console.error('Get expense by ID error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createExpense = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      amount,
      description,
      date,
      budget,
      paymentMethod,
      location,
      receipt,
      isRecurring,
      recurringFrequency,
      tags
    } = req.body;

    const budgetExists = await Budget.findOne({
      _id: budget,
      user: req.user._id
    });

    if (!budgetExists) {
      return res.status(400).json({ message: 'Invalid budget' });
    }

    const expense = new Expense({
      amount,
      description,
      date: date || Date.now(),
      budget,
      user: req.user._id,
      paymentMethod,
      location,
      receipt,
      isRecurring,
      recurringFrequency,
      tags
    });

    await expense.save();
    await expense.populate('budget', 'name icon color');

    res.status(201).json(expense);
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      amount,
      description,
      date,
      budget,
      paymentMethod,
      location,
      receipt,
      isRecurring,
      recurringFrequency,
      tags
    } = req.body;

    if (budget) {
      const budgetExists = await Budget.findOne({
        _id: budget,
        user: req.user._id
      });

      if (!budgetExists) {
        return res.status(400).json({ message: 'Invalid budget' });
      }
    }

    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      {
        amount,
        description,
        date,
        budget,
        paymentMethod,
        location,
        receipt,
        isRecurring,
        recurringFrequency,
        tags
      },
      { new: true }
    ).populate('budget', 'name icon color');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json(expense);
  } catch (error) {
    console.error('Update expense error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getExpenseStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      dateFilter.$gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.$lte = end;
    }

    const matchStage = { user: req.user._id };
    if (Object.keys(dateFilter).length > 0) {
      matchStage.date = dateFilter;
    }

    const totalExpenses = await Expense.aggregate([
      { $match: matchStage },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const expensesByBudget = await Expense.aggregate([
      { $match: matchStage },
      { $group: { _id: '$budget', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } }
    ]);

    const budgetIds = expensesByBudget.map(item => item._id);
    const budgets = await Budget.find({ _id: { $in: budgetIds } });

    const expensesByBudgetWithDetails = expensesByBudget.map(item => {
      const budget = budgets.find(b => b._id.toString() === item._id.toString());
      return {
        budget: {
          _id: budget._id,
          name: budget.name,
          icon: budget.icon,
          color: budget.color
        },
        total: item.total
      };
    });

    const expensesByDate = await Expense.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          total: { $sum: '$amount' },
          date: { $first: '$date' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      total: totalExpenses.length > 0 ? totalExpenses[0].total : 0,
      byBudget: expensesByBudgetWithDetails,
      byDate: expensesByDate
    });
  } catch (error) {
    console.error('Get expense stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
