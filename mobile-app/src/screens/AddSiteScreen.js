import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
    KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { siteAPI } from '../services/api';

const AddSiteScreen = ({ navigation }) => {
    const [formData, setFormData] = useState({
        siteName: '',
        address: '',
        budget: '',
        imageUrl: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const defaultImage = 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&q=80&w=800';

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'We need gallery permissions to upload a site photo.');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.6,
            base64: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setFormData({ ...formData, imageUrl: `data:image/jpeg;base64,${result.assets[0].base64}` });
        }
    };

    const handleSubmit = async () => {
        if (!formData.siteName || !formData.address) {
            Alert.alert('Required Fields', 'Please provide a valid Project Name and Address.');
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                siteName: formData.siteName.trim(),
                location: {
                    address: formData.address.trim(),
                    coordinates: { lat: 0, lng: 0 } // Default for now
                },
                budget: formData.budget ? Number(formData.budget) : 0,
                imageUrl: formData.imageUrl.trim() || undefined // Only send if provided
            };

            const response = await siteAPI.createSite(payload);

            if (response.success) {
                Alert.alert('Success', 'Project created successfully!');
                navigation.goBack();
            }
        } catch (error) {
            Alert.alert('Error', error.response?.data?.error || 'Failed to create the site.');
        } finally {
            setSubmitting(false);
        }
    };

    const renderInput = (label, key, placeholder, keyboardType = 'default', required = false, multiline = false) => (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label} {required && <Text style={styles.required}>*</Text>}</Text>
            <TextInput
                style={[styles.input, multiline && styles.textArea]}
                placeholder={placeholder}
                placeholderTextColor="#94a3b8"
                value={formData[key]}
                onChangeText={(text) => setFormData({ ...formData, [key]: text })}
                keyboardType={keyboardType}
                multiline={multiline}
                textAlignVertical={multiline ? 'top' : 'center'}
            />
        </View>
    );

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>New Project</Text>
                    <Text style={styles.headerSubtitle}>Add a new construction site, shop, or workspace.</Text>
                </View>

                {/* Image Preview Container */}
                <TouchableOpacity style={styles.previewContainer} onPress={pickImage} activeOpacity={0.8}>
                    <Image
                        source={{ uri: formData.imageUrl.trim() || defaultImage }}
                        style={styles.previewImage}
                    />
                    <View style={styles.previewOverlay}>
                        <Text style={styles.previewText}>📷 Tap to Upload Site Cover Photo</Text>
                    </View>
                </TouchableOpacity>

                <View style={styles.formCard}>
                    {renderInput('Project / Site Name', 'siteName', 'e.g., Downtown Plaza Build', 'default', true)}
                    {renderInput('Physical Address', 'address', 'Full location address', 'default', true, true)}
                    {renderInput('Initial Budget (₹)', 'budget', '0.00', 'numeric')}



                    <TouchableOpacity
                        style={[styles.submitBtn, submitting && styles.disabledBtn]}
                        onPress={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitBtnText}>Create Project</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    scrollContent: { padding: 20 },
    header: { marginBottom: 20, marginTop: 10 },
    headerTitle: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
    headerSubtitle: { fontSize: 15, color: '#64748b', marginTop: 4, lineHeight: 22 },

    previewContainer: {
        width: '100%', height: 180, borderRadius: 20, overflow: 'hidden', marginBottom: 24,
        backgroundColor: '#e2e8f0', borderWidth: 1, borderColor: '#cbd5e1'
    },
    previewImage: { width: '100%', height: '100%' },
    previewOverlay: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: 10, alignItems: 'center'
    },
    previewText: { color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },

    formCard: {
        backgroundColor: '#fff', padding: 24, borderRadius: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 3
    },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '700', color: '#334155', marginBottom: 8 },
    required: { color: '#ef4444' },
    optional: { color: '#94a3b8', fontSize: 12, fontWeight: '500' },
    helpText: { fontSize: 12, color: '#94a3b8', marginTop: 6, fontStyle: 'italic' },

    input: {
        backgroundColor: '#f8fafc', padding: 16, borderRadius: 16,
        fontSize: 16, color: '#1e293b', borderWidth: 1, borderColor: '#e2e8f0', fontWeight: '500'
    },
    textArea: { height: 100, paddingTop: 16 },

    submitBtn: {
        backgroundColor: '#2563eb', padding: 18, borderRadius: 18, alignItems: 'center', marginTop: 10,
        shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4
    },
    disabledBtn: { opacity: 0.7 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' }
});

export default AddSiteScreen;
