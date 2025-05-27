import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function WheelDiameterScreen() {
  return (
    <View style={styles.container}>
      <Text>Wheel Diameter Reports will go here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
