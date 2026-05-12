import axios from "axios";

const api = axios.create({
    baseURL: "/api",
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem("refreshToken");
                const accessToken = localStorage.getItem("accessToken");
                if (!accessToken || !refreshToken) throw new Error("No access token available");


                const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
                    refreshToken: refreshToken,
                    accessToken: accessToken
                });

                const newAccessToken = response.data.token.accessToken;
                const newRefreshToken = response.data.token.refreshToken;

                localStorage.setItem("accessToken", newAccessToken);
                localStorage.setItem("refreshToken", newRefreshToken);
                console.log("Access token refreshed successfully");

                originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
                return api(originalRequest);

            } catch (refreshError) {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                window.location.href = "/login";
                return Promise.reject(refreshError);
            }
        }

        if (error.response?.status >= 500) {
            console.error("Critical error:", error.response.data);

            return Promise.reject(new Error("A critical server error occurred. Please try again later."));
        }

        const data = error.response?.data;

        if (data) {
            if (typeof data === "string") {
                return Promise.reject(new Error(data));
            }

            if (data.errors && typeof data.errors === "object") {
                const firstErrorKey = Object.keys(data.errors)[0];
                const firstErrorMessage = data.errors[firstErrorKey][0];
                return Promise.reject(new Error(firstErrorMessage || data.title || "Validation error"));
            }

            if (data.detail) {
                return Promise.reject(new Error(data.detail));
            }
            if (data.title) {
                return Promise.reject(new Error(data.title));
            }

            if (data.message) {
                return Promise.reject(new Error(data.message));
            }
        }

        return Promise.reject(error);
    }
);

export default api;
