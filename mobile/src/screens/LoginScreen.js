import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Alert,
  Linking
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import NetworkDebugger from '../utils/networkDebug';
import TunnelProxy from '../utils/tunnelProxy';
import { testAPI } from '../services/api';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [networkStatus, setNetworkStatus] = useState(null);
  const [serverStatus, setServerStatus] = useState(null);
  const [testMessage, setTestMessage] = useState('');
  const { login, error, isLoading } = useAuth();

  // Check network connectivity when the component mounts
  useEffect(() => {
    checkConnections();
  }, []);

  const checkConnections = async () => {
    setTestMessage('Testing connections...');
    
    // First check general internet connectivity
    const networkResult = await NetworkDebugger.testConnection();
    setNetworkStatus(networkResult);
    
    // Then test API connectivity directly
    const apiResult = await testAPI();
    setServerStatus(apiResult.success);
    
    if (networkResult.success && !apiResult.success) {
      setTestMessage('Internet: OK ✅\nServer: FAILED ❌\n\nMake sure the server is running with tunnel mode!');
    } else if (!networkResult.success) {
      setTestMessage('Internet: FAILED ❌\nCheck your device Wi-Fi or data connection.');
    } else if (apiResult.success) {
      setTestMessage('Internet: OK ✅\nServer: OK ✅\n\nReady to log in!');
    }
    
    return networkResult.success && apiResult.success;
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }
    
    // Check connection before attempting login
    const isConnected = await checkConnections();
    if (!isConnected) {
      Alert.alert(
        'Connection Error',
        'Unable to connect to the server. Please check your connection and try again.',
        [
          { text: 'OK' },
          { 
            text: 'Try Again', 
            onPress: checkConnections 
          }
        ]
      );
      return;
    }
    
    const success = await login(email, password);
    if (!success && error) {
      Alert.alert('Login Failed', error);
    }
  };

  const showDebugInfo = () => {
    Alert.alert(
      'Server Connection',
      testMessage,
      [
        { text: 'OK' },
        { 
          text: 'Test Again', 
          onPress: checkConnections 
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Budget Tracker</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
          
          {testMessage && (
            <TouchableOpacity 
              style={[
                styles.statusContainer, 
                serverStatus ? styles.successStatus : styles.errorStatus
              ]}
              onPress={showDebugInfo}
            >
              <Text style={styles.statusText}>{testMessage}</Text>
              <Text style={styles.statusHelp}>Tap for details</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
          
          <TouchableOpacity 
            style={[styles.button, !serverStatus && styles.disabledButton]}
            onPress={handleLogin}
            disabled={isLoading || !serverStatus}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.debugButton}
            onPress={checkConnections}
          >
            <Text style={styles.debugButtonText}>Check Connection</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  statusContainer: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  successStatus: {
    backgroundColor: '#D4EDDA',
    borderColor: '#C3E6CB',
    borderWidth: 1,
  },
  errorStatus: {
    backgroundColor: '#F8D7DA',
    borderColor: '#F5C6CB', 
    borderWidth: 1,
  },
  statusText: {
    fontSize: 14,
    marginBottom: 4,
  },
  statusHelp: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'right',
    fontStyle: 'italic',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
  },
  button: {
    backgroundColor: '#5064E3',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#B8C0E1',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  footerLink: {
    color: '#5064E3',
    fontSize: 14,
    fontWeight: 'bold',
  },
  debugButton: {
    marginTop: 20,
    padding: 10,
    alignItems: 'center',
  },
  debugButtonText: {
    color: '#999',
    fontSize: 12,
  },
});

export default LoginScreen; 