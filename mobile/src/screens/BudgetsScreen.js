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

const BudgetsScreen = () => {
  const { budgets, categories, expenses, addBudget, updateBudget, deleteBudget, isLoading, refresh } = useData();
  const [modalVisible, setModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newBudget, setNewBudget] = useState({
    name: '',
    amount: '',
    category: '',
    period: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    notificationThreshold: '80',
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
  
  // Open the action menu for a budget
  const openActionMenu = (budget) => {
    setSelectedBudget(budget);
    setActionModalVisible(true);
  };
  
  // Open the edit form for a budget
  const openEditForm = () => {
    if (!selectedBudget) return;
    
    const dateObj = new Date(selectedBudget.startDate);
    const dateStr = dateObj.toISOString().split('T')[0];
    
    const categoryId = typeof selectedBudget.category === 'string'
      ? selectedBudget.category
      : selectedBudget.category?._id || '';
    
    setNewBudget({
      name: selectedBudget.name || '',
      amount: String(selectedBudget.amount || ''),
      category: categoryId,
      period: selectedBudget.period || 'monthly',
      startDate: dateStr,
      notificationThreshold: String(selectedBudget.notificationThreshold || 80),
    });
    
    setIsEditing(true);
    setActionModalVisible(false);
    setModalVisible(true);
  };
  
  // Handle adding/updating a budget
  const handleSaveBudget = async () => {
    if (!newBudget.amount || isNaN(Number(newBudget.amount))) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }
    
    if (!newBudget.name) {
      Alert.alert('Invalid Name', 'Please enter a budget name');
      return;
    }
    
    if (!newBudget.category) {
      Alert.alert('Invalid Category', 'Please select a category');
      return;
    }
    
    try {
      // Fix timezone issue by creating a proper date with time
      const dateStr = newBudget.startDate;
      const fixedDate = new Date(`${dateStr}T12:00:00`);
      
      let success;
      
      if (isEditing && selectedBudget) {
        // Update existing budget
        success = await updateBudget(selectedBudget._id, {
          ...newBudget,
          amount: Number(newBudget.amount),
          notificationThreshold: Number(newBudget.notificationThreshold),
          isActive: true,
          startDate: fixedDate.toISOString()
        });
      } else {
        // Add new budget
        success = await addBudget({
          ...newBudget,
          amount: Number(newBudget.amount),
          notificationThreshold: Number(newBudget.notificationThreshold),
          isActive: true,
          startDate: fixedDate.toISOString()
        });
      }
      
      if (success) {
        setModalVisible(false);
        setNewBudget({
          name: '',
          amount: '',
          category: '',
          period: 'monthly',
          startDate: new Date().toISOString().split('T')[0],
          notificationThreshold: '80',
        });
        setIsEditing(false);
        setSelectedBudget(null);
        refresh();
      } else {
        Alert.alert('Error', `Failed to ${isEditing ? 'update' : 'add'} budget. Please try again.`);
      }
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'adding'} budget:`, error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };
  
  // Handle deleting a budget
  const handleDeleteBudget = () => {
    if (!selectedBudget) return;
    
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this budget?',
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
              const success = await deleteBudget(selectedBudget._id);
              
              if (success) {
                setActionModalVisible(false);
                setSelectedBudget(null);
                refresh();
              } else {
                Alert.alert('Error', 'Failed to delete budget. Please try again.');
              }
            } catch (error) {
              console.error('Error deleting budget:', error);
              Alert.alert('Error', 'An unexpected error occurred');
            }
          }
        }
      ]
    );
  };
  
  // Open form to add a new budget
  const openAddForm = () => {
    setIsEditing(false);
    setNewBudget({
      name: '',
      amount: '',
      category: '',
      period: 'monthly',
      startDate: new Date().toISOString().split('T')[0],
      notificationThreshold: '80',
    });
    setModalVisible(true);
  };
  
  // Render each budget item
  const renderBudgetItem = ({ item }) => {
    // Get category name, handling both string values and object references
    const categoryName = typeof item.category === 'string' 
      ? item.category 
      : item.category?.name || 'Uncategorized';
      
    // Get category ID for filtering expenses
    const categoryId = typeof item.category === 'string'
      ? item.category
      : item.category?._id || item.category;
    
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
    
    const budgetAmount = Number(item.amount) || 1; // Prevent division by zero
    const percentage = Math.min((spent / budgetAmount) * 100, 100);
    const isOverBudget = spent > budgetAmount;
    
    return (
      <TouchableOpacity 
        style={styles.budgetItem}
        onPress={() => openActionMenu(item)}
      >
        <View style={styles.budgetHeader}>
          <View>
            <Text style={styles.budgetName}>{item.name || 'Unnamed Budget'}</Text>
            <Text style={styles.budgetCategory}>{categoryName}</Text>
          </View>
          <View style={styles.budgetPeriod}>
            <Text style={styles.periodText}>{item.period || 'monthly'}</Text>
          </View>
        </View>
        
        <View style={styles.budgetDetails}>
          <Text style={styles.budgetAmount}>
            {formatCurrency(spent)} of {formatCurrency(budgetAmount)}
          </Text>
          <Text style={[
            styles.budgetPercentage,
            isOverBudget ? styles.overBudget : percentage > 80 ? styles.warningBudget : {}
          ]}>
            {percentage.toFixed(0)}%
          </Text>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBar, 
              {
                width: `${percentage}%`,
                backgroundColor: isOverBudget ? '#E74C3C' : percentage > 80 ? '#F39C12' : '#2ECC71'
              }
            ]} 
          />
        </View>
        
        <Text style={styles.budgetDates}>
          Started: {formatDate(item.startDate)}
        </Text>
      </TouchableOpacity>
    );
  };
  
  // Set budget period
  const setPeriod = (period) => {
    setNewBudget({
      ...newBudget,
      period
    });
  };
  
  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5064E3" />
          <Text style={styles.loadingText}>Loading budgets...</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={budgets}
            keyExtractor={(item) => item._id || Math.random().toString()}
            renderItem={renderBudgetItem}
            ListHeaderComponent={
              <View style={styles.header}>
                <Text style={styles.title}>Budgets</Text>
                <Text style={styles.subtitle}>
                  {budgets?.length || 0} budget{budgets?.length !== 1 ? 's' : ''}
                </Text>
              </View>
            }
            ListEmptyComponent={
              <Text style={styles.emptyText}>No budgets found</Text>
            }
          />
          
          <TouchableOpacity
            style={styles.addButton}
            onPress={openAddForm}
          >
            <Text style={styles.addButtonText}>+ Add Budget</Text>
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
                  <Text style={styles.actionButtonText}>Edit Budget</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={handleDeleteBudget}
                >
                  <Text style={styles.deleteButtonText}>Delete Budget</Text>
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
          
          {/* Add/Edit Budget Modal */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  {isEditing ? 'Edit Budget' : 'Add New Budget'}
                </Text>
                
                <Text style={styles.inputLabel}>Budget Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Groceries Budget"
                  value={newBudget.name}
                  onChangeText={(text) => setNewBudget({...newBudget, name: text})}
                />
                
                <Text style={styles.inputLabel}>Amount</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  value={newBudget.amount}
                  onChangeText={(text) => setNewBudget({...newBudget, amount: text})}
                />
                
                <Text style={styles.inputLabel}>Category</Text>
                <View style={styles.categoryContainer}>
                  {categories && categories.length > 0 ? (
                    categories.map((category) => (
                      <TouchableOpacity
                        key={category._id}
                        style={[
                          styles.categoryButton,
                          newBudget.category === category._id && styles.selectedCategoryButton
                        ]}
                        onPress={() => setNewBudget({...newBudget, category: category._id})}
                      >
                        <Text 
                          style={[
                            styles.categoryButtonText,
                            newBudget.category === category._id && styles.selectedCategoryButtonText
                          ]}
                        >
                          {category.name}
                        </Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={styles.noCategoriesText}>No categories available</Text>
                  )}
                </View>
                
                <Text style={styles.inputLabel}>Period</Text>
                <View style={styles.periodButtons}>
                  {['weekly', 'monthly', 'quarterly', 'yearly'].map(period => (
                    <TouchableOpacity
                      key={period}
                      style={[
                        styles.periodButton,
                        newBudget.period === period ? styles.selectedPeriodButton : {}
                      ]}
                      onPress={() => setPeriod(period)}
                    >
                      <Text 
                        style={[
                          styles.periodButtonText,
                          newBudget.period === period ? styles.selectedPeriodButtonText : {}
                        ]}
                      >
                        {period.charAt(0).toUpperCase() + period.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                <Text style={styles.inputLabel}>Start Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  value={newBudget.startDate}
                  onChangeText={(text) => setNewBudget({...newBudget, startDate: text})}
                />
                
                <Text style={styles.inputLabel}>Alert Threshold (%)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="80"
                  keyboardType="number-pad"
                  value={newBudget.notificationThreshold}
                  onChangeText={(text) => setNewBudget({...newBudget, notificationThreshold: text})}
                />
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSaveBudget}
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
  budgetItem: {
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  budgetName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  budgetCategory: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  budgetPeriod: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  periodText: {
    fontSize: 12,
    color: '#333',
  },
  budgetDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  budgetAmount: {
    fontSize: 14,
    color: '#666',
  },
  budgetPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2ECC71',
  },
  warningBudget: {
    color: '#F39C12',
  },
  overBudget: {
    color: '#E74C3C',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
  budgetDates: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
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
    maxHeight: '90%',
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
    marginBottom: 15,
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
  periodButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  periodButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    margin: 5,
  },
  selectedPeriodButton: {
    backgroundColor: '#5064E3',
  },
  periodButtonText: {
    color: '#333',
    fontSize: 12,
  },
  selectedPeriodButtonText: {
    color: '#FFF',
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

export default BudgetsScreen; 