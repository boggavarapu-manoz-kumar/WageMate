import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    RefreshControl,
    SafeAreaView,
    StatusBar,
    Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dashboardAPI } from '../services/api';

const DashboardScreen = ({ navigation }) => {
    const [stats, setStats] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

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

    const fetchStats = async () => {
        try {
            const response = await dashboardAPI.getDashboardStats();
            if (response.success) setStats(response.data);
        } catch (error) {
            console.error('Dashboard Load Error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadUserData();
        const unsubscribe = navigation.addListener('focus', () => {
            fetchStats();
        });
        fetchStats();
        return unsubscribe;
    }, [navigation]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    const data = stats || {
        totalWorkers: 0,
        todayAttendance: { present: 0, totalMarked: 0 },
        costs: { today: 0, weekly: 0, monthly: 0 }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} tintColor="#2563eb" />}
            >
                {/* Header Section */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={styles.greeting}>{getGreeting()},</Text>
                            <Text style={styles.userName}>{userData?.name || 'Administrator'}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.profileBtn}
                            onPress={() => navigation.navigate('AdminProfile')}
                        >
                            <View style={styles.avatarMini}>
                                <Text style={styles.avatarMiniText}>{(userData?.name || 'A').charAt(0)}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Primary Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={[styles.statCard, styles.primaryCard]}>
                        <View style={styles.statIconBadge}>
                            <Text style={styles.iconEmoji}>🏗️</Text>
                        </View>
                        <Text style={styles.statPrimaryLabel}>Total Workforce</Text>
                        <Text style={styles.statPrimaryValue}>{data.totalWorkers}</Text>
                        <Text style={styles.statSubText}>Registered Personnel</Text>
                    </View>

                    <View style={styles.statCard}>
                        <View style={[styles.statIconBadge, { backgroundColor: '#f0fdf4' }]}>
                            <Text style={styles.iconEmoji}>✅</Text>
                        </View>
                        <Text style={styles.statLabel}>Today's Presence</Text>
                        <View style={styles.presenceRow}>
                            <Text style={styles.statValue}>{data.todayAttendance.present}</Text>
                            <Text style={styles.statDenominator}>/{data.totalWorkers}</Text>
                        </View>
                        <Text style={[styles.statTrend, { color: '#16a34a' }]}>
                            {data.totalWorkers > 0 ? ((data.todayAttendance.present / data.totalWorkers) * 100).toFixed(0) : 0}% Active
                        </Text>
                    </View>
                </View>

                {/* Financial Overview */}
                <Text style={styles.sectionTitle}>Financial Health</Text>
                <View style={styles.finCard}>
                    <View style={styles.finItem}>
                        <View style={[styles.finIcon, { backgroundColor: '#eff6ff' }]}>
                            <Text style={styles.finEmoji}>💰</Text>
                        </View>
                        <View style={styles.finInfo}>
                            <Text style={styles.finLabel}>Today's Labor Cost</Text>
                            <Text style={styles.finValue}>₹ {data.costs.today.toLocaleString('en-IN')}</Text>
                        </View>
                        <View style={styles.finTag}>
                            <Text style={styles.finTagText}>Live</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.finItem}>
                        <View style={[styles.finIcon, { backgroundColor: '#f0fdf4' }]}>
                            <Text style={styles.finEmoji}>📅</Text>
                        </View>
                        <View style={styles.finInfo}>
                            <Text style={styles.finLabel}>Weekly Liability</Text>
                            <Text style={[styles.finValue, { color: '#16a34a' }]}>₹ {data.costs.weekly.toLocaleString('en-IN')}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.finItem}>
                        <View style={[styles.finIcon, { backgroundColor: '#fff7ed' }]}>
                            <Text style={styles.finEmoji}>📈</Text>
                        </View>
                        <View style={styles.finInfo}>
                            <Text style={styles.finLabel}>Monthly Projection</Text>
                            <Text style={[styles.finValue, { color: '#ea580c' }]}>₹ {data.costs.monthly.toLocaleString('en-IN')}</Text>
                        </View>
                    </View>
                </View>

                {/* Management Shortcuts */}
                <Text style={styles.sectionTitle}>Quick Management</Text>
                <View style={styles.actionGrid}>
                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => navigation.navigate('Attendance')}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#dbeafe' }]}>
                            <Text style={styles.actionEmoji}>📝</Text>
                        </View>
                        <Text style={styles.actionText}>Attendance</Text>
                        <Text style={styles.actionSubtext}>Mark Daily</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => navigation.navigate('WorkerList')}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#dcfce7' }]}>
                            <Text style={styles.actionEmoji}>👷‍♂️</Text>
                        </View>
                        <Text style={styles.actionText}>Workforce</Text>
                        <Text style={styles.actionSubtext}>Directory</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => navigation.navigate('Salary')}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#fef3c7' }]}>
                            <Text style={styles.actionEmoji}>💵</Text>
                        </View>
                        <Text style={styles.actionText}>Payouts</Text>
                        <Text style={styles.actionSubtext}>Settle Wages</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => navigation.navigate('Reports')}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#f3e8ff' }]}>
                            <Text style={styles.actionEmoji}>📊</Text>
                        </View>
                        <Text style={styles.actionText}>Analytics</Text>
                        <Text style={styles.actionSubtext}>Full Reports</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => navigation.navigate('SiteList')}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#ffedd5' }]}>
                            <Text style={styles.actionEmoji}>🏗️</Text>
                        </View>
                        <Text style={styles.actionText}>Projects</Text>
                        <Text style={styles.actionSubtext}>Manage Sites</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footerBranding}>
                    <Text style={styles.footerText}>WageMate v1.0 • Secure Ledger</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: 20, paddingBottom: 40 },

    header: { marginBottom: 28, marginTop: Platform.OS === 'android' ? 10 : 0 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    greeting: { fontSize: 16, color: '#64748b', fontWeight: '500', letterSpacing: 0.2 },
    userName: { fontSize: 28, fontWeight: '800', color: '#0f172a', marginTop: 2, letterSpacing: -0.5 },
    profileBtn: {
        width: 48, height: 48, borderRadius: 24, padding: 2,
        backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0',
        ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 }, android: { elevation: 2 } })
    },
    avatarMini: { flex: 1, borderRadius: 22, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center' },
    avatarMiniText: { color: '#fff', fontSize: 18, fontWeight: '700' },

    statsGrid: { flexDirection: 'row', gap: 16, marginBottom: 28 },
    statCard: {
        flex: 1, backgroundColor: '#fff', borderRadius: 24, padding: 20,
        borderWidth: 1, borderColor: '#f1f5f9',
        ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.04, shadowRadius: 12 }, android: { elevation: 3 } })
    },
    primaryCard: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
    statIconBadge: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    iconEmoji: { fontSize: 20 },

    statPrimaryLabel: { fontSize: 13, color: '#bfdbfe', fontWeight: '600' },
    statPrimaryValue: { fontSize: 32, fontWeight: '800', color: '#fff', marginTop: 4 },
    statSubText: { fontSize: 11, color: '#93c5fd', marginTop: 4, fontWeight: '500' },

    statLabel: { fontSize: 13, color: '#64748b', fontWeight: '600' },
    presenceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
    statValue: { fontSize: 32, fontWeight: '800', color: '#0f172a' },
    statDenominator: { fontSize: 16, color: '#94a3b8', fontWeight: '600', marginLeft: 2 },
    statTrend: { fontSize: 12, fontWeight: '700', marginTop: 4 },

    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 16, marginTop: 8, letterSpacing: -0.3 },

    finCard: {
        backgroundColor: '#fff', borderRadius: 24, padding: 16, marginBottom: 28,
        borderWidth: 1, borderColor: '#f1f5f9',
        ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.04, shadowRadius: 12 }, android: { elevation: 3 } })
    },
    finItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4 },
    finIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    finEmoji: { fontSize: 22 },
    finInfo: { flex: 1 },
    finLabel: { fontSize: 13, color: '#64748b', fontWeight: '500' },
    finValue: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginTop: 2 },
    finTag: { backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    finTagText: { fontSize: 10, fontWeight: '800', color: '#2563eb', textTransform: 'uppercase' },
    divider: { height: 1, backgroundColor: '#f1f5f9', marginHorizontal: 12 },

    actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, paddingBottom: 20 },
    actionCard: {
        width: '47.8%', backgroundColor: '#fff', borderRadius: 24, padding: 20, alignItems: 'flex-start',
        borderWidth: 1, borderColor: '#f1f5f9',
        ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8 }, android: { elevation: 2 } })
    },
    actionIcon: { width: 56, height: 56, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    actionEmoji: { fontSize: 28 },
    actionText: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
    actionSubtext: { fontSize: 11, color: '#94a3b8', fontWeight: '500', marginTop: 2 },

    footerBranding: { alignItems: 'center', marginTop: 20, marginBottom: 10 },
    footerText: { fontSize: 12, color: '#cbd5e1', fontWeight: '600', letterSpacing: 0.5 }
});

export default DashboardScreen;
