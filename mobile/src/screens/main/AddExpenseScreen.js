import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import {
  Text,
  Appbar,
  TextInput,
  Button,
  ActivityIndicator,
  Menu,
  Divider,
  List,
  Modal,
  Portal,
  RadioButton
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../context/ThemeContext';
import axios from 'axios';
import { API_URL } from '../../utils/config';
import { format } from 'date-fns';

const AddExpenseScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: new Date(),
    category: null,
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [categories, setCategories] = useState([]);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/categories?type=expense`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.alert('Error', 'Failed to load expense categories');
    }
  };

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
    // Clear error when user types
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: null
      });
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      handleChange('date', selectedDate);
    }
  };

  const handleCategorySelect = (category) => {
    handleChange('category', category);
    setMenuVisible(false);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      try {
        setLoading(true);
        
        const expenseData = {
          description: formData.description,
          amount: parseFloat(formData.amount),
          date: formData.date.toISOString(),
          category: formData.category._id,
          notes: formData.notes
        };
        
        await axios.post(`${API_URL}/api/expenses`, expenseData);
        
        Alert.alert(
          'Success',
          'Expense added successfully',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } catch (error) {
        console.error('Error adding expense:', error);
        Alert.alert('Error', 'Failed to add expense');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Add Expense" />
      </Appbar.Header>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.formContainer}>
            <TextInput
              label="Description"
              value={formData.description}
              onChangeText={(text) => handleChange('description', text)}
              style={[styles.input, { backgroundColor: theme.colors.card }]}
              mode="outlined"
              error={!!errors.description}
            />
            {errors.description && (
              <Text style={styles.errorText}>{errors.description}</Text>
            )}
            
            <TextInput
              label="Amount"
              value={formData.amount}
              onChangeText={(text) => handleChange('amount', text)}
              style={[styles.input, { backgroundColor: theme.colors.card }]}
              mode="outlined"
              keyboardType="numeric"
              error={!!errors.amount}
              left={<TextInput.Affix text="$" />}
            />
            {errors.amount && (
              <Text style={styles.errorText}>{errors.amount}</Text>
            )}
            
            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <View pointerEvents="none">
                <TextInput
                  label="Date"
                  value={format(formData.date, 'MMMM dd, yyyy')}
                  style={[styles.input, { backgroundColor: theme.colors.card }]}
                  mode="outlined"
                  editable={false}
                  right={<TextInput.Icon icon="calendar" />}
                />
              </View>
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                value={formData.date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
            
            <TouchableOpacity onPress={() => setMenuVisible(true)}>
              <View pointerEvents="none">
                <TextInput
                  label="Category"
                  value={formData.category ? formData.category.name : ''}
                  style={[styles.input, 
                    { 
                      backgroundColor: theme.colors.card,
                      borderColor: errors.category ? theme.colors.error : theme.colors.border
                    }
                  ]}
                  mode="outlined"
                  editable={false}
                  error={!!errors.category}
                  right={<TextInput.Icon icon="chevron-down" />}
                />
              </View>
            </TouchableOpacity>
            {errors.category && (
              <Text style={styles.errorText}>{errors.category}</Text>
            )}
            
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={{ x: 0, y: 0 }}
              style={[styles.menu, { width: '80%', alignSelf: 'center' }]}
            >
              {categories.map(category => (
                <Menu.Item
                  key={category._id}
                  title={category.name}
                  onPress={() => handleCategorySelect(category)}
                  style={{ 
                    backgroundColor: formData.category && formData.category._id === category._id 
                      ? theme.colors.primaryLight 
                      : 'transparent' 
                  }}
                />
              ))}
            </Menu>
            
            <TextInput
              label="Notes (Optional)"
              value={formData.notes}
              onChangeText={(text) => handleChange('notes', text)}
              style={[styles.input, { backgroundColor: theme.colors.card }]}
              mode="outlined"
              multiline
              numberOfLines={4}
            />
            
            <Button
              mode="contained"
              onPress={handleSubmit}
              style={[styles.button, { backgroundColor: theme.colors.primary }]}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#ffffff" /> : 'Save Expense'}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  formContainer: {
    padding: 16,
  },
  input: {
    marginVertical: 8,
  },
  button: {
    marginTop: 24,
    marginBottom: 16,
    paddingVertical: 8,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginLeft: 8,
    marginTop: -4,
  },
  menu: {
    marginTop: 64,
  },
});

export default AddExpenseScreen; 