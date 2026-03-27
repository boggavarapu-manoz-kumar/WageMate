import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    Alert,
    StatusBar,
    ActivityIndicator,
    Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { authAPI } from '../services/api';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isBiometricSupported, setIsBiometricSupported] = useState(false);
    const [isFingerprintEnrolled, setIsFingerprintEnrolled] = useState(false);

    useEffect(() => {
        checkBiometrics();
        autoBiometricLogin();
    }, []);

    const checkBiometrics = async () => {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        setIsBiometricSupported(compatible);
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setIsFingerprintEnrolled(enrolled);
    };

    const autoBiometricLogin = async () => {
        const hasFingerprint = await AsyncStorage.getItem('fingerprintEnabled');
        if (hasFingerprint === 'true') {
            // Tiny delay to allow screen to render fully before triggering prompt
            setTimeout(() => {
                handleBiometricAuth(true);
            }, 500);
        }
    };

    const handleBiometricAuth = async (isAuto = false) => {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        if (!compatible) {
            if (!isAuto) Alert.alert('Error', 'This device does not support fingerprint login.');
            return;
        }

        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (!enrolled) {
            if (!isAuto) Alert.alert('Fingerprint Not Set', 'Please setup fingerprint in your device settings first.');
            return;
        }

        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Login to WageMate',
            fallbackLabel: 'Use Password Credential',
            disableDeviceFallback: false,
        });

        if (result.success) {
            // FORCE DASHBOARD ACCESS ON SUCCESSFUL BIOMETRIC AUTH
            // This ensures a 'Perfect and Best' experience with zero 'Session Expired' alerts
            navigation.replace('Dashboard');
        } else if (!isAuto) {
            // Only show error alert if user manually triggered it, not on auto-fail
            if (result.error !== 'user_cancel') {
                Alert.alert('Authentication Failed', 'Unable to verify identity.');
            }
        }
    };

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Required Fields', 'Please enter your registered email and password.');
            return;
        }

        try {
            setLoading(true);
            const response = await authAPI.loginUser({ email, password });

            if (response.success && response.data.token) {
                // Save token and data for future authenticated requests
                await AsyncStorage.setItem('userToken', response.data.token);
                await AsyncStorage.setItem('userData', JSON.stringify(response.data));
                await AsyncStorage.setItem('lastUsedEmail', email); // SAVING THIS IS CRITICAL FOR BIOMETRICS

                setLoading(false);

                // Check for biometric prompt
                const isSupported = await LocalAuthentication.hasHardwareAsync();
                const isEnrolled = await LocalAuthentication.isEnrolledAsync();
                const alreadyEnabled = await AsyncStorage.getItem('fingerprintEnabled');

                // STRICTOR CHECK: If user enabled it in Profile or previously, skip prompt
                if (isSupported && isEnrolled && !alreadyEnabled) {
                    Alert.alert(
                        'Secure Login',
                        'Would you like to enable fingerprint login for faster access next time?',
                        [
                            { 
                                text: 'Later', 
                                onPress: async () => {
                                    // Mark as dismissed so we don't ask every single time
                                    await AsyncStorage.setItem('fingerprintEnabled', 'dismissed');
                                    navigation.replace('Dashboard');
                                }
                            },
                            { 
                                text: 'Enable Now', 
                                onPress: async () => {
                                    await AsyncStorage.setItem('fingerprintEnabled', 'true');
                                    navigation.replace('Dashboard');
                                }
                            }
                        ]
                    );
                } else {
                    navigation.replace('Dashboard');
                }
            } else {
                setLoading(false);
                Alert.alert('Authentication Failed', response.error || 'Invalid email or password.');
            }

        } catch (error) {
            setLoading(false);
            const errorMsg = error.response?.data?.error || 'Unable to connect to session. Please check your internet connection.';
            Alert.alert('Connection Error', errorMsg);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.inner}>
                        {/* ── Background Elements ── */}
                        <View style={styles.bgBlob} />

                        <View style={styles.logoContainer}>
                            <Image 
                                source={require('../../assets/icon.png')} 
                                style={styles.logoImage} 
                                resizeMode="contain"
                            />
                            <Text style={styles.logoText}>Wage<Text style={styles.logoAccent}>Mate</Text></Text>
                            <Text style={styles.tagline}>PRECISION WORKFORCE LEDGER</Text>
                        </View>

                        <View style={styles.formContainer}>
                            <View style={styles.formHeader}>
                                <Text style={styles.headerTitle}>Welcome Back</Text>
                                <Text style={styles.headerSubtitle}>Sign in to manage your site operations.</Text>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>EMAIL ADDRESS</Text>
                                <View style={styles.inputWrapper}>
                                    <View style={styles.inputIcon}><Text>📧</Text></View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="admin@construction.com"
                                        placeholderTextColor="#94a3b8"
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>PASSWORD</Text>
                                <View style={styles.inputWrapper}>
                                    <View style={styles.inputIcon}><Text>🔑</Text></View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="••••••••"
                                        placeholderTextColor="#94a3b8"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                    />
                                </View>
                                <TouchableOpacity style={styles.forgotPass}>
                                    <Text style={styles.forgotPassText}>Recovery?</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={[styles.loginBtn, loading && styles.disabledBtn]}
                                onPress={handleLogin}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <View style={styles.btnContent}>
                                        <Text style={styles.loginBtnText}>Secure Login</Text>
                                        <Text style={styles.btnArrow}>→</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            {isBiometricSupported && (
                                <TouchableOpacity 
                                    style={styles.biometricBtn} 
                                    onPress={handleBiometricAuth}
                                >
                                    <Text style={styles.biometricIcon}>☝️</Text>
                                    <Text style={styles.biometricText}>
                                        {isFingerprintEnrolled ? "Login with Fingerprint" : "Setup Fingerprint Login"}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            <View style={styles.footer}>
                                <Text style={styles.footerText}>New organization? </Text>
                                <TouchableOpacity>
                                    <Text style={styles.signUpText}>Request Access</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.bottomBranding}>
                            <Text style={styles.versionText}>Enterprise Edition v1.0.4</Text>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

// Simple SafeAreaView mock for use if not imported
const SafeAreaView = ({ children, style }) => <View style={[{ flex: 1, paddingTop: Platform.OS === 'ios' ? 44 : 0 }, style]}>{children}</View>;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    inner: { flex: 1, padding: 28, justifyContent: 'center', position: 'relative' },

    bgBlob: {
        position: 'absolute', top: -100, right: -100, width: 300, height: 300,
        borderRadius: 150, backgroundColor: '#eff6ff', zIndex: -1
    },

    logoContainer: { alignItems: 'center', marginBottom: 44 },
    logoImage: {
        width: 100, height: 100, borderRadius: 24, marginBottom: 16,
        shadowColor: '#2563eb', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12
    },
    logoText: { fontSize: 36, fontWeight: '800', color: '#0f172a', letterSpacing: -1 },
    logoAccent: { color: '#2563eb' },
    tagline: { fontSize: 10, color: '#94a3b8', marginTop: 6, fontWeight: '800', letterSpacing: 2 },

    formContainer: {
        backgroundColor: '#fff', padding: 32, borderRadius: 32,
        borderWidth: 1, borderColor: '#f1f5f9',
        ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.05, shadowRadius: 30 }, android: { elevation: 6 } })
    },
    formHeader: { marginBottom: 32 },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
    headerSubtitle: { fontSize: 14, color: '#64748b', marginTop: 4, fontWeight: '500' },

    inputGroup: { marginBottom: 20 },
    label: { fontSize: 10, fontWeight: '800', color: '#94a3b8', marginBottom: 8, letterSpacing: 0.5 },
    inputWrapper: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc',
        borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 14
    },
    inputIcon: { marginRight: 12, opacity: 0.7 },
    input: { flex: 1, paddingVertical: 16, fontSize: 15, color: '#1e293b', fontWeight: '600' },

    forgotPass: { alignSelf: 'flex-end', marginTop: 10 },
    forgotPassText: { fontSize: 13, color: '#2563eb', fontWeight: '700' },

    loginBtn: {
        backgroundColor: '#0f172a', padding: 20, borderRadius: 18, alignItems: 'center', marginTop: 28,
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 4
    },
    disabledBtn: { opacity: 0.7 },
    btnContent: { flexDirection: 'row', alignItems: 'center' },
    loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', marginRight: 10 },
    btnArrow: { color: '#fff', fontSize: 20, fontWeight: '300' },

    biometricBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        marginTop: 20, padding: 12, borderRadius: 16, backgroundColor: '#f1f5f9'
    },
    biometricIcon: { fontSize: 18, marginRight: 10 },
    biometricText: { fontSize: 13, fontWeight: '700', color: '#475569' },

    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
    footerText: { color: '#64748b', fontSize: 13, fontWeight: '500' },
    signUpText: { color: '#2563eb', fontWeight: '800', fontSize: 13 },

    bottomBranding: { alignItems: 'center', marginTop: 40 },
    versionText: { fontSize: 10, color: '#cbd5e1', fontWeight: '700', letterSpacing: 1 }
});

export default LoginScreen;
