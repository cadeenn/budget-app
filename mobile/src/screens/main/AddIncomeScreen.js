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
  List
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../context/ThemeContext';
import axios from 'axios';
import { API_URL } from '../../utils/config';
import { format, parseISO } from 'date-fns';

const AddIncomeScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const incomeId = route.params?.incomeId;
  const isEditing = !!incomeId;
  
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: new Date(),
    source: null,
    notes: '',
    isRecurring: false,
    recurrenceFrequency: 'monthly'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEditing);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [sources, setSources] = useState([]);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    fetchSources();
    if (isEditing) {
      fetchIncomeDetails();
    }
  }, [incomeId]);

  const fetchSources = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/categories?type=income`);
      setSources(response.data);
    } catch (error) {
      console.error('Error fetching sources:', error);
      Alert.alert('Error', 'Failed to load income sources');
    }
  };

  const fetchIncomeDetails = async () => {
    try {
      setFetchLoading(true);
      const response = await axios.get(`${API_URL}/api/incomes/${incomeId}`);
      const income = response.data;
      
      setFormData({
        description: income.description,
        amount: income.amount.toString(),
        date: parseISO(income.date),
        source: income.source,
        notes: income.notes || '',
        isRecurring: income.isRecurring || false,
        recurrenceFrequency: income.recurrenceFrequency || 'monthly'
      });
    } catch (error) {
      console.error('Error fetching income details:', error);
      Alert.alert('Error', 'Failed to load income details');
      navigation.goBack();
    } finally {
      setFetchLoading(false);
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

  const handleSourceSelect = (source) => {
    handleChange('source', source);
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
    
    if (!formData.source) {
      newErrors.source = 'Source is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      try {
        setLoading(true);
        
        const incomeData = {
          description: formData.description,
          amount: parseFloat(formData.amount),
          date: formData.date.toISOString(),
          source: formData.source._id,
          notes: formData.notes,
          isRecurring: formData.isRecurring,
          recurrenceFrequency: formData.isRecurring ? formData.recurrenceFrequency : null
        };
        
        if (isEditing) {
          await axios.put(`${API_URL}/api/incomes/${incomeId}`, incomeData);
          Alert.alert(
            'Success',
            'Income updated successfully',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        } else {
          await axios.post(`${API_URL}/api/incomes`, incomeData);
          Alert.alert(
            'Success',
            'Income added successfully',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        }
      } catch (error) {
        console.error('Error saving income:', error);
        Alert.alert('Error', `Failed to ${isEditing ? 'update' : 'add'} income`);
      } finally {
        setLoading(false);
      }
    }
  };

  if (fetchLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title={isEditing ? 'Edit Income' : 'Add Income'} />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: 16, color: theme.colors.text }}>Loading income details...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={isEditing ? 'Edit Income' : 'Add Income'} />
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
                  label="Source"
                  value={formData.source ? formData.source.name : ''}
                  style={[styles.input, 
                    { 
                      backgroundColor: theme.colors.card,
                      borderColor: errors.source ? theme.colors.error : theme.colors.border
                    }
                  ]}
                  mode="outlined"
                  editable={false}
                  error={!!errors.source}
                  right={<TextInput.Icon icon="chevron-down" />}
                />
              </View>
            </TouchableOpacity>
            {errors.source && (
              <Text style={styles.errorText}>{errors.source}</Text>
            )}
            
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={{ x: 0, y: 0 }}
              style={[styles.menu, { width: '80%', alignSelf: 'center' }]}
            >
              {sources.map(source => (
                <Menu.Item
                  key={source._id}
                  title={source.name}
                  onPress={() => handleSourceSelect(source)}
                  style={{ 
                    backgroundColor: formData.source && formData.source._id === source._id 
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
              {loading ? <ActivityIndicator color="#ffffff" /> : (isEditing ? 'Update Income' : 'Save Income')}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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

export default AddIncomeScreen; 