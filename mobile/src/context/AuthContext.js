import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../services/api';
import { Alert } from 'react-native';

// Create context
export const AuthContext = createContext();

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  // Check if token exists when app loads
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const token = await SecureStore.getItemAsync('userToken');
        if (token) {
          setUserToken(token);
          try {
            const { data } = await authAPI.getProfile();
            setUser(data);
          } catch (profileError) {
            console.error('Failed to load user profile', profileError);
            // Token might be invalid or expired
            await SecureStore.deleteItemAsync('userToken');
            setUserToken(null);
          }
        }
      } catch (e) {
        console.error('Failed to load token or user data', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  // Login function
  const login = async (email, password) => {
    setIsLoading(true);
    setError('');
    try {
      console.log('Attempting login with:', { email });
      const { data } = await authAPI.login({ email, password });
      console.log('Login response:', data);
      
      if (data && data.token) {
        await SecureStore.setItemAsync('userToken', data.token);
        setUserToken(data.token);
        setUser(data.user);
        return true;
      } else {
        setError('Invalid login response. Please try again.');
        console.error('Invalid login response:', data);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.status === 'network_error') {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    setIsLoading(true);
    setError('');
    try {
      console.log('Attempting registration with:', { email: userData.email });
      const { data } = await authAPI.register(userData);
      console.log('Registration response:', data);
      
      if (data && data.token) {
        await SecureStore.setItemAsync('userToken', data.token);
        setUserToken(data.token);
        setUser(data.user);
        return true;
      } else {
        setError('Invalid registration response. Please try again.');
        console.error('Invalid registration response:', data);
        return false;
      }
    } catch (error) {
      console.error('Registration error:', error);
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.status === 'network_error') {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true);
    try {
      await SecureStore.deleteItemAsync('userToken');
      setUserToken(null);
      setUser(null);
    } catch (error) {
      console.error('Logout error', error);
      Alert.alert('Logout Error', 'Could not log out properly. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Context value
  const authContext = {
    isLoading,
    userToken,
    user,
    error,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={authContext}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 