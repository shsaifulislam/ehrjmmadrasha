import axios from 'axios';

// Create an Axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  withCredentials: true, // Important for HTTP-only cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if error response exists
    if (error.response) {
      const status = error.response.status;

      if (status === 401) {
        // Unauthorized - Redirect to login ONLY if visiting a protected portal route or protected API
        if (typeof window !== 'undefined') {
          const path = window.location.pathname;
          const reqUrl = error.config?.url || '';
          const isProtectedRoute = path.startsWith('/admin') || path.startsWith('/teacher') || path.startsWith('/student');
          const isProtectedApi = reqUrl.includes('/admin/') || reqUrl.includes('/teacher/') || reqUrl.includes('/student/');

          if ((isProtectedRoute || isProtectedApi) && path !== '/login') {
            window.location.href = '/login?expired=true';
          }
        }
      } else if (status === 403) {
        // Forbidden - User doesn't have permission
        console.error('Permission denied:', error.response.data.message);
      }
      
      // Extract error message from response if available
      const backendMessage = error.response.data?.message;
      if (backendMessage) {
        error.message = backendMessage;
      } else {
        error.message = 'সার্ভারে সমস্যা হয়েছে, আবার চেষ্টা করুন।';
      }
    } else {
      error.message = 'নেটওয়ার্ক এরর, ইন্টারনেট কানেকশন চেক করুন।';
    }

    return Promise.reject(error);
  }
);

export default api;
