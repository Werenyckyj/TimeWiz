import { useState } from 'react';
import { AuthRepository } from '../services/AuthRepository';
import { useNavigate } from 'react-router-dom';
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
            login(data.token.accessToken);
            navigate('/dashboard');

        } catch (error: unknown) {
            const errorMessage = (error as { response?: { data?: string } }).response?.data || 'Login failed';

            console.error("Error detail:", errorMessage);
            setMessage('❌ Error: ' + errorMessage);
        }
    };

    return (
        <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
            <h2>Login to Timesheet</h2>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', width: '300px', gap: '1rem' }}>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button type="submit">Login</button>
            </form>
            {message && <p style={{ marginTop: '1rem', fontWeight: 'bold' }}>{message}</p>}
        </div>
    );
}