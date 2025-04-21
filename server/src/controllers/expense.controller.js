const { validationResult } = require('express-validator');
const Expense = require('../models/expense.model');
const Category = require('../models/category.model');
const Budget = require('../models/budget.model');
const mongoose = require('mongoose');

// Get all expenses for the current user 
exports.getExpenses = async (req, res) => {
  try {
    const { startDate, endDate, category, budgetId, minAmount, maxAmount, sort = '-date' } = req.query; 

    // Build filter object
    const filter = { user: req.user._id }; 

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      // Adjust endDate to include the whole day
      if (endDate) filter.date.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }
    if (category) filter.category = category;
    if (budgetId) filter.budget = budgetId;
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = Number(minAmount);
      if (maxAmount) filter.amount.$lte = Number(maxAmount);
    }

    // Execute query with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Expense.countDocuments(filter);
    const expenses = await Expense.find(filter)
      .populate('category', 'name color icon') 
      .populate('budget', 'name') 
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .lean(); 
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
    console.error('Error getting expenses:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get expense by ID
exports.getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id })
                                 .populate('category', 'name color icon')
                                 .populate('budget', 'name amount');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.json(expense);
  } catch (error) {
    console.error('Error getting expense by ID:', error);
     if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Expense not found (Invalid ID)' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new expense
exports.createExpense = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { amount, description, category, date, isRecurring, recurringFrequency, notes, budgetId } = req.body; 

  try {
    const budgetExists = await Budget.findOne({ _id: budgetId, user: req.user._id });
    if (!budgetExists) {
        return res.status(400).json({ errors: [{ msg: 'Invalid Budget selected or budget does not belong to user', param: 'budgetId' }] });
    }

    // Validate category if provided
    if (category) {
        const categoryExists = await Category.findOne({ _id: category, user: req.user._id }); 
         if (!categoryExists) {
             return res.status(400).json({ errors: [{ msg: 'Invalid Category selected', param: 'category' }] });
         }
    }


    const newExpense = new Expense({
      user: req.user._id, 
      amount: parseFloat(amount),
      description: description.trim(),
      category: category || null, 
      budget: budgetId, 
      date: date ? new Date(date) : new Date(), 
      isRecurring: !!isRecurring,
      recurringFrequency: isRecurring ? recurringFrequency : null,
      notes: notes || ''
    });

    const expense = await newExpense.save();
    // Populate related fields before sending back
    await expense.populate('category', 'name color icon');
    await expense.populate('budget', 'name');

    res.status(201).json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ message: 'Server error while creating expense' });
  }
};

// Update an expense 
exports.updateExpense = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { amount, description, category, date, isRecurring, recurringFrequency, notes, budgetId } = req.body;

  try {
    let expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Validate budgetId if provided during update
    if (req.body.hasOwnProperty('budgetId')) { 
        if (budgetId) {
            const budgetExists = await Budget.findOne({ _id: budgetId, user: req.user._id });
            if (!budgetExists) {
                return res.status(400).json({ errors: [{ msg: 'Invalid Budget selected', param: 'budgetId' }] });
            }
            expense.budget = budgetId; 
        } else {
             
             return res.status(400).json({ errors: [{ msg: 'Budget cannot be empty', param: 'budgetId' }] });
             
        }
    } 


    // Validate category if provided during update
     if (req.body.hasOwnProperty('category')) { 
         if (category) { 
             const categoryExists = await Category.findOne({ _id: category, user: req.user._id });
             if (!categoryExists) {
                 return res.status(400).json({ errors: [{ msg: 'Invalid Category selected', param: 'category' }] });
             }
             expense.category = category;
         } else {
             expense.category = null; 
         }
     } 


    // Update other fields if they exist in the request body
    if (amount !== undefined) expense.amount = parseFloat(amount);
    if (description !== undefined) expense.description = description.trim();
    if (date !== undefined) expense.date = new Date(date);
    if (isRecurring !== undefined) expense.isRecurring = !!isRecurring;
    // Update frequency logically based on isRecurring state
    if (isRecurring !== undefined) { 
        expense.recurringFrequency = !!isRecurring ? recurringFrequency : null;
    } else if (expense.isRecurring && recurringFrequency !== undefined) { 
        expense.recurringFrequency = recurringFrequency;
    }
    if (notes !== undefined) expense.notes = notes;

    const updatedExpense = await expense.save();
    // Populate related fields before sending back
    await updatedExpense.populate('category', 'name color icon');
    await updatedExpense.populate('budget', 'name');

    res.json(updatedExpense);
  } catch (error) {
    console.error('Error updating expense:', error);
     if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Expense not found (Invalid ID)' });
    }
    res.status(500).json({ message: 'Server error while updating expense' });
  }
};

// Delete an expense 
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
     if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Expense not found (Invalid ID)' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};


// Get expense statistics 
exports.getExpenseStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Base match stage
    const matchStage = { user: new mongoose.Types.ObjectId(req.user._id) }; 

    // Add date range filter
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) matchStage.date.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    // Total expenses
    const totalExpenses = await Expense.aggregate([
      { $match: matchStage },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Expenses by category
    const expensesByCategory = await Expense.aggregate([
      { $match: matchStage },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } }
    ]);

    // Fetch category details for the grouped results
    const categoryIds = expensesByCategory.map(item => item._id).filter(id => id); 
    const categories = await Category.find({ _id: { $in: categoryIds } }).lean();

    // Map category details to expenses
    const expensesByCategoryWithDetails = expensesByCategory.map(item => {
      const category = categories.find(cat => cat._id.toString() === item._id?.toString());
      return {
        category: category ? { 
          _id: category._id,
          name: category.name,
          icon: category.icon,
          color: category.color
        } : { name: 'Uncategorized' }, 
        total: item.total
      };
    });

    // Get expenses by date 
    const expensesByDate = await Expense.aggregate([
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
      total: totalExpenses.length > 0 ? totalExpenses[0].total : 0,
      byCategory: expensesByCategoryWithDetails,
      byDate: expensesByDate
    });
  } catch (error) {
    console.error('Error getting expense stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};