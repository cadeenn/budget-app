import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions
} from 'react-native';
import {
  Text,
  Appbar,
  Card,
  ProgressBar,
  Title,
  Caption,
  FAB,
  ActivityIndicator,
  Button,
  Dialog,
  Portal,
  TextInput,
  Menu,
  Divider,
  IconButton
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import axios from 'axios';
import { API_URL } from '../../utils/config';
import { useTheme } from '../../context/ThemeContext';

const screenWidth = Dimensions.get('window').width;

const BudgetsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [currentBudget, setCurrentBudget] = useState(null);
  const [formData, setFormData] = useState({
    category: null,
    limit: '',
    period: 'monthly'
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [budgetsRes, categoriesRes] = await Promise.all([
        axios.get(`${API_URL}/api/budgets`),
        axios.get(`${API_URL}/api/categories?type=expense`)
      ]);
      
      setBudgets(budgetsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error fetching budgets:', error);
      Alert.alert('Error', 'Failed to load budgets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const resetForm = () => {
    setFormData({
      category: null,
      limit: '',
      period: 'monthly'
    });
    setFormErrors({});
  };

  const showAddDialog = () => {
    resetForm();
    setCurrentBudget(null);
    setDialogVisible(true);
  };

  const showEditDialog = (budget) => {
    setCurrentBudget(budget);
    setFormData({
      category: budget.category,
      limit: budget.limit.toString(),
      period: budget.period
    });
    setDialogVisible(true);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.category) {
      errors.category = 'Category is required';
    }
    
    if (!formData.limit) {
      errors.limit = 'Limit is required';
    } else if (isNaN(parseFloat(formData.limit)) || parseFloat(formData.limit) <= 0) {
      errors.limit = 'Limit must be a positive number';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      try {
        const budgetData = {
          category: formData.category._id,
          limit: parseFloat(formData.limit),
          period: formData.period
        };
        
        if (currentBudget) {
          // Update existing budget
          await axios.put(`${API_URL}/api/budgets/${currentBudget._id}`, budgetData);
          Alert.alert('Success', 'Budget updated successfully');
        } else {
          // Create new budget
          await axios.post(`${API_URL}/api/budgets`, budgetData);
          Alert.alert('Success', 'Budget created successfully');
        }
        
        setDialogVisible(false);
        fetchData();
      } catch (error) {
        console.error('Error saving budget:', error);
        Alert.alert('Error', 'Failed to save budget');
      }
    }
  };

  const deleteBudget = async (budgetId) => {
    try {
      await axios.delete(`${API_URL}/api/budgets/${budgetId}`);
      setBudgets(budgets.filter(budget => budget._id !== budgetId));
      Alert.alert('Success', 'Budget deleted successfully');
    } catch (error) {
      console.error('Error deleting budget:', error);
      Alert.alert('Error', 'Failed to delete budget');
    }
  };

  const confirmDelete = (budget) => {
    Alert.alert(
      'Delete Budget',
      `Are you sure you want to delete the budget for ${budget.category.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          onPress: () => deleteBudget(budget._id),
          style: 'destructive' 
        }
      ]
    );
  };

  const calculateProgress = (budget) => {
    const spent = budget.spent || 0;
    const limit = budget.limit;
    return Math.min(spent / limit, 1);
  };

  const getProgressColor = (progress) => {
    if (progress < 0.7) return theme.colors.success;
    if (progress < 0.9) return theme.colors.warning;
    return theme.colors.error;
  };

  const renderBudgetCard = (budget) => {
    const progress = calculateProgress(budget);
    const progressColor = getProgressColor(progress);
    const spent = budget.spent || 0;
    const remaining = Math.max(budget.limit - spent, 0);
    const isOverBudget = spent > budget.limit;
    
    return (
      <Card 
        style={[styles.budgetCard, { backgroundColor: theme.colors.card }]}
        elevation={2}
        key={budget._id}
      >
        <Card.Content>
          <View style={styles.budgetHeader}>
            <View style={styles.categoryContainer}>
              <View 
                style={[
                  styles.categoryDot, 
                  { backgroundColor: budget.category.color || theme.colors.primary }
                ]} 
              />
              <Title style={{ color: theme.colors.text }}>{budget.category.name}</Title>
            </View>
            <IconButton
              icon="dots-vertical"
              onPress={() => showEditDialog(budget)}
              color={theme.colors.text}
            />
          </View>
          
          <View style={styles.budgetLimits}>
            <View>
              <Caption style={{ color: theme.colors.placeholder }}>Limit</Caption>
              <Text style={[styles.amountText, { color: theme.colors.text }]}>
                ${budget.limit.toFixed(2)}
              </Text>
            </View>
            <View>
              <Caption style={{ color: theme.colors.placeholder }}>Spent</Caption>
              <Text 
                style={[
                  styles.amountText, 
                  { color: isOverBudget ? theme.colors.error : theme.colors.text }
                ]}
              >
                ${spent.toFixed(2)}
              </Text>
            </View>
            <View>
              <Caption style={{ color: theme.colors.placeholder }}>Remaining</Caption>
              <Text 
                style={[
                  styles.amountText, 
                  { 
                    color: isOverBudget 
                      ? theme.colors.error 
                      : theme.colors.text 
                  }
                ]}
              >
                {isOverBudget ? '-$' + (spent - budget.limit).toFixed(2) : '$' + remaining.toFixed(2)}
              </Text>
            </View>
          </View>
          
          <View style={styles.progressContainer}>
            <ProgressBar 
              progress={progress} 
              color={progressColor} 
              style={styles.progressBar} 
            />
            <Text style={[styles.percentageText, { color: theme.colors.text }]}>
              {Math.round(progress * 100)}%
            </Text>
          </View>
          
          <View style={styles.periodContainer}>
            <Text style={{ color: theme.colors.placeholder }}>
              {budget.period === 'monthly' 
                ? `Monthly budget (${format(startOfMonth(new Date()), 'MMM d')} - ${format(endOfMonth(new Date()), 'MMM d')})` 
                : 'Yearly budget'}
            </Text>
          </View>
          
          <View style={styles.actions}>
            <Button 
              mode="text" 
              onPress={() => showEditDialog(budget)}
              color={theme.colors.primary}
            >
              Edit
            </Button>
            <Button 
              mode="text" 
              onPress={() => confirmDelete(budget)}
              color={theme.colors.error}
            >
              Delete
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
          <Appbar.Content title="Budgets" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: 16, color: theme.colors.text }}>Loading budgets...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
        <Appbar.Content title="Budgets" />
      </Appbar.Header>
      
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            progressBackgroundColor={theme.colors.card}
          />
        }
      >
        {budgets.length > 0 ? (
          budgets.map(renderBudgetCard)
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons 
              name="wallet-outline" 
              size={64} 
              color={theme.colors.placeholder} 
            />
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>
              No budgets set
            </Text>
            <Text style={[styles.emptySubText, { color: theme.colors.placeholder }]}>
              Tap the + button to create your first budget
            </Text>
          </View>
        )}
      </ScrollView>
      
      <Portal>
        <Dialog
          visible={dialogVisible}
          onDismiss={() => setDialogVisible(false)}
          style={{ backgroundColor: theme.colors.card }}
        >
          <Dialog.Title style={{ color: theme.colors.text }}>
            {currentBudget ? 'Edit Budget' : 'Create Budget'}
          </Dialog.Title>
          <Dialog.Content>
            <TouchableOpacity onPress={() => setCategoryMenuVisible(true)}>
              <View pointerEvents="none">
                <TextInput
                  label="Category"
                  value={formData.category ? formData.category.name : ''}
                  style={[styles.input, { backgroundColor: theme.colors.card }]}
                  mode="outlined"
                  error={!!formErrors.category}
                  right={<TextInput.Icon icon="chevron-down" />}
                />
              </View>
            </TouchableOpacity>
            {formErrors.category && (
              <Text style={styles.errorText}>{formErrors.category}</Text>
            )}
            
            <Menu
              visible={categoryMenuVisible}
              onDismiss={() => setCategoryMenuVisible(false)}
              anchor={{ x: 0, y: 0 }}
              style={{ width: '80%', alignSelf: 'center' }}
            >
              {categories.map(category => (
                <Menu.Item
                  key={category._id}
                  title={category.name}
                  onPress={() => {
                    setFormData({ ...formData, category });
                    setCategoryMenuVisible(false);
                  }}
                />
              ))}
            </Menu>
            
            <TextInput
              label="Budget Limit"
              value={formData.limit}
              onChangeText={(text) => setFormData({ ...formData, limit: text })}
              style={[styles.input, { backgroundColor: theme.colors.card }]}
              mode="outlined"
              keyboardType="numeric"
              error={!!formErrors.limit}
              left={<TextInput.Affix text="$" />}
            />
            {formErrors.limit && (
              <Text style={styles.errorText}>{formErrors.limit}</Text>
            )}
            
            <View style={styles.radioGroup}>
              <Text style={{ color: theme.colors.text, marginBottom: 8 }}>Period</Text>
              <View style={styles.radioOption}>
                <RadioButton
                  value="monthly"
                  status={formData.period === 'monthly' ? 'checked' : 'unchecked'}
                  onPress={() => setFormData({ ...formData, period: 'monthly' })}
                  color={theme.colors.primary}
                />
                <Text style={{ color: theme.colors.text }}>Monthly</Text>
              </View>
              <View style={styles.radioOption}>
                <RadioButton
                  value="yearly"
                  status={formData.period === 'yearly' ? 'checked' : 'unchecked'}
                  onPress={() => setFormData({ ...formData, period: 'yearly' })}
                  color={theme.colors.primary}
                />
                <Text style={{ color: theme.colors.text }}>Yearly</Text>
              </View>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)} color={theme.colors.placeholder}>
              Cancel
            </Button>
            <Button onPress={handleSubmit} color={theme.colors.primary}>
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={showAddDialog}
        color="#ffffff"
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
  content: {
    padding: 16,
    paddingBottom: 80,
  },
  budgetCard: {
    marginBottom: 16,
    borderRadius: 8,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  budgetLimits: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  percentageText: {
    marginLeft: 8,
    fontWeight: 'bold',
  },
  periodContainer: {
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 64,
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
  input: {
    marginVertical: 8,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginLeft: 8,
    marginTop: -4,
  },
  radioGroup: {
    marginTop: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
});

export default BudgetsScreen; 