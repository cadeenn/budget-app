const Budget = require('../models/budget.model');
const Category = require('../models/category.model');
const Expense = require('../models/expense.model');
const mongoose = require('mongoose');

const _calculateBudgetProgress = async (budget, userId) => {
  try {
    let periodStartDate = budget.startDate;
    let periodEndDate = budget.endDate; 

    // If no endDate, determine based on period 
    if (!periodEndDate) {
        const now = new Date();
        switch (budget.period) {
            case 'daily':
                periodStartDate = new Date(now.setHours(0, 0, 0, 0));
                periodEndDate = new Date(now.setHours(23, 59, 59, 999));
                break;
            case 'weekly':
                const dayOfWeek = now.getDay(); 
                const diffStart = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); 
                periodStartDate = new Date(now.setDate(diffStart));
                periodStartDate.setHours(0, 0, 0, 0);
                periodEndDate = new Date(periodStartDate);
                periodEndDate.setDate(periodStartDate.getDate() + 6);
                periodEndDate.setHours(23, 59, 59, 999);
                break;
            case 'yearly':
                 periodStartDate = new Date(now.getFullYear(), 0, 1); 
                 periodEndDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999); 
                 break;
            case 'monthly':
            default:
                 periodStartDate = new Date(now.getFullYear(), now.getMonth(), 1); 
                 periodEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999); 
                 break;
        }
        if (budget.startDate > periodStartDate) {
            periodStartDate = budget.startDate;
        }
    }


    // Query to find expenses linked directly to this budget within the period
    const query = {
      user: userId,
      budget: budget._id, 
      date: { $gte: periodStartDate, $lte: periodEndDate }
    };

    // Aggregate total expenses matching the query
     const result = await Expense.aggregate([
      { $match: query },
      { $group: { _id: null, totalSpent: { $sum: '$amount' } } }
    ]);

    const totalSpent = result.length > 0 ? result[0].totalSpent : 0;
    const budgetAmount = budget.amount || 0; 
    const percentageSpent = budgetAmount > 0 ? (totalSpent / budgetAmount) * 100 : 0;

    return {
      totalSpent: totalSpent,
      remaining: budgetAmount - totalSpent,
      percentageSpent: percentageSpent,
      isOverBudget: totalSpent > budgetAmount
    };
  } catch (error) {
    console.error(`Error calculating progress for budget ${budget._id}:`, error);
    return {
      totalSpent: 0,
      remaining: budget.amount || 0,
      percentageSpent: 0,
      isOverBudget: false
    };
  }
};


// Get all budgets for a user
exports.getBudgets = async (req, res) => {
  try {
    const { isActive, category, period, sort = '-createdAt', page = 1, limit = 10 } = req.query;

    const query = { user: req.user.id };
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (category) query.category = category;
    if (period) query.period = period;

    const total = await Budget.countDocuments(query);
    const budgets = await Budget.find(query)
      .populate('category', 'name color')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean() 
      .exec();

    // Calculate progress for each budget
    const budgetsWithProgress = await Promise.all(budgets.map(async (budget) => {
        const progress = await _calculateBudgetProgress(budget, req.user.id);
        return { ...budget, progress }; 
    }));

    res.json({
      budgets: budgetsWithProgress,
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

// Get selectable budgets
exports.getSelectableBudgets = async (req, res) => {
  try {
    // Find active budgets for the current user
    const budgets = await Budget.find({ user: req.user.id, isActive: true })
                           .select('_id name amount period startDate endDate category') 
                           .lean(); 

    // Calculate progress for each active budget
    const budgetsWithProgress = await Promise.all(budgets.map(async (budget) => {
        const progress = await _calculateBudgetProgress(budget, req.user.id);
        return {
             _id: budget._id,
             name: budget.name,
             amount: budget.amount,
             progress: progress 
         };
    }));

    res.json({ budgets: budgetsWithProgress });
  } catch (error) {
    console.error('Error fetching selectable budgets:', error);
    res.status(500).json({ message: 'Server error fetching budgets' });
  }
};


// Get progress for all active budgets
exports.getAllBudgetsProgress = async (req, res) => {
  try {
    const budgets = await Budget.find({ user: req.user.id, isActive: true })
                           .populate('category', 'name color')
                           .lean();

    const budgetsWithProgress = await Promise.all(budgets.map(async (budget) => {
      const progress = await _calculateBudgetProgress(budget, req.user.id);
      return { budget, progress }; 
    }));

    res.json(budgetsWithProgress);
  } catch (err) {
    console.error('Error getting all budgets progress:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a single budget by ID
exports.getBudgetById = async (req, res) => {
  try {
    const budget = await Budget.findOne({ _id: req.params.id, user: req.user.id })
                           .populate('category', 'name color')
                           .lean();

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    // Calculate progress for this specific budget
    const progress = await _calculateBudgetProgress(budget, req.user.id);
    const budgetWithProgress = { ...budget, progress };

    res.json(budgetWithProgress);
  } catch (err) {
    console.error('Error getting budget by ID:', err);
    if (err.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Budget not found (Invalid ID)' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Get progress for a specific budget
exports.getBudgetProgress = async (req, res) => {
  try {
    const budget = await Budget.findOne({ _id: req.params.id, user: req.user.id }).lean();
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    const progress = await _calculateBudgetProgress(budget, req.user.id);
    res.json(progress); 

  } catch (err) {
    console.error('Error getting budget progress:', err);
     if (err.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Budget not found (Invalid ID)' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new budget
exports.createBudget = async (req, res) => {
  const { name, amount, category, period, startDate, endDate, isActive } = req.body;
  try {
    // Basic validation
    if (!name || !amount || !period) {
        return res.status(400).json({ message: 'Name, amount, and period are required' });
    }

    const newBudget = new Budget({
      user: req.user.id,
      name,
      amount: parseFloat(amount),
      category: category || null,
      period,
      startDate: startDate ? new Date(startDate) : new Date(), 
      endDate: endDate ? new Date(endDate) : null, 
      isActive: isActive !== undefined ? isActive : true 
    });

    const budget = await newBudget.save();
    // Optionally populate category before sending response
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
    const budget = await Budget.findOne({ _id: req.params.id, user: req.user.id });
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    // Update fields present in the request body
    const { name, amount, category, period, startDate, endDate, isActive } = req.body;
    if (name !== undefined) budget.name = name;
    if (amount !== undefined) budget.amount = parseFloat(amount);
    // Allow setting category to null
    if (category !== undefined) budget.category = category || null;
    if (period !== undefined) budget.period = period;
    if (startDate !== undefined) budget.startDate = new Date(startDate);
    // Allow setting endDate to null
    if (endDate !== undefined) budget.endDate = endDate ? new Date(endDate) : null;
    if (isActive !== undefined) budget.isActive = isActive;

    const updatedBudget = await budget.save();
    // Optionally populate category before sending response
    await updatedBudget.populate('category', 'name color');
    res.json(updatedBudget);
  } catch (err) {
    console.error('Error updating budget:', err);
     if (err.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Budget not found (Invalid ID)' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a budget
exports.deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user.id });

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    res.json({ message: 'Budget deleted successfully' });
  } catch (err) {
    console.error('Error deleting budget:', err);
    if (err.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Budget not found (Invalid ID)' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};