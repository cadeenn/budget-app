import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import the useAuth hook
import { useAuth } from '../context/AuthContext';

// Import screens - we'll create these next
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import IncomesScreen from '../screens/IncomesScreen';
import BudgetsScreen from '../screens/BudgetsScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Create the stacks and tabs
const AuthStack = createStackNavigator();
const AppTab = createBottomTabNavigator();

// Auth stack navigator
const AuthStackNavigator = () => (
  <AuthStack.Navigator>
    <AuthStack.Screen 
      name="Login" 
      component={LoginScreen} 
      options={{ headerShown: false }}
    />
    <AuthStack.Screen 
      name="Register" 
      component={RegisterScreen} 
      options={{ headerShown: false }}
    />
  </AuthStack.Navigator>
);

// Main app tab navigator
const AppTabNavigator = () => (
  <AppTab.Navigator
    screenOptions={({ route }) => ({
      headerShown: true,
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === 'Dashboard') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === 'Expenses') {
          iconName = focused ? 'cash' : 'cash-outline';
        } else if (route.name === 'Incomes') {
          iconName = focused ? 'wallet' : 'wallet-outline';
        } else if (route.name === 'Budgets') {
          iconName = focused ? 'pie-chart' : 'pie-chart-outline';
        } else if (route.name === 'Profile') {
          iconName = focused ? 'person' : 'person-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#5064E3',
      tabBarInactiveTintColor: 'gray',
    })}
  >
    <AppTab.Screen name="Dashboard" component={DashboardScreen} />
    <AppTab.Screen name="Expenses" component={ExpensesScreen} />
    <AppTab.Screen name="Incomes" component={IncomesScreen} />
    <AppTab.Screen name="Budgets" component={BudgetsScreen} />
    <AppTab.Screen name="Profile" component={ProfileScreen} />
  </AppTab.Navigator>
);

// Main AppNavigator that handles auth state
const AppNavigator = () => {
  const { userToken, isLoading } = useAuth();
  
  if (isLoading) {
    // You could show a loading screen here
    return null;
  }

  return (
    <NavigationContainer>
      {userToken ? <AppTabNavigator /> : <AuthStackNavigator />}
    </NavigationContainer>
  );
};

export default AppNavigator; 