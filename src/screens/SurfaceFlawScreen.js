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
  RefreshControl,
  Alert,
  Modal,
  ActivityIndicator
} from 'react-native';
import axios from 'axios';
import io from 'socket.io-client';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Buffer } from 'buffer';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { Asset } from 'expo-asset';

const screenWidth = Dimensions.get('window').width;
const API_URL = 'https://ann-flaw-detection-system-for-train.onrender.com';


export default function SurfaceFlawScreen({ navigation }) {
  const [reports, setReports] = useState([]);
  const [groupedReports, setGroupedReports] = useState({});
  const [selectedTrain, setSelectedTrain] = useState(null);
  const [selectedCompartment, setSelectedCompartment] = useState(null);
  const [latestReport, setLatestReport] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  
  const fetchImageAsBase64 = async (imagePath) => {
    try {
      const fullPath = imagePath.startsWith('/') 
        ? `${API_URL}${imagePath}`
        : `${API_URL}/${imagePath}`;
        
      const response = await axios.get(fullPath, {
        responseType: 'arraybuffer',
        headers: {
          Authorization: `Bearer ${await AsyncStorage.getItem('token')}`
        }
      });
      
      return Buffer.from(response.data, 'binary').toString('base64');
    } catch (error) {
      console.error('Error fetching image:', error);
      return null;
    }
  };

  const getLogoBase64 = async () => {
  try {
    const asset = Asset.fromModule(require('../assets/logo.png'));
    await asset.downloadAsync();
    const response = await FileSystem.readAsStringAsync(asset.localUri || '', {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:image/png;base64,${response}`;
  } catch (error) {
    console.error('Error loading logo:', error);
    return '';
  }
};

const generateTrainHTML = async (trainNumber, trainReports) => {
  const userData = JSON.parse(await AsyncStorage.getItem('user'));
  const generatedBy = userData ? userData.name : 'System';
  const currentDate = new Date().toLocaleString();
  const logoBase64 = await getLogoBase64();
  
  let html = `
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <style>
      .page-break-avoid {
        page-break-inside: avoid;
        page-break-after: avoid;
        break-inside: avoid;
        break-after: avoid;
      }
      @page {
        size: A4;
        margin: 20mm;
        @bottom-center {
          content: " Page " counter(page);
          font-size: 10pt;
          color: #666;
        }
      }
      body {
        font-family: 'Times New Roman', Times, serif;
        line-height: 1.6;
        color: #333;
        padding: 0;
        margin: 0;
      }
      .header {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 20px;
        border-bottom: 2px solid #000;
        padding-bottom: 10px;
      }
      .logo {
        height: 80px;
        margin-right: 20px;
      }
      .header-text {
        text-align: center;
      }
      .header h1 {
        font-size: 24px;
        margin: 0;
        color: #000;
      }
      .header .subtitle {
        font-size: 16px;
        color: #555;
      }
      .report-info {
        display: flex;
        justify-content: space-between;
        margin-bottom: 20px;
        font-size: 12px;
      }
      .compartment-section {
        page-break-inside: avoid;
        margin-bottom: 25px;
      }
      .compartment-title {
        font-size: 18px;
        border-bottom: 1px solid #ccc;
        padding-bottom: 5px;
        margin-top: 20px;
      }
      .wheel-section {
        margin-bottom: 20px;
        page-break-inside: avoid;
      }
      .wheel-title {
        font-size: 16px;
        font-weight: bold;
        margin: 10px 0;
      }
      .image-container {
        text-align: center;
        margin: 10px 0;
      }
      .wheel-image {
        max-width: 100%;
        max-height: 200px;
        border: 1px solid #ddd;
        border-radius: 4px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 10px 0;
        font-size: 12px;
      }
      th, td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
      }
      th {
        background-color: #f2f2f2;
        font-weight: bold;
      }
      .status-flaw {
        color: #d32f2f;
        font-weight: bold;
      }
      .status-good {
        color: #388e3c;
        font-weight: bold;
      }
      .footer {
        font-size: 10px;
        text-align: center;
        margin-top: 20px;
        color: #666;
      }
    </style>
  </head>
   <body>
    <div class="header page-break-avoid">
      ${logoBase64 ? `<img class="logo" src="${logoBase64}" alt="Logo">` : ''}
      <div class="header-text">
        <h1>SWIFT WHEEL INSPECTION SYSTEM</h1>
        <div class="subtitle">WHEEL INSPECTION REPORT</div>
      </div>
    </div>
    
    <div class="report-info">
      <div>Train Number: ${trainNumber}</div>
      <div>Date Generated: ${currentDate}</div>
    </div>
`;

  const compartments = Object.entries(trainReports).sort(([a], [b]) => a - b);

   for (const [compNum, reports] of compartments) {
    html += `
      <div class="compartment-section">
        <div class="compartment-title">COMPARTMENT ${compNum}</div>
    `;

    const sortedReports = reports.sort((a, b) => a.wheelNumber - b.wheelNumber);

    for (const r of sortedReports) {
      const base64Image = r.image_path ? await fetchImageAsBase64(r.image_path) : null;
      html += `
        <div class="wheel-section">
          <div class="wheel-title">WHEEL ${r.wheelNumber}</div>
          
          ${base64Image ? `
            <div class="image-container">
              <img class="wheel-image" src="data:image/jpeg;base64,${base64Image}" />
            </div>
          ` : '<p>No image available</p>'}
          
          <table>
            <tr>
              <th>Train Number</th>
              <td>${r.trainNumber}</td>
            </tr>
            <tr>
              <th>Compartment Number</th>
              <td>${r.compartmentNumber}</td>
            </tr>
            <tr>
              <th>Wheel Number</th>
              <td>${r.wheelNumber}</td>
            </tr>
            <tr>
              <th>Wheel Diameter</th>
              <td>${r.wheel_diameter + ' mm'|| 'N/A'}</td>
            </tr>
            <tr>
              <th>Surface Status</th>
              <td class="${r.status === 'FLAW DETECTED' ? 'status-flaw' : 'status-good'}">
                ${r.status}
              </td>
            </tr>
            <tr>
              <th>Wheel Condition</th>
              <td class="${getWheelCondition(r.wheel_diameter) === 'BAD CONDITION' ? 'status-flaw' : 'status-good'}">
                ${getWheelCondition(r.wheel_diameter)}
              </td>
            </tr>
            <tr>
              <th>Recommendation</th>
              <td>${r.recommendation}</td>
            </tr>
            <tr>
              <th>Date & Time of Inspection</th>
              <td>${new Date(r.timestamp).toLocaleString()}</td>
            </tr>
          </table>
        </div>
      `;
    }

    html += `</div>`; // Close compartment-section
  }

  html += `
      <div class="footer">
        <p>This report was automatically generated by SWIFT Wheel Inspection System</p>
        <p>Generated on: ${currentDate}</p>
      </div>
    </body>
    </html>
  `;
  
  return html;
  
};
const getWheelCondition = (wheelDiameter) => {
  if (wheelDiameter === undefined || wheelDiameter === null) return 'UNKNOWN';
  return wheelDiameter >= 631 ? 'GOOD CONDITION' : 'BAD CONDITION';
};

const handleTrainReportExport = async (trainNumber, compartments) => {
  try {
    setIsGeneratingReport(true);
    const html = await generateTrainHTML(trainNumber, compartments);
    const { uri } = await Print.printToFileAsync({ html });
    const fileName = `Train_${trainNumber}_Report.pdf`;
    const newPath = `${FileSystem.documentDirectory}${fileName}`;
    await FileSystem.moveAsync({ from: uri, to: newPath });
    await Sharing.shareAsync(newPath);
  } catch (error) {
    console.error('Failed to export PDF:', error);
    Alert.alert('Error', 'Failed to generate report. Please try again.');
  } finally {
    setIsGeneratingReport(false);
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
      
      return newReports.sort((a, b) => {
        const dateDiff = new Date(b.timestamp) - new Date(a.timestamp);
        if (dateDiff !== 0) return dateDiff;
        return a.trainNumber - b.trainNumber;
      });
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
      
      const mostRecentReport = reports.reduce((latest, report) => {
        return new Date(report.timestamp) > new Date(latest.timestamp) ? report : latest;
      }, reports[0]);
      
      setLatestReport(mostRecentReport);
    }
  }, [reports]);

const fetchReports = async () => {
  try {
    setRefreshing(true);
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      Alert.alert('Authentication Error', 'Please log in to continue');
      navigation.navigate('Login');
      return;
    }

    const response = await axios.get(`${API_URL}/api/reports`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const sortedReports = response.data.data.sort((a, b) => {
      const dateDiff = new Date(b.timestamp) - new Date(a.timestamp);
      if (dateDiff !== 0) return dateDiff;
      return a.trainNumber - b.trainNumber;
    });
    
    setReports(sortedReports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    if (error.response?.status === 401) {
      Alert.alert('Session Expired', 'Please log in again');
      await AsyncStorage.removeItem('token');
      navigation.navigate('Login');
    } else {
      Alert.alert('Error', 'Failed to fetch reports. Please try again later');
    }
  } finally {
    setRefreshing(false);
  }
};
  const groupByTrain = (reports) => {
  const grouped = {};
  
  const sortedReports = [...reports].sort((a, b) => {
    const dateDiff = new Date(b.timestamp) - new Date(a.timestamp);
    if (dateDiff !== 0) return dateDiff;
    return a.trainNumber - b.trainNumber;
  });

  sortedReports.forEach((report) => {
    const { trainNumber, compartmentNumber } = report;
    if (!grouped[trainNumber]) grouped[trainNumber] = {};
    if (!grouped[trainNumber][compartmentNumber]) grouped[trainNumber][compartmentNumber] = [];
    grouped[trainNumber][compartmentNumber].push(report);
  });
  
  setGroupedReports(grouped);
};

  const getTrainStatus = (trainReports) => {
  const allReports = Object.values(trainReports).flat();
  const hasFlaw = allReports.some(r => r.status === 'FLAW DETECTED');
  const hasBadCondition = allReports.some(r => getWheelCondition(r.wheel_diameter) === 'BAD CONDITION');
  
  if (hasFlaw || hasBadCondition) return 'NEEDS ATTENTION';
  return 'GOOD CONDITION';
  };

const renderLatestReportCard = () => {
  if (!latestReport) return null;

  const latestDate = new Date(latestReport.timestamp).toDateString();
  const latestTrainReports = reports.filter(report => {
    const reportDate = new Date(report.timestamp).toDateString();
    return (
      report.trainNumber === latestReport.trainNumber && 
      reportDate === latestDate
    );
  });

  const compartments = {};
  latestTrainReports.forEach(report => {
    if (!compartments[report.compartmentNumber]) {
      compartments[report.compartmentNumber] = [];
    }
    compartments[report.compartmentNumber].push(report);
  });

  const hasFlaw = latestTrainReports.some(r => r.status === 'FLAW DETECTED');
  const hasBadCondition = latestTrainReports.some(r => getWheelCondition(r.wheel_diameter) === 'BAD CONDITION');
  
  let recommendation = '';
  if (hasFlaw && hasBadCondition) {
    recommendation = 'For Repair/Replacement (Flaws and Wheel Wear)';
  } else if (hasFlaw) {
    recommendation = 'For Repair/Replacement (Surface Flaws)';
  } else if (hasBadCondition) {
    recommendation = 'For Wheel Replacement (Excessive Wear)';
  } else {
    recommendation = 'For Consistent Monitoring';
  }

  const matchingReports = latestTrainReports
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
          <Text style={styles.tableHeader}>Surface Status</Text>
          <Text style={styles.tableHeader}>Wheel Condition</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, hasFlaw ? styles.flawedText : styles.normalText]}>
            {hasFlaw ? 'FLAW DETECTED' : 'NO FLAW'}
          </Text>
          <Text style={[styles.tableCell, hasBadCondition ? styles.flawedText : styles.normalText]}>
            {hasBadCondition ? 'BAD CONDITION' : 'GOOD CONDITION'}
          </Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableHeader}>Recommendation</Text>
        </View>
        <View style={styles.tableCellBlack}>
          <Text style={styles.tableCellB}>{recommendation}</Text>
          <Text style={styles.timeStyle}>
          {new Date(latestReport.timestamp).toLocaleDateString()}
        </Text>
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
        const hasBadCondition = reports.some(r => getWheelCondition(r.wheel_diameter) === 'BAD CONDITION');
        
        return (
          <TouchableOpacity
            key={compNum}
            style={styles.compartmentButton}
            onPress={() => setSelectedCompartment(compNum)}
          >
            <Text style={styles.compartmentText}>C{compNum}</Text>
            <View style={{ flexDirection: 'row' }}>
              <View style={[styles.statusDot, { 
                backgroundColor: hasFlaw ? 'red' : 'green',
                marginLeft: 5
              }]} />
              <View style={[styles.statusDot, { 
                backgroundColor: hasBadCondition ? 'red' : 'green',
                marginLeft: 5
              }]} />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const renderTrainList = () => {
  // Group all reports by date first
  const reportsByDate = {};
  
  Object.entries(groupedReports).forEach(([trainNumber, compartments]) => {
    Object.values(compartments).flat().forEach(report => {
      const date = new Date(report.timestamp).toLocaleDateString();
      if (!reportsByDate[date]) {
        reportsByDate[date] = {};
      }
      if (!reportsByDate[date][trainNumber]) {
        reportsByDate[date][trainNumber] = [];
      }
      reportsByDate[date][trainNumber].push(report);
    });
  });

  // Sort dates in descending order (newest first)
  const sortedDates = Object.keys(reportsByDate).sort((a, b) => 
    new Date(b) - new Date(a)
  );

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.cardTitle}>All Reports</Text>
      
      {sortedDates.map((date) => {
        // Get train numbers for this date and sort them numerically
        const trainNumbers = Object.keys(reportsByDate[date])
          .map(Number)
          .sort((a, b) => a - b);

        return (
          <React.Fragment key={date}>
            {trainNumbers.map((trainNumber) => {
              const trainReports = reportsByDate[date][trainNumber];
              const hasFlaw = trainReports.some(r => r.status === 'FLAW DETECTED');
              const hasBadCondition = trainReports.some(r => getWheelCondition(r.wheel_diameter) === 'BAD CONDITION');
              const isSelected = selectedTrain === `${trainNumber}-${date}`;

              return (
                <View key={`${trainNumber}-${date}`} style={[styles.trainCard, { marginBottom: 16 }]}>
                  <TouchableOpacity onPress={() => {
                    setSelectedTrain(isSelected ? null : `${trainNumber}-${date}`);
                    setSelectedCompartment(null);
                  }}>
                    <Text style={styles.trainTitle}>Train {trainNumber}</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={styles.trainInfo}>{date}</Text>
                      <View style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={[styles.trainInfo, hasFlaw ? styles.flawedText : styles.normalText]}>
                            {hasFlaw ? 'FLAW DETECTED' : 'NO FLAW'}
                          </Text>
                          <View style={[styles.statusDot, { 
                            backgroundColor: hasFlaw ? 'red' : 'green', 
                            marginLeft: 6 
                          }]} />
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={[styles.trainInfo, hasBadCondition ? styles.flawedText : styles.normalText]}>
                            {hasBadCondition ? 'BAD CONDITION' : 'GOOD CONDITION'}
                          </Text>
                          <View style={[styles.statusDot, { 
                            backgroundColor: hasBadCondition ? 'red' : 'green', 
                            marginLeft: 6 
                          }]} />
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {isSelected && (
                    <>
                      <TouchableOpacity
                        onPress={() => handleTrainReportExport(trainNumber, reportsByDate[date])}
                        style={{ marginTop: 10, padding: 10, backgroundColor: '#000', borderRadius: 6 }}
                      >
                        <Text style={{ color: '#fff', textAlign: 'center' }}>Print Report</Text>
                      </TouchableOpacity>
                      
                      <Text style={{ color: '#000000', textAlign: 'center', paddingTop: 10, marginBottom: -10}}>Compartment List</Text>

                      <View style={styles.compartmentContainer}>
                        {Object.entries(
                          trainReports.reduce((comps, report) => {
                            if (!comps[report.compartmentNumber]) {
                              comps[report.compartmentNumber] = [];
                            }
                            comps[report.compartmentNumber].push(report);
                            return comps;
                          }, {})
                        )
                        .sort(([a], [b]) => a - b)
                        .map(([compNum, compReports]) => {
                          const hasFlaw = compReports.some(r => r.status === 'FLAW DETECTED');
                          const hasBadCondition = compReports.some(r => getWheelCondition(r.wheel_diameter) === 'BAD CONDITION');
                          const needsAttention = hasFlaw || hasBadCondition;
                          
                          return (
                            <TouchableOpacity
                              key={compNum}
                              style={styles.compartmentButton}
                              onPress={() => setSelectedCompartment(compNum)}
                            >
                              <Text style={styles.compartmentText}>C{compNum}</Text>
                              <View style={[styles.statusDot, { backgroundColor: needsAttention ? 'red' : 'green' }]} />
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      {selectedCompartment && (
                        <View style={styles.wheelGrid}>
                          {trainReports
                            .filter(r => r.compartmentNumber === selectedCompartment)
                            .sort((a, b) => a.wheelNumber - b.wheelNumber)
                            .map((item) => {
                              const isFlawed = item.status === 'FLAW DETECTED';
                              const isBadCondition = getWheelCondition(item.wheel_diameter) === 'BAD CONDITION';
                              
                              return (
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
                                        isFlawed ? styles.flawedText : styles.normalText
                                      ]}
                                    >
                                      {isFlawed ? 'FLAW DETECTED' : 'NO FLAW'}
                                    </Text>
                                    <Text 
                                      style={[
                                        styles.wheelStatus,
                                        isBadCondition ? styles.flawedText : styles.normalText
                                      ]}
                                    >
                                      {isBadCondition ? 'BAD CONDITION' : 'GOOD CONDITION'}
                                    </Text>
                                  </View>
                                </TouchableOpacity>
                              );
                            })}
                        </View>
                      )}
                    </>
                  )}
                </View>
              );
            })}
          </React.Fragment>
        );
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

      <Modal
        transparent={true}
        animationType="fade"
        visible={isGeneratingReport}
        onRequestClose={() => setIsGeneratingReport(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={styles.modalText}>Generating Report...</Text>
          </View>
        </View>
      </Modal>
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
  container: { 
    flex: 1, 
    padding: 16, 
    backgroundColor: '#fff',
    marginBottom: 50
    },
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
    marginTop: 15,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
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
  tableCellB: {
    flex: 1,
    color: '#000',
  },
  tableCellBlack: {
    marginTop: -6,
    flex: 1,
    color: '#000',
    fontWeight: 'semibold',
  },
  timeStyle: {
    textAlignVertical: 'center',
    textAlign: 'right',
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
  modalContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  tableCellB: {
    flex: 1,
    color: '#000',
  },
});