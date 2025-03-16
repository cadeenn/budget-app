import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { CssBaseline, Box, Typography, Container, Button, Stack, CircularProgress } from '@mui/material';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import ExpenseList from './pages/ExpenseList';
import AddExpense from './pages/AddExpense';
import ExpenseDetail from './pages/ExpenseDetail';
import EditExpense from './pages/EditExpense';
import IncomeList from './pages/IncomeList';
import AddIncome from './pages/AddIncome';
import IncomeDetail from './pages/IncomeDetail';
import EditIncome from './pages/EditIncome';
import BudgetList from './pages/BudgetList';
import AddBudget from './pages/AddBudget';
import BudgetDetail from './pages/BudgetDetail';
import EditBudget from './pages/EditBudget';
import Settings from './pages/Settings';

// Components
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';

// Context
import { useAuth } from './context/AuthContext';

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <CssBaseline />
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} 
        />
        <Route 
          path="/register" 
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} 
        />
        
        {/* Protected Routes */}
        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/expenses" element={<ExpenseList />} />
            <Route path="/expenses/add" element={<AddExpense />} />
            <Route path="/expenses/:id" element={<ExpenseDetail />} />
            <Route path="/expenses/:id/edit" element={<EditExpense />} />
            <Route path="/incomes" element={<IncomeList />} />
            <Route path="/incomes/add" element={<AddIncome />} />
            <Route path="/incomes/:id" element={<IncomeDetail />} />
            <Route path="/incomes/:id/edit" element={<EditIncome />} />
            <Route path="/budgets" element={<BudgetList />} />
            <Route path="/budgets/add" element={<AddBudget />} />
            <Route path="/budgets/:id" element={<BudgetDetail />} />
            <Route path="/budgets/:id/edit" element={<EditBudget />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
        
        {/* Home Route (redirects to dashboard if authenticated) */}
        <Route 
          path="/" 
          element={
            isAuthenticated ? 
            <Navigate to="/dashboard" /> : 
            <Container maxWidth="md" sx={{ mt: 8 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h2" component="h1" gutterBottom>
                  Budget Tracker
                </Typography>
                <Typography variant="h5" component="h2" gutterBottom>
                  Welcome to the Budget Tracker App
                </Typography>
                <Typography variant="body1" paragraph>
                  Please login or create a new account to get started.
                </Typography>
                
                <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 4 }}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    component={Link} 
                    to="/login"
                    size="large"
                  >
                    Login
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    component={Link} 
                    to="/register"
                    size="large"
                  >
                    Register
                  </Button>
                </Stack>
              </Box>
            </Container>
          } 
        />
        
        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App; 