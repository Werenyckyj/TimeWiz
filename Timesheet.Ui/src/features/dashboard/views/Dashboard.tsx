import { Link } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth"; // Uprav cestu podle své struktury

export default function Dashboard() {
    const { user } = useAuth();

    const cardStyle = {
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '12px',
        textDecoration: 'none',
        color: 'var(--text-primary)',
        flex: '1',
        minWidth: '250px'
    };

    const titleStyle = {
        margin: 0,
        fontSize: '1.25rem',
        fontWeight: 'bold',
        color: 'var(--text-primary)'
    };

    const descStyle = {
        margin: 0,
        color: 'var(--text-secondary)',
        fontSize: '0.9rem'
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Dashboard</h1>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                    Welcome back, <strong style={{ color: 'var(--text-primary)' }}>{user?.unique_name || "User"}</strong>!
                    Here is an overview of your workspace.
                </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>

                <Link to="/timesheets" style={cardStyle} className="dashboard-card">
                    <h2 style={titleStyle}>🕒 My Timesheets</h2>
                    <p style={descStyle}>Log your working hours, edit drafts, and submit timesheets for approval.</p>
                </Link>

                <Link to="/reports" style={cardStyle} className="dashboard-card">
                    <h2 style={titleStyle}>📊 Reports</h2>
                    <p style={descStyle}>View summaries and detailed reports of your tracked time.</p>
                </Link>

                {(user?.role === 'Admin' || user?.role === 'Manager') && (
                    <>
                        <Link to="/approvals" style={cardStyle} className="dashboard-card">
                            <h2 style={titleStyle}>✅ Pending Approvals</h2>
                            <p style={descStyle}>Review and approve or reject timesheets submitted by your team.</p>
                        </Link>

                        <Link to="/projects" style={cardStyle} className="dashboard-card">
                            <h2 style={titleStyle}>📁 Projects</h2>
                            <p style={descStyle}>Manage projects, assign members, and oversee progress.</p>
                        </Link>
                    </>
                )}

                {user?.role === 'Admin' && (
                    <>
                        <Link to="/users" style={cardStyle} className="dashboard-card">
                            <h2 style={titleStyle}>👥 Users</h2>
                            <p style={descStyle}>Manage employee accounts, roles, and system access.</p>
                        </Link>

                        <Link to="/companies" style={cardStyle} className="dashboard-card">
                            <h2 style={titleStyle}>🏢 Companies</h2>
                            <p style={descStyle}>Manage company profiles and organizational settings.</p>
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}