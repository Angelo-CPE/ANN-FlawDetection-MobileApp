import * as React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack'; // Import Stack Navigator
import { NavigationContainer } from '@react-navigation/native';
import SurfaceFlawScreen from './screens/SurfaceFlawScreen';
import WheelDiameterScreen from './screens/WheelDiameterScreen';
import ViewReportScreen from './screens/ViewReportScreen';  // Import Edit Report Screen
import SearchScreen from './screens/SearchScreen';  // Import Search Placeholder Screen
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

// Create a Tab Navigator and a Stack Navigator
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = 'home'; 
            size = 30;
          } else if (route.name === 'Search') {
            iconName = 'search' ;
            size = 30; 
          } else if (route.name === 'Profile') {
            return <Image source={require('./assets/default-avatar.jpg')} style={{ width: 30, height: 30, borderRadius: 20, borderColor: '#888', borderWidth: 1 }} />;
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarLabel: () => null,  
        tabBarStyle: {
          paddingStart: 50,
          paddingTop: 15,
          height: 60, 
          backgroundColor: '#fff',
          borderTopWidth: 0, 
          position: 'absolute', 
          bottom: 0,
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center', 
          paddingBottom: 60,
          shadowOpacity: 0,
          elevation: 0,
        },
        tabBarItemStyle: {
          flex: 1,
          maxWidth: 100, 
          paddingHorizontal: 10,  
          marginHorizontal: -10, 
        },
        tabBarActiveTintColor: '#000',  
        tabBarInactiveTintColor: '#888',
        tabBarButton: (props) => <TouchableOpacity {...props} activeOpacity={1} /> 
      })}
    >
      <Tab.Screen name="Home" component={SurfaceFlawScreen} 
        options={{ headerShown: false }}/>
      <Tab.Screen name="Search" component={SearchScreen} 
      options={{ headerShown: false }}/>
      <Tab.Screen name="Profile" component={ProfileScreen} 
      options={{ headerShown: false }}/>
    </Tab.Navigator>
  );
}
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Tabs">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
        <Stack.Screen name="DeepLinkHandler" component={ForgotPasswordDeepLinkHandler} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="View Report" component={ViewReportScreen} />
        <Stack.Screen name="AdminPanel" component={AdminPanelScreen} />
        <Stack.Screen name="OTPRequest" component={OTPRequestScreen} options={{ headerShown: false }}/>
        <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} options={{ headerShown: false }}/>
        <Stack.Screen name="NewPassword" component={NewPasswordScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}