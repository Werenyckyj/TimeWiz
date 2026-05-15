import { useState } from 'react';
import { AuthRepository } from '../services/AuthRepository';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { PasswordField } from '../../../shared/components/PassworField';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const navigate = useNavigate();
    const { login } = useAuth();

    const setPasswordObj: React.Dispatch<React.SetStateAction<{ password: string }>> = (val) => {
        if (typeof val === 'function') {
            const res = (val as (prev: { password: string }) => { password: string })({ password });
            setPassword(res.password);
        } else {
            setPassword(val.password);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = await AuthRepository.login({ username, password });
            login(data.token.accessToken, data.token.refreshToken);
            navigate('/dashboard');

        } catch (error: unknown) {
            const errorMessage = (error as { response?: { data?: string } }).response?.data || 'Login failed';

            console.error("Error detail:", errorMessage);
            setMessage('❌ Error: ' + errorMessage);
        }
    };

    return (
        <div style={{ padding: '2rem', fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-secondary)' }}>
            <div className="container">
                <div className="row">
                    <div className="col">
                    </div>
                    <div className="col border border-secondary-subtle gap-3 rounded-4 p-2" style={{ minWidth: '270px', backgroundColor: 'var(--bg-primary)' }}>
                        <h2 className="text-center">Login to Timesheet</h2>
                        <form onSubmit={handleLogin}>
                            <div className="mb-3">
                                <label htmlFor="usernameInput" className="form-label">Username</label>
                                <input type="text" className="form-control" style={{ backgroundColor: 'var(--bg-secondary)' }} id="usernameInput" value={username} onChange={(e) => setUsername(e.target.value)} aria-describedby="emailHelp" />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="passwordInput" className="form-label">Password</label>
                                <PasswordField formData={{ password }} setFormData={setPasswordObj} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
                                <button type="submit" className="btn btn-primary" style={{ backgroundColor: "var(--primary-button)", borderColor: "var(--primary-button-border)", color: "white" }}>Login</button>
                                <Link to="/forgot" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
                                    Forgot Password?
                                </Link>                            </div>
                            {message && (
                                <div style={{ marginBottom: '1rem', overflowWrap: 'break-word', padding: '10px', backgroundColor: message.includes("Error") ? 'var(--reject)' : 'var(--success)', color: 'var(--text-primary)', borderRadius: '4px' }}>
                                    {message}
                                </div>
                            )}
                        </form>
                    </div>
                    <div className="col">
                    </div>
                </div>
            </div>
        </div>
    );
}