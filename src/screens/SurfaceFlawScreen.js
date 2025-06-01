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
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Buffer } from 'buffer';

const screenWidth = Dimensions.get('window').width;
const API_URL = 'https://ann-flaw-detection-system-for-train.onrender.com';

export default function SurfaceFlawScreen({ navigation }) {
  const [reports, setReports] = useState([]);
  const [groupedReports, setGroupedReports] = useState({});
  const [selectedTrain, setSelectedTrain] = useState(null);
  const [selectedCompartment, setSelectedCompartment] = useState(null);
  const [latestReport, setLatestReport] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchImageAsBase64 = async (imagePath) => {
    try {
      const response = await axios.get(`${API_URL}${imagePath}`, {
        responseType: 'arraybuffer',
      });
      const base64 = `data:image/jpeg;base64,${Buffer.from(response.data, 'binary').toString('base64')}`;
      return base64;
    } catch (error) {
      console.error('Error fetching image:', error);
      return null;
    }
  };

  const generateTrainHTML = async (trainNumber, trainReports) => {
    let html = `
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <style>
          body { font-family: Arial; padding: 20px; color: #333; }
          h1 { font-size: 26px; margin-bottom: 20px; }
          h2 { font-size: 22px; margin-top: 30px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
          h3 { font-size: 18px; margin-top: 20px; color: #444; }
          img { max-width: 100%; max-height: 300px; border-radius: 8px; margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
          th, td { border: 1px solid #ccc; padding: 6px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>Inspection Report - Train ${trainNumber}</h1>
    `;

    const compartments = Object.entries(trainReports).sort(([a], [b]) => a - b);

    for (const [compNum, reports] of compartments) {
      html += `<h2>Compartment ${compNum}</h2>`;

      const sortedReports = reports.sort((a, b) => a.wheelNumber - b.wheelNumber);

      for (const r of sortedReports) {
        const base64Image = r.image_path ? await fetchImageAsBase64(r.image_path) : null;
        html += `
          <h3>Wheel ${r.wheelNumber}</h3>
          ${base64Image ? `<img src="${base64Image}" />` : '<p>No image available.</p>'}
          <table>
            <tr><th>Train No.</th><td>${r.trainNumber}</td></tr>
            <tr><th>Compartment No.</th><td>${r.compartmentNumber}</td></tr>
            <tr><th>Wheel No.</th><td>${r.wheelNumber}</td></tr>
            <tr><th>Wheel Diameter</th><td>${r.wheel_diameter || 'N/A'}</td></tr>
            <tr><th>Status</th><td>${r.status}</td></tr>
            <tr><th>Recommendation</th><td>${r.recommendation}</td></tr>
          </table>
        `;
      }
    }

    html += `</body></html>`;
    return html;
  };

  const handleTrainReportExport = async (trainNumber, compartments) => {
    try {
      const html = await generateTrainHTML(trainNumber, compartments);
      const { uri } = await Print.printToFileAsync({ html });
      const fileName = `Train_${trainNumber}_Report.pdf`;
      const newPath = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.moveAsync({ from: uri, to: newPath });
      await Sharing.shareAsync(newPath);
    } catch (error) {
      console.error('Failed to export PDF:', error);
    }
  };

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
        
        return newReports.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp) || 
               a.trainNumber - b.trainNumber ||
               a.compartmentNumber - b.compartmentNumber ||
               a.wheelNumber - b.wheelNumber);
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
      const sortedReports = response.data.data.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp) || 
        a.trainNumber - b.trainNumber ||
        a.compartmentNumber - b.compartmentNumber ||
        a.wheelNumber - b.wheelNumber
      );
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
        ? 'For Repair/Replacement' 
        : 'For Consistent Monitoring';
      
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
        const reportsByDate = {};
        Object.values(compartments)
          .flat()
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .forEach(report => {
            const date = new Date(report.timestamp).toLocaleDateString();
            if (!reportsByDate[date]) {
              reportsByDate[date] = {};
            }
            if (!reportsByDate[date][report.compartmentNumber]) {
              reportsByDate[date][report.compartmentNumber] = [];
            }
            reportsByDate[date][report.compartmentNumber].push(report);
          });

        return Object.entries(reportsByDate).map(([date, dateCompartments]) => {
          const hasFlaw = Object.values(dateCompartments)
            .flat()
            .some(r => r.status === 'FLAW DETECTED');
          const isSelected = selectedTrain === `${trainNumber}-${date}`;

          return (
            <View key={`${trainNumber}-${date}`} style={[styles.trainCard, { marginBottom: 16 }]}>
              <TouchableOpacity onPress={() => {
                setSelectedTrain(isSelected ? null : `${trainNumber}-${date}`);
                setSelectedCompartment(null);
              }}>
                <Text style={styles.trainTitle}>Train {trainNumber}</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.trainInfo}>Date: {date}</Text>
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
                    onPress={() => handleTrainReportExport(trainNumber, dateCompartments)}
                    style={{ marginTop: 10, padding: 10, backgroundColor: '#000', borderRadius: 6 }}
                  >
                    <Text style={{ color: '#fff', textAlign: 'center' }}>Print Report</Text>
                  </TouchableOpacity>

                  <View style={styles.compartmentContainer}>
                    {Object.entries(dateCompartments).map(([compNum, compReports]) => {
                      const hasFlaw = compReports.some(r => r.status === 'FLAW DETECTED');
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

                  {selectedCompartment && dateCompartments[selectedCompartment] && (
                    <View style={styles.wheelGrid}>
                      {dateCompartments[selectedCompartment].map((item) => (
                        <TouchableOpacity
                          key={item._id}
                          style={styles.wheelCard}
                          onPress={() => navigation.navigate('View Report', { reportId: item._id })}
                        >
                          {item.image_path ? (
                            <Image
                              source={{ uri: `${API_URL}${item.image_path}` }}
                              style={styles.wheelImage}
                              resizeMode="cover"
                              onError={(e) => console.log('Image error:', e.nativeEvent.error)}
                            />
                          ) : (
                            <View style={styles.imagePlaceholder}>
                              <Text>No Image</Text>
                            </View>
                          )}
                          <View style={styles.wheelInfo}>
                            <Text style={styles.wheelLabel}>Wheel {item.wheelNumber}</Text>
                            <Text 
                              style={[
                                styles.wheelStatus,
                                item.status === 'FLAW DETECTED' ? styles.flawedText : styles.normalText
                              ]}
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              {item.status}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>
          );
        });
      })}
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
    padding: 1,
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
    backgroundColor: 'gray',
    marginLeft: 5
  },
  wheelList: {
    paddingBottom: 100,
    alignItems: 'center'
  },
  wheelCard: {
    flexDirection: 'column',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginVertical: 8,
    marginHorizontal: 0,
    padding: 10,
    backgroundColor: '#fff',
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  wheelImage: {
    width: '100%',
    height: 100,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
  },
  wheelInfo: {
    padding: 5,
    width: '100%',
  },
  wheelLabel: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  wheelStatus: {
    fontSize: 10,
    fontWeight: 'bold',
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
    width: '100%',
    height: 100,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#f0f0f0'
  },
  imagePlaceholder: {
    width: '100%',
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
  },
  wheelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
});