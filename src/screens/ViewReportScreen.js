import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import Modal from 'react-native-modal';
import Icon from 'react-native-vector-icons/FontAwesome';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function EditReportScreen({ route, navigation }) {
  const { reportId } = route.params;
  const [report, setReport] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  
useEffect(() => {
  const fetchReport = async () => {
    try {
      const token = await AsyncStorage.getItem('token'); // Or your token storage method
      
      const response = await axios.get(
        `https://ann-flaw-detection-system-for-train.onrender.com/api/reports/${reportId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setReport(response.data);
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
    // Get the token from wherever you're storing it (AsyncStorage, etc.)
    const token = await AsyncStorage.getItem('token'); // or your token storage method
    
    const response = await axios.delete(
      `https://ann-flaw-detection-system-for-train.onrender.com/api/reports/${report._id}`,
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
    // Handle specific error cases
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

  const handlePrint = async () => {
  if (isSharing) return;
  setIsSharing(true);

  const htmlContent = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <style>
        .header-grid {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .header-left {
          flex: 1;
          padding-left: 20px;
        }
        .header-right {
          flex-shrink: 0;
          padding-left: 0;
          padding-right: 20px;
        }

        .logo {
          height: 100px;
          max-width: 100px;
          object-fit: contain;
        }

          body {
            font-family: Helvetica, Arial, sans-serif;
            padding: 20px;
            margin: 0;
            color: #333;
            max-width: 800px;
          }
          h1 {
            font-size: 30px;
            margin-top: 20px;
            margin-bottom: -10px;
            text-align: start;
          }
          h2 {
            font-size: 20px;
            margin-bottom: 16px;
            text-align: start;
          }
          .image-container {
            text-align: center;
            margin-bottom: 16px;
          }
          img {
            max-width: 100%;
            max-height: 500px;
            border-radius: 10px;
            object-fit: contain;
          }
          .table-wrapper {
            max-width: 600px;
            margin: 0 auto;
          }
          table {
            width: 100%;
            table-layout: fixed;
            border-collapse: collapse;
            font-size: 11px;
          }
          td, th {
            border: 1px solid #ccc;
            padding: 4px 6px;
            text-align: left;
            word-wrap: break-word;
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
            width: 40%;
          }
          td {
            width: 60%;
          }
        </style>

      </head>
      <body>
        <div class="header-grid">
          <div class="header-left">
            <h1>Wheels and Metal Inspection Report</h1>
            <h2>${report.name}</h2>
          </div>
          <div class="header-right">
            <img class="logo" src="https://ann-flaw-detection-system-for-train.onrender.com/uploads/logo.png" alt="Logo" />
          </div>
        </div>
        <div class="image-container">
          ${report.image_path
            ? `<img src="https://ann-flaw-detection-system-for-train.onrender.com${report.image_path}" alt="Report Image" />`
            : '<p>No image available.</p>'}
        </div>
        <div class="table-wrapper">
          <table>
            <tr><th>Train No.</th><td>${report.trainNumber}</td></tr>
            <tr><th>Status</th><td>${report.status}</td></tr>
            <tr><th>Compartment No.</th><td>${report.compartmentNumber}</td></tr>
            <tr><th>Wheel Diameter</th><td>${report.wheel_diameter}</td></tr>
            <tr><th>Wheel No.</th><td>${report.wheelNumber}</td></tr>
            <tr><th>Recommendation</th><td>${report.recommendation}</td></tr>

          </table>
        </div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
    });

    const fileName = `${report.name.replace(/[^a-z0-9]/gi, '_')}.pdf`;
    const newPath = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.moveAsync({
      from: uri,
      to: newPath,
    });

    await Sharing.shareAsync(newPath);
  } catch (error) {
    console.error('Print failed:', error);
  } finally {
    setIsSharing(false);
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
            source={{ uri: `https://ann-flaw-detection-system-for-train.onrender.com${report.image_path}` }}
            style={styles.reportImage}
          />
        ) : (
          <Text>No Image Available</Text>
        )}

        <Text style={styles.cardTitle}>{report.name}</Text>

        <View style={styles.tableRow}>
          <Text style={styles.tableHeader}>Train No.</Text>
          <Text style={styles.tableHeader}>Status</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>{report.trainNumber}</Text>
          <Text style={[styles.tableCell, report.status === 'FLAW DETECTED' ? styles.flawedText : styles.normalText]}>
            {report.status}
          </Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={styles.tableHeader}>Compartment No.</Text>
          <Text style={styles.tableHeader}>Wheel Diameter</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>{report.compartmentNumber}</Text>
          <Text style={styles.tableCell}>{report.wheel_diameter}</Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={styles.tableHeader}>Wheel No.</Text>
          <Text style={styles.tableHeader}>Recommendation</Text>

        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>{report.wheelNumber}</Text>
          <Text style={styles.tableCell}>{report.recommendation}</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.printButton} onPress={handlePrint}>
          <Text style={styles.buttonText}>Print</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* iOS-style Modal */}
      <Modal isVisible={isModalVisible} animationIn="zoomIn" animationOut="fadeOut">
        <View style={styles.modalContainer}>
          <Icon name="check" size={20} color="green" />
          <Text style={styles.modalText}>Report successfully deleted</Text>
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
  flawedText: {
    color: 'red',
  },
  normalText: {
    color: '#888',
  },
  reportImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginTop: 15,
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
  
});
