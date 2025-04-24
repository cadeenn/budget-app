import React, { useState } from 'react';
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

const AddIncome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    amount: '',
    source: '',
    description: '',
    date: new Date(),
    isRecurring: false,
    recurringFrequency: 'monthly',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    const newValue = name === 'isRecurring' ? checked : value;
    
    setFormData({
      ...formData,
      [name]: newValue
    });
    
    // Clear error for this field
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
    
    // Clear date error
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
    
    if (!formData.source.trim()) {
      errors.source = 'Source is required';
    }
    
    if (!formData.date) {
      errors.date = 'Please select a date';
    }
    
    if (formData.isRecurring && !formData.recurringFrequency) {
      errors.recurringFrequency = 'Please select a frequency for recurring income';
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
      setLoading(true);
      setError(null);
      
      const response = await axios.post('/api/incomes', {
        amount: parseFloat(formData.amount),
        source: formData.source,
        description: formData.description,
        date: formData.date,
        isRecurring: formData.isRecurring,
        recurringFrequency: formData.isRecurring ? formData.recurringFrequency : null,
        notes: formData.notes
      });
      
      setLoading(false);
      navigate('/incomes');
    } catch (err) {
      console.error('Error adding income:', err);
      setError('Failed to add income. Please try again.');
      setLoading(false);
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
            Add New Income
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
                  onKeyDown: (e) => {
                    if (["e", "E", "-", "+"].includes(e.key)) {
                      e.preventDefault();
                    }
                  }
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
                label="Source"
                name="source"
                value={formData.source}
                onChange={handleChange}
                fullWidth
                required
                error={!!formErrors.source}
                helperText={formErrors.source}
                placeholder="e.g. Salary, Freelance, Investment"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Description (Optional)"
                name="description"
                value={formData.description}
                onChange={handleChange}
                fullWidth
                placeholder="e.g. Monthly salary from Company XYZ"
              />
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
                label="This is a recurring income"
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
                  onClick={() => navigate('/incomes')}
                  sx={{ mr: 2 }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={loading}
                  color="success"
                >
                  {loading ? <CircularProgress size={24} /> : 'Save Income'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default AddIncome; 