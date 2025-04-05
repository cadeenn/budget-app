import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useData } from '../context/DataContext';

const ExpensesScreen = () => {
  const { expenses, categories, addExpense, updateExpense, deleteExpense, isLoading, refresh } = useData();
  const [modalVisible, setModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newExpense, setNewExpense] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    category: ''
  });
  
  // Format currency
  const formatCurrency = (amount) => {
    return `$${Number(amount).toFixed(2)}`;
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  // Open the action menu for an expense
  const openActionMenu = (expense) => {
    setSelectedExpense(expense);
    setActionModalVisible(true);
  };
  
  // Open the edit form for an expense
  const openEditForm = () => {
    if (!selectedExpense) return;
    
    const dateObj = new Date(selectedExpense.date);
    const dateStr = dateObj.toISOString().split('T')[0];
    
    const categoryId = typeof selectedExpense.category === 'string'
      ? selectedExpense.category
      : selectedExpense.category?._id || '';
    
    setNewExpense({
      amount: String(selectedExpense.amount || ''),
      description: selectedExpense.description || '',
      date: dateStr,
      category: categoryId
    });
    
    setIsEditing(true);
    setActionModalVisible(false);
    setModalVisible(true);
  };
  
  // Handle adding/updating an expense
  const handleSaveExpense = async () => {
    if (!newExpense.amount || isNaN(Number(newExpense.amount))) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }
    
    try {
      // Fix timezone issue by creating a proper date with time
      const dateStr = newExpense.date;
      const fixedDate = new Date(`${dateStr}T12:00:00`);
      
      let success;
      
      if (isEditing && selectedExpense) {
        // Update existing expense
        success = await updateExpense(selectedExpense._id, {
          ...newExpense,
          amount: Number(newExpense.amount),
          date: fixedDate.toISOString()
        });
      } else {
        // Add new expense
        success = await addExpense({
          ...newExpense,
          amount: Number(newExpense.amount),
          date: fixedDate.toISOString()
        });
      }
      
      if (success) {
        setModalVisible(false);
        setNewExpense({
          amount: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
          category: ''
        });
        setIsEditing(false);
        setSelectedExpense(null);
        refresh();
      } else {
        Alert.alert('Error', `Failed to ${isEditing ? 'update' : 'add'} expense. Please try again.`);
      }
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'adding'} expense:`, error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };
  
  // Handle deleting an expense
  const handleDeleteExpense = () => {
    if (!selectedExpense) return;
    
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this expense?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setActionModalVisible(false)
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await deleteExpense(selectedExpense._id);
              
              if (success) {
                setActionModalVisible(false);
                setSelectedExpense(null);
                refresh();
              } else {
                Alert.alert('Error', 'Failed to delete expense. Please try again.');
              }
            } catch (error) {
              console.error('Error deleting expense:', error);
              Alert.alert('Error', 'An unexpected error occurred');
            }
          }
        }
      ]
    );
  };
  
  // Open form to add a new expense
  const openAddForm = () => {
    setIsEditing(false);
    setNewExpense({
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      category: ''
    });
    setModalVisible(true);
  };
  
  // Render each expense item
  const renderExpenseItem = ({ item }) => {
    const categoryName = typeof item.category === 'string'
      ? item.category
      : item.category?.name || 'Uncategorized';
      
    return (
      <TouchableOpacity 
        style={styles.expenseItem}
        onPress={() => openActionMenu(item)}
      >
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseDescription}>
            {item.description || 'Unnamed Expense'}
          </Text>
          <Text style={styles.expenseCategory}>{categoryName}</Text>
          <Text style={styles.expenseDate}>{formatDate(item.date)}</Text>
        </View>
        <Text style={styles.expenseAmount}>-{formatCurrency(item.amount)}</Text>
      </TouchableOpacity>
    );
  };
  
  // Render category selection buttons in the modal
  const renderCategoryButtons = () => {
    if (!categories || categories.length === 0) {
      return (
        <Text style={styles.noCategoriesText}>No categories available</Text>
      );
    }
    
    return (
      <View style={styles.categoryContainer}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category._id}
            style={[
              styles.categoryButton,
              newExpense.category === category._id && styles.selectedCategoryButton
            ]}
            onPress={() => setNewExpense({...newExpense, category: category._id})}
          >
            <Text 
              style={[
                styles.categoryButtonText,
                newExpense.category === category._id && styles.selectedCategoryButtonText
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5064E3" />
          <Text style={styles.loadingText}>Loading expenses...</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={expenses}
            keyExtractor={(item) => item._id || Math.random().toString()}
            renderItem={renderExpenseItem}
            ListHeaderComponent={
              <View style={styles.header}>
                <Text style={styles.title}>Expenses</Text>
                <Text style={styles.subtitle}>
                  {expenses?.length || 0} expense{expenses?.length !== 1 ? 's' : ''}
                </Text>
              </View>
            }
            ListEmptyComponent={
              <Text style={styles.emptyText}>No expenses found</Text>
            }
          />
          
          <TouchableOpacity
            style={styles.addButton}
            onPress={openAddForm}
          >
            <Text style={styles.addButtonText}>+ Add Expense</Text>
          </TouchableOpacity>
          
          {/* Action Modal */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={actionModalVisible}
            onRequestClose={() => setActionModalVisible(false)}
          >
            <TouchableOpacity 
              style={styles.actionModalOverlay}
              activeOpacity={1}
              onPress={() => setActionModalVisible(false)}
            >
              <View style={styles.actionModalContainer}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={openEditForm}
                >
                  <Text style={styles.actionButtonText}>Edit Expense</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={handleDeleteExpense}
                >
                  <Text style={styles.deleteButtonText}>Delete Expense</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setActionModalVisible(false)}
                >
                  <Text style={styles.actionButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>
          
          {/* Add/Edit Expense Modal */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  {isEditing ? 'Edit Expense' : 'Add New Expense'}
                </Text>
                
                <Text style={styles.inputLabel}>Amount</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  value={newExpense.amount}
                  onChangeText={(text) => setNewExpense({...newExpense, amount: text})}
                />
                
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={styles.input}
                  placeholder="What did you spend on?"
                  value={newExpense.description}
                  onChangeText={(text) => setNewExpense({...newExpense, description: text})}
                />
                
                <Text style={styles.inputLabel}>Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  value={newExpense.date}
                  onChangeText={(text) => setNewExpense({...newExpense, date: text})}
                />
                
                <Text style={styles.inputLabel}>Category</Text>
                {renderCategoryButtons()}
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSaveExpense}
                  >
                    <Text style={styles.saveButtonText}>
                      {isEditing ? 'Update' : 'Save'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
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
  header: {
    padding: 16,
    backgroundColor: '#FFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    color: '#333',
  },
  expenseCategory: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  expenseDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E74C3C',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: 20,
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#5064E3',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  categoryButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    margin: 5,
  },
  selectedCategoryButton: {
    backgroundColor: '#5064E3',
  },
  categoryButtonText: {
    color: '#333',
    fontSize: 12,
  },
  selectedCategoryButtonText: {
    color: '#FFF',
  },
  noCategoriesText: {
    color: '#999',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 5,
    backgroundColor: '#F0F0F0',
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  saveButton: {
    flex: 1,
    padding: 12,
    borderRadius: 5,
    backgroundColor: '#5064E3',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  actionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionModalContainer: {
    width: '80%',
    backgroundColor: '#FFF',
    borderRadius: 10,
    overflow: 'hidden',
  },
  actionButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  actionButtonText: {
    color: '#333',
    fontSize: 16,
    textAlign: 'center',
  },
  deleteButton: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  deleteButtonText: {
    color: '#E74C3C',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ExpensesScreen; 