import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage'; 

const handleLogout = async () => {
  await AsyncStorage.removeItem('token');
  navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
};

export default function SearchScreen({ navigation }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
          const token = await AsyncStorage.getItem('token');
          const response = await axios.get('https://ann-flaw-detection-system-for-train.onrender.com/api/reports', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          setReports(response.data.data);
          setFilteredReports(response.data.data);
      } catch (err) {
        console.error('Error fetching reports:', err);
          if (err.response?.status === 401) {
            Alert.alert('Session Expired', 'Please log in again.');
            handleLogout();
          }
      }
    };
    fetchReports();
  }, []);

  const handleSearch = (text) => {
    const query = text.toLowerCase();
    setSearchTerm(query);

    const filtered = reports.filter((r) => {
      const date = new Date(r.timestamp).toLocaleDateString('en-US');
      const combined = `
        ${r.name}
        t${r.trainNumber}
        train ${r.trainNumber}
        c${r.compartmentNumber}
        compartment ${r.compartmentNumber}
        w${r.wheelNumber}
        wheel ${r.wheelNumber}
        ${date}
      `.toLowerCase();

      return combined.includes(query);
    });

    setFilteredReports(filtered);
  };


  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('View Report', { reportId: item._id })}
    >
      <View style={styles.reportItem}>
        <Text style={styles.reportName}>{item.name}</Text>
        <Text style={styles.reportDate}>
          {new Date(item.timestamp).toLocaleDateString('en-US')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search for Reports..."
          style={styles.searchInput}
          value={searchTerm}
          onChangeText={handleSearch}
        />
        <Icon name="search" size={24} color="#000" />
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.resultsHeader}>REPORTS</Text>
        <FlatList
          data={filteredReports}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
        />
        {filteredReports.length === 0 && (
          <Text style={{ textAlign: 'center', marginTop: 20, color: '#666' }}>
            No matching reports found.
          </Text>
        )}
      </View>
            <View style={{borderColor: 'transparent', borderWidth: 0, height: 60}}>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  logo: {
    alignSelf: 'center',
    height: 360,
    width: 120,
    marginTop: -110,
    marginBottom: -150,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 40,
  },
  resultsCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
  },
  resultsHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  reportItem: {
    marginBottom: 12,
  },
  reportName: {
    fontSize: 16,
    fontWeight: '500',
  },
  reportDate: {
    fontSize: 13,
    color: '#777',
  },
    sectionContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: '#fff',
    marginBottom: 0,
    paddingBottom: 245,
    padding: 12,
  },
});
