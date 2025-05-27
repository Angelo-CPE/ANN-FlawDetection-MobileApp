import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView } from 'react-native';
import axios from 'axios';

export default function SurfaceFlawScreen({ navigation }) {
  const [reports, setReports] = useState([]);
  const [latestReport, setLatestReport] = useState(null);
  const [socket, setSocket] = useState(null);

  // Fetch initial reports and setup WebSocket
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await axios.get('http://192.168.1.11:5000/api/reports');
        const sortedReports = response.data.sort((a, b) => 
          new Date(b.timestamp) - new Date(a.timestamp)
        );
        setReports(sortedReports);
        setLatestReport(sortedReports[0]);  // Set the latest report as the first one in the array
      } catch (error) {
        console.error('Error fetching reports:', error);
      }
    };

    fetchReports();

    // WebSocket setup with reconnection logic
    const setupWebSocket = () => {
      const ws = new WebSocket('ws://192.168.1.11:5000');


      ws.onopen = () => {
        console.log('WebSocket connected');
        setSocket(ws);
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setTimeout(setupWebSocket, 5000); // Reconnect after 5 seconds
      };

      return ws;
    };

    const ws = setupWebSocket();

    return () => {
      if (ws) ws.close();
    };
  }, []);

  const handleWebSocketMessage = (message) => {
    console.log('WS Message:', message.type, message.data);
    
    switch (message.type) {
      case 'new_report':
        setReports(prev => {
          const exists = prev.some(r => r._id === message.data._id);
          if (!exists) {
            const newReports = [message.data, ...prev];
            setLatestReport(newReports[0]);
            return newReports;
          }
          return prev;
        });
        break;
  
      case 'updated_report':
        setReports(prev => {
          const updated = prev.map(r => 
            r._id === message.data._id ? message.data : r
          );
          setLatestReport(updated[0]);
          return updated;
        });
        break;
  
      case 'deleted_report':
        setReports(prev => {
          const filtered = prev.filter(r => r._id !== message.data._id);
          setLatestReport(filtered[0] || null);
          return filtered;
        });
        break;
  
      default:
        console.warn('Unknown message type:', message.type);
    }
  };

  const renderReportCard = (report) => (
    <View style={styles.sectionContainer}>
      <View style={styles.card}>
        {report.image_path ? (  // Changed from image_id to image_path
          <Image
            source={{ uri: `http://192.168.1.11:5000${report.image_path}` }}  // Updated path
            style={styles.reportImage}
          />
        ) : (
          <Text>No Image Available</Text>
        )}
  
        <Text style={styles.cardTitle}>{report.name}</Text>
        
        {/* Table with proper data binding */}
        <View style={styles.tableRow}>
          <Text style={styles.tableHeader}>Train #</Text>
          <Text style={styles.tableHeader}>Compartment #</Text>
          <Text style={styles.tableHeader}>Wheel #</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>{report.trainNumber || 'N/A'}</Text>
          <Text style={styles.tableCell}>{report.compartmentNumber || 'N/A'}</Text>
          <Text style={styles.tableCell}>{report.wheelNumber || 'N/A'}</Text>
        </View>
        
        {/* Status section */}
        <View style={styles.tableRow}>
          <Text style={styles.tableHeader}>Status</Text>
          <Text style={styles.tableHeader}>Recommendation</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, report.status === 'FLAW DETECTED' ? styles.flawedText : styles.normalText]}>
            {report.status}
          </Text>
          <Text style={styles.tableCell}>{report.recommendation}</Text>
        </View>
      </View>
    </View>
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.reportItem} 
      onPress={() => navigation.navigate('View Report', { reportId: item._id })}
    >
      <Text style={styles.reportName}>{item.name}</Text>
      <Text style={styles.reportDate}>
        {new Date(item.timestamp).toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: '2-digit'
        })}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* App Logo */}
      <Image 
        source={require('../assets/logo.png')}
        style={styles.appLogo}
        resizeMode="contain"
      />
      
      <View style={styles.tabsContainer}>
        <Text style={styles.activeTab}>Surface Flaw</Text>
        <Text style={styles.inactiveTab}>Wheel Diameter</Text>
      </View>
      
      {/* Surface Flaw Report #9 Section - Latest Report */}
      {latestReport ? renderReportCard(latestReport) : null}

      {/* Reports Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>REPORTS</Text>
        
        <FlatList

          data={reports}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={styles.reportDivider} />}
        />
      </View>
      <View style={{borderColor: 'transparent', borderWidth: 0, height: 60}}>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  appLogo: {
    width: 360, 
    height: 120, 
    alignSelf: 'center',
    marginTop: 26,
    marginBottom: -30
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 16,
    color: '#000',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  activeTab: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    color: '#000',
  },
  inactiveTab: {
    fontSize: 18,
    marginHorizontal: 16,
    color: '#888',
  },
  sectionContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: '#fff',
    marginBottom: 16,
    padding: 12,
  },
  card: {
    backgroundColor: '#fff',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    width: 300,
  },
  tableHeader: {
    flex: 1,
    fontWeight: 'bold',
    fontSize: 12,
    color: '#000',
  },
  tableCell: {
    flex: 1,
    color: '#888',
  },
    flawedText: {
    color: 'green',
  },
  flawedText: {
    color: 'red',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  reportItem: {
    paddingVertical: 8,
  },
  reportName: {
    fontSize: 16,
    color: '#000',
  },
  reportDate: {
    fontSize: 14,
    color: '#888',
  },
  reportImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginTop: 15,
  },
  reportDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 4
  },
});
