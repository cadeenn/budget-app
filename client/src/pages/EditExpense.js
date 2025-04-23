import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

const EditExpense = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const budgetsResponse = await axios.get('/api/budgets');
        setBudgets(budgetsResponse.data.budgets || []);

        const expenseResponse = await axios.get(`/api/expenses/${id}`);
        const expense = expenseResponse.data;

        setFormData({
          amount: expense.amount,
          description: expense.description,
          budget: expense.budget ? expense.budget._id : '',
          date: new Date(expense.date),
          isRecurring: expense.isRecurring || false,
          recurringFrequency: expense.recurringFrequency || 'monthly',
          notes: expense.notes || ''
        });
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load expense data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

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

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await axios.put(`/api/expenses/${id}`, {
        amount: parseFloat(formData.amount),
        description: formData.description,
        budget: formData.budget,
        date: formData.date,
        isRecurring: formData.isRecurring,
        recurringFrequency: formData.isRecurring ? formData.recurringFrequency : null,
        notes: formData.notes
      });

      setSaving(false);
      navigate(`/expenses/${id}`);
    } catch (err) {
      console.error('Error updating expense:', err);
      setError('Failed to update expense. Please try again.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(`/expenses/${id}`)}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h5" component="h1">
            Edit Expense
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
                  onClick={() => navigate(`/expenses/${id}`)}
                  sx={{ mr: 2 }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={saving}
                >
                  {saving ? <CircularProgress size={24} /> : 'Save Changes'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default EditExpense;
