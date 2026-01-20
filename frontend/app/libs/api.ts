import axios from "axios";

// Create axios instance with absolute base URL
export const api = axios.create({
  baseURL: "http://localhost:5000/api", // Absolute URL with protocol
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor to add auth token if needed
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage if it exists
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      // Server responded with error status
      console.error("API Error:", error.response.status, error.response.data);

      // Handle 401 Unauthorized - redirect to login
      if (error.response.status === 401) {
        localStorage.removeItem("token");
        // Optionally redirect to login page
        // window.location.href = '/login';
      }
    } else if (error.request) {
      // Request made but no response received
      console.error("Network Error:", error.request);
    } else {
      // Something else happened
      console.error("Error:", error.message);
    }

    return Promise.reject(error);
  }
);

export default api;
