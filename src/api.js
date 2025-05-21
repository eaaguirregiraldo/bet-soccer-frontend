// src/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Puedes agregar un interceptor para incluir el token si estás autenticado
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // o sessionStorage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
