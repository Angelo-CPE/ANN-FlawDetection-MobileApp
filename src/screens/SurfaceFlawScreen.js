import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  RefreshControl
} from 'react-native';
import axios from 'axios';
import io from 'socket.io-client';

const screenWidth = Dimensions.get('window').width;
const API_URL = 'http://192.168.1.11:5000';

export default function SurfaceFlawScreen({ navigation }) {
  const [reports, setReports] = useState([]);
  const [groupedReports, setGroupedReports] = useState({});
  const [selectedTrain, setSelectedTrain] = useState(null);
  const [selectedCompartment, setSelectedCompartment] = useState(null);
  const [latestReport, setLatestReport] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const socket = io(API_URL);
    
    socket.on('report_updated', (updatedReport) => {
      setReports(prev => {
        const existingIndex = prev.findIndex(r => r._id === updatedReport._id);
        let newReports;
        
        if (existingIndex >= 0) {
          newReports = [...prev];
          newReports[existingIndex] = updatedReport;
        } else {
          newReports = [updatedReport, ...prev];
        }
        
        return newReports.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      });
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    if (reports.length > 0) {
      groupByTrain(reports);
      setLatestReport(reports[0]);
    }
  }, [reports]);

const fetchReports = async () => {
  try {
    setRefreshing(true);
    const response = await axios.get(`${API_URL}/api/reports`);
    console.log('API Response:', response.data); // Add this line
    const sortedReports = response.data.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    setReports(sortedReports);
  } catch (error) {
    console.error('Error fetching reports:', error);
  } finally {
    setRefreshing(false);
  }
};

  const groupByTrain = (reports) => {
    const grouped = {};
    reports.forEach((report) => {
      const { trainNumber, compartmentNumber } = report;
      if (!grouped[trainNumber]) grouped[trainNumber] = {};
      if (!grouped[trainNumber][compartmentNumber]) grouped[trainNumber][compartmentNumber] = [];
      grouped[trainNumber][compartmentNumber].push(report);
    });
    setGroupedReports(grouped);
  };

  const getTrainStatus = (trainReports) => {
    const allReports = Object.values(trainReports).flat();
    return allReports.some(r => r.status === 'FLAW DETECTED')
      ? 'FLAW DETECTED' 
      : 'NO FLAW';
  };

  const renderLatestReportCard = () => {
    if (!latestReport || !groupedReports[latestReport.trainNumber]) return null;
    
    const trainReports = groupedReports[latestReport.trainNumber];
    const trainStatus = getTrainStatus(trainReports);
    const recommendation = trainStatus === 'FLAW DETECTED' 
      ? 'Inspection needed' 
      : 'Operational';
    
    const matchingReports = Object.values(trainReports)
      .flat()
      .filter(r => r.image_path)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return (
      <View style={styles.sectionContainer}>
        <View style={styles.card}>
          <FlatList
            data={matchingReports.slice(0, 5)} 
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity 
                onPress={() => navigation.navigate('View Report', { reportId: item._id })} 
                style={{ marginRight: 10 }}
              >
                <View style={{ position: 'relative' }}>
                  <Image
                    source={{ uri: `${API_URL}${item.image_path}` }}
                    style={styles.reportImage}
                  />
                  <View style={{
                    position: 'absolute',
                    top: 10,
                    right: 20,
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: item.status === 'FLAW DETECTED' ? 'red' : 'green',
                    borderWidth: 1,
                    borderColor: '#fff'
                  }} />
                </View>
                <View style={{ flexDirection: 'row', marginTop: 4 }}>
                  <Text style={styles.imageLabel}>Compartment {item.compartmentNumber}</Text>
                  <Text style={styles.imageLabel}>  | Wheel {item.wheelNumber}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
          <Text style={styles.cardTitle}>Train {latestReport.trainNumber}</Text>
          <View style={styles.tableRow}>
            <Text style={styles.tableHeader}>Status</Text>
            <Text style={styles.tableHeader}>Recommendation</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, trainStatus === 'FLAW DETECTED' ? styles.flawedText : styles.normalText]}>
              {trainStatus}
            </Text>
            <Text style={styles.tableCell}>{recommendation}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderCompartmentButtons = () => {
    if (!selectedTrain) return null;
    const compartments = groupedReports[selectedTrain];
    return (
      <View style={styles.compartmentContainer}>
        {Object.entries(compartments).map(([compNum, reports]) => {
          const hasFlaw = reports.some(r => r.status === 'FLAW DETECTED');
          return (
            <TouchableOpacity
              key={compNum}
              style={styles.compartmentButton}
              onPress={() => setSelectedCompartment(compNum)}
            >
              <Text style={styles.compartmentText}>C{compNum}</Text>
              <View style={[styles.statusDot, { backgroundColor: hasFlaw ? 'red' : 'green' }]} />
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderTrainList = () => {
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.cardTitle}>All Trains</Text>
      {Object.entries(groupedReports).map(([trainNumber, compartments]) => {
        const allReports = Object.values(compartments).flat();
        const hasFlaw = allReports.some(r => r.status === 'FLAW DETECTED');
        const latestTimestamp = allReports.length
          ? new Date(Math.max(...allReports.map(r => new Date(r.timestamp)))).toLocaleDateString()
          : 'N/A';
        const isSelected = selectedTrain === trainNumber;

        return (
          <View key={trainNumber} style={[styles.trainCard, { marginBottom: 16 }]}>
            <TouchableOpacity onPress={() => {
              setSelectedTrain(isSelected ? null : trainNumber);
              setSelectedCompartment(null);
            }}>
              <Text style={styles.trainTitle}>Train {trainNumber}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.trainInfo}>Date: {latestTimestamp}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[styles.trainInfo, hasFlaw ? styles.flawedText : styles.normalText]}>
                    {hasFlaw ? 'Flaw Detected' : 'Good Condition'}
                  </Text>
                  <View style={[styles.statusDot, { backgroundColor: hasFlaw ? 'red' : 'green', marginLeft: 6 }]} />
                </View>
              </View>
            </TouchableOpacity>

            {isSelected && (
              <>
                <TouchableOpacity
                  onPress={() => console.log(`Print Train ${trainNumber} Report`)}
                  style={{ marginTop: 10, padding: 10, backgroundColor: '#000', borderRadius: 6 }}
                >
                  <Text style={{ color: '#fff', textAlign: 'center' }}>Print Report</Text>
                </TouchableOpacity>

                {/* Render Compartments */}
                <View style={styles.compartmentContainer}>
                  {Object.entries(compartments).map(([compNum, compReports]) => {
                    const hasFlaw = compReports.some(r => r.status === 'FLAW DETECTED');
                    return (
                      <TouchableOpacity
                        key={compNum}
                        style={styles.compartmentButton}
                        onPress={() => setSelectedCompartment(compNum)}
                      >
                        ~<View style={[styles.statusDot, { backgroundColor: hasFlaw ? 'red' : 'green' }]} />

                        <Text style={styles.compartmentText}>  C{compNum}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Render Wheels */}
                {selectedCompartment && compartments[selectedCompartment] && (
                  <FlatList
                    data={compartments[selectedCompartment]}
                    keyExtractor={(item) => item._id}
                    numColumns={2}
                    columnWrapperStyle={styles.columnWrapper}
                    contentContainerStyle={styles.wheelList}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.wheelCard}
                        onPress={() => navigation.navigate('View Report', { reportId: item._id })}
                      >
                        <Image
                          source={{ uri: `${API_URL}${item.image_path}` }}
                          style={styles.wheelImage}
                        />
                        <View>
                          <Text style={styles.wheelLabel}>Wheel {item.wheelNumber}</Text>
                          <Text style={item.status === 'FLAW DETECTED' ? styles.flawedText : styles.normalText}>
                            {item.status}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}

                  />
                )}
              </>
            )}
          </View>
        );
      })}
    </View>
  );
};


  const renderWheels = () => {
    if (!selectedTrain || !selectedCompartment) return null;
    
    const wheels = groupedReports[selectedTrain]?.[selectedCompartment] || [];
    const compartmentStatus = wheels.some(w => w.status === 'FLAW DETECTED') 
      ? 'FLAW DETECTED' 
      : 'NO FLAW';

    return (
      <View style={styles.sectionContainer}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text style={styles.cardTitle}>Compartment {selectedCompartment}</Text>
          <Text style={compartmentStatus === 'FLAW DETECTED' ? styles.flawedText : styles.normalText}>
            {compartmentStatus}
          </Text>
        </View>
        
        <FlatList
          data={wheels}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.wheelList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.wheelCard}
              onPress={() => navigation.navigate('View Report', { reportId: item._id })}
            >
              <Image 
                source={{ uri: `${API_URL}${item.image_path}` }} 
                style={styles.wheelImage} 
              />
              <Text style={styles.wheelLabel}>Wheel {item.wheelNumber}</Text>
              <Text style={item.status === 'FLAW DETECTED' ? styles.flawedText : styles.normalText}>
                {item.status}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={fetchReports}
        />
      }
    >
      <Image 
        source={require('../assets/logo.png')} 
        style={styles.appLogo} 
        resizeMode="contain" 
      />
      <Text style={styles.header}>Latest Report</Text>
      {renderLatestReportCard()}
      {renderTrainList()}
      {renderCompartmentButtons()}
      {renderWheels()}
    </ScrollView>
  );
}


const styles = StyleSheet.create({

   columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  wheelList: {
    paddingVertical: 8,
  },
  wheelCard: {
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#eee',
  },
  imageLabel: {
    fontSize: 12, 
    color: '#555',
    marginHorizontal: 2,
  },
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  appLogo: {
    width: '100%',
    height: 100,
    marginBottom: -10,
  },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  trainCard: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#f9f9f9'
  },
  trainTitle: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  trainInfo: { fontSize: 14, color: '#666' },
  flawedText: { color: 'red', fontWeight: 'bold' },
  normalText: { color: 'green', fontWeight: 'bold' },
  compartmentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 12,
    flexWrap: 'wrap'
  },
  compartmentButton: {
  flexDirection: 'row',           
  alignItems: 'center',           
  backgroundColor: '#e0e0e0',
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderRadius: 20,
  margin: 6,
},
  compartmentText: { fontWeight: 'bold', color: '#000' },
  statusDot: {
  width: 10,
  height: 10,
  borderRadius: 5,
  backgroundColor: 'gray',        // default color (overridden inline)
  },

  wheelList: {
    paddingBottom: 100,
    alignItems: 'center'
  },
  wheelCard: {
    flexDirection: 'row',           // horizontal layout
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginVertical: 8,
    marginHorizontal: 5,
    padding: 10,
    backgroundColor: '#fff',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  wheelImage: {
  width: 90,
  height: 90,
  borderRadius: 10,
  marginRight: 12,
  },
  wheelLabel: {
    fontWeight: 'bold',
    color: '#000',
    fontSize: 16,
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
  reportImage: {
    width: 180,
    height: 120,
    borderRadius: 10,
    marginRight: 10,
  },
});
