import axios from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import TunnelProxy from '../utils/tunnelProxy';

// ===== IMPORTANT =====
// When your phone and PC are on different networks (WiFi vs Ethernet),
// you need to use a tunnel URL that's accessible from the internet
//
// REPLACE THIS WITH THE URL FROM YOUR SERVER CONSOLE:
// (The URL shown when you run "npm run tunnel" in the server directory)
const MANUAL_SERVER_URL = 'https://budget-tracker-758.loca.lt/api';
// ⚠️ IMPORTANT: Replace 'XXX' above with the actual subdomain from your server console! ⚠️

// Log what URL we're using
console.log('🔌 CONNECTING TO SERVER AT:', MANUAL_SERVER_URL);

// We're forcing the use of the manual URL since auto-detection isn't working
const BASE_URL = MANUAL_SERVER_URL;

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 seconds timeout for slower tunnel connections
});

// Add a request interceptor to attach the auth token to every request
api.interceptors.request.use(
  async (config) => {
    try {
      console.log(`📡 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      const token = await SecureStore.getItemAsync('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      console.error('Error in request interceptor:', error);
      return config;
    }
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    const errorResponse = {
      message: 'An error occurred with the request',
      status: 'unknown',
      data: null,
    };

    if (error.response) {
      // Server responded with error
      errorResponse.message = error.response.data?.message || 'Server error';
      errorResponse.status = error.response.status;
      errorResponse.data = error.response.data;
      console.error('❌ API Response Error:', {
        url: error.config?.url,
        status: error.response.status,
        data: error.response.data,
      });
    } else if (error.request) {
      // Request was made but no response received
      errorResponse.message = 'No response from server. Check your network connection.';
      errorResponse.status = 'network_error';
      console.error('❌ API Network Error:', {
        url: error.config?.url,
        error: error.message,
      });
    } else {
      // Error in setting up the request
      errorResponse.message = 'Error setting up request: ' + error.message;
      errorResponse.status = 'request_setup_error';
      console.error('❌ API Setup Error:', {
        error: error.message,
      });
    }

    return Promise.reject(errorResponse);
  }
);

// Updated API calls to handle nested response formats
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/users/me'),
};

// Updated Expenses API calls to handle the server response format
export const expensesAPI = {
  // The server returns { expenses: [...], pagination: {...} }
  getAll: async () => {
    const response = await api.get('/expenses');
    // Log the raw response for debugging
    console.log('Expenses raw response:', response.data);
    return response;
  },
  getById: (id) => api.get(`/expenses/${id}`),
  create: (expense) => api.post('/expenses', expense),
  update: (id, expense) => api.put(`/expenses/${id}`, expense),
  delete: (id) => api.delete(`/expenses/${id}`),
};

// Updated Incomes API calls
export const incomesAPI = {
  // The server returns { incomes: [...], pagination: {...} }
  getAll: async () => {
    const response = await api.get('/incomes');
    console.log('Incomes raw response:', response.data);
    return response;
  },
  getById: (id) => api.get(`/incomes/${id}`),
  create: (income) => api.post('/incomes', income),
  update: (id, income) => api.put(`/incomes/${id}`, income),
  delete: (id) => api.delete(`/incomes/${id}`),
};

// Updated Budgets API calls
export const budgetsAPI = {
  // The server returns { budgets: [...], pagination: {...} }
  getAll: async () => {
    const response = await api.get('/budgets');
    console.log('Budgets raw response:', response.data);
    return response;
  },
  getById: (id) => api.get(`/budgets/${id}`),
  create: (budget) => api.post('/budgets', budget),
  update: (id, budget) => api.put(`/budgets/${id}`, budget),
  delete: (id) => api.delete(`/budgets/${id}`),
};

// Categories API calls
export const categoriesAPI = {
  getAll: async () => {
    const response = await api.get('/categories');
    console.log('Categories raw response:', response.data);
    return response;
  },
  getById: (id) => api.get(`/categories/${id}`),
  create: (category) => api.post('/categories', category),
  update: (id, category) => api.put(`/categories/${id}`, category),
  delete: (id) => api.delete(`/categories/${id}`),
};

// Test API connectivity
export const testAPI = async () => {
  try {
    console.log('Testing API connectivity to:', BASE_URL);
    const response = await fetch(`${BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    console.log('API test result:', data);
    return { success: true, data };
  } catch (error) {
    console.error('API test failed:', error);
    return { success: false, error };
  }
};

// Call test immediately to verify connection
testAPI();

export default api; 