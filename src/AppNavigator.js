import * as React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack'; // Import Stack Navigator
import { NavigationContainer } from '@react-navigation/native';
import SurfaceFlawScreen from './screens/SurfaceFlawScreen';
import WheelDiameterScreen from './screens/WheelDiameterScreen';
import ViewReportScreen from './screens/ViewReportScreen';  // Import Edit Report Screen
import SearchScreen from './screens/SearchScreen';  // Import Search Placeholder Screen
import ProfileScreen from './screens/ProfileScreen';  
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
            iconName = 'home'; // Icon for Home
            size = 30;
          } else if (route.name === 'Search') {
            iconName = 'search' ;
            size = 30; // Icon for Search
          } else if (route.name === 'Profile') {
            // Profile icon as a circular placeholder
            return <Image source={require('./assets/test.jpg')} style={{ width: 30, height: 30, borderRadius: 20, borderColor: '#888', borderWidth: 1 }} />;
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarLabel: () => null,  // Remove the labels (Home, Search, Profile)
        tabBarStyle: {
          paddingStart: 50,
          height: 60, // Lower the height of the tab bar to make the icons more compressed
          backgroundColor: 'white', // Ensure no background color for the tab bar
          borderTopWidth: 0, // Remove the top border of the tab bar
          position: 'absolute', // Position the tab bar absolutely to avoid any background or extra space
          bottom: 5,
          display: 'flex',
          flexDirection: 'row', // Ensures icons are horizontally centered
          justifyContent: 'center', // Centers the icons in the middle of the tab bar
          paddingBottom: 5, // Reduces any extra padding below the icons
          shadowOpacity: 0, // Remove the shadow to avoid a border or any shadow under the tab bar
          elevation: 0, // Remove shadow on Android
        },
        tabBarItemStyle: {
          flex: 1,
          maxWidth: 100, 
          paddingHorizontal: 10,  // Remove horizontal padding
          marginHorizontal: -10,  // Closer spacing between icons
        },
        tabBarActiveTintColor: '#000',  // Ensure inactive and active icons don't show any color change
        tabBarInactiveTintColor: '#888', // Ensure no color change effect on touch
        tabBarButton: (props) => <TouchableOpacity {...props} activeOpacity={1} /> // Disable the touch effect
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
        <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="View Report" component={ViewReportScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}