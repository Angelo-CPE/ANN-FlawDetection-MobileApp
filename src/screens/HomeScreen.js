import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, Button, StyleSheet, TouchableOpacity } from 'react-native';
import axios from 'axios';
import ReportItem from '../components/ReportItem';
import Icon from 'react-native-vector-icons/MaterialIcons';  // Importing icons

export default function HomeScreen({ navigation }) {
  const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredReports, setFilteredReports] = useState([]);
  const [sortBy, setSortBy] = useState('name'); // Default sorting by name

  useEffect(() => {
    // Fetch initial reports from the server
    const fetchReports = async () => {
      try {
        const response = await axios.get('http://192.168.1.11:5000/api/reports'); // Your backend URL
        setReports(response.data);
        setFilteredReports(response.data); // Initialize with all reports
      } catch (error) {
        console.error('Error fetching reports:', error);
      }
    };

    fetchReports();

    // WebSocket setup to listen for new reports
    const socket = new WebSocket('ws://192.168.1.11:5000'); // Connect to the WebSocket server

    socket.onopen = () => {
      console.log('Connected to WebSocket');
    };

    socket.onmessage = (event) => {
      const newReport = JSON.parse(event.data).data;
      console.log('New report received:', newReport);
      setReports((prevReports) => [newReport, ...prevReports]); // Add new report at the top
      setFilteredReports((prevReports) => [newReport, ...prevReports]);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error.message);
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    // Cleanup WebSocket connection when the component unmounts
    return () => {
      socket.close();
    };
  }, []);

  const handleSearch = (text) => {
    setSearchTerm(text);
    if (text) {
      const filtered = reports.filter(report =>
        report.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredReports(filtered);
    } else {
      setFilteredReports(reports); // Show all reports when search is empty
    }
  };

  const handleSort = (criteria) => {
    setSortBy(criteria);
    let sortedReports;
    if (criteria === 'name') {
      sortedReports = [...filteredReports].sort((a, b) => a.name.localeCompare(b.name));
    } else if (criteria === 'date') {
      sortedReports = [...filteredReports].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } else if (criteria === 'status') {
      sortedReports = [...filteredReports].sort((a, b) => (a.status === 'FLAW DETECTED' ? 1 : 0) - (b.status === 'FLAW DETECTED' ? 1 : 0));
    }
    setFilteredReports(sortedReports);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search by Report Name"
        value={searchTerm}
        onChangeText={handleSearch}
      />
      <View style={styles.sortContainer}>
        <TouchableOpacity style={styles.sortButton} onPress={() => handleSort('name')}>
          <Icon name="sort" size={24} color="white" />
          <Text style={styles.sortText}>Name</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sortButton} onPress={() => handleSort('date')}>
          <Icon name="calendar-today" size={24} color="white" />
          <Text style={styles.sortText}>Date</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sortButton} onPress={() => handleSort('status')}>
          <Icon name="priority-high" size={24} color="white" />
          <Text style={styles.sortText}>Status</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={filteredReports}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <ReportItem report={item} navigation={navigation} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff',  // White background
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  sortContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f44336',  // Red background for sorting buttons
    padding: 10,
    borderRadius: 5,
  },
  sortText: {
    color: 'white',
    marginLeft: 5,
    fontWeight: 'bold',
  },
});
