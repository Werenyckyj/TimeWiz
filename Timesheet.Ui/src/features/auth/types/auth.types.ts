export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    username: string;
    isAuthorized: boolean;
    token: {
        accessToken: string;
        expirationTime: Date;
        refreshToken: string;
        userId: number;
    };
}

export interface RevokeRequest {
    accessToken: string;
    refreshToken: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    email: string;
    token: string;
    newPassword: string;
}