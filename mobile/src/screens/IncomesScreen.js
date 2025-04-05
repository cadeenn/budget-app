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

const IncomesScreen = () => {
  const { incomes, addIncome, updateIncome, deleteIncome, isLoading, refresh } = useData();
  const [modalVisible, setModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newIncome, setNewIncome] = useState({
    amount: '',
    source: '',
    date: new Date().toISOString().split('T')[0],
    isRecurring: false,
    recurringFrequency: 'monthly',
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
  
  // Open the action menu for an income
  const openActionMenu = (income) => {
    setSelectedIncome(income);
    setActionModalVisible(true);
  };
  
  // Open the edit form for an income
  const openEditForm = () => {
    if (!selectedIncome) return;
    
    const dateObj = new Date(selectedIncome.date);
    const dateStr = dateObj.toISOString().split('T')[0];
    
    setNewIncome({
      amount: String(selectedIncome.amount || ''),
      source: selectedIncome.source || '',
      date: dateStr,
      isRecurring: selectedIncome.isRecurring || false,
      recurringFrequency: selectedIncome.recurringFrequency || 'monthly',
    });
    
    setIsEditing(true);
    setActionModalVisible(false);
    setModalVisible(true);
  };
  
  // Handle adding/updating an income
  const handleSaveIncome = async () => {
    if (!newIncome.amount || isNaN(Number(newIncome.amount))) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }
    
    if (!newIncome.source) {
      Alert.alert('Invalid Source', 'Please enter an income source');
      return;
    }
    
    try {
      // Fix timezone issue by creating a proper date with time
      const dateStr = newIncome.date;
      const fixedDate = new Date(`${dateStr}T12:00:00`);
      
      let success;
      
      if (isEditing && selectedIncome) {
        // Update existing income
        success = await updateIncome(selectedIncome._id, {
          ...newIncome,
          amount: Number(newIncome.amount),
          date: fixedDate.toISOString()
        });
      } else {
        // Add new income
        success = await addIncome({
          ...newIncome,
          amount: Number(newIncome.amount),
          date: fixedDate.toISOString()
        });
      }
      
      if (success) {
        setModalVisible(false);
        setNewIncome({
          amount: '',
          source: '',
          date: new Date().toISOString().split('T')[0],
          isRecurring: false,
          recurringFrequency: 'monthly',
        });
        setIsEditing(false);
        setSelectedIncome(null);
        refresh();
      } else {
        Alert.alert('Error', `Failed to ${isEditing ? 'update' : 'add'} income. Please try again.`);
      }
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'adding'} income:`, error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };
  
  // Handle deleting an income
  const handleDeleteIncome = () => {
    if (!selectedIncome) return;
    
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this income?',
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
              const success = await deleteIncome(selectedIncome._id);
              
              if (success) {
                setActionModalVisible(false);
                setSelectedIncome(null);
                refresh();
              } else {
                Alert.alert('Error', 'Failed to delete income. Please try again.');
              }
            } catch (error) {
              console.error('Error deleting income:', error);
              Alert.alert('Error', 'An unexpected error occurred');
            }
          }
        }
      ]
    );
  };
  
  // Open form to add a new income
  const openAddForm = () => {
    setIsEditing(false);
    setNewIncome({
      amount: '',
      source: '',
      date: new Date().toISOString().split('T')[0],
      isRecurring: false,
      recurringFrequency: 'monthly',
    });
    setModalVisible(true);
  };
  
  // Render each income item
  const renderIncomeItem = ({ item }) => {
    return (
      <TouchableOpacity 
        style={styles.incomeItem}
        onPress={() => openActionMenu(item)}
      >
        <View style={styles.incomeInfo}>
          <Text style={styles.incomeSource}>{item.source || 'Unnamed Income'}</Text>
          {item.isRecurring && (
            <Text style={styles.recurringBadge}>
              Recurring ({item.recurringFrequency || 'monthly'})
            </Text>
          )}
          <Text style={styles.incomeDate}>{formatDate(item.date)}</Text>
        </View>
        <Text style={styles.incomeAmount}>+{formatCurrency(item.amount)}</Text>
      </TouchableOpacity>
    );
  };
  
  // Toggle recurring option
  const toggleRecurring = () => {
    setNewIncome({
      ...newIncome,
      isRecurring: !newIncome.isRecurring
    });
  };
  
  // Set recurring frequency
  const setFrequency = (frequency) => {
    setNewIncome({
      ...newIncome,
      recurringFrequency: frequency
    });
  };
  
  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5064E3" />
          <Text style={styles.loadingText}>Loading incomes...</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={incomes}
            keyExtractor={(item) => item._id || Math.random().toString()}
            renderItem={renderIncomeItem}
            ListHeaderComponent={
              <View style={styles.header}>
                <Text style={styles.title}>Incomes</Text>
                <Text style={styles.subtitle}>
                  {incomes?.length || 0} income{incomes?.length !== 1 ? 's' : ''}
                </Text>
              </View>
            }
            ListEmptyComponent={
              <Text style={styles.emptyText}>No incomes found</Text>
            }
          />
          
          <TouchableOpacity
            style={styles.addButton}
            onPress={openAddForm}
          >
            <Text style={styles.addButtonText}>+ Add Income</Text>
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
                  <Text style={styles.actionButtonText}>Edit Income</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={handleDeleteIncome}
                >
                  <Text style={styles.deleteButtonText}>Delete Income</Text>
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
          
          {/* Add/Edit Income Modal */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  {isEditing ? 'Edit Income' : 'Add New Income'}
                </Text>
                
                <Text style={styles.inputLabel}>Amount</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  value={newIncome.amount}
                  onChangeText={(text) => setNewIncome({...newIncome, amount: text})}
                />
                
                <Text style={styles.inputLabel}>Source</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Where did the money come from?"
                  value={newIncome.source}
                  onChangeText={(text) => setNewIncome({...newIncome, source: text})}
                />
                
                <Text style={styles.inputLabel}>Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  value={newIncome.date}
                  onChangeText={(text) => setNewIncome({...newIncome, date: text})}
                />
                
                <View style={styles.switchContainer}>
                  <Text style={styles.inputLabel}>Is this a recurring income?</Text>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      newIncome.isRecurring ? styles.toggleActive : {}
                    ]}
                    onPress={toggleRecurring}
                  >
                    <Text style={[
                      styles.toggleText,
                      newIncome.isRecurring ? styles.toggleTextActive : {}
                    ]}>
                      {newIncome.isRecurring ? 'Yes' : 'No'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {newIncome.isRecurring && (
                  <View style={styles.frequencyContainer}>
                    <Text style={styles.inputLabel}>Frequency</Text>
                    <View style={styles.frequencyButtons}>
                      {['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'].map(freq => (
                        <TouchableOpacity
                          key={freq}
                          style={[
                            styles.frequencyButton,
                            newIncome.recurringFrequency === freq ? styles.frequencySelected : {}
                          ]}
                          onPress={() => setFrequency(freq)}
                        >
                          <Text style={[
                            styles.frequencyText,
                            newIncome.recurringFrequency === freq ? styles.frequencyTextSelected : {}
                          ]}>
                            {freq.charAt(0).toUpperCase() + freq.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSaveIncome}
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
  incomeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  incomeInfo: {
    flex: 1,
  },
  incomeSource: {
    fontSize: 16,
    color: '#333',
  },
  recurringBadge: {
    fontSize: 12,
    color: '#FFF',
    backgroundColor: '#5064E3',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 4,
    overflow: 'hidden',
  },
  incomeDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  incomeAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2ECC71',
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
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  toggleButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  toggleActive: {
    backgroundColor: '#5064E3',
  },
  toggleText: {
    color: '#333',
    fontWeight: 'bold',
  },
  toggleTextActive: {
    color: '#FFF',
  },
  frequencyContainer: {
    marginBottom: 15,
  },
  frequencyButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  frequencyButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    margin: 5,
  },
  frequencySelected: {
    backgroundColor: '#5064E3',
  },
  frequencyText: {
    color: '#333',
    fontSize: 12,
  },
  frequencyTextSelected: {
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

export default IncomesScreen; 