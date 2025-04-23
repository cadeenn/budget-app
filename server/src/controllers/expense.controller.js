const { validationResult } = require('express-validator');
const Expense = require('../models/expense.model');
const Category = require('../models/category.model');

/**
 * Get all expenses for the current user
 * @route GET /api/expenses
 * @access Private
 */
exports.getExpenses = async (req, res) => {
  try {
    const { startDate, endDate, category, minAmount, maxAmount, sort = '-date', search } = req.query;
    
    // Build filter object
    const filter = { user: req.user._id };
    
    // Add date range filter if provided
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    
    // Add category filter if provided
    if (category) filter.category = category;
    
    // Add amount range filter if provided
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = Number(minAmount);
      if (maxAmount) filter.amount.$lte = Number(maxAmount);
    }

    // Add search filter if provided
    if (search) {
      filter.$or = [
        { source: { $regex: search, $options: 'i' } }, // Search in source
        { description: { $regex: search, $options: 'i' } } // Search in description
      ];
    }
    
    // Execute query with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const expenses = await Expense.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('category', 'name icon color');
    
    // Get total count for pagination
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

/**
 * Get expense by ID
 * @route GET /api/expenses/:id
 * @access Private
 */
exports.getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('category', 'name icon color');
    
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

/**
 * Create a new expense
 * @route POST /api/expenses
 * @access Private
 */
exports.createExpense = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const {
      amount,
      description,
      date,
      category,
      paymentMethod,
      location,
      receipt,
      isRecurring,
      recurringFrequency,
      tags
    } = req.body;
    
    // Verify category exists and belongs to user
    const categoryExists = await Category.findOne({
      _id: category,
      user: req.user._id
    });
    
    if (!categoryExists) {
      return res.status(400).json({ message: 'Invalid category' });
    }
    
    // Create new expense
    const expense = new Expense({
      amount,
      description,
      date: date || Date.now(),
      category,
      user: req.user._id,
      paymentMethod,
      location,
      receipt,
      isRecurring,
      recurringFrequency,
      tags
    });
    
    await expense.save();
    
    // Populate category details
    await expense.populate('category', 'name icon color');
    
    res.status(201).json(expense);
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update an expense
 * @route PUT /api/expenses/:id
 * @access Private
 */
exports.updateExpense = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const {
      amount,
      description,
      date,
      category,
      paymentMethod,
      location,
      receipt,
      isRecurring,
      recurringFrequency,
      tags
    } = req.body;
    
    // If category is being updated, verify it exists and belongs to user
    if (category) {
      const categoryExists = await Category.findOne({
        _id: category,
        user: req.user._id
      });
      
      if (!categoryExists) {
        return res.status(400).json({ message: 'Invalid category' });
      }
    }
    
    // Find expense and update
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      {
        amount,
        description,
        date,
        category,
        paymentMethod,
        location,
        receipt,
        isRecurring,
        recurringFrequency,
        tags
      },
      { new: true }
    ).populate('category', 'name icon color');
    
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

/**
 * Delete an expense
 * @route DELETE /api/expenses/:id
 * @access Private
 */
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

/**
 * Get expense statistics
 * @route GET /api/expenses/stats
 * @access Private
 */
exports.getExpenseStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    console.log('Received date range:', { startDate, endDate });
    
    // Build date filter
    const dateFilter = {};
    if (startDate) {
      // Set the time to 00:00:00 for the start date
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      dateFilter.$gte = start;
    }
    if (endDate) {
      // Set the time to 23:59:59 for the end date to include the entire day
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.$lte = end;
    }
    
    console.log('Date filter:', dateFilter);
    
    // Match stage for aggregation
    const matchStage = {
      user: req.user._id
    };
    
    if (Object.keys(dateFilter).length > 0) {
      matchStage.date = dateFilter;
    }
    
    // Get total expenses
    const totalExpenses = await Expense.aggregate([
      { $match: matchStage },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // Get expenses by category
    const expensesByCategory = await Expense.aggregate([
      { $match: matchStage },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } }
    ]);
    
    // Get category details
    const categoryIds = expensesByCategory.map(item => item._id);
    const categories = await Category.find({ _id: { $in: categoryIds } });
    
    // Map category details to expenses
    const expensesByCategoryWithDetails = expensesByCategory.map(item => {
      const category = categories.find(cat => cat._id.toString() === item._id.toString());
      return {
        category: {
          _id: category._id,
          name: category.name,
          icon: category.icon,
          color: category.color
        },
        total: item.total
      };
    });
    
    // Get expenses by date (for charts)
    const expensesByDate = await Expense.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          total: { $sum: '$amount' },
          date: { $first: '$date' } // Keep the original date for sorting
        }
      },
      { $sort: { _id: 1 } } // Sort by date ascending
    ]);
    
    // Log all expenses for debugging
    const allExpenses = await Expense.find(matchStage).select('date amount description');
    console.log('All expenses in date range:', allExpenses);
    console.log('Expenses by date:', expensesByDate);
    
    res.json({
      total: totalExpenses.length > 0 ? totalExpenses[0].total : 0,
      byCategory: expensesByCategoryWithDetails,
      byDate: expensesByDate
    });
  } catch (error) {
    console.error('Get expense stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 