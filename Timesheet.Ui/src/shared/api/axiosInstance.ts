import axios from "axios";

const api = axios.create({
    baseURL: "/api", // Change this to your API base URL
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
        return Promise.reject(error);
    }
);

export default api;
