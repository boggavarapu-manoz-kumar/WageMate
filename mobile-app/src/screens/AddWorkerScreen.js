import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Image
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { workerAPI } from '../services/api';

const AddWorkerScreen = ({ navigation }) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        aadhaar: '',
        salaryType: 'daily',
        wageAmount: '',
        workType: ''
    });

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [photo, setPhoto] = useState(null);



    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'We need gallery permissions to upload a photo.');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images, // Correct usage of enum
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
        }
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.phone || !formData.wageAmount || !formData.workType) {
            Alert.alert('Selection Required', 'Please fill in all required fields.');
            return;
        }

        if (!photo) {
            Alert.alert('Photo Required', 'Please capture or select a worker photo. It is mandatory for identification.');
            return;
        }

        try {
            setSubmitting(true);

            const payload = {
                ...formData,
                wageAmount: Number(formData.wageAmount),
                photo: photo
            };

            const response = await workerAPI.addWorker(payload);

            if (response.success) {
                Alert.alert('Success', 'New worker registered successfully');
                navigation.goBack();
            }
        } catch (error) {
            const errorMsg = error.response?.data?.error || '';
            if (errorMsg.includes('duplicate key') && errorMsg.includes('aadhaar')) {
                Alert.alert('Duplicate Worker', 'A worker with this Aadhaar number is already registered.');
            } else if (errorMsg.includes('phone')) {
                Alert.alert('Duplicate Contact', 'This phone number is already registered for another worker.');
            } else {
                Alert.alert('Submission Error', errorMsg || 'Failed to save worker. Please verify the details.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const renderInput = (label, key, placeholder, keyboardType = 'default', required = false) => (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label} {required && <Text style={styles.required}>*</Text>}</Text>
            <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor="#94a3b8"
                value={formData[key]}
                onChangeText={(text) => setFormData({ ...formData, [key]: text })}
                keyboardType={keyboardType}
            />
        </View>
    );

    if (loading) return <View style={styles.container}><ActivityIndicator size="large" color="#2563eb" /></View>;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>New Worker</Text>
                    <Text style={styles.headerSubtitle}>Enter the details to add a new member to your workforce.</Text>
                </View>

                <View style={styles.formCard}>
                    <Text style={styles.label}>Worker Photo <Text style={styles.required}>*</Text></Text>
                    <View style={styles.photoContainer}>
                        <TouchableOpacity style={styles.photoUploadBtn} onPress={pickImage} activeOpacity={0.8}>
                            {photo ? (
                                <Image source={{ uri: photo }} style={styles.photoImage} />
                            ) : (
                                <View style={styles.photoPlaceholder}>
                                    <Text style={styles.photoPlaceholderIcon}>👤</Text>
                                    <Text style={styles.photoPlaceholderText}>Add Photo</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {renderInput('Full Name', 'name', 'e.g. Ramesh Kumar', 'default', true)}
                    {renderInput('Phone Number', 'phone', '10-digit mobile number', 'phone-pad', true)}
                    {renderInput('Aadhaar Number', 'aadhaar', '12-digit UIDAI number', 'numeric')}

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 12 }}>
                            {renderInput('Daily Wage (₹)', 'wageAmount', '800', 'numeric', true)}
                        </View>
                        <View style={{ flex: 1 }}>
                            {renderInput('Role', 'workType', 'Mason, Helper...', 'default', true)}
                        </View>
                    </View>

                    <Text style={styles.label}>Payment Cycle</Text>
                    <View style={styles.typeContainer}>
                        {['daily', 'weekly'].map((type) => (
                            <TouchableOpacity
                                key={type}
                                style={[
                                    styles.typeBtn,
                                    formData.salaryType === type && styles.typeBtnSelected
                                ]}
                                onPress={() => setFormData({ ...formData, salaryType: type })}
                            >
                                <Text style={[
                                    styles.typeText,
                                    formData.salaryType === type && styles.typeTextSelected
                                ]}>
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, submitting && styles.disabledBtn]}
                        onPress={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Register Worker</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView >
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    scrollContent: { padding: 20 },
    header: { marginBottom: 24, marginTop: 10 },
    headerTitle: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
    headerSubtitle: { fontSize: 15, color: '#64748b', marginTop: 4, lineHeight: 22 },
    formCard: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3
    },
    photoContainer: { alignItems: 'center', marginBottom: 24, marginTop: -10 },
    photoUploadBtn: {
        width: 100, height: 100, borderRadius: 50, backgroundColor: '#f1f5f9',
        justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
        borderWidth: 2, borderColor: '#e2e8f0', borderStyle: 'dashed'
    },
    photoImage: { width: '100%', height: '100%' },
    photoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
    photoPlaceholderIcon: { fontSize: 32, marginBottom: 4 },
    photoPlaceholderText: { fontSize: 12, color: '#64748b', fontWeight: '600' },

    inputGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
    required: { color: '#ef4444' },
    input: {
        backgroundColor: '#f1f5f9',
        padding: 16,
        borderRadius: 12,
        fontSize: 16,
        color: '#1e293b',
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    row: { flexDirection: 'row' },
    typeContainer: { flexDirection: 'row', gap: 12, marginBottom: 32 },
    typeBtn: {
        flex: 1, paddingVertical: 12, borderRadius: 12,
        borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', backgroundColor: '#fff'
    },
    typeBtnSelected: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
    typeText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
    typeTextSelected: { color: '#2563eb' },
    submitButton: {
        backgroundColor: '#2563eb',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4
    },
    disabledBtn: { opacity: 0.7 },
    submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});

export default AddWorkerScreen;
