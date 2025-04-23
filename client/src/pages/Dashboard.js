import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Container,
  ListItemAvatar,
  Avatar,
  Menu,
  Tab,
  Tabs,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowForward as ArrowForwardIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  AccountBalance as BudgetIcon,
  Wallet as WalletIcon,
  MoreVert as MoreIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Restaurant as FoodIcon,
  DirectionsCar as TransportIcon,
  Home as HomeIcon,
  Movie as EntertainmentIcon,
  ShoppingCart as ShoppingIcon,
  Repeat as RepeatIcon
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  BarElement
} from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';
import axios from 'axios';
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  startOfYear, 
  endOfYear,   
  parseISO, 
  isWithinInterval, 
  differenceInDays, 
  addWeeks, 
  addMonths, 
  addYears, 
  addDays,  
  max       
} from 'date-fns';



// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title
);

const calculatePredictedIncome = (incomes, rangeStartDate, rangeEndDate) => {
  let predictedIncome = 0;
  // Ensure rangeStartDate and rangeEndDate are Date objects
  const interval = {
     start: rangeStartDate instanceof Date ? rangeStartDate : parseISO(rangeStartDate),
     end: rangeEndDate instanceof Date ? rangeEndDate : parseISO(rangeEndDate)
  };

  incomes.forEach(income => {
    // Ensure income object and date exist
    if (!income || !income.date) {
        console.warn('Skipping income with missing data:', income);
        return;
    }
    // Ensure date is parsed correctly
    let incomeStartDate;
     try {
         incomeStartDate = parseISO(income.date);
         // Basic check if parseISO returned a valid date
         if (isNaN(incomeStartDate.getTime())) throw new Error('Invalid date');
    } catch (e) {
        console.warn(`Skipping income with invalid date format: ${income.date}`, income);
         return;
     }


    if (!income.isRecurring) {
      // Non-recurring: Add if its specific date falls within the range
      if (isWithinInterval(incomeStartDate, interval)) {
        predictedIncome += income.amount;
      }
    } else {
      // Recurring income: Calculate occurrences within the range [rangeStartDate, rangeEndDate]
      let occurrenceDate = incomeStartDate;

      // Determine the correct calculation based on frequency
      switch (income.recurringFrequency) {
        case 'daily': {
            const effectiveStartDate = max([occurrenceDate, interval.start]);
            if (effectiveStartDate <= interval.end) {
                const daysCount = differenceInDays(interval.end, effectiveStartDate) + 1;
                if (daysCount > 0) {
                    predictedIncome += daysCount * income.amount;
                }
             }
            break;
        }
        case 'weekly': {
             let currentOccurrence = occurrenceDate;
             while (currentOccurrence < interval.start) {
                 currentOccurrence = addWeeks(currentOccurrence, 1);
             }
             while (currentOccurrence <= interval.end) {
                 if (currentOccurrence >= incomeStartDate) {
                     predictedIncome += income.amount;
                 }
                 currentOccurrence = addWeeks(currentOccurrence, 1);
             }
            break;
        }
        case 'monthly': {
             let currentOccurrence = occurrenceDate;
             while (currentOccurrence < interval.start) {
                currentOccurrence = addMonths(currentOccurrence, 1);
            }
            while (currentOccurrence <= interval.end) {
                 if (currentOccurrence >= incomeStartDate) {
                    predictedIncome += income.amount;
                 }
                 currentOccurrence = addMonths(currentOccurrence, 1);
            }
          break;
        }
        case 'yearly': {
            let currentOccurrence = occurrenceDate;
             while (currentOccurrence < interval.start) {
                currentOccurrence = addYears(currentOccurrence, 1);
            }
            while (currentOccurrence <= interval.end) {
                 if (currentOccurrence >= incomeStartDate) {
                    predictedIncome += income.amount;
                 }
                currentOccurrence = addYears(currentOccurrence, 1);
            }
          break;
        }
        default:
            console.warn(`Unknown recurring frequency: ${income.recurringFrequency} for income ID: ${income._id}`);
          break;
      }
    }
  });

  return predictedIncome;
};


const Dashboard = () => {
  // Removed useAuth reference if present
  // const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expenseStats, setExpenseStats] = useState(null);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [recentIncomes, setRecentIncomes] = useState([]);
  const [allIncomes, setAllIncomes] = useState([]);
  const [timeRange, setTimeRange] = useState('month');
  const [anchorEl, setAnchorEl] = useState(null);
  const [summaryData, setSummaryData] = useState({
    balance: 0,
    income: 0,
    expenses: 0
  });
  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        let rangeStartDate, rangeEndDate;
        const now = new Date();

        switch (timeRange) {
          case 'week':
            rangeStartDate = subDays(now, 6);
            rangeEndDate = now;
            rangeStartDate.setHours(0, 0, 0, 0);
            rangeEndDate.setHours(23, 59, 59, 999); 
            break;
          case 'month':
            rangeStartDate = startOfMonth(now);
            rangeEndDate = endOfMonth(now);
            rangeEndDate.setHours(23, 59, 59, 999); 
            break;
          case 'year':
            rangeStartDate = startOfYear(now);
            rangeEndDate = endOfYear(now);
            rangeEndDate.setHours(23, 59, 59, 999); 
            break;
          default:
            rangeStartDate = startOfMonth(now);
            rangeEndDate = endOfMonth(now);
            rangeEndDate.setHours(23, 59, 59, 999);
        }

        const formattedStartDate = format(rangeStartDate, 'yyyy-MM-dd');
        const formattedEndDate = format(rangeEndDate, 'yyyy-MM-dd');

        // Fetch expense statistics for the calculated range
        console.log(`Fetching expense stats for ${timeRange}: ${formattedStartDate} to ${formattedEndDate}`);
        const statsResponse = await axios.get('/api/expenses/stats', {
          params: { startDate: formattedStartDate, endDate: formattedEndDate }
        });
        console.log('Expense stats response:', statsResponse.data);

        console.log('Fetching all incomes...');
        const allIncomesResponse = await axios.get('/api/incomes');
        const fetchedIncomes = allIncomesResponse.data.incomes || [];
        setAllIncomes(fetchedIncomes);
        console.log(`Fetched ${fetchedIncomes.length} total income records.`);


        // Fetch recent expenses for the list display
        const recentExpensesResponse = await axios.get('/api/expenses', {
          params: { limit: 5, sort: '-date' }
        });

        // Fetch recent incomes for the list display
        const recentIncomesResponse = await axios.get('/api/incomes', {
          params: { limit: 5, sort: '-date' }
        });

        setExpenseStats(statsResponse.data);
        setRecentExpenses(recentExpensesResponse.data.expenses || []);
        setRecentIncomes(recentIncomesResponse.data.incomes || []);

        console.log('Calculating predicted income...');
        // Pass fetched incomes and DATE OBJECTS to the calculation function
        const predictedIncome = calculatePredictedIncome(fetchedIncomes, rangeStartDate, rangeEndDate);
        console.log(`Predicted Income for ${timeRange}: ${predictedIncome.toFixed(2)}`);

        // Calculate totals for summary data
        const totalIncome = recentIncomesResponse.data.incomes.reduce(
          (sum, income) => sum + income.amount, 
          0
        );

        // Get total expenses for the period from stats
        const totalExpenses = statsResponse.data.total || 0;

        setSummaryData({
          balance: totalIncome - totalExpenses,
          income: predictedIncome,
          expenses: totalExpenses
        });

        // Combine and sort recent transactions for the list
        const combinedTransactions = [
          ...(recentExpensesResponse.data.expenses || []).map(expense => ({
            ...expense,
            type: 'expense',
            amount: -Math.abs(expense.amount)
          })),
          ...(recentIncomesResponse.data.incomes || []).map(income => ({
            ...income,
            type: 'income',
            source: income.source || 'Income',
            category: { name: income.source || 'Income' }
          }))
        ].sort((a, b) => {
            // Safer date sorting using parseISO
            const dateA = a.date ? parseISO(a.date) : new Date(0);
            const dateB = b.date ? parseISO(b.date) : new Date(0);
            // Check for invalid dates after parsing
            if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
                console.warn("Invalid date found during sorting:", a, b);
                return 0;
            }
            return dateB - dateA;
        }).slice(0, 5);

        setRecentTransactions(combinedTransactions);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
         if (err.response) {
             console.error("API Error Response:", err.response.data);
             setError(`Failed to load dashboard data (Status: ${err.response.status}). Please check API endpoints and parameters.`);
         } else if (err.request) {
             console.error("API No Response:", err.request);
             setError('Failed to load dashboard data. Server might be unreachable.');
         } else {
             console.error("Setup Error:", err.message);
             setError(`Failed to load dashboard data. An error occurred: ${err.message}`);
         }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [timeRange]);

  /// Prepare chart data
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
            borderWidth: 1
          }
        ]
      };
    };
    
    const prepareLineChartData = () => {
      if (!expenseStats || !expenseStats.byDate) {
        return {
          labels: [],
          datasets: [
            {
              label: 'Daily Expenses',
              data: [],
              borderColor: 'rgb(75, 192, 192)',
              tension: 0.1
            }
          ]
        };
      }
      
      // For week view, ensure we have data for all 7 days
      if (timeRange === 'week') {
        const now = new Date();
        const labels = [];
        const data = [];
        const dateMap = {};
        
        // First, create a mapping of formatted dates to their expense values
        expenseStats.byDate.forEach(item => {
          // Store the expense data with the date as the key
          dateMap[item._id] = item.total;
          console.log(`Found expense for date ${item._id}: $${item.total}`);
        });
        
        // Create array of last 7 days
        for (let i = 6; i >= 0; i--) {
          const date = subDays(now, i);
          const formattedDate = format(date, 'yyyy-MM-dd');
          const dayLabel = format(date, 'EEE dd');
          
          labels.push(dayLabel);
          
          // Get expense value from map or use 0
          const expenseValue = dateMap[formattedDate] || 0;
          data.push(expenseValue);
          
          console.log(`Day ${dayLabel} (${formattedDate}): $${expenseValue}`);
        }
        
        // Special check for today's expenses
        const todayFormatted = format(now, 'yyyy-MM-dd');
        if (dateMap[todayFormatted]) {
          console.log(`Ensuring today's expenses (${todayFormatted}) are included: $${dateMap[todayFormatted]}`);
          // Make sure today's expenses are in the last position of the data array
          data[data.length - 1] = dateMap[todayFormatted];
        }
        
        // Log for debugging
        console.log('Week data:', { 
          dates: labels, 
          values: data,
          dateMap,
          rawExpenseData: expenseStats.byDate
        });
        
        return {
          labels,
          datasets: [
            {
              label: 'Daily Expenses',
              data,
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              tension: 0.1
            }
          ]
        };
      }
      
      // For month view, ensure we have data for all days of the month
      if (timeRange === 'month') {
        const now = new Date();
        const firstDay = startOfMonth(now);
        const lastDay = endOfMonth(now);
        const daysInMonth = lastDay.getDate();
        
        const labels = [];
        const data = [];
        
        // Create array for all days in the month
        for (let i = 1; i <= daysInMonth; i++) {
          const date = new Date(now.getFullYear(), now.getMonth(), i);
          const formattedDate = format(date, 'yyyy-MM-dd');
          const dayLabel = format(date, 'MMM dd');
          
          labels.push(dayLabel);
          
          // Find matching expense data or use 0
          const expenseForDay = expenseStats.byDate.find(item => item._id === formattedDate);
          data.push(expenseForDay ? expenseForDay.total : 0);
        }
        
        return {
          labels,
          datasets: [
            {
              label: 'Daily Expenses',
              data,
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              tension: 0.1
            }
          ]
        };
      }
      
      // For year view, use the data as is or aggregate by month
      if (timeRange === 'year') {
        // Group data by month
        const monthlyData = {};
        const now = new Date();
        const currentYear = now.getFullYear();
        
        // Initialize all months with zero
        for (let i = 0; i < 12; i++) {
          const monthLabel = format(new Date(currentYear, i, 1), 'MMM');
          monthlyData[monthLabel] = 0;
        }
        
        // Sum up expenses for each month
        expenseStats.byDate.forEach(item => {
          const date = new Date(item._id);
          if (date.getFullYear() === currentYear) {
            const monthLabel = format(date, 'MMM');
            monthlyData[monthLabel] += item.total;
          }
        });
        
        const labels = Object.keys(monthlyData);
        const data = Object.values(monthlyData);
        
        return {
          labels,
          datasets: [
            {
              label: 'Monthly Expenses',
              data,
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              tension: 0.1
            }
          ]
        };
      }
      
      // Fallback to raw data
      return {
        labels: expenseStats.byDate.map(item => format(new Date(item._id), 'MMM dd')),
        datasets: [
          {
            label: 'Daily Expenses',
            data: expenseStats.byDate.map(item => item.total),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.1
          }
        ]
      };
    };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleTimeRangeChange = (event, newValue) => {
     if (newValue !== timeRange) {
        setTimeRange(newValue);
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
       <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
           <Alert severity="error" sx={{ mt: 2 }}>
               {error}
           </Alert>
        </Container>
     );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Page Header */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" component="h1">
              Dashboard
            </Typography>
            <Box>
              <IconButton onClick={handleMenuClick}>
                <MoreIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={handleMenuClose}>Refresh Data</MenuItem>
                <MenuItem onClick={handleMenuClose}>Export Report</MenuItem>
              </Menu>
            </Box>
          </Box>
          <Divider />
        </Grid>

        {/* Summary Cards */}
        {/* Balance Card */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 120,
              bgcolor: '#f5f5f5',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ position: 'absolute', top: -15, right: -15, opacity: 0.1 }}>
              <WalletIcon sx={{ fontSize: 100 }} />
            </Box>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              {/* Title */}
              Current Balance
            </Typography>
            <Typography component="p" variant="h4">
              {/* Display calculated balance */}
              ${summaryData.balance.toFixed(2)}
            </Typography>
            <Typography color="text.secondary" sx={{ flex: 1 }}>
              {/* caption */}
              as of {format(new Date(), 'MMMM dd, yyyy')}
            </Typography>
          </Paper>
        </Grid>

        {/* Income Card */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 120,
              bgcolor: '#e8f5e9',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ position: 'absolute', top: -15, right: -15, opacity: 0.1 }}>
              <IncomeIcon sx={{ fontSize: 100 }} />
            </Box>
            {/* Title */}
            <Typography component="h2" variant="h6" color="success.main" gutterBottom>
              Income
            </Typography>
            {/* Display predicted income from summaryData */}
            <Typography component="p" variant="h4">
              ${summaryData.income.toFixed(2)}
            </Typography>
            {/*  */}
            <Typography color="text.secondary" sx={{ flex: 1 }}>
                
            </Typography>
          </Paper>
        </Grid>

         {/* Expenses Card */}
         <Grid item xs={12} md={4}>
           <Paper
             sx={{
               p: 2,
               display: 'flex',
               flexDirection: 'column',
               height: 120,
               bgcolor: '#ffebee',
               position: 'relative',
               overflow: 'hidden',
             }}
           >
             <Box sx={{ position: 'absolute', top: -15, right: -15, opacity: 0.1 }}>
               <ExpenseIcon sx={{ fontSize: 100 }} />
             </Box>
             <Typography component="h2" variant="h6" color="error.main" gutterBottom>
               Expenses
             </Typography>
             <Typography component="p" variant="h4">
               ${summaryData.expenses.toFixed(2)}
             </Typography>
             {/*  */}
             <Typography color="text.secondary" sx={{ flex: 1 }}>
                
             </Typography>
           </Paper>
         </Grid>

        
        {/* Charts */}
        <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={timeRange} onChange={handleTimeRangeChange}>
                <Tab label="Week" value="week" />
                <Tab label="Month" value="month" />
                <Tab label="Year" value="year" />
                </Tabs>
            </Box>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
                Spending Trends
            </Typography>
            <Box sx={{ height: 300, position: 'relative' }}>
                <Line data={prepareLineChartData()} options={{ maintainAspectRatio: false }} />
            </Box>
            </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
                Expenses by Category
            </Typography>
            <Box sx={{ height: 300, position: 'relative' }}>
                <Pie data={preparePieChartData()} options={{ maintainAspectRatio: false }} />
            </Box>
            </Paper>
        </Grid>

        {/* Recent Transactions */}
        <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography component="h2" variant="h6" color="primary">
                Recent Transactions
                </Typography>
                <Button 
                variant="outlined" 
                startIcon={<AddIcon />}
                size="small"
                component={RouterLink}
                to="/expenses/add"
                >
                Add Transaction
                </Button>
            </Box>
            <List>
                {recentTransactions.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                    No recent transactions found.
                </Typography>
                ) : (
                recentTransactions.map((transaction) => (
                    <React.Fragment key={transaction._id}>
                    <ListItem alignItems="flex-start">
                        <ListItemAvatar>
                        <Avatar sx={{ 
                            bgcolor: transaction.type === 'income' ? 'success.main' : 'error.main' 
                        }}>
                            {transaction.type === 'income' ? <IncomeIcon /> : <ExpenseIcon />}
                        </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                        primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography component="span" variant="body1">
                                {transaction.description || transaction.source}
                            </Typography>
                            {transaction.isRecurring && (
                                <Chip
                                icon={<RepeatIcon sx={{ fontSize: '0.75rem' }} />}
                                label={transaction.recurringFrequency.charAt(0).toUpperCase() + transaction.recurringFrequency.slice(1)}
                                size="small"
                                color={transaction.type === 'income' ? 'primary' : 'secondary'}
                                sx={{ ml: 1, height: 20, '& .MuiChip-label': { fontSize: '0.625rem', px: 1 } }}
                                />
                            )}
                            </Box>
                        }
                        secondary={
                            <>
                            <Typography
                                component="span"
                                variant="body2"
                                color="text.primary"
                            >
                                {transaction.type === 'income' ? 'Income' : transaction.category?.name || 'Expense'}
                            </Typography>
                            {" — "}{format(new Date(transaction.date), 'MMM dd, yyyy')}
                            </>
                        }
                        />
                        <Typography
                        variant="body1"
                        sx={{ 
                            fontWeight: 'bold', 
                            color: transaction.type === 'income' ? 'success.main' : 'error.main' 
                        }}
                        >
                        {transaction.amount > 0 ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
                        </Typography>
                    </ListItem>
                    <Divider variant="inset" component="li" />
                    </React.Fragment>
                ))
                )}
            </List>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Button 
                color="primary"
                component={RouterLink}
                to="/expenses"
                >
                View All Transactions
                </Button>
            </Box>
            </Paper>
        </Grid>
        </Grid>
    </Container>
    );
};

export default Dashboard;