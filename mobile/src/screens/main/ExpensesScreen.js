import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import {
  Text,
  Appbar,
  Card,
  Avatar,
  ActivityIndicator,
  Divider,
  FAB,
  Chip,
  Searchbar,
  Menu
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import axios from 'axios';
import { API_URL } from '../../utils/config';
import { useTheme } from '../../context/ThemeContext';

const ExpensesScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [sortOption, setSortOption] = useState('-date');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, [selectedCategory, sortOption]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = { sort: sortOption };
      
      // Add category filter if selected
      if (selectedCategory) {
        params.category = selectedCategory._id;
      }
      
      const response = await axios.get(`${API_URL}/api/expenses`, { params });
      setExpenses(response.data.expenses);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      Alert.alert('Error', 'Failed to load expenses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/categories?type=expense`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchExpenses();
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category === selectedCategory ? null : category);
    setFilterMenuVisible(false);
  };

  const handleDeleteExpense = async (expenseId) => {
    try {
      await axios.delete(`${API_URL}/api/expenses/${expenseId}`);
      setExpenses(expenses.filter(expense => expense._id !== expenseId));
      Alert.alert('Success', 'Expense deleted successfully');
    } catch (error) {
      console.error('Error deleting expense:', error);
      Alert.alert('Error', 'Failed to delete expense');
    }
  };

  const confirmDelete = (expense) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          onPress: () => handleDeleteExpense(expense._id),
          style: 'destructive' 
        }
      ]
    );
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const renderExpenseItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('ExpenseDetail', { expenseId: item._id })}
      onLongPress={() => confirmDelete(item)}
    >
      <Card style={[styles.card, { backgroundColor: theme.colors.card }]} elevation={2}>
        <Card.Content>
          <View style={styles.expenseHeader}>
            <Avatar.Icon 
              size={40} 
              icon="cash-minus" 
              backgroundColor={item.category?.color || theme.colors.primary} 
            />
            <View style={styles.expenseInfo}>
              <Text style={[styles.expenseTitle, { color: theme.colors.text }]}>{item.description}</Text>
              <Text style={[styles.expenseCategory, { color: theme.colors.placeholder }]}>
                {item.category?.name || 'Uncategorized'}
              </Text>
            </View>
            <View style={styles.amountContainer}>
              <Text style={[styles.expenseAmount, { color: theme.colors.error }]}>
                -${item.amount.toFixed(2)}
              </Text>
              <Text style={[styles.expenseDate, { color: theme.colors.placeholder }]}>
                {format(parseISO(item.date), 'MMM dd, yyyy')}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
        <Appbar.Content title="Expenses" />
        <Menu
          visible={sortMenuVisible}
          onDismiss={() => setSortMenuVisible(false)}
          anchor={
            <Appbar.Action 
              icon="sort" 
              onPress={() => setSortMenuVisible(true)} 
            />
          }
        >
          <Menu.Item 
            title="Newest First" 
            onPress={() => {
              setSortOption('-date');
              setSortMenuVisible(false);
            }} 
          />
          <Menu.Item 
            title="Oldest First" 
            onPress={() => {
              setSortOption('date');
              setSortMenuVisible(false);
            }} 
          />
          <Menu.Item 
            title="Highest Amount" 
            onPress={() => {
              setSortOption('-amount');
              setSortMenuVisible(false);
            }} 
          />
          <Menu.Item 
            title="Lowest Amount" 
            onPress={() => {
              setSortOption('amount');
              setSortMenuVisible(false);
            }} 
          />
        </Menu>
        <Menu
          visible={filterMenuVisible}
          onDismiss={() => setFilterMenuVisible(false)}
          anchor={
            <Appbar.Action 
              icon="filter" 
              onPress={() => setFilterMenuVisible(true)} 
            />
          }
        >
          <Menu.Item 
            title="All Categories" 
            onPress={() => {
              setSelectedCategory(null);
              setFilterMenuVisible(false);
            }} 
          />
          <Divider />
          {categories.map(category => (
            <Menu.Item 
              key={category._id}
              title={category.name}
              onPress={() => handleCategorySelect(category)} 
            />
          ))}
        </Menu>
      </Appbar.Header>
      
      <Searchbar
        placeholder="Search expenses..."
        onChangeText={handleSearch}
        value={searchQuery}
        style={[styles.searchbar, { backgroundColor: theme.colors.card }]}
        iconColor={theme.colors.primary}
        inputStyle={{ color: theme.colors.text }}
      />
      
      {selectedCategory && (
        <View style={styles.filterChip}>
          <Chip 
            icon="filter-variant" 
            onClose={() => setSelectedCategory(null)} 
            style={{ backgroundColor: theme.colors.card }}
          >
            {selectedCategory.name}
          </Chip>
        </View>
      )}
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: 10, color: theme.colors.text }}>Loading expenses...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredExpenses}
          renderItem={renderExpenseItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons 
                name="cash-remove" 
                size={64} 
                color={theme.colors.placeholder} 
              />
              <Text style={[styles.emptyText, { color: theme.colors.text }]}>
                No expenses found
              </Text>
              <Text style={[styles.emptySubText, { color: theme.colors.placeholder }]}>
                Tap the + button to add a new expense
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
              progressBackgroundColor={theme.colors.card}
            />
          }
        />
      )}
      
      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={() => navigation.navigate('AddExpense')}
        color="#ffffff"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchbar: {
    margin: 10,
    borderRadius: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 10,
  },
  card: {
    marginVertical: 4,
    borderRadius: 8,
  },
  expenseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseInfo: {
    flex: 1,
    marginLeft: 12,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  expenseCategory: {
    fontSize: 14,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  expenseDate: {
    fontSize: 12,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  filterChip: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    marginBottom: 8,
  },
});

export default ExpensesScreen; 