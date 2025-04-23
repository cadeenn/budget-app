import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  CircularProgress,
  Alert,
  Divider,
  FormControlLabel,
  Switch
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { Save as SaveIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const AddExpense = ({ handleClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    budget: '',
    date: new Date(),
    isRecurring: false,
    recurringFrequency: 'monthly',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        const response = await axios.get('/api/budgets');
        console.log('Budget API response:', response.data);

        const budgetList = Array.isArray(response.data)
          ? response.data
          : response.data.budgets || [];

        setBudgets(budgetList);

        if (budgetList.length > 0) {
          setFormData(prev => ({
            ...prev,
            budget: budgetList[0]._id
          }));
        }
      } catch (err) {
        console.error('Error fetching budgets:', err);
        setError('Failed to load budgets. Please try again later.');
      }
    };

    fetchBudgets();
  }, []);

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    const newValue = name === 'isRecurring' ? checked : value;

    setFormData({
      ...formData,
      [name]: newValue
    });

    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };

  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      date
    });

    if (formErrors.date) {
      setFormErrors({
        ...formErrors,
        date: null
      });
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.amount || isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      errors.amount = 'Please enter a valid amount greater than 0';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }

    if (!formData.budget) {
      errors.budget = 'Please select a budget';
    }

    if (!formData.date) {
      errors.date = 'Please select a date';
    }

    if (formData.isRecurring && !formData.recurringFrequency) {
      errors.recurringFrequency = 'Please select a frequency for recurring expense';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      console.log("Sending expense data:", formData);
  
      // Make sure you're sending 'budget' instead of 'category'
      const response = await axios.post('/api/expenses', {
        amount: formData.amount,
        description: formData.description,
        budget: formData.budget,  // Changed to 'budget' instead of 'category'
        date: formData.date,
        isRecurring: formData.isRecurring,
        recurringFrequency: formData.isRecurring ? formData.recurringFrequency : null,
        notes: formData.notes
      });
  
      console.log("Expense added:", response.data);
      handleClose();
      setFormData({
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        budget: budgets[0]?._id || '',
        isRecurring: false,
        recurringFrequency: 'monthly',
        notes: ''
      });
    } catch (err) {
      console.error("Failed to add expense:", err.response?.data || err.message);
      setError('Failed to add expense. Please try again.');
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h5" component="h1">
            Add New Expense
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                fullWidth
                required
                type="number"
                inputProps={{ step: "0.01", min: "0.01" }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">$</InputAdornment>
                  ),
                }}
                error={!!formErrors.amount}
                helperText={formErrors.amount}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Date"
                  value={formData.date}
                  onChange={handleDateChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      required
                      error={!!formErrors.date}
                      helperText={formErrors.date}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                fullWidth
                required
                error={!!formErrors.description}
                helperText={formErrors.description}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth required error={!!formErrors.budget}>
                <InputLabel>Budget</InputLabel>
                <Select
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  label="Budget"
                >
                  {budgets.map(budget => (
                    <MenuItem key={budget._id} value={budget._id}>
                      {budget.name}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.budget && (
                  <Typography variant="caption" color="error">
                    {formErrors.budget}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isRecurring}
                    onChange={handleChange}
                    name="isRecurring"
                    color="primary"
                  />
                }
                label="This is a recurring expense"
              />
            </Grid>

            {formData.isRecurring && (
              <Grid item xs={12}>
                <FormControl fullWidth required error={!!formErrors.recurringFrequency}>
                  <InputLabel>Frequency</InputLabel>
                  <Select
                    name="recurringFrequency"
                    value={formData.recurringFrequency}
                    onChange={handleChange}
                    label="Frequency"
                  >
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                    <MenuItem value="yearly">Yearly</MenuItem>
                  </Select>
                  {formErrors.recurringFrequency && (
                    <Typography variant="caption" color="error">
                      {formErrors.recurringFrequency}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12}>
              <TextField
                label="Notes (Optional)"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => navigate('/expenses')}
                  sx={{ mr: 2 }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={loading}
                  color="error"
                >
                  {loading ? <CircularProgress size={24} /> : 'Save Expense'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default AddExpense;
