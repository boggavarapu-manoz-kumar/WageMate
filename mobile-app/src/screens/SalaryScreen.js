import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    TextInput,
    SafeAreaView,
    Platform,
    StatusBar,
    Share
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { workerAPI, paymentAPI } from '../services/api';

const SalaryScreen = ({ navigation }) => {
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedWorkerId, setSelectedWorkerId] = useState('');

    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const [startDate, setStartDate] = useState(lastWeek.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

    const [salaryData, setSalaryData] = useState(null);
    const [calculating, setCalculating] = useState(false);
    const [paying, setPaying] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('Cash');

    useEffect(() => {
        fetchWorkers();
    }, []);

    const fetchWorkers = async () => {
        try {
            const response = await workerAPI.getAllWorkers();
            if (response.success && response.data.length > 0) {
                setWorkers(response.data);
                setSelectedWorkerId(response.data[0]._id);
            }
        } catch (error) {
            Alert.alert('System Error', 'Unable to load workforce data.');
        } finally {
            setLoading(false);
        }
    };

    const handleCalculate = async () => {
        if (!selectedWorkerId || !startDate || !endDate) {
            Alert.alert('Required Fields', 'Please select a worker and choose a valid date range.');
            return;
        }

        try {
            setCalculating(true);
            const response = await paymentAPI.generateSalary(selectedWorkerId, startDate, endDate);
            if (response.success) {
                setSalaryData(response.salaryData);
            }
        } catch (error) {
            const msg = error.response?.data?.error || 'No attendance records found for this period.';
            Alert.alert('No Records', msg);
            setSalaryData(null);
        } finally {
            setCalculating(false);
        }
    };

    const handlePayment = async () => {
        try {
            setPaying(true);
            const payload = {
                workerId: selectedWorkerId,
                amount: salaryData.financials.netPayable,
                paymentMethod: paymentMethod,
                periodStart: startDate,
                periodEnd: endDate,
                notes: 'Settled via WageMate'
            };

            const response = await paymentAPI.createPayment(payload);
            if (response.success) {
                Alert.alert('Success ✓', `Payment of ₹${salaryData.financials.netPayable} recorded in ledger.`);
                setSalaryData(null);
            }
        } catch (error) {
            Alert.alert('System Error', 'Failed to record the payment transaction.');
        } finally {
            setPaying(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    const SlipRow = ({ label, value, isBold = false, isNegative = false }) => (
        <View style={styles.slipRow}>
            <Text style={[styles.slipLabel, isBold && { fontWeight: '700', color: '#1e293b' }]}>{label}</Text>
            <Text style={[
                styles.slipValue,
                isBold && { fontWeight: '800' },
                isNegative && { color: '#ef4444' }
            ]}>
                {isNegative ? `- ₹${value.toLocaleString('en-IN')}` : `₹${value.toLocaleString('en-IN')}`}
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Salary Payouts</Text>
                    <Text style={styles.headerSubtitle}>Settle accounts and generate digital payslips.</Text>
                </View>

                <View style={styles.configCard}>
                    <View style={styles.rowLabel}>
                        <Text style={styles.labelEmoji}>👷‍♂️</Text>
                        <Text style={styles.label}>Select Worker</Text>
                    </View>
                    <View style={styles.pickerWrapper}>
                        <Picker
                            selectedValue={selectedWorkerId}
                            onValueChange={(val) => setSelectedWorkerId(val)}
                            style={styles.picker}
                        >
                            {workers.map((w) => (
                                <Picker.Item key={w._id} label={`${w.name} (${w.workType})`} value={w._id} />
                            ))}
                        </Picker>
                    </View>

                    {selectedWorkerId ? (
                        <TouchableOpacity
                            style={styles.historyBtn}
                            onPress={() => {
                                const worker = workers.find(w => w._id === selectedWorkerId);
                                navigation.navigate('PayoutHistory', { workerId: selectedWorkerId, workerName: worker ? worker.name : 'Unknown Worker' });
                            }}
                        >
                            <Text style={styles.historyBtnText}>View Past Payouts</Text>
                        </TouchableOpacity>
                    ) : null}

                    <View style={styles.dateRow}>
                        <View style={{ flex: 1, marginRight: 12 }}>
                            <Text style={styles.label}>Start Date</Text>
                            <TextInput
                                style={styles.input}
                                value={startDate}
                                onChangeText={setStartDate}
                                placeholder="YYYY-MM-DD"
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>End Date</Text>
                            <TextInput
                                style={styles.input}
                                value={endDate}
                                onChangeText={setEndDate}
                                placeholder="YYYY-MM-DD"
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.calcBtn, calculating && styles.disabledBtn]}
                        onPress={handleCalculate}
                        disabled={calculating}
                        activeOpacity={0.8}
                    >
                        {calculating ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.calcBtnText}>Generate Statement</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {salaryData && (
                    <View style={styles.slipContainer}>
                        <View style={styles.slipCard}>
                            <View style={styles.slipBranding}>
                                <Text style={styles.brandText}>Wage<Text style={{ color: '#2563eb' }}>Mate</Text></Text>
                                <TouchableOpacity
                                    style={styles.shareBtn}
                                    onPress={async () => {
                                        try {
                                            const workerName = workers.find(w => w._id === selectedWorkerId)?.name || 'Worker';
                                            const message = `*WageMate Payroll Statement*\n\nName: ${workerName}\nPeriod: ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}\n\nDays Present: ${salaryData.summary.daysPresent}\nBasic Earnings: ₹${salaryData.financials.totalBaseEarned}\nOvertime: ₹${salaryData.financials.totalOvertimePay}\nBonuses: ₹${salaryData.financials.totalBonus}\nAdvances Deducted: ₹${salaryData.financials.totalAdvancesDeducted}\n\n*NET PAYABLE: ₹${salaryData.financials.netPayable}*\n\nPowered by WageMate Digital Ledger`;
                                            await Share.share({ message });
                                        } catch (error) {
                                            console.log('Error sharing', error);
                                        }
                                    }}
                                >
                                    <Text style={styles.shareIcon}>📤</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.slipHeader}>
                                <Text style={styles.slipTitle}>OFFICIAL PAYROLL STATEMENT</Text>
                                <Text style={styles.slipDates}>{new Date(startDate).toLocaleDateString()} — {new Date(endDate).toLocaleDateString()}</Text>
                            </View>

                            <View style={styles.slipContent}>
                                <View style={styles.slipMainRow}>
                                    <View>
                                        <Text style={styles.mainLabel}>Total Presence</Text>
                                        <Text style={styles.mainSubLabel}>Worker Attendance</Text>
                                    </View>
                                    <Text style={styles.mainValue}>{salaryData.summary.daysPresent} Days</Text>
                                </View>

                                <View style={styles.divider} />

                                <SlipRow label="Basic Earnings" value={salaryData.financials.totalBaseEarned} />
                                <SlipRow label="Overtime (OT)" value={salaryData.financials.totalOvertimePay} />
                                <SlipRow label="Total Bonuses" value={salaryData.financials.totalBonus} />
                                <SlipRow label="Advances Deducted" value={salaryData.financials.totalAdvancesDeducted} isNegative={true} />
                                {salaryData.financials.totalAlreadyPaid > 0 && (
                                    <SlipRow label="Previously Settled" value={salaryData.financials.totalAlreadyPaid} isNegative={true} />
                                )}

                                {salaryData.dailyHistory && salaryData.dailyHistory.length > 0 && (
                                    <View style={styles.historyTable}>
                                        <Text style={styles.tableTitle}>Daily Breakdown</Text>
                                        {salaryData.dailyHistory.map((day, idx) => (
                                            <View key={idx} style={[styles.tableRow, idx === salaryData.dailyHistory.length - 1 && { borderBottomWidth: 0 }]}>
                                                <View>
                                                    <Text style={styles.dayName}>{day.dayName}, {new Date(day.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}</Text>
                                                    <Text style={[styles.dayStatus, day.status === 'Absent' ? {color: '#ef4444'} : {color: '#10b981'}]}>
                                                        {day.status}
                                                    </Text>
                                                    {day.isSettled && <Text style={{fontSize: 10, color:'#b91c1c', fontWeight: 'bold', marginTop: 2}}>⚠ Payment Already Settled</Text>}
                                                </View>
                                                <View style={{alignItems: 'flex-end'}}>
                                                    <Text style={styles.dayAmount}>+ ₹{day.amount}</Text>
                                                    {day.advance > 0 && <Text style={styles.dayAdvance}>- ₹{day.advance} (Adv)</Text>}
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                )}

                                <View style={styles.paymentMethodSection}>
                                    <View style={styles.rowLabel}>
                                        <Text style={styles.labelEmoji}>💳</Text>
                                        <Text style={styles.label}>Settlement Method</Text>
                                    </View>
                                    <View style={styles.pickerWrapperMini}>
                                        <Picker
                                            selectedValue={paymentMethod}
                                            onValueChange={(val) => setPaymentMethod(val)}
                                            style={styles.pickerMini}
                                        >
                                            <Picker.Item label="Cash" value="Cash" />
                                            <Picker.Item label="UPI / PhonePe" value="UPI" />
                                            <Picker.Item label="Bank Transfer" value="Bank Transfer" />
                                        </Picker>
                                    </View>
                                </View>

                                <View style={styles.totalContainer}>
                                    <View>
                                        <Text style={styles.totalLabel}>NET PAYABLE</Text>
                                        <Text style={styles.netAmountSub}>Final settlement amount</Text>
                                    </View>
                                    <Text style={styles.totalValue}>₹{salaryData.financials.netPayable.toLocaleString('en-IN')}</Text>
                                </View>
                            </View>
                            <View style={styles.slipFooter}>
                                <Text style={styles.footerBrand}>Powered by WageMate Digital Ledger</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.payBtn, (paying || salaryData.financials.netPayable <= 0) && styles.disabledBtn]}
                            onPress={handlePayment}
                            disabled={paying || salaryData.financials.netPayable <= 0}
                            activeOpacity={0.8}
                        >
                            {paying ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <View style={styles.btnRow}>
                                    <Text style={styles.payBtnText}>
                                        {salaryData.financials.netPayable <= 0 ? "Fully Paid" : "Settle Payment"}
                                    </Text>
                                    <Text style={styles.btnIcon}>💸</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: 20, paddingBottom: 40 },

    header: { marginBottom: 24, marginTop: 10 },
    headerTitle: { fontSize: 28, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
    headerSubtitle: { fontSize: 15, color: '#64748b', marginTop: 4 },

    configCard: {
        backgroundColor: '#fff', padding: 24, borderRadius: 28,
        borderWidth: 1, borderColor: '#f1f5f9',
        ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 15 }, android: { elevation: 4 } })
    },
    rowLabel: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    labelEmoji: { fontSize: 16, marginRight: 8 },
    label: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 8 },

    pickerWrapper: {
        backgroundColor: '#f8fafc', borderRadius: 16, marginBottom: 20,
        borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden'
    },
    pickerWrapperMini: {
        backgroundColor: '#f8fafc', borderRadius: 12, marginBottom: 10,
        borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden'
    },
    pickerMini: { height: 50 },
    historyBtn: {
        alignSelf: 'flex-end', marginBottom: 20, marginTop: -10,
        backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8
    },
    historyBtnText: { color: '#2563eb', fontSize: 13, fontWeight: '700' },
    paymentMethodSection: { marginTop: 10 },
    dateRow: { flexDirection: 'row', marginBottom: 24 },
    input: {
        backgroundColor: '#f8fafc', padding: 16, borderRadius: 16,
        fontSize: 15, color: '#1e293b', borderWidth: 1, borderColor: '#e2e8f0', fontWeight: '600'
    },
    calcBtn: {
        backgroundColor: '#2563eb', padding: 18, borderRadius: 18, alignItems: 'center',
        shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 4
    },
    calcBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

    slipContainer: { marginTop: 32 },
    slipCard: {
        backgroundColor: '#fff', borderRadius: 32, padding: 0, overflow: 'hidden',
        borderWidth: 1, borderColor: '#e2e8f0',
        ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.08, shadowRadius: 30 }, android: { elevation: 8 } })
    },
    slipBranding: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 24, paddingTop: 24, paddingBottom: 10
    },
    brandText: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
    shareBtn: { backgroundColor: '#f1f5f9', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    shareIcon: { fontSize: 18 },

    slipHeader: { backgroundColor: '#fcfdfe', padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    slipTitle: { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 1.5 },
    slipDates: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginTop: 4 },

    slipContent: { padding: 24 },
    slipMainRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    mainLabel: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
    mainSubLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '500', marginTop: 2 },
    mainValue: { fontSize: 18, fontWeight: '800', color: '#2563eb' },

    divider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 20 },
    slipRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
    slipLabel: { fontSize: 14, color: '#64748b', fontWeight: '500' },
    slipValue: { fontSize: 15, fontWeight: '700', color: '#1e293b' },

    totalContainer: {
        marginTop: 10, paddingTop: 24, borderTopWidth: 2, borderTopColor: '#f1f5f9', borderStyle: 'dashed',
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
    },
    totalLabel: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
    netAmountSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
    totalValue: { fontSize: 32, fontWeight: '900', color: '#059669' },

    slipFooter: { backgroundColor: '#f8fafc', padding: 16, alignItems: 'center' },
    footerBrand: { fontSize: 10, color: '#cbd5e1', fontWeight: '700', letterSpacing: 0.5 },

    historyTable: { marginTop: 20, marginBottom: 20, backgroundColor: '#f8fafc', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
    tableTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a', marginBottom: 12 },
    tableRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    dayName: { fontSize: 14, fontWeight: '700', color: '#334155' },
    dayStatus: { fontSize: 12, fontWeight: '600', marginTop: 2 },
    dayAmount: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
    dayAdvance: { fontSize: 12, fontWeight: '600', color: '#ef4444', marginTop: 2 },

    payBtn: {
        backgroundColor: '#059669', padding: 20, borderRadius: 22, alignItems: 'center', marginTop: 24,
        shadowColor: '#059669', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8
    },
    payBtnText: { color: '#fff', fontSize: 17, fontWeight: '800', marginRight: 10 },
    btnRow: { flexDirection: 'row', alignItems: 'center' },
    btnIcon: { fontSize: 20 },
    disabledBtn: { opacity: 0.7 }
});

export default SalaryScreen;
