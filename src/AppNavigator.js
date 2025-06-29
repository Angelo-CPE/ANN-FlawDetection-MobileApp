import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import SurfaceFlawScreen from './screens/SurfaceFlawScreen';
import WheelDiameterScreen from './screens/WheelDiameterScreen';
import ViewReportScreen from './screens/ViewReportScreen';
import SearchScreen from './screens/SearchScreen';
import ProfileScreen from './screens/ProfileScreen';  
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import AdminPanelScreen from './screens/AdminPanelScreen';
import OTPRequestScreen from './screens/OTPRequestScreen';
import OTPVerificationScreen from './screens/OTPVerificationScreen';
import NewPasswordScreen from './screens/NewPasswordScreen';
import ForgotPasswordDeepLinkHandler from './screens/ForgotPasswordDeepLinkHandler';
import Icon from 'react-native-vector-icons/MaterialIcons'; 
import { Image, TouchableOpacity } from 'react-native';
import * as Linking from 'expo-linking';

const prefix = Linking.createURL('/');
const API_URL = 'https://ann-flaw-detection-system-for-train.onrender.com';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#0000ff" />
    </View>
  );
}

function TabNavigator() {
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const response = await axios.get(`${API_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          await AsyncStorage.setItem('user', JSON.stringify(response.data));
        }
      } catch (error) {
        console.log('Failed to refresh user data', error);
        await AsyncStorage.removeItem('token');
        navigation.navigate('Login');
      }
    };
    loadUserData();
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = 'home'; 
            size = 30;
          } else if (route.name === 'Search') {
            iconName = 'search';
            size = 30; 
          } else if (route.name === 'Profile') {
            return <Image source={require('./assets/default-avatar.jpg')} style={{ width: 30, height: 30, borderRadius: 20, borderColor: '#888', borderWidth: 1 }} />;
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarLabel: () => null,
        tabBarStyle: {
          height: 60,
          backgroundColor: '#fff',
          borderTopWidth: 0,
          position: 'absolute',
          left: '20%',   
          right: '20%',  
          bottom: 0,
          elevation: 0,
          shadowOpacity: 0,
          borderTopLeftRadius: 20, 
          borderTopRightRadius: 20,
          paddingTop: 10
        },
        tabBarItemStyle: {
          width: 60,      
          padding: 0,
        },
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: '#888',
        tabBarButton: (props) => <TouchableOpacity {...props} activeOpacity={1} />
      })}
    >
      <Tab.Screen name="Home" component={SurfaceFlawScreen} options={{ headerShown: false }}/>
      <Tab.Screen name="Search" component={SearchScreen} options={{ headerShown: false }}/>
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}
export default function AppNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

   const updateAuthState = (authenticated) => {
    setIsAuthenticated(authenticated);
  };

   useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          try {
            // Verify token is still valid
            await axios.get(`${API_URL}/api/auth/me`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            setIsAuthenticated(true);
          } catch (error) {
            // Token is invalid, clear storage
            await AsyncStorage.multiRemove(['token', 'user']);
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer linking={{ prefixes: [prefix] }}>
      <Stack.Navigator initialRouteName={isAuthenticated ? "Tabs" : "Login"}>
        <Stack.Screen name="Login" options={{ headerShown: false }}>
          {(props) => <LoginScreen {...props} updateAuthState={updateAuthState} />}
        </Stack.Screen>
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
        <Stack.Screen name="DeepLinkHandler" component={ForgotPasswordDeepLinkHandler} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="View Report" component={ViewReportScreen} />
        <Stack.Screen name="AdminPanel" component={AdminPanelScreen} />
        <Stack.Screen name="OTPRequest" component={OTPRequestScreen} options={{ headerShown: false }}/>
        <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} options={{ headerShown: false }}/>
        <Stack.Screen name="NewPassword" component={NewPasswordScreen} options={{ headerShown: false }}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});