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
  Visibility as VisibilityIcon,
  TrendingUp as IncomeIcon
} from '@mui/icons-material';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import axios from 'axios';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { Tabs, Tab } from '@mui/material';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

const IncomeList = () => {
  const { user } = useAuth();
  const theme = useTheme(); // Add theme hook
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [incomes, setIncomes] = useState([]);
  const [timeRange, setTimeRange] = useState('month');
  const [incomeBySource, setIncomeBySource] = useState([]);
  const [pagination, setPagination] = useState({
    page: 0,
    limit: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    source: '',
    minAmount: '',
    maxAmount: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchIncomes = async () => {
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
        if (filters.source) params.source = filters.source;
        if (filters.minAmount) params.minAmount = filters.minAmount;
        if (filters.maxAmount) params.maxAmount = filters.maxAmount;
        if (filters.search) params.search = filters.search;

        const response = await axios.get('/api/incomes', { params });
        
        setIncomes(response.data.incomes);
        setPagination({
          ...pagination,
          total: response.data.pagination.total
        });
      } catch (err) {
        console.error('Error fetching incomes:', err);
        setError('Failed to load income data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchIncomes();
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    const fetchIncomeStats = async () => {
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


        const response = await axios.get('/api/incomes/stats', {
          params: { startDate, endDate }
        });
        setIncomeBySource(response.data.bySource || []);
      } catch (err) {
        console.error('Error fetching income stats:', err);
      }
    };

    fetchIncomeStats();
  }, [timeRange]);

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
      source: '',
      minAmount: '',
      maxAmount: '',
      search: ''
    });
    setPagination({
      ...pagination,
      page: 0
    });
  };

  const handleDeleteIncome = async (id) => {
    if (window.confirm('Are you sure you want to delete this income entry?')) {
      try {
        await axios.delete(`/api/incomes/${id}`);
        setIncomes(incomes.filter(income => income._id !== id));
        setPagination({
          ...pagination,
          total: pagination.total - 1
        });
      } catch (err) {
        console.error('Error deleting income:', err);
        alert('Failed to delete income. Please try again.');
      }
    }
  };

  const preparePieChartData = () => {
    const labels = incomeBySource.map(item => item._id);
    const data = incomeBySource.map(item => item.total);
    const backgroundColors = [
      '#FF6384',
      '#36A2EB',
      '#FFCE56',
      '#4BC0C0',
      '#9966FF',
      '#FF9F40'
    ];

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors,
          borderColor: '#fff',
          borderWidth: 1
        }
      ]
    };
  };

  if (loading && incomes.length === 0) {
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
          Income
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
            to="/incomes/add"
            color="success"
          >
            Add Income
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Add Pie Chart with updated legend text color */}
{incomeBySource.length > 0 && (
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
        Income by Source
      </Typography>
      
      {/* Tabs centered in the container */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center',
        width: '100%'
      }}>
        <Tabs value={timeRange} onChange={(_, newValue) => setTimeRange(newValue)}>
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
                      label: function (context) {
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
              <TextField
                label="Source"
                name="source"
                value={filters.source}
                onChange={handleFilterChange}
                fullWidth
              />
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
                <TableCell>Source</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="center">Info</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {incomes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No income entries found. Add your first income!
                  </TableCell>
                </TableRow>
              ) : (
                incomes.map(income => (
                  <TableRow key={income._id}>
                    <TableCell>
                      {format(new Date(income.date), 'MMM dd, yyyy')}
                      {income.isRecurring && (
                        <Chip
                          icon={<RepeatIcon />}
                          label={income.recurringFrequency.charAt(0).toUpperCase() + income.recurringFrequency.slice(1)}
                          size="small"
                          color="primary"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {/* Add a Chip for income source similar to expense category */}
                      <Chip 
                        label={income.source || 'Unknown'} 
                        size="small"
                        sx={{ 
                          backgroundColor: '#4caf50', // Default green for income sources
                          // Use theme.palette.text.primary for text color to support dark mode
                          color: theme.palette.text.primary,
                          fontWeight: 'medium'
                        }}
                      />
                    </TableCell>
                    <TableCell>{income.description}</TableCell>
                    <TableCell align="right" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                    {`+$${Math.abs(income.amount).toFixed(2)}`}
                    </TableCell>
                    <TableCell align="center" sx={{ display: 'flex', justifyContent: 'center' }}>
                      <IconButton
                        component={RouterLink}
                        to={`/incomes/${income._id}`}
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

export default IncomeList;