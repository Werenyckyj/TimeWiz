import { useState } from 'react';
import { AuthRepository } from '../services/AuthRepository';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const navigate = useNavigate();
    const { login } = useAuth();

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
        <div style={{ padding: '2rem', fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
            <div className="container">
                <div className="row">
                    <div className="col">
                    </div>
                    <div className="col border border-secondary-subtle gap-3 rounded-4 p-2">
                        <h2 className="text-center">Login to Timesheet</h2>
                        <form onSubmit={handleLogin}>
                            <div className="mb-3">
                                <label htmlFor="usernameInput" className="form-label">Username</label>
                                <input type="text" className="form-control" id="usernameInput" value={username} onChange={(e) => setUsername(e.target.value)} aria-describedby="emailHelp" />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="passwordInput" className="form-label">Password</label>
                                <input type="password" className="form-control" id="passwordInput" value={password} onChange={(e) => setPassword(e.target.value)} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
                                <button type="submit" className="btn btn-primary">Login</button>
                                <Link to="/forgot" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
                                    Forgot Password?
                                </Link>                            </div>
                            {message && <p style={{ marginTop: '1rem', fontWeight: 'bold' }}>{message}</p>}
                        </form>
                    </div>
                    <div className="col">
                    </div>
                </div>
            </div>
        </div>
    );
}