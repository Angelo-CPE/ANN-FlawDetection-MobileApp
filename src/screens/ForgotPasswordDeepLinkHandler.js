import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import * as Linking from 'expo-linking';
import { useNavigation } from '@react-navigation/native';

const ForgotPasswordDeepLinkHandler = () => {
  const navigation = useNavigation();

  useEffect(() => {
    const getInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        const parsed = Linking.parse(initialUrl);
        const token = parsed.queryParams?.token;

        if (token) {
          navigation.navigate('ResetPassword', { token });
        } else {
          navigation.navigate('Login');
        }
      }
    };

    const handleDeepLink = ({ url }) => {
      const parsed = Linking.parse(url);
      const token = parsed.queryParams?.token;

      if (token) {
        navigation.navigate('ResetPassword', { token });
      } else {
        navigation.navigate('Login');
      }
    };

    Linking.addEventListener('url', handleDeepLink);
    getInitialURL();

    return () => {
      Linking.removeEventListener('url', handleDeepLink);
    };
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#000" />
      <Text style={styles.text}>Processing link...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    marginTop: 16,
    color: '#333',
    fontSize: 16,
  },
});

export default ForgotPasswordDeepLinkHandler;
