import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

API.interceptors.request.use((config) => {
    const user = localStorage.getItem('armsUser');
    if (user) {
        const { token } = JSON.parse(user);
        if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default API;
