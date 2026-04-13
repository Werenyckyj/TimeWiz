import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AuthRepository } from "../services/AuthRepository";

export default function Reset() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword !== confirmPassword) {
            setMessage({ text: "Passwords do not match.", type: 'error' });
            return;
        }

        if (!token || !email) {
            setMessage({ text: "Invalid reset link. Token or email is missing.", type: 'error' });
            return;
        }

        setIsLoading(true);

        try {
            await AuthRepository.resetPassword({
                email: email,
                token: token,
                newPassword: newPassword
            });

            setMessage({ text: "Password has been successfully reset! You can now log in.", type: 'success' });
            setNewPassword("");
            setConfirmPassword("");
        } catch (error) {
            console.error("Reset password error:", error);
            setMessage({ text: "Failed to reset password. The link might be expired or invalid.", type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    if (!token || !email) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: 'var(--text-primary)' }}>
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ color: '#ef4444' }}>Invalid Reset Link</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>The link you followed is missing required information.</p>
                    <Link to="/forgot" className="btn btn-primary mt-3">Request New Link</Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: 'var(--text-primary)' }}>
            <div style={{ maxWidth: '400px', width: '100%', padding: '2rem', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Create New Password</h2>

                {message && (
                    <div style={{ marginBottom: '1rem', padding: '10px', backgroundColor: message.text.includes("Error") ? 'var(--reject)' : 'var(--success)', color: 'var(--text-primary)', borderRadius: '4px' }}>
                        {message.text}
                    </div>
                )}

                {message?.type !== 'success' && (
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label" style={{ fontWeight: '500' }}>Email</label>
                            <input
                                type="email"
                                className="form-control"
                                value={email}
                                disabled
                                style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}
                            />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="newPassword" className="form-label" style={{ fontWeight: '500' }}>New Password</label>
                            <input
                                type="password"
                                className="form-control"
                                id="newPassword"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                minLength={6}
                                style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="confirmPassword" className="form-label" style={{ fontWeight: '500' }}>Confirm Password</label>
                            <input
                                type="password"
                                className="form-control"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                minLength={6}
                                style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-100"
                            disabled={isLoading || !newPassword || !confirmPassword}
                            style={{ fontWeight: 'bold', padding: '10px' }}
                        >
                            {isLoading ? "Saving..." : "Reset Password"}
                        </button>
                    </form>
                )}

                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    <Link to="/login" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}