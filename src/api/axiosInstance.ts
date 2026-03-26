import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Defined in Vite config to proxy to Spring Boot backend
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
