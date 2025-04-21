const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: false 
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  budget: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Budget',
    required: false 
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit card', 'debit card', 'bank transfer', 'other'],
    default: 'cash'
  },
  location: {
    type: String,
    trim: true
  },
  receipt: {
    type: String // URL to receipt image
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly', null],
    default: null
  },
  notes: { // Added notes field if it wasn't implicitly there via req.body
    type: String,
    trim: true,
    default: ''
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Create indexes for common queries
expenseSchema.index({ user: 1, date: -1 });
expenseSchema.index({ category: 1, user: 1 });
expenseSchema.index({ budget: 1, user: 1 });

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;