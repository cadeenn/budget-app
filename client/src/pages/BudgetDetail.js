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
  CircularProgress,
  Alert,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ShoppingBag as ExpenseIcon,
  CalendarToday as DateIcon,
  Category as CategoryIcon,
  AttachMoney as MoneyIcon,
  Notifications as NotificationIcon,
  Notes as NotesIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const BudgetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [budget, setBudget] = useState(null);
  const [progress, setProgress] = useState(null);
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    const fetchBudgetDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`/api/budgets/${id}/progress`);
        
        setBudget(response.data.budget);
        setProgress(response.data.progress);
        setExpenses(response.data.expenses || []);
      } catch (err) {
        console.error('Error fetching budget details:', err);
        setError('Failed to load budget details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBudgetDetails();
  }, [id]);

  const handleDeleteBudget = async () => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      try {
        await axios.delete(`/api/budgets/${id}`);
        navigate('/budgets');
      } catch (err) {
        console.error('Error deleting budget:', err);
        alert('Failed to delete budget. Please try again.');
      }
    }
  };

  const getPeriodLabel = (period) => {
    switch (period) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      case 'yearly':
        return 'Yearly';
      case 'custom':
        return 'Custom';
      default:
        return period;
    }
  };

  const getProgressColor = (percentSpent) => {
    if (percentSpent >= 100) return 'error';
    if (percentSpent >= 75) return 'warning';
    return 'success';
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
            onClick={() => navigate('/budgets')}
          >
            Back to Budgets
          </Button>
        </Box>
      </Container>
    );
  }

  if (!budget) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="info">Budget not found</Alert>
        <Box sx={{ mt: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/budgets')}
          >
            Back to Budgets
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/budgets')}
        >
          Back to Budgets
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Budget Header */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4" component="h1">
                {budget.name}
              </Typography>
              <Box>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  component={RouterLink}
                  to={`/budgets/${id}/edit`}
                  sx={{ mr: 1 }}
                >
                  Edit
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleDeleteBudget}
                >
                  Delete
                </Button>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              <Chip 
                icon={<CategoryIcon />} 
                label={budget.category ? budget.category.name : 'All Categories'} 
                style={{ 
                  backgroundColor: budget.category ? budget.category.color : '#757575',
                  color: '#fff'
                }}
              />
              <Chip 
                icon={<DateIcon />} 
                label={getPeriodLabel(budget.period)} 
              />
              <Chip 
                label={budget.isActive ? 'Active' : 'Inactive'} 
                color={budget.isActive ? 'success' : 'default'}
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <MoneyIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Budget Amount" 
                      secondary={`$${budget.amount.toFixed(2)}`} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <DateIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Start Date" 
                      secondary={format(new Date(budget.startDate), 'MMMM dd, yyyy')} 
                    />
                  </ListItem>
                  {budget.endDate && (
                    <ListItem>
                      <ListItemIcon>
                        <DateIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary="End Date" 
                        secondary={format(new Date(budget.endDate), 'MMMM dd, yyyy')} 
                      />
                    </ListItem>
                  )}
                  <ListItem>
                    <ListItemIcon>
                      <NotificationIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Notification Threshold" 
                      secondary={`${budget.notificationThreshold}%`} 
                    />
                  </ListItem>
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                {budget.notes && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center' }}>
                      <NotesIcon sx={{ mr: 1 }} /> Notes
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {budget.notes}
                    </Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Budget Progress */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Budget Progress
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(progress?.percentageSpent || 0, 100)} 
                  color={getProgressColor(progress?.percentageSpent || 0)}
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </Box>
              <Box sx={{ minWidth: 35 }}>
                <Typography variant="body2" color="text.secondary">
                  {Math.round(progress?.percentageSpent || 0)}%
                </Typography>
              </Box>
            </Box>
            
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Budget
                    </Typography>
                    <Typography variant="h5" component="div">
                      ${budget.amount.toFixed(2)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Spent
                    </Typography>
                    <Typography variant="h5" component="div" color={progress?.isOverBudget ? 'error' : 'inherit'}>
                      ${progress?.totalSpent.toFixed(2)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Remaining
                    </Typography>
                    <Typography variant="h5" component="div" color={progress?.isOverBudget ? 'error' : 'inherit'}>
                      ${progress?.remaining.toFixed(2)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            {progress?.isOverBudget && (
              <Alert severity="error" sx={{ mt: 2 }}>
                You have exceeded your budget by ${Math.abs(progress.remaining).toFixed(2)}
              </Alert>
            )}
            
            {progress?.percentageSpent >= budget.notificationThreshold && !progress?.isOverBudget && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                You have used {Math.round(progress.percentageSpent)}% of your budget
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Related Expenses */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Related Expenses
            </Typography>
            
            {expenses.length === 0 ? (
              <Typography variant="body2" color="textSecondary">
                No expenses found for this budget period
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {expenses.slice(0, 5).map((expense) => (
                      <TableRow key={expense._id}>
                        <TableCell>
                          {format(new Date(expense.date), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>{expense.description}</TableCell>
                        <TableCell align="right">${expense.amount.toFixed(2)}</TableCell>
                        <TableCell align="center">
                          <Tooltip title="View Expense">
                            <IconButton
                              size="small"
                              component={RouterLink}
                              to={`/expenses/${expense._id}`}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            
            {expenses.length > 5 && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary">
                  Showing 5 of {expenses.length} expenses
                </Typography>
                <Button
                  component={RouterLink}
                  to="/expenses"
                  size="small"
                  sx={{ mt: 1 }}
                >
                  View All Expenses
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default BudgetDetail; 