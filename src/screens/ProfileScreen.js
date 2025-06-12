import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          setError('No authentication token found');
          setLoading(false);
          return;
        }

        const response = await axios.get('https://ann-flaw-detection-system-for-train.onrender.com/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data && response.data.success) {
          setUser(response.data.data);
        } else {
          setError('Failed to fetch user data');
        }
      } catch (err) {
        console.error('Error fetching user info:', err);
        if (err.response) {
          if (err.response.status === 401) {
            setError('Session expired. Please login again.');
            await AsyncStorage.removeItem('token');
            navigation.navigate('Login');
          } else {
            setError(err.response.data?.error || 'Failed to fetch user data');
          }
        } else {
          setError('Network error. Please check your connection.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleOpenAdminPanel = () => {
    navigation.navigate('AdminPanel');
  };

  const handleForgotPassword = () => {
    navigation.navigate('OTPRequest');
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            await AsyncStorage.removeItem('token');
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#4a6da7" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Icon name="error-outline" size={50} color="#d32f2f" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.retryButtonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image
              source={require('../assets/default-avatar.jpg')} 
              style={styles.avatar}
            />
          </View>
          <Text style={styles.title}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user.role.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleForgotPassword}
          >
            <Icon name="lock-reset" size={24} color="#4a6da7" />
            <Text style={styles.actionButtonText}>Change Password</Text>
            <Icon name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity>

          {user.role === 'admin' && (
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={handleOpenAdminPanel}
            >
              <Icon name="admin-panel-settings" size={24} color="#c62828" />
              <Text style={styles.actionButtonText}>Admin Panel</Text>
              <Icon name="chevron-right" size={24} color="#ccc" />
            </TouchableOpacity>
          )}

          <View style={styles.divider} />

          <TouchableOpacity 
            style={[styles.actionButton, styles.logoutButton]} 
            onPress={handleLogout}
          >
            <Icon name="logout" size={24} color="#d32f2f" />
            <Text style={[styles.actionButtonText, styles.logoutButtonText]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingBottom: 30,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#555',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 20,
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4a6da7',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  profileHeader: {
    paddingTop: 80,
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#fff',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e1e5ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#c62828',
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 15,
  },
  roleBadge: {
    backgroundColor: '#c62828',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  actionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 15,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
    marginLeft: 15,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#ecf0f1',
    marginHorizontal: 20,
  },
  logoutButton: {
    borderTopWidth: 0,
  },
  logoutButtonText: {
    color: '#d32f2f',
  },
});