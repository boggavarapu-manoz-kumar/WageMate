import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    TextInput,
    RefreshControl,
    SafeAreaView,
    Platform,
    ScrollView,
    Image
} from 'react-native';
import { workerAPI } from '../services/api';

const WorkerListScreen = ({ navigation }) => {
    const [workers, setWorkers] = useState([]);
    const [filteredWorkers, setFilteredWorkers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all');

    const fetchWorkers = async () => {
        try {
            const response = await workerAPI.getAllWorkers();
            if (response.success) {
                setWorkers(response.data);
                applyFilters(response.data, searchQuery, activeFilter);
            }
        } catch (error) {
            console.error('Failed to load workers');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', fetchWorkers);
        fetchWorkers();
        return unsubscribe;
    }, [navigation]);

    const applyFilters = (data, query, filter) => {
        let result = [...data];

        if (query) {
            result = result.filter(worker =>
                worker.name.toLowerCase().includes(query.toLowerCase()) ||
                worker.workType.toLowerCase().includes(query.toLowerCase())
            );
        }

        if (filter !== 'all') {
            result = result.filter(worker => worker.salaryType === filter);
        }

        setFilteredWorkers(result);
    };

    const handleSearch = (text) => {
        setSearchQuery(text);
        applyFilters(workers, text, activeFilter);
    };

    const handleFilterChange = (filter) => {
        setActiveFilter(filter);
        applyFilters(workers, searchQuery, filter);
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchWorkers();
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('WorkerDetails', { workerId: item._id })}
            activeOpacity={0.8}
        >
            <View style={styles.cardContent}>
                {item.photo ? (
                    <Image source={{ uri: item.photo }} style={styles.imageAvatar} />
                ) : (
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
                    </View>
                )}
                <View style={styles.infoContainer}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.nameText} numberOfLines={1}>{item.name}</Text>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                            {!item.isActive && (
                                <View style={[styles.badge, styles.inactiveBadge]}>
                                    <Text style={[styles.badgeText, { color: '#991b1b' }]}>INACTIVE</Text>
                                </View>
                            )}
                            <View style={[styles.badge, item.salaryType === 'monthly' ? styles.monthlyBadge : item.salaryType === 'weekly' ? styles.weeklyBadge : styles.dailyBadge]}>
                                <Text style={styles.badgeText}>{item.salaryType.toUpperCase()}</Text>
                            </View>
                        </View>
                    </View>
                    <Text style={styles.roleText}>{item.workType}</Text>
                    <View style={styles.statsRow}>
                        <View style={styles.wageBadge}>
                            <Text style={styles.wageText}>₹{item.wageAmount}</Text>
                        </View>
                        <Text style={styles.phoneText}>•  {item.phone}</Text>
                    </View>
                </View>
                <View style={styles.chevronContainer}>
                    <Text style={styles.chevron}>›</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    const FilterChip = ({ label, value }) => (
        <TouchableOpacity
            style={[styles.filterChip, activeFilter === value && styles.filterChipActive]}
            onPress={() => handleFilterChange(value)}
        >
            <Text style={[styles.filterChipText, activeFilter === value && styles.filterChipTextActive]}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerPadding}>
                <View style={styles.searchWrapper}>
                    <View style={styles.searchIconContainer}>
                        <Text style={{ fontSize: 16 }}>🔍</Text>
                    </View>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search workers or roles..."
                        placeholderTextColor="#94a3b8"
                        value={searchQuery}
                        onChangeText={handleSearch}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => handleSearch('')} style={styles.clearBtn}>
                            <Text style={{ fontSize: 14, color: '#94a3b8' }}>✕</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={{ paddingRight: 20 }}>
                    <FilterChip label="All Workers" value="all" />
                    <FilterChip label="Daily Pay" value="daily" />
                    <FilterChip label="Weekly Pay" value="weekly" />
                    <FilterChip label="Monthly Pay" value="monthly" />
                </ScrollView>
            </View>

            {loading && !refreshing ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#2563eb" />
                </View>
            ) : filteredWorkers.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIllustration}>
                        <Text style={{ fontSize: 60 }}>🏗️</Text>
                    </View>
                    <Text style={styles.emptyText}>No workers found</Text>
                    <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
                    <TouchableOpacity
                        style={styles.emptyBtn}
                        onPress={() => navigation.navigate('AddWorker')}
                    >
                        <Text style={styles.emptyBtnText}>+ Register New Worker</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={filteredWorkers}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} tintColor="#2563eb" />
                    }
                />
            )}

            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('AddWorker')}
                activeOpacity={0.9}
            >
                <Text style={styles.fabIcon}>+</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    headerPadding: { backgroundColor: '#fff', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    searchWrapper: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9',
        marginHorizontal: 16, marginTop: 16, marginBottom: 12, borderRadius: 16, paddingHorizontal: 12
    },
    searchIconContainer: { marginRight: 8 },
    searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#1e293b', fontWeight: '500' },
    clearBtn: { padding: 4 },

    filterBar: { flexDirection: 'row', paddingHorizontal: 16 },
    filterChip: {
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
        backgroundColor: '#fff', marginRight: 8, borderWidth: 1, borderColor: '#e2e8f0'
    },
    filterChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
    filterChipText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
    filterChipTextActive: { color: '#fff' },

    listContent: { padding: 16, paddingBottom: 100 },
    card: {
        backgroundColor: '#fff', borderRadius: 20, marginBottom: 12,
        borderWidth: 1, borderColor: '#f1f5f9',
        ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8 }, android: { elevation: 2 } })
    },
    cardContent: { flexDirection: 'row', padding: 16, alignItems: 'center' },
    imageAvatar: {
        width: 52, height: 52, borderRadius: 16,
        marginRight: 16
    },
    avatar: {
        width: 52, height: 52, borderRadius: 16,
        backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center',
        marginRight: 16
    },
    avatarText: { fontSize: 20, fontWeight: '800', color: '#2563eb' },
    infoContainer: { flex: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    nameText: { fontSize: 17, fontWeight: '700', color: '#0f172a', flex: 1, marginRight: 8 },
    roleText: { fontSize: 13, color: '#64748b', fontWeight: '500', marginBottom: 10 },

    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    inactiveBadge: { backgroundColor: '#fee2e2' },
    dailyBadge: { backgroundColor: '#fef3c7' },
    weeklyBadge: { backgroundColor: '#e0e7ff' },
    monthlyBadge: { backgroundColor: '#dcfce7' },
    badgeText: { fontSize: 10, fontWeight: '800', color: '#92400e' },

    statsRow: { flexDirection: 'row', alignItems: 'center' },
    wageBadge: { backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginRight: 10 },
    wageText: { fontSize: 13, fontWeight: '700', color: '#16a34a' },
    phoneText: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },

    chevronContainer: { paddingLeft: 8 },
    chevron: { fontSize: 24, color: '#cbd5e1', fontWeight: '300' },

    fab: {
        position: 'absolute', right: 20, bottom: 20,
        backgroundColor: '#2563eb', width: 64, height: 64, borderRadius: 32,
        justifyContent: 'center', alignItems: 'center',
        ...Platform.select({ ios: { shadowColor: '#2563eb', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12 }, android: { elevation: 8 } })
    },
    fabIcon: { color: '#fff', fontSize: 36, fontWeight: '300', marginTop: -2 },

    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyIllustration: {
        width: 120, height: 120, borderRadius: 60, backgroundColor: '#f1f5f9',
        justifyContent: 'center', alignItems: 'center', marginBottom: 20
    },
    emptyText: { fontSize: 20, color: '#0f172a', fontWeight: '800', marginBottom: 8 },
    emptySubtext: { fontSize: 14, color: '#64748b', fontWeight: '500', textAlign: 'center', marginBottom: 28 },
    emptyBtn: { backgroundColor: '#2563eb', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 16 },
    emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 }
});

export default WorkerListScreen;
