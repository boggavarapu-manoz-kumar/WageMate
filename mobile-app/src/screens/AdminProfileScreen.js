import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AdminProfileScreen = ({ navigation }) => {
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const data = await AsyncStorage.getItem('userData');
            if (data) {
                setUserData(JSON.parse(data).data);
            }
        } catch (error) {
            console.error('Error loading user data');
        }
    };

    const handleLogout = async () => {
        Alert.alert('Logout', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Sign Out',
                style: 'destructive',
                onPress: async () => {
                    await AsyncStorage.removeItem('userToken');
                    await AsyncStorage.removeItem('userData');
                    navigation.replace('Login');
                }
            }
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <View style={styles.avatarLarge}>
                        <Text style={styles.avatarText}>{(userData?.name || 'A').charAt(0)}</Text>
                    </View>
                    <Text style={styles.name}>{userData?.name || 'Administrator'}</Text>
                    <Text style={styles.role}>{userData?.role?.toUpperCase() || 'ADMIN'}</Text>
                </View>

                <View style={styles.detailsCard}>
                    <Text style={styles.sectionTitle}>Contact Information</Text>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Email</Text>
                        <Text style={styles.detailValue}>{userData?.email || 'Not provided'}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Phone Number</Text>
                        <Text style={styles.detailValue}>{userData?.phone || 'Not provided'}</Text>
                    </View>
                </View>

                <View style={styles.actionsCard}>
                    <TouchableOpacity style={styles.actionBtn}>
                        <Text style={styles.actionIcon}>⚙️</Text>
                        <Text style={styles.actionText}>App Settings</Text>
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.actionBtn}>
                        <Text style={styles.actionIcon}>🔒</Text>
                        <Text style={styles.actionText}>Change Password</Text>
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.actionBtn} onPress={handleLogout}>
                        <Text style={styles.actionIcon}>🚪</Text>
                        <Text style={[styles.actionText, { color: '#ef4444' }]}>Sign Out</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    content: { padding: 20 },
    header: { alignItems: 'center', marginBottom: 32, marginTop: 20 },
    avatarLarge: {
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#2563eb', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5
    },
    avatarText: { fontSize: 40, fontWeight: '800', color: '#fff' },
    name: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
    role: { fontSize: 13, fontWeight: '700', color: '#2563eb', marginTop: 4, letterSpacing: 1 },

    detailsCard: {
        backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2
    },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 16 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
    detailLabel: { fontSize: 14, color: '#64748b', fontWeight: '500' },
    detailValue: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
    divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 8 },

    actionsCard: {
        backgroundColor: '#fff', borderRadius: 20, padding: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2
    },
    actionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    actionIcon: { fontSize: 20, marginRight: 16 },
    actionText: { fontSize: 16, fontWeight: '600', color: '#1e293b' }
});

export default AdminProfileScreen;
