import { Link } from "react-router-dom";

export default function NotFound() {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            textAlign: 'center',
            padding: '2rem'
        }}>
            <h1 style={{ fontSize: '8rem', margin: 0, color: '#3b82f6', lineHeight: 1 }}>404</h1>
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem', marginTop: '1rem' }}>Page Not Found</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '400px', fontSize: '1.1rem' }}>
                Oops! It looks like you're lost. The page you are looking for does not exist or has been moved.
            </p>

            <Link
                to="/dashboard"
                style={{
                    padding: '12px 24px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    fontWeight: 'bold'
                }}
            >
                Take Me Home
            </Link>
        </div>
    );
}