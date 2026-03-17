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
                <Text style={styles.date}>{new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                <View style={styles.methodBadge}>
                    <Text style={styles.methodText}>{item.paymentMethod}</Text>
                </View>
            </View>
            <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Paid Amount</Text>
                <Text style={styles.amountValue}>₹ {item.amount.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.periodRow}>
                <Text style={styles.periodLabel}>Period: </Text>
                <Text style={styles.periodValue}>
                    {new Date(item.periodStart).toLocaleDateString()} - {new Date(item.periodEnd).toLocaleDateString()}
                </Text>
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
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    date: { fontSize: 14, fontWeight: '700', color: '#475569' },
    methodBadge: { backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    methodText: { fontSize: 12, fontWeight: '800', color: '#2563eb' },
    amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    amountLabel: { fontSize: 16, color: '#0f172a', fontWeight: '600' },
    amountValue: { fontSize: 24, fontWeight: '800', color: '#059669' },
    periodRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    periodLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
    periodValue: { fontSize: 12, color: '#444', fontWeight: '600' },
    emptyBox: { alignItems: 'center', marginTop: 60 },
    emptyIcon: { fontSize: 48, marginBottom: 16 },
    emptyText: { fontSize: 16, color: '#64748b', fontWeight: '500' }
});

export default PayoutHistoryScreen;
