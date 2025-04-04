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

const IncomeScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('-date');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [selectedSource, setSelectedSource] = useState(null);
  const [sources, setSources] = useState([]);

  useEffect(() => {
    fetchIncomes();
    fetchSources();
  }, [selectedSource, sortOption]);

  const fetchIncomes = async () => {
    try {
      setLoading(true);
      const params = { sort: sortOption };
      
      // Add source filter if selected
      if (selectedSource) {
        params.source = selectedSource._id;
      }
      
      const response = await axios.get(`${API_URL}/api/incomes`, { params });
      setIncomes(response.data.incomes);
    } catch (error) {
      console.error('Error fetching income data:', error);
      Alert.alert('Error', 'Failed to load income data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchSources = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/categories?type=income`);
      setSources(response.data);
    } catch (error) {
      console.error('Error fetching income sources:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchIncomes();
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleDeleteIncome = async (incomeId) => {
    try {
      await axios.delete(`${API_URL}/api/incomes/${incomeId}`);
      setIncomes(incomes.filter(income => income._id !== incomeId));
      Alert.alert('Success', 'Income deleted successfully');
    } catch (error) {
      console.error('Error deleting income:', error);
      Alert.alert('Error', 'Failed to delete income');
    }
  };

  const confirmDelete = (income) => {
    Alert.alert(
      'Delete Income',
      'Are you sure you want to delete this income?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          onPress: () => handleDeleteIncome(income._id),
          style: 'destructive' 
        }
      ]
    );
  };

  const handleSourceSelect = (source) => {
    setSelectedSource(source === selectedSource ? null : source);
    setFilterMenuVisible(false);
  };

  const filteredIncomes = incomes.filter(income => {
    const matchesSearch = income.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const renderIncomeItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('AddIncome', { incomeId: item._id })}
      onLongPress={() => confirmDelete(item)}
    >
      <Card style={[styles.card, { backgroundColor: theme.colors.card }]} elevation={2}>
        <Card.Content>
          <View style={styles.incomeHeader}>
            <Avatar.Icon 
              size={40} 
              icon="cash-plus" 
              backgroundColor={item.source?.color || '#4CAF50'} 
            />
            <View style={styles.incomeInfo}>
              <Text style={[styles.incomeTitle, { color: theme.colors.text }]}>{item.description}</Text>
              <Text style={[styles.incomeSource, { color: theme.colors.placeholder }]}>
                {item.source?.name || 'Other'}
              </Text>
            </View>
            <View style={styles.amountContainer}>
              <Text style={[styles.incomeAmount, { color: '#4CAF50' }]}>
                +${item.amount.toFixed(2)}
              </Text>
              <Text style={[styles.incomeDate, { color: theme.colors.placeholder }]}>
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
        <Appbar.Content title="Income" />
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
            title="All Sources" 
            onPress={() => {
              setSelectedSource(null);
              setFilterMenuVisible(false);
            }} 
          />
          <Divider />
          {sources.map(source => (
            <Menu.Item 
              key={source._id}
              title={source.name}
              onPress={() => handleSourceSelect(source)} 
            />
          ))}
        </Menu>
      </Appbar.Header>
      
      <Searchbar
        placeholder="Search income..."
        onChangeText={handleSearch}
        value={searchQuery}
        style={[styles.searchbar, { backgroundColor: theme.colors.card }]}
        iconColor={theme.colors.primary}
        inputStyle={{ color: theme.colors.text }}
      />
      
      {selectedSource && (
        <View style={styles.filterChip}>
          <Chip 
            icon="filter-variant" 
            onClose={() => setSelectedSource(null)} 
            style={{ backgroundColor: theme.colors.card }}
          >
            {selectedSource.name}
          </Chip>
        </View>
      )}
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: 10, color: theme.colors.text }}>Loading income data...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredIncomes}
          renderItem={renderIncomeItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons 
                name="cash-register" 
                size={64} 
                color={theme.colors.placeholder} 
              />
              <Text style={[styles.emptyText, { color: theme.colors.text }]}>
                No income entries found
              </Text>
              <Text style={[styles.emptySubText, { color: theme.colors.placeholder }]}>
                Tap the + button to add a new income entry
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
        onPress={() => navigation.navigate('AddIncome')}
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
  incomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  incomeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  incomeTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  incomeSource: {
    fontSize: 14,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  incomeAmount: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  incomeDate: {
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

export default IncomeScreen; 