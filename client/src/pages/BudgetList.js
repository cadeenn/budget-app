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
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Visibility as VisibilityIcon,
  AccountBalance as BudgetIcon
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
} from 'recharts';

const BudgetList = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    page: 0,
    limit: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    isActive: '',
    category: '',
    period: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);

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

  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        setLoading(true);
        setError(null);
    
        const params = {
          page: pagination.page + 1,
          limit: pagination.limit,
          sort: '-createdAt'
        };
    
        // Add filters if provided
        if (filters.isActive) params.isActive = filters.isActive;
        if (filters.category) params.category = filters.category;
        if (filters.period) params.period = filters.period;
        if (filters.search) params.search = filters.search;
    
        const response = await axios.get('/api/budgets', { params });
        
        // Check if budgets have progress data, if not, fetch it
        let budgetsWithProgress = response.data.budgets;
        
        // If budgets don't have progress data, fetch it separately
        if (budgetsWithProgress.length > 0 && !budgetsWithProgress[0].progress) {
          const progressPromises = budgetsWithProgress.map(async (budget) => {
            try {
              const progressResponse = await axios.get(`/api/budgets/${budget._id}/progress`);
              return {
                ...budget,
                progress: {
                  percentageSpent: progressResponse.data.progress.percentageSpent,
                  totalSpent: progressResponse.data.progress.totalSpent,
                  remaining: progressResponse.data.progress.remaining,
                  isOverBudget: progressResponse.data.progress.isOverBudget
                }
              };
            } catch (err) {
              console.error(`Error fetching progress for budget ${budget._id}:`, err);
              return {
                ...budget,
                progress: { percentageSpent: 0, totalSpent: 0, remaining: budget.amount, isOverBudget: false }
              };
            }
          });
          
          budgetsWithProgress = await Promise.all(progressPromises);
        }
        
        setBudgets(budgetsWithProgress);
        setPagination({
          ...pagination,
          total: response.data.pagination.total
        });
      } catch (err) {
        console.error('Error fetching budgets:', err);
        setError('Failed to load budgets. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBudgets();
  }, [pagination.page, pagination.limit, filters]);

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
      isActive: '',
      category: '',
      period: '',
      search: ''
    });
    setPagination({
      ...pagination,
      page: 0
    });
  };

  const handleDeleteBudget = async (id) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      try {
        await axios.delete(`/api/budgets/${id}`);
        setBudgets(budgets.filter(budget => budget._id !== id));
        setPagination({
          ...pagination,
          total: pagination.total - 1
        });
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

  if (loading && budgets.length === 0) {
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
          Budgets
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
            to="/budgets/add"
          >
            Add Budget
          </Button>
        </Box>
      </Box>

      {/* Budget Usage Overview Chart */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Budget Usage Overview
        </Typography>
        {budgets.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(300, budgets.length * 50)}>
            <BarChart
              layout="vertical"
              data={budgets.map(budget => ({
                name: budget.name,
                spent: budget.progress ? Math.min(budget.progress.percentageSpent || 0, 100) : 0,
                remaining: budget.progress ? Math.max(0, 100 - (budget.progress.percentageSpent || 0)) : 100
              }))}
              margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
            >
              <XAxis type="number" domain={[0, 100]} unit="%" />
              <YAxis dataKey="name" type="category" width={120} />
              <Tooltip 
                formatter={(value) => `${value.toFixed(1)}%`}
                labelFormatter={(name) => `Budget: ${name}`}
              />
              <Legend />
              <Bar dataKey="remaining" stackId="a" fill="#4caf50" name="Remaining" />
              <Bar dataKey="spent" stackId="a" fill="#f44336" name="Spent" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="textSecondary">
              No budget data available to display
            </Typography>
          </Box>
        )}
      </Paper>








      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {showFilters && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="isActive"
                  value={filters.isActive}
                  onChange={handleFilterChange}
                  label="Status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="true">Active</MenuItem>
                  <MenuItem value="false">Inactive</MenuItem>
                </Select>
              </FormControl>
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
                  {categories.map(category => (
                    <MenuItem key={category._id} value={category._id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Period</InputLabel>
                <Select
                  name="period"
                  value={filters.period}
                  onChange={handleFilterChange}
                  label="Period"
                >
                  <MenuItem value="">All Periods</MenuItem>
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="yearly">Yearly</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
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
            <Grid item xs={12}>
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
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Period</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {budgets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No budgets found. Create your first budget!
                  </TableCell>
                </TableRow>
              ) : (
                budgets.map(budget => (
                  <TableRow key={budget._id}>
                    <TableCell>{budget.name}</TableCell>
                    <TableCell>
                      {budget.category ? (
                        <Chip 
                          label={budget.category.name} 
                          size="small"
                          style={{ 
                            backgroundColor: budget.category.color,
                            color: '#fff'
                          }}
                        />
                      ) : (
                        'All Categories'
                      )}
                    </TableCell>
                    <TableCell>{getPeriodLabel(budget.period)}</TableCell>
                    <TableCell>
                      {format(new Date(budget.startDate), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell align="right">
                      ${budget.amount.toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ width: '15%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={Math.min(budget.progress?.percentageSpent || 0, 100)} 
                            color={getProgressColor(budget.progress?.percentageSpent || 0)}
                          />
                        </Box>
                        <Box sx={{ minWidth: 35 }}>
                          <Typography variant="body2" color="text.secondary">
                            {Math.round(budget.progress?.percentageSpent || 0)}%
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={budget.isActive ? 'Active' : 'Inactive'} 
                        color={budget.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        component={RouterLink}
                        to={`/budgets/${budget._id}`}
                        size="small"
                        sx={{ mr: 1 }}
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton
                        component={RouterLink}
                        to={`/budgets/${budget._id}/edit`}
                        size="small"
                        color="primary"
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeleteBudget(budget._id)}
                        size="small"
                        color="error"
                      >
                        <DeleteIcon />
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

export default BudgetList; 