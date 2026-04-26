import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8321',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Kirim cookie session Redis
});

// ─── Request Interceptor: Tambahkan JWT ke setiap request ─────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`[AXIOS-DEBUG] Token attached for ${config.url}`);
    } else {
      console.warn(`[AXIOS-DEBUG] NO TOKEN found for ${config.url}`);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ─── Response Interceptor: Handle 401 + Auto Refresh Token ────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Jika bukan 401 atau sudah retry, reject langsung
    if (!error.response || error.response.status !== 401 || originalRequest._retry) {
      // Jika 403 (Forbidden), redirect ke home
      if (error.response?.status === 403) {
        console.warn('[AXIOS] 403 Forbidden — akses ditolak');
      }
      return Promise.reject(error);
    }

    // Jangan refresh untuk endpoint auth (login/register/refresh)
    if (originalRequest.url?.includes('/api/v1/auth/')) {
      return Promise.reject(error);
    }

    // Jika sedang refresh, masukkan ke antrian
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return axiosInstance(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      // Tidak ada refresh token — force logout
      handleForceLogout();
      return Promise.reject(error);
    }

    try {
      const response = await axios.post('http://localhost:8321/api/v1/auth/refresh', {
        refreshToken,
      });

      if (response.data.success) {
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axiosInstance(originalRequest);
      } else {
        processQueue(new Error('Refresh failed'), null);
        handleForceLogout();
        return Promise.reject(error);
      }
    } catch (refreshError) {
      processQueue(refreshError, null);
      handleForceLogout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

/**
 * Force logout — hapus semua token dan redirect ke login.
 */
function handleForceLogout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userData');

  // Redirect ke login jika belum di halaman login
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

export default axiosInstance;
