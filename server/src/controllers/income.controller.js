const { validationResult } = require('express-validator');
const Income = require('../models/income.model');

/**
 * Get all incomes for the current user
 * @route GET /api/incomes
 * @access Private
 */
exports.getIncomes = async (req, res) => {
  try {
    const { startDate, endDate, sort = '-date' } = req.query;
    
    // Build filter object
    const filter = { user: req.user._id };
    
    // Add date range filter if provided
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    
    // Execute query with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const incomes = await Income.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await Income.countDocuments(filter);
    
    res.json({
      incomes,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get incomes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get income by ID
 * @route GET /api/incomes/:id
 * @access Private
 */
exports.getIncomeById = async (req, res) => {
  try {
    const income = await Income.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!income) {
      return res.status(404).json({ message: 'Income not found' });
    }
    
    res.json(income);
  } catch (error) {
    console.error('Get income by ID error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Income not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Create a new income
 * @route POST /api/incomes
 * @access Private
 */
exports.createIncome = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { amount, source, description, date, isRecurring, recurringFrequency, tags } = req.body;
    
    const newIncome = new Income({
      amount,
      source,
      description,
      date: date || Date.now(),
      user: req.user._id,
      isRecurring: isRecurring || false,
      recurringFrequency: isRecurring ? recurringFrequency : null,
      tags: tags || []
    });
    
    const income = await newIncome.save();
    
    res.status(201).json(income);
  } catch (error) {
    console.error('Create income error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update an income
 * @route PUT /api/incomes/:id
 * @access Private
 */
exports.updateIncome = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { amount, source, description, date, isRecurring, recurringFrequency, tags } = req.body;
    
    // Build income update object
    const incomeFields = {};
    if (amount !== undefined) incomeFields.amount = amount;
    if (source !== undefined) incomeFields.source = source;
    if (description !== undefined) incomeFields.description = description;
    if (date !== undefined) incomeFields.date = date;
    if (isRecurring !== undefined) {
      incomeFields.isRecurring = isRecurring;
      if (!isRecurring) {
        incomeFields.recurringFrequency = null;
      }
    }
    if (isRecurring && recurringFrequency !== undefined) {
      incomeFields.recurringFrequency = recurringFrequency;
    }
    if (tags !== undefined) incomeFields.tags = tags;
    
    // Find and update income
    let income = await Income.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!income) {
      return res.status(404).json({ message: 'Income not found' });
    }
    
    income = await Income.findByIdAndUpdate(
      req.params.id,
      { $set: incomeFields },
      { new: true }
    );
    
    res.json(income);
  } catch (error) {
    console.error('Update income error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Income not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete an income
 * @route DELETE /api/incomes/:id
 * @access Private
 */
exports.deleteIncome = async (req, res) => {
  try {
    const income = await Income.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!income) {
      return res.status(404).json({ message: 'Income not found' });
    }
    
    res.json({ message: 'Income deleted successfully' });
  } catch (error) {
    console.error('Delete income error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Income not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get income statistics
 * @route GET /api/incomes/stats
 * @access Private
 */
exports.getIncomeStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date filter
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    
    // Match stage for aggregation
    const matchStage = {
      user: req.user._id
    };
    
    if (Object.keys(dateFilter).length > 0) {
      matchStage.date = dateFilter;
    }
    
    // Get total income
    const totalIncome = await Income.aggregate([
      { $match: matchStage },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // Get income by source
    const incomeBySource = await Income.aggregate([
      { $match: matchStage },
      { $group: { _id: '$source', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } }
    ]);
    
    // Get income by date (for charts)
    const incomeByDate = await Income.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      total: totalIncome.length > 0 ? totalIncome[0].total : 0,
      bySource: incomeBySource,
      byDate: incomeByDate
    });
  } catch (error) {
    console.error('Get income stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 