import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator } from 'react-native';
import { paymentAPI } from '../services/api';

const PayoutHistoryScreen = ({ route }) => {
    const { workerId, workerName } = route.params;
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const response = await paymentAPI.getWorkerPayments(workerId);
            if (response.success) {
                setPayments(response.data);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.date}>
                        {new Date(item.createdAt || item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                    <Text style={styles.time}>
                        Settled at {new Date(item.createdAt || item.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
                <View style={styles.methodBadge}>
                    <Text style={styles.methodText}>{item.paymentMethod.toUpperCase()}</Text>
                </View>
            </View>

            <View style={styles.amountRow}>
                <View>
                    <Text style={styles.amountLabel}>Total Disbursed</Text>
                    <Text style={styles.settledBy}>
                        Accountant: <Text style={{fontWeight: '700', color: '#1e293b'}}>{item.paidBy?.name || 'Authorized Admin'}</Text>
                    </Text>
                </View>
                <Text style={styles.amountValue}>₹{item.amount.toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.footerRow}>
                <View style={styles.periodBadge}>
                    <Text style={styles.periodText}>
                        Period: {new Date(item.periodStart).toLocaleDateString('en-IN', {day:'2-digit', month:'short'})} - {new Date(item.periodEnd).toLocaleDateString('en-IN', {day:'2-digit', month:'short'})}
                    </Text>
                </View>
                {item.referenceId ? (
                    <Text style={styles.refText}>Ref: {item.referenceId}</Text>
                ) : (
                    <Text style={styles.verifiedBadge}>✓ Verified</Text>
                )}
            </View>
        </View>
    );

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Payment History</Text>
                <Text style={styles.subtitle}>{workerName}</Text>
            </View>

            <FlatList
                data={payments}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyBox}>
                        <Text style={styles.emptyIcon}>📭</Text>
                        <Text style={styles.emptyText}>No previous payments found.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    title: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
    subtitle: { fontSize: 16, color: '#64748b', marginTop: 4, fontWeight: '500' },
    listContent: { padding: 20 },
    card: {
        backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    date: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
    time: { fontSize: 11, color: '#94a3b8', fontWeight: '600', marginTop: 2 },
    methodBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
    methodText: { fontSize: 10, fontWeight: '900', color: '#475569', letterSpacing: 0.5 },
    
    amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 },
    amountLabel: { fontSize: 12, color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    settledBy: { fontSize: 12, color: '#94a3b8', marginTop: 4, fontWeight: '500' },
    amountValue: { fontSize: 26, fontWeight: '900', color: '#059669', letterSpacing: -0.5 },
    
    footerRow: { 
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
        paddingTop: 15, borderTopWidth: 1, borderTopColor: '#f1f5f9', borderStyle: 'dashed' 
    },
    periodBadge: { backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    periodText: { fontSize: 11, color: '#2563eb', fontWeight: '700' },
    refText: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
    verifiedBadge: { fontSize: 11, color: '#10b981', fontWeight: '800' },

    emptyBox: { alignItems: 'center', marginTop: 80 },
    emptyIcon: { fontSize: 54, marginBottom: 20 },
    emptyText: { fontSize: 17, color: '#94a3b8', fontWeight: '600' }
});

export default PayoutHistoryScreen;
