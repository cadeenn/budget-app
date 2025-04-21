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
  Switch,
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogContentText, 
  DialogTitle 
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { Save as SaveIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; 

const AddExpense = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null); 
  const [fetchError, setFetchError] = useState(null); 
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]); 
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: '', 
    budgetId: '', 
    date: new Date(),
    isRecurring: false,
    recurringFrequency: 'monthly',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState({});

  const [openBudgetWarning, setOpenBudgetWarning] = useState(false);
  const [budgetWarningDetails, setBudgetWarningDetails] = useState(null);
  const [expenseDataToSubmit, setExpenseDataToSubmit] = useState(null);


  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setFetchError(null);
        const response = await axios.get('/api/categories');
        setCategories(response.data.categories || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setFetchError('Failed to load categories.');
      }
    };
    if (user) {
      fetchCategories();
    }
  }, [user]);

  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        setFetchError(null);
        const response = await axios.get('/api/budgets/selectable');
        setBudgets(response.data.budgets || []);
      } catch (err) {
        console.error('Error fetching budgets:', err);
        setFetchError('Failed to load budgets.');
      }
    };
    if (user) {
      fetchBudgets();
    }
  }, [user]);


  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData({
      ...formData,
      [name]: newValue
    });

    if (formErrors[name]) {
      setFormErrors(prevErrors => ({ ...prevErrors, [name]: null }));
    }
  };

  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      date
    });
    if (formErrors.date) {
        setFormErrors(prevErrors => ({ ...prevErrors, date: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    const amountValue = parseFloat(formData.amount);

    if (!formData.amount || isNaN(amountValue) || amountValue <= 0) {
      errors.amount = 'Please enter a valid amount greater than 0';
    }
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }
    if (!formData.budgetId) {
      errors.budgetId = 'Please select a budget';
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

  // Function to handle the actual API submission
  const proceedWithSubmit = async (dataToSubmit) => {
    setLoading(true);
    setSubmitError(null);
    try {
      const payload = {
        amount: parseFloat(dataToSubmit.amount),
        description: dataToSubmit.description,
        category: dataToSubmit.category || null, 
        budgetId: dataToSubmit.budgetId, 
        date: dataToSubmit.date,
        isRecurring: dataToSubmit.isRecurring,
        recurringFrequency: dataToSubmit.isRecurring ? dataToSubmit.recurringFrequency : null,
        notes: dataToSubmit.notes
      };
      await axios.post('/api/expenses', payload);
      navigate('/expenses'); 
    } catch (err) {
      console.error('Error adding expense:', err);
      const message = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to add expense. Please try again.';
      setSubmitError(message);
      setLoading(false); 
    }
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validateForm()) {
      return;
    }

    // Over Budget Check
    const selectedBudget = budgets.find(b => b._id === formData.budgetId);
    const newExpenseAmount = parseFloat(formData.amount);

    if (selectedBudget && !isNaN(newExpenseAmount)) {
        const budgetLimit = selectedBudget.amount; 
        const currentExpenses = selectedBudget.progress?.totalSpent || 0;

        const newTotalExpenses = currentExpenses + newExpenseAmount;

        if (newTotalExpenses > budgetLimit) {
            setExpenseDataToSubmit({ ...formData }); 
            setBudgetWarningDetails({
                limit: budgetLimit,
                current: currentExpenses,
                newTotal: newTotalExpenses,
                budgetName: selectedBudget.name
            });
            setOpenBudgetWarning(true); 
            return; 
        }
    } else if (!selectedBudget && formData.budgetId) {
         setSubmitError("Selected budget data not found. Please refresh.");
         return;
    } else if (isNaN(newExpenseAmount)) {
         setSubmitError("Invalid amount entered."); 
         return;
    }
    // Over Budget Check

    await proceedWithSubmit(formData);
  };

  const handleCloseWarning = (proceed = false) => {
    setOpenBudgetWarning(false);
    if (proceed && expenseDataToSubmit) {
        proceedWithSubmit(expenseDataToSubmit);
    }
    setExpenseDataToSubmit(null);
    setBudgetWarningDetails(null);
  };


  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mr: 2 }}> Back </Button>
            <Typography variant="h5" component="h1"> Add New Expense </Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />

          {/* Display fetch errors separately */}
          {fetchError && ( <Alert severity="error" sx={{ mb: 3 }}> {fetchError} </Alert> )}
          {/* Display submission errors */}
          {submitError && ( <Alert severity="error" sx={{ mb: 3 }}> {submitError} </Alert> )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Amount */}
              <Grid item xs={12} sm={6}>
                <TextField label="Amount" name="amount" value={formData.amount} onChange={handleChange} fullWidth required type="number" inputProps={{ step: "0.01", min: "0.01" }} InputProps={{ startAdornment: ( <InputAdornment position="start">$</InputAdornment> ), }} error={!!formErrors.amount} helperText={formErrors.amount} />
              </Grid>

              {/* Date */}
              <Grid item xs={12} sm={6}>
                <DatePicker label="Date" value={formData.date} onChange={handleDateChange} renderInput={(params) => ( <TextField {...params} fullWidth required error={!!formErrors.date} helperText={formErrors.date} /> )} />
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <TextField label="Description" name="description" value={formData.description} onChange={handleChange} fullWidth required error={!!formErrors.description} helperText={formErrors.description} />
              </Grid>

              {/* Budget Selection */}
              <Grid item xs={12} sm={6}>
                 <FormControl fullWidth required error={!!formErrors.budgetId}>
                   <InputLabel id="budget-select-label">Budget</InputLabel>
                   <Select
                    labelId="budget-select-label"
                    name="budgetId"
                    value={formData.budgetId}
                    onChange={handleChange}
                    label="Budget"
                   >
                     <MenuItem value=""><em>-- Select a Budget --</em></MenuItem>
                     {budgets.length === 0 && !fetchError && <MenuItem disabled>Loading budgets...</MenuItem>}
                     {budgets.map(budget => (
                       <MenuItem key={budget._id} value={budget._id}>
                         {budget.name} (${(budget.progress?.totalSpent ?? 0).toFixed(2)} / ${budget.amount.toFixed(2)})
                       </MenuItem>
                     ))}
                   </Select>
                   {formErrors.budgetId && ( <Typography variant="caption" color="error" sx={{ pl: 2 }}> {formErrors.budgetId} </Typography> )}
                 </FormControl>
              </Grid>

              {/* Category (Optional) */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!formErrors.category}>
                  <InputLabel id="category-select-label">Category (Optional)</InputLabel>
                  <Select
                    labelId="category-select-label"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    label="Category (Optional)"
                  >
                    <MenuItem value=""><em>-- Select a Category --</em></MenuItem>
                    {categories.length === 0 && !fetchError && <MenuItem disabled>Loading categories...</MenuItem>}
                    {categories.map(category => ( <MenuItem key={category._id} value={category._id}> {category.name} </MenuItem> ))}
                  </Select>
                  {formErrors.category && ( <Typography variant="caption" color="error" sx={{ pl: 2 }}> {formErrors.category} </Typography> )}
                </FormControl>
              </Grid>

              {/* Recurring Switch */}
              <Grid item xs={12}>
                <FormControlLabel control={ <Switch checked={formData.isRecurring} onChange={handleChange} name="isRecurring" color="primary" /> } label="This is a recurring expense" />
              </Grid>

              {/* Recurring Frequency */}
              {formData.isRecurring && (
                <Grid item xs={12}>
                  <FormControl fullWidth required error={!!formErrors.recurringFrequency}>
                    <InputLabel id="frequency-select-label">Frequency</InputLabel>
                    <Select
                        labelId='frequency-select-label'
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
                    {formErrors.recurringFrequency && ( <Typography variant="caption" color="error"> {formErrors.recurringFrequency} </Typography> )}
                  </FormControl>
                </Grid>
              )}

              {/* Notes */}
              <Grid item xs={12}>
                <TextField label="Notes (Optional)" name="notes" value={formData.notes} onChange={handleChange} fullWidth multiline rows={3} />
              </Grid>

              {/* Action Buttons */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button type="button" variant="outlined" onClick={() => navigate('/expenses')} sx={{ mr: 2 }}> Cancel </Button>
                  <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={loading} > {/* Use primary color */}
                      {loading ? <CircularProgress size={24} /> : 'Save Expense'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>

        {/* Budget Warning Dialog */}
        <Dialog open={openBudgetWarning} onClose={() => handleCloseWarning(false)}>
          <DialogTitle>Budget Limit Warning</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {budgetWarningDetails && (
                <>
                  Adding this expense will exceed the limit for the budget: <strong>{budgetWarningDetails.budgetName}</strong>.
                  <br /><br />
                  Budget Limit: ${budgetWarningDetails.limit?.toFixed(2)}
                  <br />
                  Current Spending: ${budgetWarningDetails.current?.toFixed(2)}
                  <br />
                  New Total Spending would be: <strong>${budgetWarningDetails.newTotal?.toFixed(2)}</strong>
                  <br /><br />
                  Do you still want to add this expense?
                </>
              )}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => handleCloseWarning(false)}>Cancel</Button>
            <Button onClick={() => handleCloseWarning(true)} autoFocus color="warning"> {/* Use warning color */}
              Add Anyway
            </Button>
          </DialogActions>
        </Dialog>

      </Container>
    </LocalizationProvider>
  );
};

export default AddExpense;