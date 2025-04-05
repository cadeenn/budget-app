import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  Image
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import Constants from 'expo-constants';

const ProfileScreen = () => {
  const { user, logout, isLoading: authLoading } = useAuth();
  const { refresh } = useData();
  const [editMode, setEditMode] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  // Handle user information update
  const handleUpdateProfile = async () => {
    // This would typically call an API to update the user profile
    // For now just show an alert
    setSaveLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setSaveLoading(false);
      setEditMode(false);
      Alert.alert(
        'Success',
        'Profile updated successfully',
        [{ text: 'OK' }]
      );
    }, 1000);
  };

  // Handle logout
  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          }
        }
      ]
    );
  };

  // Handle account deletion
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Would typically call an API to delete the account
            Alert.alert('Account Deleted', 'Your account has been deleted.');
            logout();
          }
        }
      ]
    );
  };

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5064E3" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
        </View>
        
        <Text style={styles.userName}>{user?.name || 'User'}</Text>
        <Text style={styles.userEmail}>{user?.email || ''}</Text>
        
        {!editMode ? (
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setEditMode(true)}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.editForm}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={userInfo.name}
              onChangeText={(text) => setUserInfo({...userInfo, name: text})}
              placeholder="Your name"
            />
            
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={userInfo.email}
              onChangeText={(text) => setUserInfo({...userInfo, email: text})}
              placeholder="Your email"
              keyboardType="email-address"
              editable={false} // Email is typically not editable after account creation
            />
            
            <View style={styles.editActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setEditMode(false);
                  setUserInfo({
                    name: user?.name || '',
                    email: user?.email || '',
                  });
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleUpdateProfile}
                disabled={saveLoading}
              >
                {saveLoading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Enable Notifications</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#CCCCCC', true: '#5064E3' }}
            thumbColor="#FFFFFF"
          />
        </View>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Dark Mode</Text>
          <Switch
            value={darkModeEnabled}
            onValueChange={setDarkModeEnabled}
            trackColor={{ false: '#CCCCCC', true: '#5064E3' }}
            thumbColor="#FFFFFF"
          />
        </View>
        
        <TouchableOpacity 
          style={styles.settingButton}
          onPress={refresh}
        >
          <Text style={styles.settingButtonText}>Sync Data</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        
        <View style={styles.aboutItem}>
          <Text style={styles.aboutLabel}>Version</Text>
          <Text style={styles.aboutValue}>{Constants.expoConfig?.version || '1.0.0'}</Text>
        </View>
        
        <View style={styles.aboutItem}>
          <Text style={styles.aboutLabel}>Build</Text>
          <Text style={styles.aboutValue}>{Constants.expoConfig?.ios?.buildNumber || '1'}</Text>
        </View>
      </View>
      
      <View style={styles.actionsSection}>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.deleteAccountButton}
          onPress={handleDeleteAccount}
        >
          <Text style={styles.deleteAccountButtonText}>Delete Account</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  header: {
    backgroundColor: '#FFF',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#5064E3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFF',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
    marginBottom: 16,
  },
  editButton: {
    backgroundColor: '#5064E3',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  editForm: {
    width: '100%',
    marginTop: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#5064E3',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: '#FFF',
    padding: 16,
    marginTop: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#EEEEEE',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  settingButton: {
    backgroundColor: '#F0F0F0',
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  settingButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  aboutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  aboutLabel: {
    fontSize: 16,
    color: '#333',
  },
  aboutValue: {
    fontSize: 16,
    color: '#666',
  },
  actionsSection: {
    padding: 16,
    marginTop: 16,
    marginBottom: 32,
  },
  logoutButton: {
    backgroundColor: '#F0F0F0',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  deleteAccountButton: {
    backgroundColor: '#FFEBEE',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteAccountButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E74C3C',
  },
});

export default ProfileScreen; 