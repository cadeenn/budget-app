import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useNavigation } from '@react-navigation/native';

const DashboardScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { 
    expenses, 
    incomes, 
    budgets, 
    isLoading, 
    error, 
    refresh, 
    lastRefresh 
  } = useData();
  const [refreshing, setRefreshing] = useState(false);
  const [localLastRefresh, setLocalLastRefresh] = useState(null);
  
  // If context lastRefresh updates, update local state
  useEffect(() => {
    console.log('Last refresh timestamp from context:', lastRefresh);
    if (lastRefresh) {
      setLocalLastRefresh(lastRefresh);
    }
  }, [lastRefresh]);

  // Format date for display
  const formatLastUpdated = () => {
    console.log('Formatting last updated with timestamp:', localLastRefresh || lastRefresh);
    if (!localLastRefresh && !lastRefresh) return 'Never';
    const timestamp = localLastRefresh || lastRefresh;
    return new Date(timestamp).toLocaleTimeString();
  };
  
  // Handle pull-to-refresh
  const onRefresh = async () => {
    console.log('Starting manual refresh');
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
    console.log('Manual refresh completed');
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return `$${Number(amount).toFixed(2)}`;
  };
  
  // Calculate total expenses
  const calculateTotalExpenses = () => {
    if (!Array.isArray(expenses)) return 0;
    return expenses.reduce((sum, expense) => {
      const amount = typeof expense.amount === 'number' 
        ? expense.amount 
        : expense.amount?.value || 0;
      return sum + Number(amount);
    }, 0);
  };
  
  // Calculate total incomes
  const calculateTotalIncomes = () => {
    if (!Array.isArray(incomes)) return 0;
    return incomes.reduce((sum, income) => {
      const amount = typeof income.amount === 'number' 
        ? income.amount 
        : income.amount?.value || 0;
      return sum + Number(amount);
    }, 0);
  };
  
  // Get recent transactions (combine expenses and incomes, sort by date)
  const getRecentTransactions = () => {
    if (!Array.isArray(expenses) || !Array.isArray(incomes)) {
      return [];
    }
    
    // Map expenses with safe accessors for nested values
    const expenseItems = expenses.map(e => {
      // Get the category name, handling both string and object formats
      const categoryName = typeof e.category === 'string' 
        ? e.category 
        : e.category?.name || 'Uncategorized';
      
      return {
        _id: e._id || `exp-${Math.random()}`,
        type: 'expense',
        amount: Number(e.amount) || 0,
        date: e.date || new Date().toISOString(),
        description: e.description || 'Unnamed expense',
        category: categoryName
      };
    });
    
    // Map incomes with safe accessors
    const incomeItems = incomes.map(i => {
      return {
        _id: i._id || `inc-${Math.random()}`,
        type: 'income',
        amount: Number(i.amount) || 0,
        date: i.date || new Date().toISOString(),
        description: i.source || 'Unnamed income',
      };
    });
    
    // Combine, sort by date, and get most recent
    return [...expenseItems, ...incomeItems]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  };
  
  // Format date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Navigate to other screens
  const navigateToExpenses = () => {
    navigation.navigate('Expenses');
  };

  const navigateToIncomes = () => {
    navigation.navigate('Incomes');
  };

  const navigateToBudgets = () => {
    navigation.navigate('Budgets');
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5064E3" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  const totalExpenses = calculateTotalExpenses();
  const totalIncomes = calculateTotalIncomes();
  const balance = totalIncomes - totalExpenses;
  const recentTransactions = getRecentTransactions();

  return (
    <ScrollView 
      style={styles.container} 
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user?.name || 'User'}</Text>
        <Text style={styles.subtitle}>Here's your financial summary</Text>
        <View style={styles.lastUpdatedContainer}>
          <Text style={styles.lastUpdated}>Last updated: {formatLastUpdated()}</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={refresh}>
            <Text style={styles.refreshButtonText}>Refresh Data</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, styles.balanceCard]}>
          <Text style={styles.summaryLabel}>Current Balance</Text>
          <Text style={[styles.summaryValue, balance < 0 ? styles.negative : styles.positive]}>
            {formatCurrency(balance)}
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, styles.incomeCard]}>
            <Text style={styles.summaryLabel}>Income</Text>
            <Text style={[styles.summaryValue, styles.positive]}>
              {formatCurrency(totalIncomes)}
            </Text>
          </View>
          
          <View style={[styles.summaryCard, styles.expenseCard]}>
            <Text style={styles.summaryLabel}>Expenses</Text>
            <Text style={[styles.summaryValue, styles.negative]}>
              {formatCurrency(totalExpenses)}
            </Text>
          </View>
        </View>
      </View>
      
      {/* Recent Transactions */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <TouchableOpacity onPress={navigateToExpenses}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={navigateToExpenses}>
            <Text style={styles.seeAllButton}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {recentTransactions.length > 0 ? (
          recentTransactions.map((transaction, index) => (
            <View key={transaction._id || `transaction-${index}`} style={styles.transactionItem}>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionTitle}>{transaction.description}</Text>
                {transaction.category && (
                  <Text style={styles.transactionCategory}>{transaction.category}</Text>
                )}
                <Text style={styles.transactionDate}>{formatDate(transaction.date)}</Text>
              </View>
              <Text 
                style={[
                  styles.transactionAmount,
                  transaction.type === 'expense' ? styles.negative : styles.positive
                ]}
              >
                {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No recent transactions found</Text>
        )}
      </View>
      
      {/* Budget Status */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <TouchableOpacity onPress={navigateToBudgets}>
            <Text style={styles.sectionTitle}>Budget Status</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={navigateToBudgets}>
            <Text style={styles.seeAllButton}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {Array.isArray(budgets) && budgets.length > 0 ? (
          budgets.slice(0, 3).map((budget, index) => {
            // Get category name, handling both string values and object references
            const categoryName = typeof budget.category === 'string' 
              ? budget.category 
              : budget.category?.name || 'Uncategorized';
              
            // Get category ID for filtering expenses
            const categoryId = typeof budget.category === 'string'
              ? budget.category
              : budget.category?._id || budget.category;
            
            // Get the budget name or use category name as fallback
            const budgetName = budget.name || categoryName;
            
            // Safely calculate spent amount
            const spent = Array.isArray(expenses)
              ? expenses
                  .filter(e => {
                    // Check if expense category matches budget category, handling different formats
                    const expenseCategoryId = typeof e.category === 'string'
                      ? e.category
                      : e.category?._id;
                      
                    return expenseCategoryId === categoryId;
                  })
                  .reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
              : 0;
            
            const budgetAmount = Number(budget.amount) || 1; // Prevent division by zero
            const percentage = Math.min((spent / budgetAmount) * 100, 100);
            
            return (
              <View key={budget._id || `budget-${index}`} style={styles.budgetItem}>
                <View style={styles.budgetInfo}>
                  <View>
                    <Text style={styles.budgetTitle}>{budgetName}</Text>
                    <Text style={styles.budgetCategory}>{categoryName}</Text>
                  </View>
                  <Text style={styles.budgetSubtitle}>
                    {formatCurrency(spent)} of {formatCurrency(budgetAmount)}
                  </Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar, 
                      {
                        width: `${percentage}%`,
                        backgroundColor: percentage > 90 ? '#E74C3C' : percentage > 75 ? '#F39C12' : '#2ECC71'
                      }
                    ]} 
                  />
                </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.emptyText}>No budgets set up yet</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    padding: 20,
    backgroundColor: '#FFEEEE',
    borderRadius: 8,
    margin: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#E74C3C',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#E74C3C',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  header: {
    padding: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  lastUpdatedContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  summaryContainer: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  balanceCard: {
    backgroundColor: '#F8FAFF',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  incomeCard: {
    flex: 1,
    marginRight: 6,
  },
  expenseCard: {
    flex: 1,
    marginLeft: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  positive: {
    color: '#2ECC71',
  },
  negative: {
    color: '#E74C3C',
  },
  sectionContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllButton: {
    color: '#5064E3',
    fontSize: 14,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    color: '#333',
  },
  transactionCategory: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: 20,
  },
  budgetItem: {
    marginBottom: 16,
  },
  budgetInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetTitle: {
    fontSize: 16,
    color: '#333',
  },
  budgetSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  budgetCategory: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
  refreshButton: {
    backgroundColor: '#5064E3',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default DashboardScreen; 