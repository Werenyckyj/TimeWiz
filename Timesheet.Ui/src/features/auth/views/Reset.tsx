import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AuthRepository } from "../services/AuthRepository";
import { PasswordField } from "../../../shared/components/PassworField";

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

        if (newPassword.length < 8) {
            setMessage({ text: "Password must be at least 8 characters long.", type: 'error' });
            return;
        }

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
                    <h2 style={{ color: 'var(--reject-text)' }}>Invalid Reset Link</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>The link you followed is missing required information.</p>
                    <Link to="/forgot" className="btn btn-primary mt-3">Request New Link</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ color: 'var(--text-primary)', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
            <div className="row">
                <div className="col">
                </div>
                <div className="col border border-secondary-subtle gap-3 rounded-4 p-2" style={{ minWidth: '270px', backgroundColor: 'var(--bg-secondary)' }}>
                    <div style={{ maxWidth: '400px', width: '100%', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)' }}>
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
                                    <PasswordField formData={{ password: newPassword }} setFormData={(val) => {
                                        if (typeof val === 'function') {
                                            const res = (val as (prev: { password: string }) => { password: string })({ password: newPassword });
                                            setNewPassword(res.password);
                                        } else {
                                            setNewPassword(val.password);
                                        }
                                    }} />
                                </div>

                                <div className="mb-4">
                                    <label htmlFor="confirmPassword" className="form-label" style={{ fontWeight: '500' }}>Confirm Password</label>
                                    <PasswordField formData={{ password: confirmPassword }} setFormData={(val) => {
                                        if (typeof val === 'function') {
                                            const res = (val as (prev: { password: string }) => { password: string })({ password: confirmPassword });
                                            setConfirmPassword(res.password);
                                        } else {
                                            setConfirmPassword(val.password);
                                        }
                                    }} />
                                </div>

                                <button
                                    type="submit"
                                    className="primary-button-2"
                                    disabled={isLoading || !newPassword || !confirmPassword}
                                    style={{ fontWeight: 'bold', padding: '10px', backgroundColor: "var(--primary-button)", color: "white", border: "1px solid var(--primary-button-border)", borderRadius: '8px', width: '100%' }}
                                >
                                    {isLoading ? "Saving..." : "Reset Password"}
                                </button>
                            </form>
                        )}

                        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                            <Link to="/login" style={{ color: 'var(--primary-button)', textDecoration: 'none', fontWeight: 'bold' }}>
                                Back to Login
                            </Link>
                        </div>
                        <br />
                    </div>
                </div>
                <div className="col">
                </div>
            </div>

        </div>
    );
}