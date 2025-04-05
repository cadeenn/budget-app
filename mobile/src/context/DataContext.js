import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { expensesAPI, incomesAPI, budgetsAPI, categoriesAPI } from '../services/api';
import { useAuth } from './AuthContext';

// Create the context
const DataContext = createContext();

// Provider component
export const DataProvider = ({ children }) => {
  const { userToken } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  // Fetch all data from different endpoints
  const fetchAllData = useCallback(async () => {
    if (!userToken) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching data with token:', userToken ? 'Valid token exists' : 'No token');
      
      // Fetch data in parallel for better performance
      const [expensesRes, incomesRes, budgetsRes, categoriesRes] = await Promise.all([
        expensesAPI.getAll(),
        incomesAPI.getAll(),
        budgetsAPI.getAll(),
        categoriesAPI.getAll()
      ]);
      
      console.log('Data fetched successfully:',
        `Expenses: ${expensesRes?.data?.expenses?.length || 0}`,
        `Incomes: ${incomesRes?.data?.incomes?.length || 0}`,
        `Budgets: ${budgetsRes?.data?.budgets?.length || 0}`,
        `Categories: ${categoriesRes?.data?.categories?.length || 0}`
      );
      
      // Handle nested response format (data inside "expenses", "incomes", etc.)
      setExpenses(expensesRes?.data?.expenses || []);
      setIncomes(incomesRes?.data?.incomes || []);
      setBudgets(budgetsRes?.data?.budgets || []);
      setCategories(categoriesRes?.data?.categories || []);
      
      // Update last refresh timestamp
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [userToken]);
  
  // Load data when token changes (user logs in)
  useEffect(() => {
    if (userToken) {
      console.log('Token changed, fetching new data');
      fetchAllData();
    } else {
      // Clear data when logged out
      console.log('No token, clearing data');
      setExpenses([]);
      setIncomes([]);
      setBudgets([]);
      setCategories([]);
      setIsLoading(false);
      setLastRefresh(null);
    }
  }, [userToken, fetchAllData]);
  
  // Functions to add, update, and delete items
  
  // Expenses
  const addExpense = async (expenseData) => {
    try {
      await expensesAPI.create(expenseData);
      await fetchAllData(); // Refresh data
      return true;
    } catch (err) {
      setError('Failed to add expense');
      return false;
    }
  };
  
  const updateExpense = async (id, expenseData) => {
    try {
      await expensesAPI.update(id, expenseData);
      await fetchAllData(); // Refresh data
      return true;
    } catch (err) {
      setError('Failed to update expense');
      return false;
    }
  };
  
  const deleteExpense = async (id) => {
    try {
      await expensesAPI.delete(id);
      await fetchAllData(); // Refresh data
      return true;
    } catch (err) {
      setError('Failed to delete expense');
      return false;
    }
  };
  
  // Incomes
  const addIncome = async (incomeData) => {
    try {
      await incomesAPI.create(incomeData);
      await fetchAllData(); // Refresh data
      return true;
    } catch (err) {
      setError('Failed to add income');
      return false;
    }
  };
  
  const updateIncome = async (id, incomeData) => {
    try {
      await incomesAPI.update(id, incomeData);
      await fetchAllData(); // Refresh data
      return true;
    } catch (err) {
      setError('Failed to update income');
      return false;
    }
  };
  
  const deleteIncome = async (id) => {
    try {
      await incomesAPI.delete(id);
      await fetchAllData(); // Refresh data
      return true;
    } catch (err) {
      setError('Failed to delete income');
      return false;
    }
  };
  
  // Budgets
  const addBudget = async (budgetData) => {
    try {
      await budgetsAPI.create(budgetData);
      await fetchAllData(); // Refresh data
      return true;
    } catch (err) {
      setError('Failed to add budget');
      return false;
    }
  };
  
  const updateBudget = async (id, budgetData) => {
    try {
      await budgetsAPI.update(id, budgetData);
      await fetchAllData(); // Refresh data
      return true;
    } catch (err) {
      setError('Failed to update budget');
      return false;
    }
  };
  
  const deleteBudget = async (id) => {
    try {
      await budgetsAPI.delete(id);
      await fetchAllData(); // Refresh data
      return true;
    } catch (err) {
      setError('Failed to delete budget');
      return false;
    }
  };
  
  return (
    <DataContext.Provider
      value={{
        expenses,
        incomes,
        budgets,
        categories,
        isLoading,
        error,
        lastRefresh,
        refresh: fetchAllData,
        addExpense,
        updateExpense,
        deleteExpense,
        addIncome,
        updateIncome,
        deleteIncome,
        addBudget,
        updateBudget,
        deleteBudget
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

// Custom hook for using this context
export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}; 