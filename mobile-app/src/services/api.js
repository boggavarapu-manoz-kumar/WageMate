import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// NOTE: When testing on Android Emulator, localhost doesn't work. Use 10.0.2.2
// If testing on a real device over Wi-Fi, use your computer's local IP address (e.g., 192.168.1.5)
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.2:5000/api';

// Create an Axios instance
const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add JWT token
api.interceptors.request.use(async (config) => {
    try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (error) {
        console.error('Interceptor Token Error');
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export const workerAPI = {
    // Fetch all workers
    getAllWorkers: async () => {
        try {
            const response = await api.get('/workers');
            return response.data;
        } catch (error) {
            console.error('Error fetching workers:', error);
            throw error;
        }
    },

    // Fetch a single worker
    getWorkerById: async (id) => {
        try {
            const response = await api.get(`/workers/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching worker details:', error);
            throw error;
        }
    },

    // Add a new worker
    addWorker: async (workerData) => {
        try {
            const response = await api.post('/workers', workerData);
            return response.data;
        } catch (error) {
            console.error('Error adding worker:', error);
            throw error;
        }
    },

    // Update worker
    updateWorker: async (id, workerData) => {
        try {
            const response = await api.put(`/workers/${id}`, workerData);
            return response.data;
        } catch (error) {
            console.error('Error updating worker:', error);
            throw error;
        }
    },

    // Delete worker
    deleteWorker: async (id) => {
        try {
            const response = await api.delete(`/workers/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting worker:', error);
            throw error;
        }
    }
};

export const attendanceAPI = {
    // Mark daily attendance
    markAttendance: async (attendanceData) => {
        try {
            const response = await api.post('/attendance', attendanceData);
            return response.data;
        } catch (error) {
            console.error('Error marking attendance:', error);
            throw error;
        }
    },

    // Get attendance history for a specific worker
    getWorkerAttendance: async (workerId) => {
        try {
            const response = await api.get(`/attendance/${workerId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching worker attendance:', error);
            throw error;
        }
    }
};

export const dashboardAPI = {
    // Get summary statistics
    getDashboardStats: async () => {
        try {
            const response = await api.get('/dashboard');
            return response.data;
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            throw error;
        }
    }
};

export const authAPI = {
    // Login user
    loginUser: async (credentials) => {
        try {
            const response = await api.post('/users/login', credentials);
            return response.data;
        } catch (error) {
            console.error('Error logging in:', error);
            throw error;
        }
    }
};

export const siteAPI = {
    // Fetch all active sites
    getAllSites: async () => {
        try {
            const response = await api.get('/sites');
            return response.data;
        } catch (error) {
            console.error('Error fetching sites:', error);
            throw error;
        }
    },
    // Create new site
    createSite: async (siteData) => {
        try {
            const response = await api.post('/sites', siteData);
            return response.data;
        } catch (error) {
            console.error('Error creating site:', error);
            throw error;
        }
    },
    // Update site
    updateSite: async (id, siteData) => {
        try {
            const response = await api.put(`/sites/${id}`, siteData);
            return response.data;
        } catch (error) {
            console.error('Error updating site:', error);
            throw error;
        }
    },
    // Delete site
    deleteSite: async (id) => {
        try {
            const response = await api.delete(`/sites/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting site:', error);
            throw error;
        }
    }
};

export const paymentAPI = {
    // Generate salary for a period
    generateSalary: async (workerId, startDate, endDate) => {
        try {
            const response = await api.get(`/payments/generate/${workerId}?startDate=${startDate}&endDate=${endDate}`);
            return response.data;
        } catch (error) {
            console.error('Error generating salary:', error);
            throw error;
        }
    },

    // Record a payment
    createPayment: async (paymentData) => {
        try {
            const response = await api.post('/payments', paymentData);
            return response.data;
        } catch (error) {
            console.error('Error creating payment:', error);
            throw error;
        }
    },

    // Get payment history for a specific worker
    getWorkerPayments: async (workerId) => {
        try {
            const response = await api.get(`/payments/worker/${workerId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching worker payments:', error);
            throw error;
        }
    },

    // Get all payments
    getAllPayments: async () => {
        try {
            const response = await api.get('/payments');
            return response.data;
        } catch (error) {
            console.error('Error fetching all payments:', error);
            throw error;
        }
    }
};

export default api;
