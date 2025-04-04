import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity
} from 'react-native';
import {
  Text,
  Appbar,
  Card,
  Avatar,
  Button,
  ActivityIndicator,
  Divider,
  List,
  IconButton,
  Menu
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import axios from 'axios';
import { API_URL } from '../../utils/config';
import { useTheme } from '../../context/ThemeContext';

const ExpenseDetailScreen = ({ route, navigation }) => {
  const { expenseId } = route.params;
  const { theme } = useTheme();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    fetchExpenseDetails();
  }, [expenseId]);

  const fetchExpenseDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/api/expenses/${expenseId}`);
      setExpense(response.data);
    } catch (err) {
      console.error('Error fetching expense details:', err);
      setError('Failed to load expense details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_URL}/api/expenses/${expenseId}`);
      Alert.alert(
        'Success',
        'Expense deleted successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      console.error('Error deleting expense:', err);
      Alert.alert('Error', 'Failed to delete expense');
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          onPress: handleDelete,
          style: 'destructive' 
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Expense Details" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: 16, color: theme.colors.text }}>Loading expense details...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Expense Details" />
        </Appbar.Header>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={64} color={theme.colors.error} />
          <Text style={[styles.errorText, { color: theme.colors.text }]}>{error}</Text>
          <Button 
            mode="contained" 
            onPress={fetchExpenseDetails}
            style={{ marginTop: 16, backgroundColor: theme.colors.primary }}
          >
            Try Again
          </Button>
        </View>
      </View>
    );
  }

  if (!expense) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Expense Details" />
        </Appbar.Header>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="file-find-outline" size={64} color={theme.colors.warning} />
          <Text style={[styles.errorText, { color: theme.colors.text }]}>Expense not found</Text>
          <Button 
            mode="contained" 
            onPress={() => navigation.goBack()}
            style={{ marginTop: 16, backgroundColor: theme.colors.primary }}
          >
            Go Back
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Expense Details" />
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Appbar.Action 
              icon="dots-vertical" 
              onPress={() => setMenuVisible(true)} 
            />
          }
        >
          <Menu.Item 
            icon="pencil" 
            title="Edit" 
            onPress={() => {
              setMenuVisible(false);
              navigation.navigate('AddExpense', { expenseId: expense._id });
            }} 
          />
          <Menu.Item 
            icon="delete" 
            title="Delete" 
            onPress={() => {
              setMenuVisible(false);
              confirmDelete();
            }} 
          />
        </Menu>
      </Appbar.Header>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={[styles.card, { backgroundColor: theme.colors.card }]} elevation={2}>
          <Card.Content>
            <View style={styles.headerContainer}>
              <Avatar.Icon 
                size={60} 
                icon="cash-minus" 
                style={{ backgroundColor: expense.category?.color || theme.colors.primary }} 
              />
              <View style={styles.headerTextContainer}>
                <Text style={[styles.expenseTitle, { color: theme.colors.text }]}>
                  {expense.description}
                </Text>
                <Text style={[styles.expenseCategory, { color: theme.colors.placeholder }]}>
                  {expense.category?.name || 'Uncategorized'}
                </Text>
              </View>
            </View>
            
            <View style={styles.amountContainer}>
              <Text style={[styles.amountLabel, { color: theme.colors.placeholder }]}>Amount</Text>
              <Text style={[styles.amountValue, { color: theme.colors.error }]}>
                -${expense.amount.toFixed(2)}
              </Text>
            </View>
            
            <Divider style={styles.divider} />
            
            <List.Item
              title="Date"
              description={format(parseISO(expense.date), 'MMMM dd, yyyy')}
              left={props => <List.Icon {...props} icon="calendar" />}
              titleStyle={{ color: theme.colors.text }}
              descriptionStyle={{ color: theme.colors.primary }}
            />
            
            <Divider style={styles.divider} />
            
            <List.Item
              title="Category"
              description={expense.category?.name || 'Uncategorized'}
              left={props => 
                <List.Icon 
                  {...props} 
                  icon="tag" 
                  color={expense.category?.color || theme.colors.primary} 
                />
              }
              titleStyle={{ color: theme.colors.text }}
              descriptionStyle={{ color: theme.colors.primary }}
            />
            
            <Divider style={styles.divider} />
            
            {expense.notes && (
              <>
                <List.Item
                  title="Notes"
                  description={expense.notes}
                  left={props => <List.Icon {...props} icon="text" />}
                  titleStyle={{ color: theme.colors.text }}
                  descriptionStyle={{ color: theme.colors.text }}
                  descriptionNumberOfLines={0}
                />
                <Divider style={styles.divider} />
              </>
            )}
            
            <List.Item
              title="Created"
              description={format(parseISO(expense.createdAt), 'MMMM dd, yyyy • h:mm a')}
              left={props => <List.Icon {...props} icon="clock-outline" />}
              titleStyle={{ color: theme.colors.text }}
              descriptionStyle={{ color: theme.colors.placeholder }}
            />
            
            {expense.createdAt !== expense.updatedAt && (
              <>
                <Divider style={styles.divider} />
                <List.Item
                  title="Last Updated"
                  description={format(parseISO(expense.updatedAt), 'MMMM dd, yyyy • h:mm a')}
                  left={props => <List.Icon {...props} icon="update" />}
                  titleStyle={{ color: theme.colors.text }}
                  descriptionStyle={{ color: theme.colors.placeholder }}
                />
              </>
            )}
          </Card.Content>
        </Card>
        
        <View style={styles.buttonContainer}>
          <Button 
            mode="contained" 
            icon="pencil"
            onPress={() => navigation.navigate('AddExpense', { expenseId: expense._id })}
            style={[styles.button, styles.editButton, { backgroundColor: theme.colors.primary }]}
          >
            Edit Expense
          </Button>
          
          <Button 
            mode="outlined"
            icon="delete"
            onPress={confirmDelete}
            style={styles.button}
            textColor={theme.colors.error}
            buttonColor={theme.colors.background}
          >
            Delete Expense
          </Button>
        </View>
      </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    borderRadius: 12,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  expenseTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  expenseCategory: {
    fontSize: 14,
    marginTop: 4,
  },
  amountContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    padding: 16,
    borderRadius: 8,
    marginVertical: 16,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 8,
  },
  divider: {
    marginVertical: 8,
  },
  buttonContainer: {
    marginTop: 24,
  },
  button: {
    marginVertical: 8,
    paddingVertical: 8,
  },
  editButton: {
    marginBottom: 12,
  },
});

export default ExpenseDetailScreen; 