import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
  Button,
  ActivityIndicator,
  Chip,
  Divider,
  List,
  Avatar,
  FAB,
  Appbar,
  Menu,
  IconButton
} from 'react-native-paper';
import { PieChart, LineChart } from 'react-native-chart-kit';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import axios from 'axios';
import { API_URL } from '../../utils/config';
import { format, subDays, startOfMonth, endOfMonth, parseISO } from 'date-fns';

const screenWidth = Dimensions.get('window').width;

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('month');
  const [menuVisible, setMenuVisible] = useState(false);
  
  // Data states
  const [expenseStats, setExpenseStats] = useState(null);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [recentIncomes, setRecentIncomes] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  
  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);
  
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Calculate date range based on selected time range
      let startDate, endDate;
      const now = new Date();
      
      switch (timeRange) {
        case 'week':
          startDate = format(subDays(now, 7), 'yyyy-MM-dd');
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
      
      // Fetch expense statistics
      const statsResponse = await axios.get(`${API_URL}/api/expenses/stats`, {
        params: { startDate, endDate }
      });
      
      // Fetch recent expenses
      const expensesResponse = await axios.get(`${API_URL}/api/expenses`, {
        params: { limit: 5, sort: '-date' }
      });
      
      // Fetch recent incomes
      const incomesResponse = await axios.get(`${API_URL}/api/incomes`, {
        params: { limit: 5, sort: '-date' }
      });
      
      setExpenseStats(statsResponse.data);
      setRecentExpenses(expensesResponse.data.expenses);
      setRecentIncomes(incomesResponse.data.incomes);
      
      // Calculate totals
      const totalInc = incomesResponse.data.incomes.reduce(
        (sum, income) => sum + income.amount, 
        0
      );
      setTotalIncome(totalInc);
      setTotalBalance(totalInc - statsResponse.data.total);
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };
  
  const preparePieChartData = () => {
    if (!expenseStats || !expenseStats.byCategory || expenseStats.byCategory.length === 0) {
      return {
        labels: ['No Data'],
        data: [1],
        colors: ['#cccccc']
      };
    }
    
    return {
      labels: expenseStats.byCategory.map(item => item.category.name),
      data: expenseStats.byCategory.map(item => item.total),
      colors: expenseStats.byCategory.map(item => item.category.color)
    };
  };
  
  const prepareLineChartData = () => {
    if (!expenseStats || !expenseStats.byDate || expenseStats.byDate.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [
          {
            data: [0],
            color: () => theme.colors.primary,
          }
        ]
      };
    }
    
    return {
      labels: expenseStats.byDate.map(item => format(parseISO(item._id), 'MM/dd')),
      datasets: [
        {
          data: expenseStats.byDate.map(item => item.total),
          color: () => theme.colors.primary,
          strokeWidth: 2
        }
      ]
    };
  };
  
  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 10, color: theme.colors.text }}>Loading dashboard...</Text>
      </View>
    );
  }
  
  const chartConfig = {
    backgroundGradientFrom: isDark ? '#1e1e1e' : '#ffffff',
    backgroundGradientTo: isDark ? '#1e1e1e' : '#ffffff',
    color: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false
  };
  
  const pieChartData = preparePieChartData();
  const lineChartData = prepareLineChartData();
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
        <Appbar.Content title="Dashboard" />
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Appbar.Action 
              icon="calendar-range" 
              onPress={() => setMenuVisible(true)} 
            />
          }
        >
          <Menu.Item 
            onPress={() => { 
              setTimeRange('week'); 
              setMenuVisible(false); 
            }} 
            title="This Week" 
          />
          <Menu.Item 
            onPress={() => { 
              setTimeRange('month'); 
              setMenuVisible(false); 
            }} 
            title="This Month" 
          />
          <Menu.Item 
            onPress={() => { 
              setTimeRange('year'); 
              setMenuVisible(false); 
            }} 
            title="This Year" 
          />
        </Menu>
        <Appbar.Action 
          icon={isDark ? 'brightness-7' : 'brightness-4'} 
          onPress={toggleTheme} 
        />
      </Appbar.Header>
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={styles.welcomeSection}>
          <Text style={[styles.welcomeText, { color: theme.colors.text }]}>
            Welcome back, {user?.name}!
          </Text>
          <Text style={[styles.dateText, { color: theme.colors.text }]}>
            {timeRange === 'week' 
              ? 'This Week' 
              : timeRange === 'month' 
                ? 'This Month' 
                : 'This Year'}
          </Text>
        </View>
        
        {/* Summary Cards */}
        <View style={styles.summaryCards}>
          <Card style={[styles.summaryCard, { backgroundColor: theme.colors.primary }]}>
            <Card.Content>
              <MaterialCommunityIcons name="wallet" size={24} color="#fff" />
              <Title style={styles.cardTitle}>Balance</Title>
              <Paragraph style={styles.cardAmount}>
                ${totalBalance.toFixed(2)}
              </Paragraph>
            </Card.Content>
          </Card>
          
          <Card style={[styles.summaryCard, { backgroundColor: '#E53935' }]}>
            <Card.Content>
              <MaterialCommunityIcons name="cash-minus" size={24} color="#fff" />
              <Title style={styles.cardTitle}>Expenses</Title>
              <Paragraph style={styles.cardAmount}>
                ${expenseStats?.total.toFixed(2) || '0.00'}
              </Paragraph>
            </Card.Content>
          </Card>
          
          <Card style={[styles.summaryCard, { backgroundColor: '#43A047' }]}>
            <Card.Content>
              <MaterialCommunityIcons name="cash-plus" size={24} color="#fff" />
              <Title style={styles.cardTitle}>Income</Title>
              <Paragraph style={styles.cardAmount}>
                ${totalIncome.toFixed(2)}
              </Paragraph>
            </Card.Content>
          </Card>
        </View>
        
        {/* Pie Chart */}
        <Card style={styles.chartCard}>
          <Card.Title title="Expenses by Category" />
          <Card.Content>
            {expenseStats && expenseStats.byCategory && expenseStats.byCategory.length > 0 ? (
              <PieChart
                data={pieChartData.labels.map((label, index) => ({
                  name: label,
                  population: pieChartData.data[index],
                  color: pieChartData.colors[index],
                  legendFontColor: theme.colors.text,
                  legendFontSize: 12,
                }))}
                width={screenWidth - 40}
                height={220}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={{ color: theme.colors.text }}>No expense data available</Text>
              </View>
            )}
          </Card.Content>
        </Card>
        
        {/* Line Chart */}
        <Card style={styles.chartCard}>
          <Card.Title title="Expense Trend" />
          <Card.Content>
            {expenseStats && expenseStats.byDate && expenseStats.byDate.length > 0 ? (
              <LineChart
                data={lineChartData}
                width={screenWidth - 40}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.lineChart}
              />
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={{ color: theme.colors.text }}>No trend data available</Text>
              </View>
            )}
          </Card.Content>
        </Card>
        
        {/* Recent Expenses */}
        <Card style={styles.transactionsCard}>
          <Card.Title 
            title="Recent Expenses" 
            right={(props) => (
              <Button 
                mode="text" 
                onPress={() => navigation.navigate('Expenses')}
              >
                View All
              </Button>
            )}
          />
          <Divider />
          {recentExpenses.length > 0 ? (
            recentExpenses.map((expense) => (
              <List.Item
                key={expense._id}
                title={expense.description}
                description={format(new Date(expense.date), 'MMM dd, yyyy')}
                left={props => (
                  <Avatar.Icon 
                    {...props} 
                    icon={expense.category.icon || 'cash'} 
                    style={{ backgroundColor: expense.category.color }}
                    size={40}
                  />
                )}
                right={props => (
                  <Text style={styles.expenseAmount}>-${expense.amount.toFixed(2)}</Text>
                )}
                onPress={() => navigation.navigate('Expenses', {
                  screen: 'ExpenseDetail',
                  params: { id: expense._id }
                })}
              />
            ))
          ) : (
            <List.Item
              title="No recent expenses"
              description="Add your first expense to see it here"
            />
          )}
        </Card>
        
        {/* Recent Income */}
        <Card style={styles.transactionsCard}>
          <Card.Title 
            title="Recent Income" 
            right={(props) => (
              <Button 
                mode="text" 
                onPress={() => navigation.navigate('Income')}
              >
                View All
              </Button>
            )}
          />
          <Divider />
          {recentIncomes.length > 0 ? (
            recentIncomes.map((income) => (
              <List.Item
                key={income._id}
                title={income.source}
                description={format(new Date(income.date), 'MMM dd, yyyy')}
                left={props => (
                  <Avatar.Icon 
                    {...props} 
                    icon="cash-plus" 
                    style={{ backgroundColor: '#43A047' }}
                    size={40}
                  />
                )}
                right={props => (
                  <Text style={styles.incomeAmount}>+${income.amount.toFixed(2)}</Text>
                )}
                onPress={() => navigation.navigate('Income', {
                  screen: 'IncomeDetail',
                  params: { id: income._id }
                })}
              />
            ))
          ) : (
            <List.Item
              title="No recent income"
              description="Add your first income to see it here"
            />
          )}
        </Card>
      </ScrollView>
      
      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={() => navigation.navigate('Expenses', { screen: 'AddExpense' })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  welcomeSection: {
    padding: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 16,
    opacity: 0.7,
  },
  summaryCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  summaryCard: {
    width: '31%',
    borderRadius: 8,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 14,
    marginTop: 8,
  },
  cardAmount: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  chartCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  lineChart: {
    marginVertical: 8,
    borderRadius: 8,
  },
  noDataContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  expenseAmount: {
    color: '#E53935',
    fontWeight: 'bold',
    alignSelf: 'center',
  },
  incomeAmount: {
    color: '#43A047',
    fontWeight: 'bold',
    alignSelf: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default DashboardScreen; 