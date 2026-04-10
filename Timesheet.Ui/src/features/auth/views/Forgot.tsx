import { useState } from "react";
import { Link } from "react-router-dom";
import { AuthRepository } from "../services/AuthRepository";

export default function Forgot() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            await AuthRepository.forgotPassword({ email });
            setMessage({ text: "If that email is in our database, we will send you a link to reset your password.", type: 'success' });
            setEmail("")
        } catch {
            setMessage({ text: "If that email is in our database, we will send you a link to reset your password.", type: 'success' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: 'var(--text-primary)' }}>
            <div style={{ maxWidth: '400px', width: '100%', padding: '2rem', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Forgot Password</h2>

                {message && (
                    <div style={{ marginBottom: '1rem', padding: '10px', borderRadius: '4px', backgroundColor: message.type === 'error' ? '#fef2f2' : '#f0fdf4', color: message.type === 'error' ? '#ef4444' : '#16a34a', border: `1px solid ${message.type === 'error' ? '#fecaca' : '#bbf7d0'}` }}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="emailInput" className="form-label" style={{ fontWeight: '500' }}>Email address</label>
                        <input
                            type="email"
                            className="form-control"
                            id="emailInput"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isLoading}
                            style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary w-100"
                        disabled={isLoading || !email}
                        style={{ fontWeight: 'bold', padding: '10px' }}
                    >
                        {isLoading ? "Sending..." : "Send Reset Link"}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    <Link to="/login" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}