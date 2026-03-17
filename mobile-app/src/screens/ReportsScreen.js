import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator, RefreshControl } from 'react-native';
import { dashboardAPI, paymentAPI } from '../services/api';

const ReportsScreen = ({ navigation }) => {
    const [stats, setStats] = useState(null);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            const [dashRes, payRes] = await Promise.allSettled([
                dashboardAPI.getDashboardStats(),
                paymentAPI.getAllPayments(),
            ]);

            if (dashRes.status === 'fulfilled' && dashRes.value.success) {
                setStats(dashRes.value.data);
            }
            if (payRes.status === 'fulfilled' && payRes.value.success) {
                setPayments(payRes.value.data || []);
            }
        } catch (e) {
            console.error('Reports fetch error', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', fetchData);
        fetchData();
        return unsubscribe;
    }, [navigation]);

    const onRefresh = () => { setRefreshing(true); fetchData(); };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    const data = stats || { totalWorkers: 0, todayAttendance: { present: 0 }, costs: { today: 0, weekly: 0, monthly: 0 } };
    const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0);
    const attendanceRate = data.totalWorkers > 0
        ? ((data.todayAttendance.present / data.totalWorkers) * 100).toFixed(0)
        : 0;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />}
            >
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Analytics</Text>
                    <Text style={styles.headerSubtitle}>Live insights into your labor costs and attendance.</Text>
                </View>

                {/* ── Cost Summary ── */}
                <Text style={styles.sectionTitle}>Live Cost Metrics</Text>
                <View style={styles.card}>
                    {[
                        { label: "Today's Labor Cost", value: `₹ ${data.costs.today.toLocaleString('en-IN')}`, color: '#2563eb', icon: '📅' },
                        { label: 'Weekly Liability', value: `₹ ${data.costs.weekly.toLocaleString('en-IN')}`, color: '#059669', icon: '🗓️' },
                        { label: 'Monthly Projection', value: `₹ ${data.costs.monthly.toLocaleString('en-IN')}`, color: '#d97706', icon: '📈' },
                        { label: 'Total Payments Released', value: `₹ ${totalPaid.toLocaleString('en-IN')}`, color: '#7c3aed', icon: '💸' },
                    ].map((item, i, arr) => (
                        <View key={item.label}>
                            <View style={styles.costRow}>
                                <View style={styles.costLeft}>
                                    <Text style={styles.costIcon}>{item.icon}</Text>
                                    <Text style={styles.costLabel}>{item.label}</Text>
                                </View>
                                <Text style={[styles.costValue, { color: item.color }]}>{item.value}</Text>
                            </View>
                            {i < arr.length - 1 && <View style={styles.divider} />}
                        </View>
                    ))}
                </View>

                {/* ── Workforce Stats ── */}
                <Text style={styles.sectionTitle}>Today's Snapshot</Text>
                <View style={styles.statGrid}>
                    <View style={[styles.statCard, { backgroundColor: '#2563eb' }]}>
                        <Text style={[styles.statNum, { color: '#fff' }]}>{data.totalWorkers}</Text>
                        <Text style={[styles.statLbl, { color: '#bfdbfe' }]}>Active Workers</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNum}>{data.todayAttendance.present}</Text>
                        <Text style={styles.statLbl}>Present Today</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statNum, { color: '#059669' }]}>{attendanceRate}%</Text>
                        <Text style={styles.statLbl}>Attendance Rate</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statNum, { color: '#7c3aed' }]}>{payments.length}</Text>
                        <Text style={styles.statLbl}>Payments Made</Text>
                    </View>
                </View>

                {/* ── Recent Payments ── */}
                {payments.length > 0 && (
                    <>
                        <Text style={styles.sectionTitle}>Recent Payments</Text>
                        <View style={styles.card}>
                            {payments.slice(0, 8).map((p, i, arr) => (
                                <View key={p._id || i}>
                                    <View style={styles.payRow}>
                                        <View style={styles.payAvatar}>
                                            <Text style={styles.payAvatarText}>
                                                {(p.workerId?.name || 'W').charAt(0)}
                                            </Text>
                                        </View>
                                        <View style={styles.payInfo}>
                                            <Text style={styles.payName}>{p.workerId?.name || 'Unknown'}</Text>
                                            <Text style={styles.payMeta}>{p.paymentMethod} • {new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
                                        </View>
                                        <Text style={styles.payAmount}>₹{p.amount?.toLocaleString('en-IN')}</Text>
                                    </View>
                                    {i < arr.length - 1 && <View style={styles.divider} />}
                                </View>
                            ))}
                        </View>
                    </>
                )}

                {payments.length === 0 && (
                    <View style={styles.emptyBox}>
                        <Text style={styles.emptyIcon}>💸</Text>
                        <Text style={styles.emptyText}>No payments recorded yet.</Text>
                        <Text style={styles.emptySubtext}>Use Salary Payout to settle wages.</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: 20, paddingBottom: 48 },
    header: { marginBottom: 24, marginTop: 10 },
    headerTitle: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
    headerSubtitle: { fontSize: 15, color: '#64748b', marginTop: 4 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 14, marginTop: 4 },

    card: {
        backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3
    },
    divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 12 },

    costRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    costLeft: { flexDirection: 'row', alignItems: 'center' },
    costIcon: { fontSize: 20, marginRight: 12 },
    costLabel: { fontSize: 14, color: '#64748b', fontWeight: '500' },
    costValue: { fontSize: 16, fontWeight: '800' },

    statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
    statCard: {
        width: '47%', backgroundColor: '#fff', borderRadius: 20, padding: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2
    },
    statNum: { fontSize: 26, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
    statLbl: { fontSize: 12, color: '#64748b', fontWeight: '600' },

    payRow: { flexDirection: 'row', alignItems: 'center' },
    payAvatar: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#e0e7ff', justifyContent: 'center', alignItems: 'center', marginRight: 14
    },
    payAvatarText: { fontSize: 16, fontWeight: '800', color: '#4338ca' },
    payInfo: { flex: 1 },
    payName: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
    payMeta: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
    payAmount: { fontSize: 16, fontWeight: '800', color: '#059669' },

    emptyBox: { padding: 48, alignItems: 'center' },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyText: { fontSize: 16, fontWeight: '700', color: '#475569', marginBottom: 4 },
    emptySubtext: { fontSize: 13, color: '#94a3b8' },
});

export default ReportsScreen;
