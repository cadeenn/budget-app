import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  TextField,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Tabs,
  Tab,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Repeat as RepeatIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import axios from 'axios';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useAuth } from '../context/AuthContext';
// Add these imports for the pie chart
import { Pie } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend 
} from 'chart.js';

// Register ChartJS components needed for pie chart
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend
);

const ExpenseList = () => {
  const { user } = useAuth();
  const theme = useTheme(); // Add theme hook
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    page: 0,
    limit: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    category: '',
    minAmount: '',
    maxAmount: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  // Add state for expense stats and time range
  const [expenseStats, setExpenseStats] = useState(null);
  const [timeRange, setTimeRange] = useState('month');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('/api/categories');
        setCategories(response.data.categories || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };

    fetchCategories();
  }, []);

  // Add useEffect for fetching expense stats - same as Dashboard
  useEffect(() => {
    const fetchExpenseStats = async () => {
      try {
        // Calculate date range based on selected time range
        let startDate, endDate;
        const now = new Date();
        
        switch (timeRange) {
          case 'week':
            startDate = format(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6), 'yyyy-MM-dd');
            endDate = format(now, 'yyyy-MM-dd');
            break;
          case 'month':
            startDate = format(startOfMonth(now), 'yyyy-MM-dd');
            endDate = format(endOfMonth(now), 'yyyy-MM-dd');
            break;
          case 'year':
            startDate = format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd');
            endDate = format(new Date(now.getFullYear(), 11, 31), 'yyyy-MM-dd');
            break;
          default:
            startDate = format(startOfMonth(now), 'yyyy-MM-dd');
            endDate = format(endOfMonth(now), 'yyyy-MM-dd');
        }
        
        // Fetch expense statistics - same API as Dashboard
        const statsResponse = await axios.get('/api/expenses/stats', {
          params: { startDate, endDate }
        });
        
        setExpenseStats(statsResponse.data);
      } catch (err) {
        console.error('Error fetching expense stats:', err);
        // Silently fail - pie chart will just not show
      }
    };

    fetchExpenseStats();
  }, [timeRange]);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = {
          page: pagination.page + 1,
          limit: pagination.limit,
          sort: '-date'
        };

        // Add filters to params
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;
        if (filters.category) params.category = filters.category;
        if (filters.minAmount) params.minAmount = filters.minAmount;
        if (filters.maxAmount) params.maxAmount = filters.maxAmount;
        if (filters.search) params.search = filters.search;

        const response = await axios.get('/api/expenses', { params });
        
        setExpenses(response.data.expenses);
        setPagination({
          ...pagination,
          total: response.data.pagination.total
        });
      } catch (err) {
        console.error('Error fetching expenses:', err);
        setError('Failed to load expenses. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, [pagination.page, pagination.limit, filters]);

  // Modified preparePieChartData function to match the income list format
  const preparePieChartData = () => {
    if (!expenseStats || !expenseStats.byCategory) {
      return {
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: [],
            borderWidth: 1
          }
        ]
      };
    }
    
    return {
      labels: expenseStats.byCategory.map(item => item.category.name),
      datasets: [
        {
          data: expenseStats.byCategory.map(item => item.total),
          backgroundColor: expenseStats.byCategory.map(item => item.category.color),
          borderColor: '#fff',
          borderWidth: 1
        }
      ]
    };
  };

  const handleChangePage = (event, newPage) => {
    setPagination({
      ...pagination,
      page: newPage
    });
  };

  const handleChangeRowsPerPage = (event) => {
    setPagination({
      ...pagination,
      limit: parseInt(event.target.value, 10),
      page: 0
    });
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters({
      ...filters,
      [name]: value
    });
    setPagination({
      ...pagination,
      page: 0
    });
  };

  const handleClearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      category: '',
      minAmount: '',
      maxAmount: '',
      search: ''
    });
    setPagination({
      ...pagination,
      page: 0
    });
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await axios.delete(`/api/expenses/${id}`);
        setExpenses(expenses.filter(expense => expense._id !== id));
        setPagination({
          ...pagination,
          total: pagination.total - 1
        });
      } catch (err) {
        console.error('Error deleting expense:', err);
        alert('Failed to delete expense. Please try again.');
      }
    }
  };

  // Add function to handle time range change
  const handleTimeRangeChange = (event, newValue) => {
    setTimeRange(newValue);
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat._id === categoryId);
    return category ? category.name : 'Unknown';
  };

  if (loading && expenses.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Expenses
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setShowFilters(!showFilters)}
            sx={{ mr: 1 }}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            component={RouterLink}
            to="/expenses/add"
          >
            Add Expense
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

{/* Modified Pie Chart Section */}
{expenseStats && expenseStats.byCategory && expenseStats.byCategory.length > 0 && (
  <Paper sx={{ p: 2, mb: 3 }}>
    <Box sx={{ 
      position: 'relative',
      borderBottom: 1, 
      borderColor: 'divider', 
      mb: 2,
      pb: 1
    }}>
      {/* Title on the left */}
      <Typography 
        component="h2" 
        variant="h6" 
        color="text.primary"
        sx={{ 
          position: 'absolute',
          left: 0,
          top: 'calc(50% - 3px)', // Adjusted to move title slightly higher
          transform: 'translateY(-50%)',
          fontSize: '1.1rem'
        }}
      >
        Expenses by Category
      </Typography>
      
      {/* Tabs centered in the container */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center',
        width: '100%'
      }}>
        <Tabs value={timeRange} onChange={handleTimeRangeChange}>
          <Tab label="Week" value="week" />
          <Tab label="Month" value="month" />
          <Tab label="Year" value="year" />
        </Tabs>
      </Box>
    </Box>
    
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box sx={{ width: '100%', maxWidth: '600px' }}>
        <Box sx={{ height: 300, position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <Box sx={{ width: '100%', maxWidth: '500px', height: '100%' }}>
            <Pie 
              data={preparePieChartData()} 
              options={{ 
                maintainAspectRatio: false,
                responsive: true,
                plugins: {
                  legend: {
                    position: 'right',
                    labels: {
                      // Make legend text use theme color for dark mode compatibility
                      color: theme.palette.text.primary
                    }
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        return `${label}: $${value.toFixed(2)}`;
                      }
                    }
                  }
                }
              }} 
            />
          </Box>
        </Box>
      </Box>
    </Box>
  </Paper>
)}
      {showFilters && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Start Date"
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="End Date"
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  label="Category"
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {Array.isArray(categories) && categories.map(category => (
                    <MenuItem key={category._id} value={category._id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Search"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                fullWidth
                InputProps={{
                  endAdornment: (
                    <SearchIcon color="action" />
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Min Amount"
                type="number"
                name="minAmount"
                value={filters.minAmount}
                onChange={handleFilterChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Max Amount"
                type="number"
                name="maxAmount"
                value={filters.maxAmount}
                onChange={handleFilterChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={12} md={6}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="center">Info</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No expenses found. Add your first expense!
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map(expense => (
                  <TableRow key={expense._id}>
                    <TableCell>
                      {format(new Date(expense.date), 'MMM dd, yyyy')}
                      {expense.isRecurring && (
                        <Chip
                          icon={<RepeatIcon />}
                          label={expense.recurringFrequency.charAt(0).toUpperCase() + expense.recurringFrequency.slice(1)}
                          size="small"
                          color="secondary"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell>
                      <Chip 
                        label={expense.category ? expense.category.name : 'Unknown'} 
                        size="small"
                        sx={{ 
                          backgroundColor: expense.category ? expense.category.color : '#ccc',
                          // Use theme.palette.text.primary for text color to support dark mode
                          color: theme.palette.text.primary,
                          fontWeight: 'medium'
                        }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'error.main', fontWeight: 'medium' }}>
                      {`-$${Math.abs(expense.amount).toFixed(2)}`}
                    </TableCell>
                    <TableCell align="center" sx={{ display: 'flex', justifyContent: 'center' }}>
                      <IconButton
                        component={RouterLink}
                        to={`/expenses/${expense._id}`}
                        size="small"
                      >
                        <SearchIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Divider />
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={pagination.total}
          rowsPerPage={pagination.limit}
          page={pagination.page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Container>
  );
};

export default ExpenseList;