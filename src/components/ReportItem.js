import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';

export default function ReportItem({ report, navigation }) {
  const statusStyle = report.status === 'FLAW DETECTED' ? styles.flawedStatus : styles.noFlawStatus;
  
  const date = new Date(report.timestamp);
  const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

  const imageUrl = `https://ann-flaw-detection-system-for-train.onrender.com${report.image_path}`;

  return (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate('View Report', { reportId: report._id })}
    >
      <View style={styles.textContainer}>
        <Text style={styles.name}>{report.name}</Text>
        <Text style={styles.date}>{formattedDate}</Text>
        <View style={[styles.statusContainer, statusStyle]}>
          <Text style={styles.statusText}>{report.status}</Text>
        </View>
      </View>
      <Image
        source={{ uri: imageUrl }}
        style={styles.image}
        onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
      />
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
    paddingRight: 10,
    justifyContent: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  date: {
    color: '#666',
    marginTop: 5,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  statusContainer: {
    marginTop: 10,
    padding: 8,
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  flawedStatus: {
    backgroundColor: 'red',
  },
  noFlawStatus: {
    backgroundColor: 'green',
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
