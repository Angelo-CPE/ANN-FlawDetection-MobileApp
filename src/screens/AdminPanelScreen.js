import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { MaterialIcons } from '@expo/vector-icons';

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('asc');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [adminPassword, setAdminPassword] = useState('');

  const handlePasswordSubmit = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    await axios.post(
      'https://ann-flaw-detection-system-for-train.onrender.com/api/admin/confirm-password',
      { password: adminPassword },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    await toggleUserStatus(selectedUserId, true);
    setModalVisible(false);
    setAdminPassword('');
  } catch (err) {
    Alert.alert('Error', err.response?.data?.error || 'Password verification failed');
  }
};
  const endpointMap = {
    active: '/api/admin/users',
    archived: '/api/admin/users/archived',
    all: '/api/admin/users/all',
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const endpoint = `https://ann-flaw-detection-system-for-train.onrender.com${endpointMap[activeTab]}`;
      
      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(response.data.data);
      setFilteredUsers(response.data.data);
    } catch (err) {
      console.error('Error fetching users:', err);
      Alert.alert('Error', 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [activeTab]);

  useEffect(() => {
    filterAndSortUsers();
  }, [searchQuery, roleFilter, sortOrder, users]);

  const filterAndSortUsers = () => {
  let result = [...users];
  
  // Apply search filter
  if (searchQuery) {
    result = result.filter(user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  
  // Apply role filter
  if (roleFilter !== 'all') {
    result = result.filter(user => user.role === roleFilter);
  }
  
  // Apply sorting
  result.sort((a, b) => {
    if (sortOrder === 'asc') {
      return a.name.localeCompare(b.name);
    } else {
      return b.name.localeCompare(a.name);
    }
  });
  
  setFilteredUsers(result);
};

  const toggleUserRole = async (userId, currentRole) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const endpoint = currentRole === 'admin' 
        ? `https://ann-flaw-detection-system-for-train.onrender.com/api/admin/users/${userId}/demote`
        : `https://ann-flaw-detection-system-for-train.onrender.com/api/admin/users/${userId}/promote`;
      
      await axios.patch(
        endpoint,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      Alert.alert(
        'Success', 
        `User ${currentRole === 'admin' ? 'demoted to regular user' : 'promoted to admin'}`
      );
      fetchUsers();
    } catch (err) {
      console.error('Error updating user role:', err);
      Alert.alert(
        'Error', 
        err.response?.data?.error || 'Failed to update user role'
      );
    }
  };

  const toggleUserStatus = async (userId, shouldDeactivate) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const endpoint = shouldDeactivate
        ? `https://ann-flaw-detection-system-for-train.onrender.com/api/admin/users/${userId}/deactivate`
        : `https://ann-flaw-detection-system-for-train.onrender.com/api/admin/users/${userId}/reactivate`;

      await axios.put(
        endpoint,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Alert.alert(
        'Success',
        `User ${shouldDeactivate ? 'deactivated' : 'reactivated'} successfully`
      );
      fetchUsers();
    } catch (err) {
      console.error('Error toggling user status:', err);
      Alert.alert(
        'Error',
        err.response?.data?.error || 'Failed to update user status'
      );
    }
  };

  const promptPasswordAndDeactivate = (userId) => {
    let password = '';
    Alert.prompt(
      'Confirm Deactivation',
      'Enter your password to deactivate this user',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: async (value) => {
            password = value;
            try {
              const token = await AsyncStorage.getItem('token');
              await axios.post(
                `https://ann-flaw-detection-system-for-train.onrender.com/api/admin/confirm-password`, 
                { password }, 
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              await toggleUserStatus(userId, true);
            } catch (err) {
              Alert.alert('Error', err.response?.data?.error || 'Password verification failed');
            }
          },
        },
      ],
      'secure-text'
    );
  };

  const renderUserItem = ({ item }) => (
  <View style={styles.userCard}>
    <View style={styles.userInfo}>
      <Text style={styles.userName}>{item.name}</Text>
      <Text style={styles.userEmail}>{item.email}</Text>
      <View style={styles.userMeta}>
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusIndicator,
            item.isActive ? styles.activeIndicator : styles.archivedIndicator
          ]} />
          <Text style={styles.statusText}>
            {item.isActive ? 'Active' : 'Archived'}
          </Text>
        </View>
        <Text style={styles.userRole}>Role: {item.role}</Text>
        <Text style={styles.userDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </View>
    <View style={styles.userActions}>
      {item.role === 'admin' ? (
        <TouchableOpacity
          style={[styles.actionButton, styles.demoteButton]}
          onPress={() => toggleUserRole(item._id, item.role)}
        >
          <Text style={styles.actionButtonText}>Demote</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.actionButton, styles.promoteButton]}
          onPress={() => toggleUserRole(item._id, item.role)}
        >
          <Text style={styles.actionButtonText}>Promote</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={[
          styles.actionButton, 
          item.isActive ? styles.deactivateButton : styles.reactivateButton
        ]}
        onPress={() => {
          if (item.isActive) {
            setSelectedUserId(item._id);
            setModalVisible(true);
          } else {
            toggleUserStatus(item._id, false);
          }
        }}
      >
        <Text style={styles.actionButtonText}>
          {item.isActive ? 'Deactivate' : 'Reactivate'}
        </Text>
      </TouchableOpacity>
    </View>
  </View>
);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Users</Text>
      
      <View style={styles.tabs}>
        {['all', 'active', 'archived'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={styles.tabText}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)} Users
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <MaterialIcons name="search" size={24} color="#666" style={styles.searchIcon} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, roleFilter === 'all' && styles.activeFilter]}
          onPress={() => setRoleFilter('all')}
        >
          <Text style={[styles.filterText, roleFilter === 'all' && styles.activeFilterText]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, roleFilter === 'admin' && styles.activeFilter]}
          onPress={() => setRoleFilter('admin')}
        >
          <Text style={[styles.filterText, roleFilter === 'admin' && styles.activeFilterText]}>Admins</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, roleFilter === 'user' && styles.activeFilter]}
          onPress={() => setRoleFilter('user')}
        >
          <Text style={[styles.filterText, roleFilter === 'user' && styles.activeFilterText]}>Users</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, styles.sortButton]}
          onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
        >
          <Text style={styles.filterText}>
            Sort: {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {loading ? (
        <ActivityIndicator size="large" color="#000" style={styles.loader} />
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No users found</Text>
          }
        />
      )}

      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Confirm Deactivation</Text>
            <TextInput
              secureTextEntry
              placeholder="Enter your password"
              style={styles.modalInput}
              value={adminPassword}
              onChangeText={setAdminPassword}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCancel}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handlePasswordSubmit} style={styles.modalConfirm}>
                <Text style={styles.modalButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#000',
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',

  },
  tab: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#000',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  searchContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    paddingLeft: 40,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    position: 'absolute',
    left: 10,
    top: 10,
  },
  filterContainer: {
    marginBottom: -50
  },
  filterButton: {
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 10,
    maxHeight: 40,
    minHeight: 40
  },
  activeFilter: {
    backgroundColor: '#000',
  },
  filterText: {
    color: '#000',
    fontSize: 14,
  },
  activeFilterText: {
    color: '#fff',
  },
  sortButton: {
    backgroundColor: '#e0e0e0',
  },
  listContent: {
    paddingBottom: 20,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userInfo: {
    marginBottom: 10,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  userMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
    flexWrap: 'wrap',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  activeIndicator: {
    backgroundColor: '#4CAF50',
  },
  archivedIndicator: {
    backgroundColor: '#F44336',
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  userRole: {
    fontSize: 14,
    color: '#444',
  },
  userDate: {
    fontSize: 12,
    color: '#999',
  },
  userActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    minWidth: '48%',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  promoteButton: {
    backgroundColor: '#000',
  },
  demoteButton: {
    backgroundColor: '#000',
  },
  deactivateButton: {
    backgroundColor: '#d32f2f',
  },
  reactivateButton: {
    backgroundColor: '#000',
  },
  loader: {
    marginTop: 50,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },

  modalBackground: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: 300,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancel: {
    backgroundColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  modalConfirm: {
    backgroundColor: '#000',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },

});