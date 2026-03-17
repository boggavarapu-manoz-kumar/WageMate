import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, StatusBar, Platform, Dimensions, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

const { width, height } = Dimensions.get('window');

const ScannerScreen = ({ navigation }) => {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);

    useEffect(() => {
        if (!permission) {
            requestPermission();
        }
    }, [permission]);

    if (!permission) {
        // Camera permissions are still loading.
        return <View style={styles.centerContainer}><ActivityIndicator size="large" color="#2563eb" /></View>;
    }

    if (!permission.granted) {
        // Camera permissions are not granted yet.
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.permissionText}>We need your permission to show the camera</Text>
                <TouchableOpacity onPress={requestPermission} style={styles.permissionBtn}>
                    <Text style={styles.permissionBtnText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const handleBarCodeScanned = ({ type, data }) => {
        setScanned(true);
        // data should be workerId
        console.log(`Bar code with type ${type} and data ${data} has been scanned!`);
        navigation.navigate('Attendance', { scannedWorkerId: data });
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <CameraView
                style={StyleSheet.absoluteFillObject}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr", "pdf417"],
                }}
            >
                <SafeAreaView style={styles.overlay}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <Text style={styles.backBtnText}>✕</Text>
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Scan Worker ID</Text>
                        <View style={{ width: 44 }} />
                    </View>

                    <View style={styles.scannerContainer}>
                        <View style={styles.unfocusedContainer}></View>
                        <View style={styles.middleRow}>
                            <View style={styles.unfocusedContainer}></View>
                            <View style={styles.focusedContainer}>
                                <View style={styles.cornerTopLeft} />
                                <View style={styles.cornerTopRight} />
                                <View style={styles.cornerBottomLeft} />
                                <View style={styles.cornerBottomRight} />
                            </View>
                            <View style={styles.unfocusedContainer}></View>
                        </View>
                        <View style={styles.unfocusedContainer}></View>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Align the QR code within the frame to scan</Text>
                    </View>
                </SafeAreaView>
            </CameraView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f8fafc'
    },
    permissionText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#64748b',
        marginBottom: 20
    },
    permissionBtn: {
        backgroundColor: '#2563eb',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12
    },
    permissionBtnText: {
        color: '#fff',
        fontWeight: '700'
    },
    overlay: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 20,
        zIndex: 10
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    backBtnText: {
        color: '#fff',
        fontSize: 20
    },
    scannerContainer: {
        flex: 1,
    },
    unfocusedContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    middleRow: {
        flexDirection: 'row',
        height: width * 0.7,
    },
    focusedContainer: {
        width: width * 0.7,
        borderWidth: 0,
        position: 'relative'
    },
    cornerTopLeft: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 40,
        height: 40,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderColor: '#2563eb',
        borderTopLeftRadius: 16
    },
    cornerTopRight: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 40,
        height: 40,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderColor: '#2563eb',
        borderTopRightRadius: 16
    },
    cornerBottomLeft: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: 40,
        height: 40,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderColor: '#2563eb',
        borderBottomLeftRadius: 16
    },
    cornerBottomRight: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 40,
        height: 40,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderColor: '#2563eb',
        borderBottomRightRadius: 16
    },
    footer: {
        padding: 30,
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)'
    },
    footerText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
        opacity: 0.8
    }
});

export default ScannerScreen;
