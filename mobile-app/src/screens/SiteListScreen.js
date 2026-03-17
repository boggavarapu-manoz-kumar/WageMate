import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, TouchableOpacity, Image, Platform, Alert } from 'react-native';
import { siteAPI } from '../services/api';

const SiteListScreen = ({ navigation }) => {
    const [sites, setSites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', fetchSites);
        fetchSites();
        return unsubscribe;
    }, [navigation]);

    const fetchSites = async () => {
        try {
            const response = await siteAPI.getAllSites();
            if (response.success) {
                setSites(response.data);
            }
        } catch (error) {
            console.error('Error fetching sites:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkComplete = (site) => {
        Alert.alert(
            "Mark as Complete",
            `Are you sure you want to mark ${site.siteName} as completed?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Yes, Complete",
                    onPress: async () => {
                        try {
                            setActionLoading(site._id);
                            await siteAPI.updateSite(site._id, { isActive: false });
                            fetchSites();
                            Alert.alert('Success', 'Project marked as complete!');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to update project.');
                        } finally {
                            setActionLoading(null);
                        }
                    }
                }
            ]
        );
    };

    const handleDelete = (site) => {
        Alert.alert(
            "Delete Project",
            `Are you sure you want to permanently delete ${site.siteName}? This action cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setActionLoading(site._id);
                            await siteAPI.deleteSite(site._id);
                            fetchSites();
                            Alert.alert('Success', 'Project deleted successfully!');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete project.');
                        } finally {
                            setActionLoading(null);
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <Image
                source={{ uri: item.imageUrl || 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&q=80&w=800' }}
                style={styles.cardImage}
                resizeMode="cover"
            />
            <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                    <Text style={styles.siteName}>{item.siteName}</Text>
                    <View style={[styles.statusBadge, item.isActive ? styles.statusActive : styles.statusInactive]}>
                        <Text style={[styles.statusText, item.isActive ? styles.statusTextActive : styles.statusTextInactive]}>
                            {item.isActive ? 'ACTIVE' : 'COMPLETED'}
                        </Text>
                    </View>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailIcon}>📍</Text>
                    <Text style={styles.detailText} numberOfLines={2}>{item.location?.address || 'Address not provided'}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailIcon}>💰</Text>
                    <Text style={styles.detailText}>Budget: ₹{item.budget?.toLocaleString('en-IN') || '0'}</Text>
                </View>

                {/* Actions Section */}
                <View style={styles.actionRow}>
                    {item.isActive ? (
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.completeBtn]}
                            onPress={() => handleMarkComplete(item)}
                            disabled={actionLoading === item._id}
                        >
                            <Text style={styles.completeBtnText}>
                                {actionLoading === item._id ? 'Processing...' : '✅ Mark Complete'}
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={[styles.actionBtn, styles.completedBadge]}>
                            <Text style={styles.completedBadgeText}>🎉 Project Completed</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.actionBtn, styles.deleteBtn]}
                        onPress={() => handleDelete(item)}
                        disabled={actionLoading === item._id}
                    >
                        <Text style={styles.deleteBtnText}>🗑️ Delete</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Projects & Sites</Text>
                    <Text style={styles.subtitle}>Manage all active locations</Text>
                </View>
                <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => navigation.navigate('AddSite')}
                >
                    <Text style={styles.addBtnIcon}>+</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={sites}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyBox}>
                        <Text style={styles.emptyIcon}>🏗️</Text>
                        <Text style={styles.emptyTitle}>No Projects Found</Text>
                        <Text style={styles.emptySubtext}>Add your first construction site or shop to start tracking.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    header: {
        padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
    },
    title: { fontSize: 26, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
    subtitle: { fontSize: 14, color: '#64748b', marginTop: 4, fontWeight: '500' },

    addBtn: {
        backgroundColor: '#2563eb', width: 44, height: 44, borderRadius: 22,
        justifyContent: 'center', alignItems: 'center',
        ...Platform.select({ ios: { shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }, android: { elevation: 4 } })
    },
    addBtnIcon: { color: '#fff', fontSize: 24, fontWeight: '600', marginTop: -2 },

    listContent: { padding: 20, paddingBottom: 40 },

    card: {
        backgroundColor: '#fff', borderRadius: 20, marginBottom: 20, overflow: 'hidden',
        borderWidth: 1, borderColor: '#f1f5f9',
        ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 12 }, android: { elevation: 3 } })
    },
    cardImage: { width: '100%', height: 160 },
    cardContent: { padding: 20 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    siteName: { fontSize: 18, fontWeight: '800', color: '#1e293b', flex: 1, marginRight: 12 },

    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusActive: { backgroundColor: '#dcfce7' },
    statusInactive: { backgroundColor: '#fef2f2' },
    statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    statusTextActive: { color: '#166534' },
    statusTextInactive: { color: '#991b1b' },

    detailRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
    detailIcon: { fontSize: 14, marginRight: 8, marginTop: 2 },
    detailText: { fontSize: 14, color: '#64748b', flex: 1, lineHeight: 20, fontWeight: '500' },

    emptyBox: { alignItems: 'center', marginTop: 60, paddingHorizontal: 20 },
    emptyIcon: { fontSize: 64, marginBottom: 16 },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
    emptySubtext: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 22 },

    actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    actionBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    completeBtn: { backgroundColor: '#eff6ff', flex: 1, marginRight: 10 },
    completeBtnText: { color: '#2563eb', fontWeight: '700', fontSize: 13 },
    completedBadge: { backgroundColor: '#f0fdf4', flex: 1, marginRight: 10 },
    completedBadgeText: { color: '#166534', fontWeight: '800', fontSize: 13 },
    deleteBtn: { backgroundColor: '#fef2f2', paddingHorizontal: 16 },
    deleteBtnText: { color: '#ef4444', fontWeight: '700', fontSize: 13 }
});

export default SiteListScreen;
