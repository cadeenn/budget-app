import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Grid,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  IconButton
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Receipt as ReceiptIcon,
  Category as CategoryIcon,
  DateRange as DateIcon,
  AttachMoney as MoneyIcon,
  Notes as NotesIcon,
  Repeat as RepeatIcon
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const ExpenseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expense, setExpense] = useState(null);

  useEffect(() => {
    const fetchExpense = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`/api/expenses/${id}`);
        setExpense(response.data);
      } catch (err) {
        console.error('Error fetching expense:', err);
        setError('Failed to load expense details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchExpense();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await axios.delete(`/api/expenses/${id}`);
        navigate('/expenses');
      } catch (err) {
        console.error('Error deleting expense:', err);
        alert('Failed to delete expense. Please try again.');
      }
    }
  };

  const getRecurringFrequencyText = (frequency) => {
    switch (frequency) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      case 'yearly':
        return 'Yearly';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Box sx={{ mt: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/expenses')}
          >
            Back to Expenses
          </Button>
        </Box>
      </Container>
    );
  }

  if (!expense) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="info">Expense not found.</Alert>
        <Box sx={{ mt: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/expenses')}
          >
            Back to Expenses
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/expenses')}
              sx={{ mr: 2 }}
            >
              Back
            </Button>
            <Typography variant="h5" component="h1">
              Expense Details
            </Typography>
          </Box>
          <Box>
            <IconButton
              component={RouterLink}
              to={`/expenses/${id}/edit`}
              color="primary"
              sx={{ mr: 1 }}
            >
              <EditIcon />
            </IconButton>
            <IconButton
              onClick={handleDelete}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h4" component="h2" gutterBottom sx={{ color: 'error.main' }}>
              ${expense.amount.toFixed(2)}
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {expense.description}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {expense.category && (
                <Chip 
                  label={expense.category.name} 
                  color="primary" 
                  icon={<CategoryIcon />}
                  style={{ 
                    backgroundColor: expense.category.color,
                    color: '#fff'
                  }}
                />
              )}
              {expense.isRecurring && (
                <Chip 
                  label={`Recurring (${getRecurringFrequencyText(expense.recurringFrequency)})`} 
                  color="secondary" 
                  icon={<RepeatIcon />}
                />
              )}
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <List>
              <ListItem>
                <ListItemText 
                  primary="Date" 
                  secondary={format(new Date(expense.date), 'MMMM dd, yyyy')}
                  primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
                  secondaryTypographyProps={{ variant: 'body1' }}
                />
              </ListItem>
              
              <Divider component="li" />
              
              <ListItem>
                <ListItemText 
                  primary="Category" 
                  secondary={expense.category ? expense.category.name : 'Uncategorized'}
                  primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
                  secondaryTypographyProps={{ variant: 'body1' }}
                />
              </ListItem>
              
              <Divider component="li" />
              
              <ListItem>
                <ListItemText 
                  primary="Amount" 
                  secondary={`$${expense.amount.toFixed(2)}`}
                  primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
                  secondaryTypographyProps={{ variant: 'body1', color: 'error.main', fontWeight: 'bold' }}
                />
              </ListItem>
              
              {expense.isRecurring && (
                <>
                  <Divider component="li" />
                  <ListItem>
                    <ListItemText 
                      primary="Recurring" 
                      secondary={`Yes (${getRecurringFrequencyText(expense.recurringFrequency)})`}
                      primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1' }}
                    />
                  </ListItem>
                </>
              )}
              
              {expense.notes && (
                <>
                  <Divider component="li" />
                  <ListItem>
                    <ListItemText 
                      primary="Notes" 
                      secondary={expense.notes}
                      primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1' }}
                    />
                  </ListItem>
                </>
              )}
              
              <Divider component="li" />
              
              <ListItem>
                <ListItemText 
                  primary="Created At" 
                  secondary={format(new Date(expense.createdAt), 'MMMM dd, yyyy HH:mm')}
                  primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
                  secondaryTypographyProps={{ variant: 'body1' }}
                />
              </ListItem>
              
              {expense.updatedAt && expense.updatedAt !== expense.createdAt && (
                <>
                  <Divider component="li" />
                  <ListItem>
                    <ListItemText 
                      primary="Last Updated" 
                      secondary={format(new Date(expense.updatedAt), 'MMMM dd, yyyy HH:mm')}
                      primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1' }}
                    />
                  </ListItem>
                </>
              )}
            </List>
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/expenses')}
              >
                Back to Expenses
              </Button>
              <Button
                variant="contained"
                color="primary"
                component={RouterLink}
                to={`/expenses/${id}/edit`}
              >
                Edit Expense
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default ExpenseDetail; 