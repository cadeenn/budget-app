const Budget = require('../models/budget.model');
const Category = require('../models/category.model');
const Expense = require('../models/expense.model');
const mongoose = require('mongoose');

// Get all budgets for a user
exports.getBudgets = async (req, res) => {
  try {
    const { isActive, category, period, sort = '-createdAt', page = 1, limit = 10, search } = req.query;
    
    const query = { user: req.user.id };
    
    // Add filters if provided
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    if (category) {
      query.category = category;
    }
    
    if (period) {
      query.period = period;
    }

    // Add search filter if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } }, // Search in budget name
        { notes: { $regex: search, $options: 'i' } } // Search in notes
      ];
    }
    
    // Count total documents
    const total = await Budget.countDocuments(query);
    
    // Execute query with pagination
    const budgets = await Budget.find(query)
      .populate('category', 'name color')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    // Return response with pagination info
    res.json({
      budgets,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error getting budgets:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a single budget by ID
exports.getBudgetById = async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('category', 'name color');
    
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    res.json(budget);
  } catch (err) {
    console.error('Error getting budget:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new budget
exports.createBudget = async (req, res) => {
  try {
    const { name, amount, period, startDate, endDate, category, notificationThreshold, notes } = req.body;
    
    // Create new budget
    const budget = new Budget({
      name,
      amount,
      period,
      startDate,
      endDate,
      category,
      notificationThreshold,
      notes,
      user: req.user.id
    });
    
    await budget.save();
    
    // Populate category details
    await budget.populate('category', 'name color');
    
    res.status(201).json(budget);
  } catch (err) {
    console.error('Error creating budget:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a budget
exports.updateBudget = async (req, res) => {
  try {
    const { name, amount, period, startDate, endDate, category, isActive, notificationThreshold, notes } = req.body;
    
    // Find and update budget
    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { 
        name, 
        amount, 
        period, 
        startDate, 
        endDate, 
        category, 
        isActive, 
        notificationThreshold, 
        notes 
      },
      { new: true, runValidators: true }
    ).populate('category', 'name color');
    
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    res.json(budget);
  } catch (err) {
    console.error('Error updating budget:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a budget
exports.deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    res.json({ message: 'Budget deleted successfully' });
  } catch (err) {
    console.error('Error deleting budget:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get budget progress (how much has been spent vs budget amount)
exports.getBudgetProgress = async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('category', 'name color');
    
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    // Calculate date range for expenses
    const startDate = budget.startDate;
    const endDate = budget.endDate || new Date();
    
    // Query to get expenses for this budget's category within the date range
    const query = {
      user: req.user.id,
      date: { $gte: startDate, $lte: endDate }
    };
    
    // If budget is for a specific category, filter by that category
    if (budget.category) {
      query.category = budget.category._id;
    }
    
    // Get total expenses for this budget
    const expenses = await Expense.find(query);
    const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Calculate percentage spent
    const percentageSpent = (totalSpent / budget.amount) * 100;
    
    res.json({
      budget,
      progress: {
        totalSpent,
        remaining: budget.amount - totalSpent,
        percentageSpent,
        isOverBudget: totalSpent > budget.amount
      },
      expenses
    });
  } catch (err) {
    console.error('Error getting budget progress:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all budget progress for a user
exports.getAllBudgetsProgress = async (req, res) => {
  try {
    // Get active budgets
    const budgets = await Budget.find({
      user: req.user.id,
      isActive: true
    }).populate('category', 'name color');
    
    const budgetsWithProgress = await Promise.all(budgets.map(async (budget) => {
      // Calculate date range for expenses
      const startDate = budget.startDate;
      const endDate = budget.endDate || new Date();
      
      // Query to get expenses for this budget's category within the date range
      const query = {
        user: req.user.id,
        date: { $gte: startDate, $lte: endDate }
      };
      
      // If budget is for a specific category, filter by that category
      if (budget.category) {
        query.category = budget.category._id;
      }
      
      // Get total expenses for this budget
      const expenses = await Expense.find(query);
      const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      // Calculate percentage spent
      const percentageSpent = (totalSpent / budget.amount) * 100;
      
      return {
        budget,
        progress: {
          totalSpent,
          remaining: budget.amount - totalSpent,
          percentageSpent,
          isOverBudget: totalSpent > budget.amount
        }
      };
    }));
    
    res.json(budgetsWithProgress);
  } catch (err) {
    console.error('Error getting all budgets progress:', err);
    res.status(500).json({ message: 'Server error' });
  }
}; 