import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    Modal,
    Image
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { workerAPI, attendanceAPI, siteAPI, paymentAPI } from '../services/api';

const AttendanceScreen = ({ navigation, route }) => {
    const [workers, setWorkers] = useState([]);
    const [sites, setSites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [confirmModalVisible, setConfirmModalVisible] = useState(false);
    const [checkingBalance, setCheckingBalance] = useState(false);
    const [pendingBalance, setPendingBalance] = useState(0);

    const [formData, setFormData] = useState({
        workerId: '',
        siteId: '',
        date: new Date().toISOString().split('T')[0],
        status: 'Present',
        overtimeHours: '0',
        overtimeRate: '0',
        extraBonus: '0',
        customPayment: '0',
        advancePaid: '0',
        notes: ''
    });

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (route.params?.scannedWorkerId) {
            setFormData(prev => ({ ...prev, workerId: route.params.scannedWorkerId }));
            // Provide subtle feedback
            Alert.alert('Worker Found ✓', 'Worker ID pre-filled from QR scan.');
            // Clear the param
            navigation.setParams({ scannedWorkerId: undefined });
        }
    }, [route.params?.scannedWorkerId]);

    const loadInitialData = async () => {
        try {
            const [workerRes, siteRes] = await Promise.all([
                workerAPI.getAllWorkers(),
                siteAPI.getAllSites()
            ]);

            if (siteRes.success && siteRes.data.length > 0) {
                setSites(siteRes.data);
                setFormData(prev => ({ ...prev, siteId: siteRes.data[0]._id }));
            }

            if (workerRes.success && workerRes.data.length > 0) {
                setWorkers(workerRes.data);
                setFormData(prev => ({ ...prev, workerId: workerRes.data[0]._id }));
            }
        } catch (error) {
            Alert.alert('Data Error', 'Failed to synchronize sites and workers.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!formData.workerId) {
            Alert.alert('Selection Required', 'Please choose a worker from the list first.');
            return;
        }

        if (['Present', 'Half Day', 'Custom'].includes(formData.status)) {
            setCheckingBalance(true);
            try {
                const [attendRes, payRes] = await Promise.all([
                    attendanceAPI.getWorkerAttendance(formData.workerId),
                    paymentAPI.getWorkerPayments(formData.workerId)
                ]);

                let historicalEarned = 0;
                let historicalPaid = 0;

                if (attendRes.success) {
                    historicalEarned = attendRes.data.reduce((sum, a) => sum + (a.totalDaySalary || 0), 0);
                }
                if (payRes.success) {
                    historicalPaid = payRes.data.reduce((sum, p) => sum + (p.amount || 0), 0);
                }

                setPendingBalance(historicalEarned - historicalPaid);
            } catch (error) {
                console.error("Failed to fetch balance", error);
                setPendingBalance(0);
            } finally {
                setCheckingBalance(false);
                setConfirmModalVisible(true);
            }
        } else {
            executeSubmit();
        }
    };

    const executeSubmit = async () => {
        try {
            setConfirmModalVisible(false);
            setSubmitting(true);
            const payload = {
                ...formData,
                overtimeHours: Number(formData.overtimeHours) || 0,
                overtimeRate: Number(formData.overtimeRate) || 0,
                extraBonus: Number(formData.extraBonus) || 0,
                customPayment: Number(formData.customPayment) || 0,
                advancePaid: Number(formData.advancePaid) || 0,
            };

            const response = await attendanceAPI.markAttendance(payload);

            if (response.success) {
                Alert.alert('Success ✓', 'Daily attendance has been recorded.');
                setFormData(prev => ({
                    ...prev,
                    overtimeHours: '0', overtimeRate: '0', extraBonus: '0',
                    customPayment: '0', advancePaid: '0', notes: ''
                }));
            }
        } catch (error) {
            const msg = error.response?.data?.error || 'Failed to record attendance. Check if it\'s already marked for today.';
            Alert.alert('Blocked', msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusChange = (newStatus) => {
        setFormData(prev => {
            const updated = { ...prev, status: newStatus };
            // Rule: If switching away from Custom, clear customPayment
            if (newStatus !== 'Custom') {
                updated.customPayment = '0';
            }
            // If switching to Absent, clear everything except worker/site/date
            if (newStatus === 'Absent') {
                updated.overtimeHours = '0';
                updated.overtimeRate = '0';
                updated.extraBonus = '0';
                updated.customPayment = '0';
                updated.advancePaid = '0';
            }
            return updated;
        });
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    const FormLabel = ({ label, icon }) => (
        <View style={styles.labelRow}>
            <Text style={styles.labelEmoji}>{icon}</Text>
            <Text style={styles.label}>{label}</Text>
        </View>
    );

    const selectedWorker = workers.find(w => w._id === formData.workerId) || null;
    const selectedSite = sites.find(s => s._id === formData.siteId) || null;

    let baseWageToCalculate = 0;
    if (selectedWorker) {
        if (formData.status === 'Custom') baseWageToCalculate = Number(formData.customPayment) || 0;
        else if (formData.status === 'Half Day') baseWageToCalculate = (selectedWorker.wageAmount || 0) / 2;
        else baseWageToCalculate = selectedWorker.wageAmount || 0;
    }
    const totalTodayPay = baseWageToCalculate
        + (Number(formData.overtimeHours || 0) * Number(formData.overtimeRate || 0))
        + Number(formData.extraBonus || 0)
        - Number(formData.advancePaid || 0);

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Daily Logs</Text>
                        <Text style={styles.headerSubtitle}>Deploy workers and record daily performance.</Text>
                    </View>

                    <View style={styles.formCard}>
                        <View style={styles.dateHeader}>
                            <View style={styles.dateBadge}>
                                <Text style={styles.dateEmoji}>📅</Text>
                                <Text style={styles.dateText}>
                                    {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                </Text>
                            </View>
                            <View style={styles.liveBadge}>
                                <View style={styles.liveDot} />
                                <Text style={styles.liveText}>READY</Text>
                            </View>
                        </View>

                        <FormLabel label="Project Site" icon="🏗️" />
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={formData.siteId}
                                onValueChange={(val) => setFormData({ ...formData, siteId: val })}
                                style={styles.picker}
                                dropdownIconColor="#2563eb"
                            >
                                {sites.map((s) => (
                                    <Picker.Item key={s._id} label={s.siteName} value={s._id} />
                                ))}
                            </Picker>
                        </View>

                        <View style={styles.labelRow}>
                            <FormLabel label="Select Worker" icon="👷‍♂️" />
                            <TouchableOpacity
                                style={styles.scanBtn}
                                onPress={() => navigation.navigate('Scanner')}
                            >
                                <Text style={styles.scanBtnText}>📸 Scan QR</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={formData.workerId}
                                onValueChange={(val) => setFormData({ ...formData, workerId: val })}
                                style={styles.picker}
                                dropdownIconColor="#2563eb"
                            >
                                {workers.map((w) => (
                                    <Picker.Item key={w._id} label={`${w.name} (${w.workType})`} value={w._id} />
                                ))}
                            </Picker>
                        </View>

                        <FormLabel label="Attendance Status" icon="📍" />
                        <View style={styles.statusGrid}>
                            {['Present', 'Absent', 'Half Day', 'Custom'].map((opt) => (
                                <TouchableOpacity
                                    key={opt}
                                    style={[
                                        styles.statusBtn,
                                        formData.status === opt && styles.statusBtnSelected
                                    ]}
                                    onPress={() => handleStatusChange(opt)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[
                                        styles.statusBtnText,
                                        formData.status === opt && styles.statusBtnTextSelected
                                    ]}>{opt}</Text>
                                    {formData.status === opt && <View style={styles.checkDone}><Text style={{ fontSize: 10, color: '#fff' }}>✓</Text></View>}
                                </TouchableOpacity>
                            ))}
                        </View>

                        {formData.status !== 'Absent' && (
                            <View style={styles.detailedInputs}>
                                <View style={styles.row}>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.subLabel}>OT Hours</Text>
                                        <TextInput
                                            style={styles.input}
                                            keyboardType="numeric"
                                            value={formData.overtimeHours}
                                            onChangeText={(t) => setFormData({ ...formData, overtimeHours: t })}
                                            placeholder="0"
                                        />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.subLabel}>OT Rate (₹)</Text>
                                        <TextInput
                                            style={styles.input}
                                            keyboardType="numeric"
                                            value={formData.overtimeRate}
                                            onChangeText={(t) => setFormData({ ...formData, overtimeRate: t })}
                                            placeholder="0"
                                        />
                                    </View>
                                </View>

                                <View style={styles.row}>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.subLabel}>Bonus (₹)</Text>
                                        <TextInput
                                            style={styles.input}
                                            keyboardType="numeric"
                                            value={formData.extraBonus}
                                            onChangeText={(t) => setFormData({ ...formData, extraBonus: t })}
                                            placeholder="0"
                                        />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={[styles.subLabel, { color: '#ef4444' }]}>Advance (₹)</Text>
                                        <TextInput
                                            style={[styles.input, styles.advanceInput]}
                                            keyboardType="numeric"
                                            value={formData.advancePaid}
                                            onChangeText={(t) => setFormData({ ...formData, advancePaid: t })}
                                            placeholder="0"
                                        />
                                    </View>
                                </View>
                            </View>
                        )}

                        {formData.status === 'Custom' && (
                            <View style={styles.customField}>
                                <FormLabel label="Specific Wage Amount (₹)" icon="💵" />
                                <TextInput
                                    style={styles.input}
                                    keyboardType="numeric"
                                    value={formData.customPayment}
                                    onChangeText={(t) => setFormData({ ...formData, customPayment: t })}
                                    placeholder="Enter amount"
                                />
                            </View>
                        )}

                        <FormLabel label="Work Notes" icon="📝" />
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            multiline
                            numberOfLines={3}
                            placeholder="Shift details, performance or site notes..."
                            placeholderTextColor="#94a3b8"
                            value={formData.notes}
                            onChangeText={(t) => setFormData({ ...formData, notes: t })}
                        />

                        <TouchableOpacity
                            style={[styles.submitBtn, (submitting || checkingBalance) && styles.disabledBtn]}
                            onPress={handleSubmit}
                            disabled={submitting || checkingBalance}
                            activeOpacity={0.8}
                        >
                            {submitting || checkingBalance ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <View style={styles.btnContent}>
                                    <Text style={styles.submitBtnText}>Confirm Entry</Text>
                                    <Text style={styles.btnArrow}>→</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* ── Confirm Modal ── */}
            <Modal visible={confirmModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Confirm Attendance</Text>
                            <TouchableOpacity onPress={() => setConfirmModalVisible(false)}>
                                <Text style={styles.modalClose}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {selectedWorker && (
                            <View style={styles.modalProfileRow}>
                                {selectedWorker.photo ? (
                                    <Image source={{ uri: selectedWorker.photo }} style={styles.modalAvatarImage} />
                                ) : (
                                    <View style={styles.modalAvatarPlaceholder}>
                                        <Text style={styles.modalAvatarText}>{selectedWorker.name.charAt(0)}</Text>
                                    </View>
                                )}
                                <View style={styles.modalProfileInfo}>
                                    <Text style={styles.modalWorkerName}>{selectedWorker.name}</Text>
                                    <Text style={styles.modalWorkerRole}>{selectedWorker.workType}</Text>
                                    <View style={styles.statusPill}>
                                        <Text style={styles.statusPillText}>Status: {formData.status}</Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {selectedSite && (
                            <View style={styles.modalLocationBox}>
                                <Text style={{ fontSize: 18, marginHorizontal: 4, marginRight: 12 }}>📍</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.modalLocationLabel}>Assigned Site Today</Text>
                                    <Text style={styles.modalLocationName}>{selectedSite.siteName}</Text>
                                </View>
                            </View>
                        )}

                        <View style={styles.modalCalcCard}>
                            <Text style={styles.calcTitle}>Today's Calculation</Text>

                            <View style={styles.calcRow}>
                                <Text style={styles.calcLabel}>Base Wage ({formData.status})</Text>
                                <Text style={styles.calcValue}>₹{baseWageToCalculate.toFixed(0)}</Text>
                            </View>

                            {(Number(formData.overtimeHours) > 0) && (
                                <View style={styles.calcRow}>
                                    <Text style={styles.calcLabel}>Overtime (+)</Text>
                                    <Text style={[styles.calcValue, { color: '#16a34a' }]}>
                                        ₹{(Number(formData.overtimeHours) * Number(formData.overtimeRate)).toFixed(0)}
                                    </Text>
                                </View>
                            )}

                            {(Number(formData.extraBonus) > 0) && (
                                <View style={styles.calcRow}>
                                    <Text style={styles.calcLabel}>Bonus (+)</Text>
                                    <Text style={[styles.calcValue, { color: '#16a34a' }]}>₹{Number(formData.extraBonus).toFixed(0)}</Text>
                                </View>
                            )}

                            {(Number(formData.advancePaid) > 0) && (
                                <View style={styles.calcRow}>
                                    <Text style={styles.calcLabel}>Advance Deducted (-)</Text>
                                    <Text style={[styles.calcValue, { color: '#ef4444' }]}>₹{Number(formData.advancePaid).toFixed(0)}</Text>
                                </View>
                            )}

                            <View style={styles.calcDivider} />

                            <View style={styles.calcRowTotal}>
                                <Text style={styles.calcTotalLabel}>Total Pay Today</Text>
                                <Text style={styles.calcTotalValue}>₹{totalTodayPay.toFixed(0)}</Text>
                            </View>

                            <View style={styles.calcDivider} />

                            <View style={styles.calcRow}>
                                <Text style={styles.calcLabel}>Total Historical Pending Balance</Text>
                                <Text style={[styles.calcValue, { color: pendingBalance > 0 ? '#ea580c' : '#16a34a' }]}>
                                    ₹{pendingBalance.toFixed(0)}
                                </Text>
                            </View>
                        </View>

                        <Text style={styles.modalWarning}>
                            Are you sure you want to mark this attendance and record the daily compensation?
                        </Text>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setConfirmModalVisible(false)}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.confirmFinalBtn} onPress={executeSubmit}>
                                <Text style={styles.confirmFinalBtnText}>Yes, Confirm!</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: 20, paddingBottom: 40 },

    header: { marginBottom: 24, marginTop: 10 },
    headerTitle: { fontSize: 28, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
    headerSubtitle: { fontSize: 15, color: '#64748b', marginTop: 4, lineHeight: 20 },

    formCard: {
        backgroundColor: '#fff', padding: 24, borderRadius: 28,
        borderWidth: 1, borderColor: '#f1f5f9',
        ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 15 }, android: { elevation: 4 } })
    },

    dateHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
    dateBadge: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff',
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12
    },
    dateEmoji: { fontSize: 16, marginRight: 8 },
    dateText: { color: '#1e40af', fontWeight: '700', fontSize: 13 },
    liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e', marginRight: 6 },
    liveText: { fontSize: 10, fontWeight: '800', color: '#166534' },

    labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
    labelEmoji: { fontSize: 14, marginRight: 8 },
    label: { fontSize: 14, fontWeight: '700', color: '#334155' },
    subLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 6 },

    scanBtn: {
        backgroundColor: '#eff6ff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#dbeafe'
    },
    scanBtnText: { color: '#2563eb', fontSize: 12, fontWeight: '800' },

    pickerContainer: {
        backgroundColor: '#f8fafc', borderRadius: 16, marginBottom: 20,
        borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden'
    },
    picker: { height: 55, ...Platform.select({ android: { marginLeft: -8 } }) },

    statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
    statusBtn: {
        flex: 1, minWidth: '45%', paddingVertical: 15, borderRadius: 16,
        borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', backgroundColor: '#fff',
        position: 'relative'
    },
    statusBtnSelected: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
    statusBtnText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
    statusBtnTextSelected: { color: '#2563eb' },
    checkDone: {
        position: 'absolute', top: -5, right: -5, width: 18, height: 18,
        borderRadius: 9, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: '#fff'
    },

    detailedInputs: { marginBottom: 8 },
    row: { flexDirection: 'row', gap: 12, marginBottom: 4 },
    inputGroup: { flex: 1 },
    input: {
        backgroundColor: '#f8fafc', padding: 16, borderRadius: 16,
        fontSize: 16, color: '#1e293b', borderWidth: 1, borderColor: '#e2e8f0',
        marginBottom: 16, fontWeight: '600'
    },
    advanceInput: { borderColor: '#fee2e2', color: '#ef4444' },
    textArea: { height: 100, textAlignVertical: 'top', paddingTop: 16 },

    submitBtn: {
        backgroundColor: '#2563eb', padding: 20, borderRadius: 20,
        alignItems: 'center', marginTop: 12,
        shadowColor: '#2563eb', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6
    },
    disabledBtn: { opacity: 0.7 },
    btnContent: { flexDirection: 'row', alignItems: 'center' },
    submitBtnText: { color: '#fff', fontSize: 17, fontWeight: '800', marginRight: 10 },
    btnArrow: { color: '#fff', fontSize: 20, fontWeight: '300' },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalCard: { backgroundColor: '#fff', width: '100%', borderRadius: 28, padding: 24, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 }, android: { elevation: 10 } }) },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
    modalClose: { fontSize: 24, color: '#94a3b8', fontWeight: '700' },

    modalProfileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, backgroundColor: '#f8fafc', padding: 16, borderRadius: 20 },
    modalAvatarImage: { width: 56, height: 56, borderRadius: 28, marginRight: 16 },
    modalAvatarPlaceholder: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    modalAvatarText: { color: '#fff', fontSize: 24, fontWeight: '800' },
    modalProfileInfo: { flex: 1 },
    modalWorkerName: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 2 },
    modalWorkerRole: { fontSize: 13, color: '#64748b', fontWeight: '600', marginBottom: 6 },
    statusPill: { alignSelf: 'flex-start', backgroundColor: '#e0e7ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusPillText: { fontSize: 11, fontWeight: '800', color: '#4338ca' },

    modalLocationBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', padding: 16, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#bfdbfe' },
    modalLocationLabel: { fontSize: 11, color: '#3b82f6', fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
    modalLocationName: { fontSize: 16, color: '#1e3a8a', fontWeight: '800' },

    modalCalcCard: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 20, padding: 16, marginBottom: 20 },
    calcTitle: { fontSize: 13, fontWeight: '700', color: '#64748b', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
    calcRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    calcLabel: { fontSize: 14, color: '#475569', fontWeight: '500' },
    calcValue: { fontSize: 14, color: '#0f172a', fontWeight: '700' },
    calcDivider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 12 },
    calcRowTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    calcTotalLabel: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
    calcTotalValue: { fontSize: 20, fontWeight: '800', color: '#2563eb' },

    modalWarning: { fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    modalActions: { flexDirection: 'row', gap: 12 },
    cancelBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, backgroundColor: '#f1f5f9', alignItems: 'center' },
    cancelBtnText: { color: '#475569', fontSize: 15, fontWeight: '700' },
    confirmFinalBtn: { flex: 1.5, paddingVertical: 16, borderRadius: 16, backgroundColor: '#2563eb', alignItems: 'center' },
    confirmFinalBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' }
});

export default AttendanceScreen;
