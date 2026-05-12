import { Link } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";
import logoutIcon from "../../assets/logout.png";
import { useTheme } from "../context/ThemeContext";
import { canApprove } from "../others/canApprove";
import { useEffect, useState } from "react";

interface SidebarProps {
    isOpen: boolean;
    closeMenu: () => void;
}

export const Sidebar = ({ isOpen, closeMenu }: SidebarProps) => {
    const { user, logout } = useAuth();
    const { theme } = useTheme();
    const [userCanApprove, setUserCanApprove] = useState(false);

    useEffect(() => {
        if (user?.nameid) {
            canApprove(Number(user.nameid)).then(setUserCanApprove);
        }
    }, [user?.nameid]);

    const close = () => {
        closeMenu();
    }

    return (
        <aside className={`sidebar-container ${isOpen ? 'open' : ''}`}
            style={{
                width: '250px', backgroundColor: 'var(--bg-primary)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column'
            }}>
            <div className="list-group list-group-flush" style={{ flex: 1, color: 'var(--text-primary)', backgroundColor: 'transparent' }}>
                <div className="mobile-only" style={{ padding: '20px', fontSize: '1.2rem', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)' }}>
                    Timesheet App
                </div>
                <Link
                    to="/dashboard"
                    className="list-group-item list-group-item-action py-3 border-0 primary-button"
                    onClick={close}
                    style={{ backgroundColor: 'transparent', color: 'var(--text-primary)' }}
                >
                    Dashboard
                </Link>

                <Link
                    to="/timesheets"
                    className="list-group-item list-group-item-action py-3 border-0 primary-button"
                    onClick={close}
                    style={{ backgroundColor: 'transparent', color: 'var(--text-primary)' }}
                >
                    My Timesheets
                </Link>

                <Link
                    to="/reports"
                    className="list-group-item list-group-item-action py-3 border-0 primary-button"
                    onClick={close}
                    style={{ backgroundColor: 'transparent', color: 'var(--text-primary)' }}
                >
                    Reports
                </Link>

                {(user?.role === 'Admin' || user?.role === 'Manager' || userCanApprove) && (
                    <Link
                        to="/approvals"
                        className="list-group-item list-group-item-action py-3 border-0 primary-button"
                        onClick={close}
                        style={{ backgroundColor: 'transparent', color: 'var(--text-primary)' }}
                    >
                        Approvals
                    </Link>
                )}

                {(user?.role === 'Admin' || user?.role === 'Manager') && (
                    <>
                        <Link
                            to="/projects"
                            className="list-group-item list-group-item-action py-3 border-0 primary-button"
                            onClick={close}
                            style={{ backgroundColor: 'transparent', color: 'var(--text-primary)' }}
                        >
                            Projects
                        </Link>

                        <Link
                            to="/users"
                            className="list-group-item list-group-item-action py-3 border-0 primary-button"
                            onClick={close}
                            style={{ backgroundColor: 'transparent', color: 'var(--text-primary)' }}
                        >
                            Users
                        </Link>
                    </>
                )}

                {user?.role === 'Admin' && (
                    <>
                        <Link
                            to="/companies"
                            className="list-group-item list-group-item-action py-3 border-0 primary-button"
                            onClick={close}
                            style={{ backgroundColor: 'transparent', color: 'var(--text-primary)' }}
                        >
                            Companies
                        </Link>
                    </>
                )}
            </div>
            <div style={{ marginTop: 'auto', alignItems: 'flex-start' }}>
                <button onClick={logout} style={{
                    width: '35px', height: '35px', margin: '20px 10px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer'
                }}>
                    <img src={logoutIcon} alt="Logout" style={{
                        width: '100%', height: '100%', marginRight: '8px', filter: theme === 'dark' ? 'invert(1)' : 'none',
                    }} />
                </button>
            </div>
        </aside >
    );
}