import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    ScrollView,
    SafeAreaView,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Image
} from 'react-native';
import { workerAPI, attendanceAPI, paymentAPI } from '../services/api';

const WorkerDetailsScreen = ({ route, navigation }) => {
    const { workerId } = route.params;
    const [worker, setWorker] = useState(null);
    const [loading, setLoading] = useState(true);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [payments, setPayments] = useState([]);

    // Edit modal state
    const [editVisible, setEditVisible] = useState(false);
    const [editData, setEditData] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchAll();
    }, [workerId]);

    const fetchAll = async () => {
        try {
            const [workerRes, attendRes, payRes] = await Promise.allSettled([
                workerAPI.getWorkerById(workerId),
                attendanceAPI.getWorkerAttendance(workerId),
                paymentAPI.getWorkerPayments(workerId),
            ]);

            if (workerRes.status === 'fulfilled' && workerRes.value.success) {
                setWorker(workerRes.value.data);
                setEditData({
                    name: workerRes.value.data.name,
                    phone: workerRes.value.data.phone,
                    wageAmount: String(workerRes.value.data.wageAmount),
                    workType: workerRes.value.data.workType,
                    salaryType: workerRes.value.data.salaryType,
                });
            } else {
                Alert.alert('Profile Error', 'Failed to load worker details.');
                navigation.goBack();
            }

            if (attendRes.status === 'fulfilled' && attendRes.value.success) {
                setAttendanceHistory(attendRes.value.data || []);
            }

            if (payRes.status === 'fulfilled' && payRes.value.success) {
                setPayments(payRes.value.data || []);
            }
        } catch (error) {
            Alert.alert('Profile Error', 'Failed to load worker details.');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!editData.name || !editData.phone || !editData.wageAmount || !editData.workType) {
            Alert.alert('Missing Fields', 'Please fill in all required fields.');
            return;
        }

        try {
            setSaving(true);
            const payload = {
                ...editData,
                wageAmount: Number(editData.wageAmount),
            };
            const res = await workerAPI.updateWorker(workerId, payload);
            if (res.success) {
                setWorker(res.data);
                setEditVisible(false);
                Alert.alert('Updated ✓', 'Worker profile has been updated.');
            }
        } catch (error) {
            Alert.alert('Update Failed', 'Could not save changes. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = () => {
        const action = worker.isActive ? 'Deactivate' : 'Reactivate';
        Alert.alert(
            `${action} Worker`,
            `Are you sure you want to ${action.toLowerCase()} ${worker.name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: action,
                    style: worker.isActive ? 'destructive' : 'default',
                    onPress: async () => {
                        try {
                            const res = await workerAPI.updateWorker(workerId, { isActive: !worker.isActive });
                            if (res.success) {
                                setWorker(res.data);
                                Alert.alert('Success', `Worker Profile ${worker.isActive ? 'deactivated' : 'reactivated'}`);
                            }
                        } catch (error) {
                            Alert.alert('Error', `Failed to ${action.toLowerCase()} worker.`);
                        }
                    }
                }
            ]
        );
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Worker Permanently',
            `Are you sure you want to completely delete ${worker?.name}? This action cannot be undone and deletes all associated records.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Permanently',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const res = await workerAPI.deleteWorker(workerId);
                            if (res.success) {
                                Alert.alert('Deleted', 'Worker has been completely removed.');
                                navigation.goBack();
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Failed to deactivate. Please check your connection.');
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    if (!worker) return null;

    const DetailItem = ({ label, value, icon }) => (
        <View style={styles.detailItem}>
            <View style={styles.detailIcon}><Text style={{ fontSize: 18 }}>{icon}</Text></View>
            <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={styles.detailValue}>{value}</Text>
            </View>
        </View>
    );

    const daysPresent = attendanceHistory.filter(a => a.status === 'Present').length;
    const totalEarned = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* ── Profile Header ── */}
                <View style={styles.profileHeader}>
                    {worker.photo ? (
                        <Image source={{ uri: worker.photo }} style={styles.imageAvatarLarge} />
                    ) : (
                        <View style={styles.avatarLarge}>
                            <Text style={styles.avatarTextLarge}>{worker.name.charAt(0)}</Text>
                        </View>
                    )}
                    <Text style={styles.nameLarge}>{worker.name}</Text>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                        {!worker.isActive && (
                            <View style={[styles.badge, { backgroundColor: '#fee2e2' }]}>
                                <Text style={[styles.badgeText, { color: '#991b1b' }]}>INACTIVE</Text>
                            </View>
                        )}
                        <View style={[styles.badge, worker.salaryType === 'monthly' ? styles.monthlyBadge : worker.salaryType === 'weekly' ? styles.weeklyBadge : styles.dailyBadge]}>
                            <Text style={styles.badgeText}>{worker.salaryType.toUpperCase()} PAYROLL</Text>
                        </View>
                    </View>
                </View>

                {/* ── Quick Stats ── */}
                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <Text style={styles.statNum}>{attendanceHistory.length}</Text>
                        <Text style={styles.statLbl}>Total Days</Text>
                    </View>
                    <View style={[styles.statBox, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#f1f5f9' }]}>
                        <Text style={[styles.statNum, { color: '#059669' }]}>{daysPresent}</Text>
                        <Text style={styles.statLbl}>Days Present</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={[styles.statNum, { color: '#2563eb' }]}>₹{totalEarned}</Text>
                        <Text style={styles.statLbl}>Total Paid</Text>
                    </View>
                </View>

                {/* ── Primary Info ── */}
                <View style={styles.infoCard}>
                    <Text style={styles.cardTitle}>Primary Information</Text>
                    <DetailItem label="Role / Position" value={worker.workType} icon="👷‍♂️" />
                    <DetailItem label="Wage Rate" value={`₹ ${worker.wageAmount} (${worker.salaryType})`} icon="💰" />
                    <DetailItem label="Phone Number" value={worker.phone} icon="📱" />
                    <DetailItem label="Aadhaar ID" value={worker.aadhaar || 'Not Provided'} icon="🆔" />
                    <DetailItem
                        label="Member Since"
                        value={new Date(worker.joinDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                        icon="📅"
                    />
                </View>

                {/* ── Recent Attendance ── */}
                {attendanceHistory.length > 0 && (
                    <View style={styles.infoCard}>
                        <Text style={styles.cardTitle}>Recent Attendance</Text>
                        {attendanceHistory.slice(0, 5).map((rec, i) => (
                            <View key={rec._id || i} style={styles.historyRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.historyDate}>{new Date(rec.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
                                    <Text style={styles.historySiteName} numberOfLines={1}>📍 {rec.siteId?.siteName || 'Unknown Site'}</Text>
                                </View>

                                <View style={styles.historyRightCol}>
                                    <View style={[styles.statusPill,
                                    rec.status === 'Present' ? styles.pillPresent :
                                        rec.status === 'Absent' ? styles.pillAbsent : styles.pillHalf
                                    ]}>
                                        <Text style={styles.pillText}>{rec.status}</Text>
                                    </View>
                                    <Text style={styles.historySalary}>₹{rec.totalDaySalary?.toFixed(0) || '0'}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* ── Actions ── */}
                <View style={styles.actionSection}>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.editBtn]}
                        onPress={() => setEditVisible(true)}
                    >
                        <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, worker.isActive ? styles.suspendBtn : styles.reactivateBtn]}
                        onPress={handleToggleActive}
                    >
                        <Text style={worker.isActive ? styles.suspendBtnText : styles.reactivateBtnText}>
                            {worker.isActive ? 'Suspend' : 'Reactivate'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, styles.deleteBtn]}
                        onPress={handleDelete}
                    >
                        <Text style={styles.deleteBtnText}>Delete</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* ── Edit Modal ── */}
            <Modal visible={editVisible} animationType="slide" transparent>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Worker Profile</Text>
                            <TouchableOpacity onPress={() => setEditVisible(false)}>
                                <Text style={styles.modalClose}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView>
                            {[
                                { label: 'Full Name', key: 'name', keyboard: 'default' },
                                { label: 'Phone Number', key: 'phone', keyboard: 'phone-pad' },
                                { label: 'Daily Wage (₹)', key: 'wageAmount', keyboard: 'numeric' },
                                { label: 'Role / Position', key: 'workType', keyboard: 'default' },
                            ].map(({ label, key, keyboard }) => (
                                <View key={key} style={styles.editGroup}>
                                    <Text style={styles.editLabel}>{label}</Text>
                                    <TextInput
                                        style={styles.editInput}
                                        value={editData[key]}
                                        onChangeText={(t) => setEditData(prev => ({ ...prev, [key]: t }))}
                                        keyboardType={keyboard}
                                        placeholderTextColor="#94a3b8"
                                    />
                                </View>
                            ))}

                            <Text style={styles.editLabel}>Payment Cycle</Text>
                            <View style={styles.cycleRow}>
                                {['daily', 'monthly', 'weekly'].map(type => (
                                    <TouchableOpacity
                                        key={type}
                                        style={[styles.cycleBtn, editData.salaryType === type && styles.cycleBtnSelected]}
                                        onPress={() => setEditData(prev => ({ ...prev, salaryType: type }))}
                                    >
                                        <Text style={[styles.cycleTxt, editData.salaryType === type && styles.cycleTxtSelected]}>
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TouchableOpacity
                                style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                                onPress={handleSaveEdit}
                                disabled={saving}
                            >
                                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: 24, paddingBottom: 48 },

    profileHeader: { alignItems: 'center', marginBottom: 24 },
    imageAvatarLarge: {
        width: 100, height: 100, borderRadius: 50,
        marginBottom: 16, borderWidth: 4, borderColor: '#fff',
    },
    avatarLarge: {
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: '#e0e7ff', justifyContent: 'center', alignItems: 'center',
        marginBottom: 16, borderWidth: 4, borderColor: '#fff',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4
    },
    avatarTextLarge: { fontSize: 40, fontWeight: 'bold', color: '#4338ca' },
    nameLarge: { fontSize: 26, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
    badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
    dailyBadge: { backgroundColor: '#fef3c7' },
    monthlyBadge: { backgroundColor: '#dcfce7' },
    weeklyBadge: { backgroundColor: '#e0e7ff' },
    badgeText: { fontSize: 12, fontWeight: '800', color: '#92400e' },

    statsRow: {
        flexDirection: 'row', backgroundColor: '#fff', borderRadius: 20,
        marginBottom: 20, overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2
    },
    statBox: { flex: 1, paddingVertical: 16, alignItems: 'center' },
    statNum: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
    statLbl: { fontSize: 11, color: '#94a3b8', fontWeight: '600', marginTop: 2 },

    infoCard: {
        backgroundColor: '#fff', borderRadius: 24, padding: 24, paddingBottom: 8,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
        marginBottom: 20
    },
    cardTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 20 },
    detailItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    detailIcon: {
        width: 44, height: 44, borderRadius: 12, backgroundColor: '#f1f5f9',
        justifyContent: 'center', alignItems: 'center', marginRight: 16
    },
    detailLabel: { fontSize: 12, color: '#64748b', fontWeight: '500' },
    detailValue: { fontSize: 15, color: '#0f172a', fontWeight: '700', marginTop: 2 },

    historyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    historyDate: { fontSize: 13, color: '#0f172a', fontWeight: '700', marginBottom: 4 },
    historySiteName: { fontSize: 12, color: '#64748b', fontWeight: '500' },
    historyRightCol: { alignItems: 'flex-end', justifyContent: 'center' },
    statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 6 },
    pillPresent: { backgroundColor: '#dcfce7' },
    pillAbsent: { backgroundColor: '#fee2e2' },
    pillHalf: { backgroundColor: '#fef3c7' },
    pillText: { fontSize: 10, fontWeight: '800', color: '#374151', textTransform: 'uppercase' },
    historySalary: { fontSize: 15, fontWeight: '800', color: '#059669' },

    actionSection: { flexDirection: 'row', gap: 12 },
    actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    editBtn: { backgroundColor: '#f1f5f9' },
    editBtnText: { color: '#475569', fontWeight: '700', fontSize: 14 },

    suspendBtn: { backgroundColor: '#fff3f3', borderWidth: 1, borderColor: '#fecaca' },
    suspendBtnText: { color: '#ef4444', fontWeight: '700', fontSize: 14 },

    reactivateBtn: { backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0' },
    reactivateBtnText: { color: '#10b981', fontWeight: '700', fontSize: 14 },

    deleteBtn: { backgroundColor: '#ef4444' },
    deleteBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalCard: {
        backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32,
        padding: 28, maxHeight: '90%'
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
    modalClose: { fontSize: 20, color: '#94a3b8', fontWeight: '700' },
    editGroup: { marginBottom: 18 },
    editLabel: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 8 },
    editInput: {
        backgroundColor: '#f1f5f9', padding: 14, borderRadius: 12,
        fontSize: 16, color: '#1e293b', borderWidth: 1, borderColor: '#e2e8f0'
    },
    cycleRow: { flexDirection: 'row', gap: 10, marginBottom: 28, marginTop: 8 },
    cycleBtn: {
        flex: 1, paddingVertical: 12, borderRadius: 12,
        borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', backgroundColor: '#fff'
    },
    cycleBtnSelected: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
    cycleTxt: { fontSize: 13, fontWeight: '600', color: '#64748b' },
    cycleTxtSelected: { color: '#2563eb' },
    saveBtn: {
        backgroundColor: '#2563eb', padding: 18, borderRadius: 14,
        alignItems: 'center', marginBottom: 12,
        shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4
    },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default WorkerDetailsScreen;
