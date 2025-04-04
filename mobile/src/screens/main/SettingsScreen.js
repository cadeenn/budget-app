import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  TouchableOpacity,
  Linking
} from 'react-native';
import {
  Text,
  Appbar,
  List,
  Divider,
  Button,
  Dialog,
  Portal,
  Avatar,
  TextInput,
  ActivityIndicator
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../../utils/config';

const SettingsScreen = ({ navigation }) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const { user, updateProfile, logout } = useAuth();
  
  const [profileDialogVisible, setProfileDialogVisible] = useState(false);
  const [passwordDialogVisible, setPasswordDialogVisible] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  
  const handleProfileUpdate = async () => {
    try {
      setProfileLoading(true);
      setFormErrors({});
      
      // Validate form
      const errors = {};
      if (!profileForm.name.trim()) {
        errors.name = 'Name is required';
      }
      if (!profileForm.email.trim()) {
        errors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(profileForm.email)) {
        errors.email = 'Email is invalid';
      }
      
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        setProfileLoading(false);
        return;
      }
      
      await updateProfile(profileForm);
      setProfileDialogVisible(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };
  
  const handlePasswordUpdate = async () => {
    try {
      setPasswordLoading(true);
      setFormErrors({});
      
      // Validate form
      const errors = {};
      if (!passwordForm.currentPassword) {
        errors.currentPassword = 'Current password is required';
      }
      if (!passwordForm.newPassword) {
        errors.newPassword = 'New password is required';
      } else if (passwordForm.newPassword.length < 6) {
        errors.newPassword = 'Password must be at least 6 characters long';
      }
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
      
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        setPasswordLoading(false);
        return;
      }
      
      await axios.put(`${API_URL}/api/users/password`, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      setPasswordDialogVisible(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      Alert.alert('Success', 'Password updated successfully');
    } catch (error) {
      console.error('Error updating password:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };
  
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Logout',
          onPress: () => logout(),
          style: 'destructive'
        }
      ]
    );
  };
  
  const renderProfileDialog = () => (
    <Dialog
      visible={profileDialogVisible}
      onDismiss={() => setProfileDialogVisible(false)}
      style={{ backgroundColor: theme.colors.card }}
    >
      <Dialog.Title style={{ color: theme.colors.text }}>Edit Profile</Dialog.Title>
      <Dialog.Content>
        <TextInput
          label="Name"
          value={profileForm.name}
          onChangeText={text => setProfileForm({ ...profileForm, name: text })}
          style={[styles.input, { backgroundColor: theme.colors.card }]}
          mode="outlined"
          error={!!formErrors.name}
        />
        {formErrors.name && <Text style={styles.errorText}>{formErrors.name}</Text>}
        
        <TextInput
          label="Email"
          value={profileForm.email}
          onChangeText={text => setProfileForm({ ...profileForm, email: text })}
          style={[styles.input, { backgroundColor: theme.colors.card }]}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          error={!!formErrors.email}
        />
        {formErrors.email && <Text style={styles.errorText}>{formErrors.email}</Text>}
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={() => setProfileDialogVisible(false)} color={theme.colors.placeholder}>
          Cancel
        </Button>
        <Button
          onPress={handleProfileUpdate}
          loading={profileLoading}
          disabled={profileLoading}
          color={theme.colors.primary}
        >
          Save
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
  
  const renderPasswordDialog = () => (
    <Dialog
      visible={passwordDialogVisible}
      onDismiss={() => setPasswordDialogVisible(false)}
      style={{ backgroundColor: theme.colors.card }}
    >
      <Dialog.Title style={{ color: theme.colors.text }}>Change Password</Dialog.Title>
      <Dialog.Content>
        <TextInput
          label="Current Password"
          value={passwordForm.currentPassword}
          onChangeText={text => setPasswordForm({ ...passwordForm, currentPassword: text })}
          style={[styles.input, { backgroundColor: theme.colors.card }]}
          mode="outlined"
          secureTextEntry
          error={!!formErrors.currentPassword}
        />
        {formErrors.currentPassword && <Text style={styles.errorText}>{formErrors.currentPassword}</Text>}
        
        <TextInput
          label="New Password"
          value={passwordForm.newPassword}
          onChangeText={text => setPasswordForm({ ...passwordForm, newPassword: text })}
          style={[styles.input, { backgroundColor: theme.colors.card }]}
          mode="outlined"
          secureTextEntry
          error={!!formErrors.newPassword}
        />
        {formErrors.newPassword && <Text style={styles.errorText}>{formErrors.newPassword}</Text>}
        
        <TextInput
          label="Confirm New Password"
          value={passwordForm.confirmPassword}
          onChangeText={text => setPasswordForm({ ...passwordForm, confirmPassword: text })}
          style={[styles.input, { backgroundColor: theme.colors.card }]}
          mode="outlined"
          secureTextEntry
          error={!!formErrors.confirmPassword}
        />
        {formErrors.confirmPassword && <Text style={styles.errorText}>{formErrors.confirmPassword}</Text>}
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={() => setPasswordDialogVisible(false)} color={theme.colors.placeholder}>
          Cancel
        </Button>
        <Button
          onPress={handlePasswordUpdate}
          loading={passwordLoading}
          disabled={passwordLoading}
          color={theme.colors.primary}
        >
          Update
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
        <Appbar.Content title="Settings" />
      </Appbar.Header>
      
      <ScrollView style={styles.content}>
        <View style={[styles.userInfo, { backgroundColor: theme.colors.card }]}>
          <Avatar.Text 
            size={72} 
            label={user?.name?.split(' ').map(n => n[0]).join('') || 'U'} 
            backgroundColor={theme.colors.primary}
          />
          <View style={styles.userDetails}>
            <Text style={[styles.userName, { color: theme.colors.text }]}>{user?.name}</Text>
            <Text style={[styles.userEmail, { color: theme.colors.placeholder }]}>{user?.email}</Text>
          </View>
        </View>
        
        <List.Section title="Account" titleStyle={{ color: theme.colors.text }}>
          <List.Item
            title="Edit Profile"
            left={props => <List.Icon {...props} icon="account-edit" />}
            onPress={() => setProfileDialogVisible(true)}
            titleStyle={{ color: theme.colors.text }}
            style={{ backgroundColor: theme.colors.card }}
          />
          <List.Item
            title="Change Password"
            left={props => <List.Icon {...props} icon="lock-reset" />}
            onPress={() => setPasswordDialogVisible(true)}
            titleStyle={{ color: theme.colors.text }}
            style={{ backgroundColor: theme.colors.card }}
          />
        </List.Section>
        
        <List.Section title="Appearance" titleStyle={{ color: theme.colors.text }}>
          <List.Item
            title="Dark Mode"
            left={props => <List.Icon {...props} icon={isDark ? "weather-night" : "white-balance-sunny"} />}
            right={props => <Switch value={isDark} onValueChange={toggleTheme} />}
            titleStyle={{ color: theme.colors.text }}
            style={{ backgroundColor: theme.colors.card }}
          />
        </List.Section>
        
        <List.Section title="About" titleStyle={{ color: theme.colors.text }}>
          <List.Item
            title="App Version"
            description="1.0.0"
            left={props => <List.Icon {...props} icon="information" />}
            titleStyle={{ color: theme.colors.text }}
            descriptionStyle={{ color: theme.colors.placeholder }}
            style={{ backgroundColor: theme.colors.card }}
          />
          <List.Item
            title="Privacy Policy"
            left={props => <List.Icon {...props} icon="shield-account" />}
            onPress={() => Linking.openURL('https://www.example.com/privacy')}
            titleStyle={{ color: theme.colors.text }}
            style={{ backgroundColor: theme.colors.card }}
          />
          <List.Item
            title="Terms of Service"
            left={props => <List.Icon {...props} icon="file-document" />}
            onPress={() => Linking.openURL('https://www.example.com/terms')}
            titleStyle={{ color: theme.colors.text }}
            style={{ backgroundColor: theme.colors.card }}
          />
        </List.Section>
        
        <Button
          mode="outlined"
          icon="logout"
          onPress={handleLogout}
          style={styles.logoutButton}
          color={theme.colors.error}
        >
          Logout
        </Button>
        
        <Portal>
          {renderProfileDialog()}
          {renderPasswordDialog()}
        </Portal>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  userDetails: {
    marginLeft: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
    marginTop: 4,
  },
  input: {
    marginVertical: 8,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginLeft: 8,
    marginTop: -4,
  },
  logoutButton: {
    marginVertical: 24,
  }
});

export default SettingsScreen; 