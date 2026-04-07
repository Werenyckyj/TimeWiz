import { Link } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";
import logoutIcon from "../../assets/logout.png";
import { useTheme } from "../context/ThemeContext";

export const Sidebar = () => {
    const { user, logout } = useAuth();
    const { theme } = useTheme();

    return (
        <aside style={{
            width: '250px', backgroundColor: 'var(--bg-primary)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column'
        }}>
            <div className="list-group list-group-flush" style={{ flex: 1, color: 'var(--text-primary)', backgroundColor: 'transparent' }}>
                <Link
                    to="/dashboard"
                    className="list-group-item list-group-item-action py-3 border-0 primary-button"
                    style={{ backgroundColor: 'transparent', color: 'var(--text-primary)' }}
                >
                    Dashboard
                </Link>

                <Link
                    to="/timesheets"
                    className="list-group-item list-group-item-action py-3 border-0 primary-button"
                    style={{ backgroundColor: 'transparent', color: 'var(--text-primary)' }}
                >
                    My Timesheets
                </Link>

                <Link
                    to="/reports"
                    className="list-group-item list-group-item-action py-3 border-0 primary-button"
                    style={{ backgroundColor: 'transparent', color: 'var(--text-primary)' }}
                >
                    Reports
                </Link>

                {(user?.role === 'Admin' || user?.role === 'Manager') && (
                    <>
                        <Link
                            to="/approvals"
                            className="list-group-item list-group-item-action py-3 border-0 primary-button"
                            style={{ backgroundColor: 'transparent', color: 'var(--text-primary)' }}
                        >
                            Approvals
                        </Link>

                        <Link
                            to="/projects"
                            className="list-group-item list-group-item-action py-3 border-0 primary-button"
                            style={{ backgroundColor: 'transparent', color: 'var(--text-primary)' }}
                        >
                            Projects
                        </Link>
                    </>
                )}

                {user?.role === 'Admin' && (
                    <>
                        <Link
                            to="/users"
                            className="list-group-item list-group-item-action py-3 border-0 primary-button"
                            style={{ backgroundColor: 'transparent', color: 'var(--text-primary)' }}
                        >
                            Users
                        </Link>

                        <Link
                            to="/companies"
                            className="list-group-item list-group-item-action py-3 border-0 primary-button"
                            style={{ backgroundColor: 'transparent', color: 'var(--text-primary)' }}
                        >
                            Companies
                        </Link>
                    </>
                )}
            </div>
            <div style={{ marginTop: 'auto', alignItems: 'flex-start' }}>
                <button onClick={logout} style={{
                    width: '50px', height: '50px', margin: '20px 10px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer'
                }}>
                    <img src={logoutIcon} alt="Logout" style={{
                        width: '100%', height: '100%', marginRight: '8px', filter: theme === 'dark' ? 'invert(1)' : 'none',
                    }} />
                </button>
            </div>
        </aside>
    );
}