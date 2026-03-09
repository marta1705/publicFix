import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Flaga zapobiegająca wielokrotnym próbom refresh
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

/**
 * Interceptor dla automatycznego odświeżania tokenu
 */
api.interceptors.response.use(
  (response) => {
    // Sukces - zwróć response
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Jeśli to błąd 401 (Unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Nie próbuj refresh dla endpointów auth
      if (
        originalRequest.url.includes("/auth/login") ||
        originalRequest.url.includes("/auth/register") ||
        originalRequest.url.includes("/auth/refresh")
      ) {
        return Promise.reject(error);
      }

      // Jeśli już trwa odświeżanie
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log("🔄 Odświeżanie tokenu...");

        // Spróbuj odświeżyć token
        await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true },
        );

        console.log("✅ Token odświeżony");

        processQueue(null);
        isRefreshing = false;

        // Powtórz oryginalny request
        return api(originalRequest);
      } catch (refreshError) {
        console.error("❌ Refresh token wygasł");

        processQueue(refreshError);
        isRefreshing = false;

        // Przekieruj na login
        window.location.href = "/login";

        return Promise.reject(refreshError);
      }
    }

    // Inne błędy - zwróć bez zmian
    return Promise.reject(error);
  },
);

export default api;
