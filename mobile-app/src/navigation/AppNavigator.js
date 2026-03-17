import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import Screens
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import WorkerListScreen from '../screens/WorkerListScreen';
import AddWorkerScreen from '../screens/AddWorkerScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import SalaryScreen from '../screens/SalaryScreen';
import ReportsScreen from '../screens/ReportsScreen';
import WorkerDetailsScreen from '../screens/WorkerDetailsScreen';
import ScannerScreen from '../screens/ScannerScreen';
import AdminProfileScreen from '../screens/AdminProfileScreen';
import PayoutHistoryScreen from '../screens/PayoutHistoryScreen';
import SiteListScreen from '../screens/SiteListScreen';
import AddSiteScreen from '../screens/AddSiteScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Login"
                screenOptions={{
                    headerStyle: {
                        backgroundColor: '#fff',
                        elevation: 0,
                        shadowOpacity: 0,
                        borderBottomWidth: 1,
                        borderBottomColor: '#f1f5f9'
                    },
                    headerTintColor: '#0f172a',
                    headerTitleStyle: {
                        fontWeight: '800',
                        fontSize: 17,
                        letterSpacing: -0.5
                    },
                    headerBackTitleVisible: false,
                }}
            >
                {/* Authentication Stack */}
                <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />

                {/* Main Application Stack */}
                <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
                <Stack.Screen name="WorkerList" component={WorkerListScreen} options={{ title: 'Workforce' }} />
                <Stack.Screen name="WorkerDetails" component={WorkerDetailsScreen} options={{ title: 'Worker Profile' }} />
                <Stack.Screen name="AddWorker" component={AddWorkerScreen} options={{ title: 'Register Worker' }} />
                <Stack.Screen name="Attendance" component={AttendanceScreen} options={{ title: 'Daily Attendance' }} />
                <Stack.Screen name="Salary" component={SalaryScreen} options={{ title: 'Salary Payout' }} />
                <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: 'Analytics' }} />
                <Stack.Screen name="Scanner" component={ScannerScreen} options={{ headerShown: false }} />
                <Stack.Screen name="AdminProfile" component={AdminProfileScreen} options={{ title: 'My Profile' }} />
                <Stack.Screen name="PayoutHistory" component={PayoutHistoryScreen} options={{ title: 'Payout History' }} />
                <Stack.Screen name="SiteList" component={SiteListScreen} options={{ title: 'Projects & Sites', headerStyle: { backgroundColor: '#f8fafc', elevation: 0, shadowOpacity: 0, borderBottomWidth: 0 } }} />
                <Stack.Screen name="AddSite" component={AddSiteScreen} options={{ title: 'Add Project', headerStyle: { backgroundColor: '#f8fafc', elevation: 0, shadowOpacity: 0, borderBottomWidth: 0 } }} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
