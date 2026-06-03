import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
  headers: {
    Accept: "application/json",
  },
});

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const config = error.config;

    if (!config) return Promise.reject(error);

    config.__retryCount = config.__retryCount || 0;

    const isNetworkError = !error.response;
    const isServerError = error.response && error.response.status >= 500;
    const isSafeToRetry = isNetworkError || isServerError;

    if (isSafeToRetry && !config.noRetry && config.__retryCount < MAX_RETRIES) {
      config.__retryCount += 1;

      const delay = RETRY_DELAY_MS * config.__retryCount;

      await new Promise((resolve) => setTimeout(resolve, delay));

      return api(config);
    }

    return Promise.reject(error);
  },
);

export default api;
