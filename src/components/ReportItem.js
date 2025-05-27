import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';

export default function ReportItem({ report, navigation }) {
  const statusStyle = report.status === 'FLAW DETECTED' ? styles.flawedStatus : styles.noFlawStatus;
  
  const date = new Date(report.timestamp);
  const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

const imageUrl = `http://192.168.1.11:5000${report.image_path}`;
console.log('Report image path:', report.image_path);
console.log('Resolved image URL:', imageUrl);
  return (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate('View Report', { reportId: report._id })}
    >
      <View style={styles.textContainer}>
        <Text style={styles.name}>{report.name}</Text>
        <Text style={styles.date}>{formattedDate}</Text>
      </View>
        <Image source={{ uri: 'http://192.168.1.11:5000/uploads/1748325175423-ed40a373.jpg' }} style={styles.image} />
          onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
      <View style={[styles.statusContainer, statusStyle]}>
        <Text style={styles.statusText}>{report.status}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#fff',
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  textContainer: {
    flex: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333', // Black color for text
  },
  date: {
    color: '#666', // Gray color for date
    marginTop: 5,
  },
  image: {
    width: 100,  // Adjust based on your layout
    height: 100, // Adjust based on your layout
    borderRadius: 10,
    marginVertical: 10,
  },
  statusContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    borderRadius: 5,
    minWidth: 100,
  },
  flawedStatus: {
    backgroundColor: 'red', // Red for "Flawed"
  },
  noFlawStatus: {
    backgroundColor: 'green', // Green for "No Flaw"
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
