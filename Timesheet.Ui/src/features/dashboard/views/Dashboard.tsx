import { Link } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import timesheetIcon from "../../../assets/archive.png";
import reporticon from "../../../assets/report.png";
import approvalIcon from "../../../assets/quality.png";
import projectIcon from "../../../assets/folder.png";
import userIcon from "../../../assets/user.png";
import companyIcon from "../../../assets/office.png";
import { useTheme } from "../../../shared/context/ThemeContext";

export default function Dashboard() {
    const { user } = useAuth();
    const { theme } = useTheme();

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
        <div className="main-content" style={{ maxWidth: '1200px' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Dashboard</h1>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                    Welcome back, <strong style={{ color: 'var(--text-primary)' }}>{user?.unique_name || "User"}</strong>!
                    Here is an overview of your workspace.
                </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>

                <Link to="/timesheets" style={cardStyle} className="dashboard-card">
                    <h2 style={titleStyle}><img style={{ width: '30px', filter: theme === 'dark' ? 'invert(1)' : 'none' }} src={timesheetIcon} alt="Timesheet" /> My Timesheets</h2>
                    <p style={descStyle}>Log your working hours, edit drafts, and submit timesheets for approval.</p>
                </Link>

                <Link to="/reports" style={cardStyle} className="dashboard-card">
                    <h2 style={titleStyle}><img style={{ width: '30px', filter: theme === 'dark' ? 'invert(1)' : 'none' }} src={reporticon} alt="Reports" /> Reports</h2>
                    <p style={descStyle}>View summaries and detailed reports of your tracked time.</p>
                </Link>

                {(user?.role === 'Admin' || user?.role === 'Manager') && (
                    <>
                        <Link to="/approvals" style={cardStyle} className="dashboard-card">
                            <h2 style={titleStyle}><img style={{ width: '30px', filter: theme === 'dark' ? 'invert(1)' : 'none' }} src={approvalIcon} alt="Approvals" /> Pending Approvals</h2>
                            <p style={descStyle}>Review and approve or reject timesheets submitted by your team.</p>
                        </Link>

                        <Link to="/projects" style={cardStyle} className="dashboard-card">
                            <h2 style={titleStyle}><img style={{ width: '30px', filter: theme === 'dark' ? 'invert(1)' : 'none' }} src={projectIcon} alt="Projects" /> Projects</h2>
                            <p style={descStyle}>Manage projects, assign members.</p>
                        </Link>
                    </>
                )}

                {user?.role === 'Admin' && (
                    <>
                        <Link to="/users" style={cardStyle} className="dashboard-card">
                            <h2 style={titleStyle}><img style={{ width: '30px', filter: theme === 'dark' ? 'invert(1)' : 'none' }} src={userIcon} alt="Users" /> Users</h2>
                            <p style={descStyle}>Manage employee accounts, roles, and system access.</p>
                        </Link>

                        <Link to="/companies" style={cardStyle} className="dashboard-card">
                            <h2 style={titleStyle}><img style={{ width: '30px', filter: theme === 'dark' ? 'invert(1)' : 'none' }} src={companyIcon} alt="Companies" /> Companies</h2>
                            <p style={descStyle}>Manage company profiles and organizational settings.</p>
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}