import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import axios from 'axios';
import Modal from 'react-native-modal';
import Icon from 'react-native-vector-icons/FontAwesome';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer } from 'buffer';

const API_URL = 'https://ann-flaw-detection-system-for-train.onrender.com';

export default function EditReportScreen({ route, navigation }) {
  const { reportId } = route.params;
  const [report, setReport] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Reverted to original working image fetching
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

  // Original working logo fetching
  const getLogoBase64 = async () => {
    try {
      const logo = require('../assets/logo.png');
      const response = await fetch(Image.resolveAssetSource(logo).uri);
      const blob = await response.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result); 
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.log('Could not load logo, using fallback');
      return ''; 
    }
  };

  useEffect(() => {
  const fetchReport = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      const response = await axios.get(
        `${API_URL}/api/reports/${reportId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      const reportData = response.data;
      const isFlawed = reportData.status === 'FLAW DETECTED';
      const isBadCondition = getWheelCondition(reportData.wheel_diameter) === 'BAD CONDITION';
      
      if (isFlawed && isBadCondition) {
        reportData.recommendation = 'For Repair/Replacement (Flaws and Wheel Wear)';
      } else if (isFlawed) {
        reportData.recommendation = 'For Repair/Replacement (Surface Flaws)';
      } else if (isBadCondition) {
        reportData.recommendation = 'For Wheel Replacement (Excessive Wear)';
      } else {
        reportData.recommendation = 'For Consistent Monitoring';
      }
      
      setReport(reportData);
    } catch (error) {
      console.error('Error fetching report:', error);
      if (error.response?.status === 401) {
        navigation.navigate('Login');
      }
    }
  };
  fetchReport();
}, [reportId]);

  const handleDelete = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      const response = await axios.delete(
        `${API_URL}/api/reports/${report._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setModalVisible(true);
      setTimeout(() => {
        setModalVisible(false);
        navigation.navigate('Tabs', { screen: 'Home' });
      }, 1500);
    } catch (error) {
      console.error('Delete failed:', error);
      if (error.response) {
        if (error.response.status === 401) {
          alert('You need to be logged in to delete reports');
        } else if (error.response.status === 403) {
          alert('Only admins can delete reports');
        } else {
          alert('Failed to delete report');
        }
      } else {
        alert('Network error - please check your connection');
      }
    }
  };
  const getWheelCondition = (wheelDiameter) => {
    if (wheelDiameter === undefined || wheelDiameter === null) return 'UNKNOWN';
    return wheelDiameter >= 631 ? 'GOOD CONDITION' : 'BAD CONDITION';
  };
  const handlePrint = async () => {
    if (!report) return;
    setIsGeneratingReport(true);
    
    try {
      const userData = JSON.parse(await AsyncStorage.getItem('user'));
      const generatedBy = userData ? userData.name : 'System';
      const currentDate = new Date().toLocaleString();
      const logoBase64 = await getLogoBase64();
      const base64Image = report.image_path ? await fetchImageAsBase64(report.image_path) : null;

      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            <style>
              @page {
                size: A4;
                margin: 20mm;
                @bottom-center {
                  content: "Generated by ${generatedBy} | Page " counter(page);
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
            <div class="header">
              ${logoBase64 ? `<img class="logo" src="${logoBase64}" alt="Logo">` : ''}
              <div class="header-text">
                <h1>SWIFT WHEEL INSPECTION SYSTEM</h1>
                <div class="subtitle">WHEEL INSPECTION REPORT</div>
              </div>
            </div>
          
            <div class="report-info">
              <div>Train Number: ${report.trainNumber}</div>
              <div>Date Generated: ${currentDate}</div>
            </div>
            
         <div class="wheel-section">
            <div class="wheel-title">WHEEL ${report.wheelNumber}</div>
            
            ${base64Image ? `
              <div class="image-container">
                <img class="wheel-image" src="data:image/jpeg;base64,${base64Image}" />
              </div>
            ` : '<p>No image available</p>'}
            
            <table>
              <tr>
                <th>Train Number</th>
                <td>${report.trainNumber}</td>
              </tr>
              <tr>
                <th>Compartment Number</th>
                <td>${report.compartmentNumber}</td>
              </tr>
              <tr>
                <th>Wheel Number</th>
                <td>${report.wheelNumber}</td>
              </tr>
              <tr>
                <th>Wheel Diameter</th>
                <td>${report.wheel_diameter || 'N/A'}</td>
              </tr>
              <tr>
                <th>Surface Status</th>
                <td class="${report.status === 'FLAW DETECTED' ? 'status-flaw' : 'status-good'}">
                  ${report.status}
                </td>
              </tr>
              <tr>
                <th>Wheel Condition</th>
                <td class="${getWheelCondition(report.wheel_diameter) === 'BAD CONDITION' ? 'status-flaw' : 'status-good'}">
                  ${getWheelCondition(report.wheel_diameter)} (${report.wheel_diameter || 'N/A'} mm)
                </td>
              </tr>
              <tr>
                <th>Recommendation</th>
                <td>${report.recommendation}</td>
              </tr>
              <tr>
                <th>Date & Time of Inspection</th>
                <td>${new Date(report.timestamp).toLocaleString()}</td>
              </tr>
            </table>
          </div>
            
            <div class="footer">
              <p>This report was automatically generated by SWIFT Wheel Inspection System</p>
              <p>Generated on: ${currentDate}</p>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      const fileName = `Train_${report.trainNumber}_Wheel_${report.wheelNumber}_Report.pdf`;
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

  if (!report) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

return (
  <ScrollView style={styles.container}>
    <View style={styles.sectionContainer}>
      {report.image_path ? (
        <Image
          source={{ uri: `${API_URL}${report.image_path}` }}
          style={styles.reportImage}
        />
      ) : (
        <Text>No Image Available</Text>
      )}

      <Text style={styles.cardTitle}>Train {report.trainNumber} - Compartment {report.compartmentNumber} - Wheel {report.wheelNumber}</Text>

      <View style={styles.tableRow}>
        <Text style={styles.tableHeader}>Surface Status</Text>
        <Text style={styles.tableHeader}>Wheel Condition</Text>
      </View>
      <View style={styles.tableRow}>
        <Text style={[styles.tableCell, report.status === 'FLAW DETECTED' ? styles.flawedText : styles.normalText]}>
          {report.status}
        </Text>
        <Text style={[styles.tableCell, getWheelCondition(report.wheel_diameter) === 'BAD CONDITION' ? styles.flawedText : styles.normalText]}>
          {getWheelCondition(report.wheel_diameter)}
        </Text>
      </View>

      <View style={styles.tableRow}>
        <Text style={styles.tableHeader}>Wheel Diameter</Text>
        <Text style={styles.tableHeader}>Inspected On</Text>
      </View>
      <View style={styles.tableRow}>
        <Text style={styles.tableCellB}>{report.wheel_diameter || 'N/A'} mm</Text>
        <Text style={styles.tableCellB}>{new Date(report.timestamp).toLocaleString()}</Text>
      </View>

      <View style={styles.tableRow}>
        <Text style={styles.tableHeader}>Recommendation</Text>
      </View>
      <View style={styles.tableRow}>
         <Text style={styles.tableCellBlack}>{report.recommendation}</Text>
      </View>
    </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.printButton} onPress={handlePrint}>
          <Text style={styles.buttonText}>Print Report</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.buttonText}>Delete Report</Text>
        </TouchableOpacity>
      </View>

      <Modal isVisible={isModalVisible} animationIn="zoomIn" animationOut="fadeOut">
        <View style={styles.modalContainer}>
          <Icon name="check" size={20} color="green" />
          <Text style={styles.modalText}>Report successfully deleted</Text>
        </View>
      </Modal>

      <Modal
        transparent={true}
        animationType="fade"
        visible={isGeneratingReport}
        onRequestClose={() => setIsGeneratingReport(false)}
      >
        <View style={styles.loadingModal}>
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
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: '#fff',
    marginBottom: 16,
    padding: 12,
    marginTop: 16,
  },
  cardTitle: {
    marginTop: 10,
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
  tableCell: {
    flex: 1,
    color: '#000',
  },
  flawedText: {
    color: 'red',
    fontWeight: 'bold',
  },
  normalText: {
    color: 'green',
    fontWeight: 'bold',
  },
  reportImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginTop: 15,
    backgroundColor: '#f0f0f0'
  },
  buttonContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  printButton: {
    backgroundColor: '#000000',
    padding: 18,
    borderRadius: 4,
    width: '100%',
    alignItems: 'center',
    marginVertical: 10,
  },
  deleteButton: {
    backgroundColor: '#c62828',
    padding: 18,
    borderRadius: 4,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 16,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  loadingModal: {
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
    tableCellBlack: {
    marginTop: -6,
    flex: 1,
    color: '#000',
    fontWeight: 'semibold',
  },
});