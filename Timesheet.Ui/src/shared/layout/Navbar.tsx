import { useEffect, useState } from "react";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { UsersRepository } from "../../features/users/services/UsersRepository";
import type { ChangeUserPassword, User } from "../../features/users/types/users.type";
import { Modal } from "../components/Modal";
import { useTheme } from "../context/ThemeContext";
import switchIcon from "../../assets/night-mode.png";
import { PasswordField } from "../components/PassworField";

interface NavbarProps {
    toggleMenu: () => void;
}

export const Navbar = ({ toggleMenu }: NavbarProps) => {
    const { user } = useAuth();
    const [userInfo, setUserInfo] = useState<User | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isChangePassword, setIsChangePassword] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [oldPassword, setOldPassword] = useState({ password: "" });
    const [newPassword, setNewPassword] = useState({ password: "" });
    const [confirmPassword, setConfirmPassword] = useState({ password: "" });
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        const loadUserInfo = async () => {
            if (!user) return;
            const loadedUserInfo = await UsersRepository.getUser(Number(user.nameid));
            setUserInfo(loadedUserInfo);
        };

        loadUserInfo();
    }, [user]);

    const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            const payload = {
                userId: userInfo?.id,
                oldPassword: oldPassword.password,
                newPassword: newPassword.password
            };

            if (payload.newPassword !== confirmPassword.password) {
                setMessage({ text: "New password and confirm password do not match.", type: 'error' });
                return;
            }

            if (payload.newPassword.length < 8) {
                setMessage({ text: "New password must be at least 8 characters long.", type: 'error' });
                return;
            }

            await UsersRepository.changeUserPassword(payload as ChangeUserPassword);
            setIsChangePassword(false);
            setMessage({ text: "Password changed successfully.", type: 'success' });
            setOldPassword({ password: "" });
            setNewPassword({ password: "" });
            setConfirmPassword({ password: "" });
        } catch (error) {
            console.error("Error updating user information:", error);
            setMessage({ text: "Failed to change password.", type: 'error' });
        }
    };

    return (
        <div>
            <nav style={{
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                borderBottom: '1px solid var(--border-color)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <button className="mobile-toggle" onClick={toggleMenu}>☰</button>

                    <h2 className="desktop-title" style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.25rem' }}>
                        Timesheet App
                    </h2>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button
                        onClick={toggleTheme}
                        style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            height: "40px",
                        }}
                        title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
                    >
                        <img
                            src={switchIcon}
                            alt="Switch theme"
                            style={{
                                width: "100%",
                                height: "100%",
                                filter: theme === 'dark' ? 'invert(1)' : 'none',
                                transition: 'filter 0.3s ease'
                            }}
                        />
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <button
                            className="secondary-button"
                            onClick={() => { setMessage(null); setIsModalOpen(true); setIsChangePassword(false); }}
                            style={{
                                padding: '6px 12px',
                                cursor: 'pointer',
                                backgroundColor: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                color: 'var(--text-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '10px',
                            }}
                        >
                            <div className="user-details-text" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                                <span style={{ fontWeight: 'bold' }}>{userInfo?.name} {userInfo?.surname}</span>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{userInfo?.role?.name}</span>
                            </div>

                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--bg-hover-primary)',
                                border: '1px solid var(--border-color)',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                color: 'var(--text-primary)',
                                fontWeight: 'bold',
                                flexShrink: 0
                            }}>
                                {userInfo?.name?.charAt(0)}{userInfo?.surname?.charAt(0)}
                            </div>
                        </button>
                    </div>
                </div>

            </nav>
            <Modal isOpen={isModalOpen} onClose={() => { setMessage(null); setIsModalOpen(false); }} title="User Information">
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", color: 'var(--text-primary)' }}>
                    <div><strong>Name:</strong> {userInfo?.name} {userInfo?.surname}</div>
                    <div><strong>Username:</strong> {userInfo?.username}</div>
                    <div><strong>Email:</strong> {userInfo?.email}</div>
                    <div><strong>Role:</strong> {userInfo?.role?.name ?? "N/A"}</div>

                    {message && (
                        <div style={{ padding: '10px', backgroundColor: message.type === 'error' ? 'var(--reject)' : 'var(--success)', color: 'var(--text-primary)', borderRadius: '4px' }}>
                            {message.text}
                        </div>
                    )}

                    <div style={{ width: "100%", marginTop: "8px" }}>
                        {isChangePassword ? (
                            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Old Password *</label>
                                    <PasswordField formData={oldPassword} setFormData={setOldPassword} />
                                </div>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>New Password *</label>
                                        <PasswordField formData={newPassword} setFormData={setNewPassword} />
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Confirm Password *</label>
                                        <PasswordField formData={confirmPassword} setFormData={setConfirmPassword} />
                                    </div>
                                </div>
                                <button
                                    className="primary-button-2"
                                    type="submit"
                                    style={{
                                        padding: "8px 12px",
                                        cursor: "pointer",
                                        backgroundColor: "var(--primary-button)",
                                        color: "white",
                                        border: "1px solid var(--primary-button-border)",
                                        borderRadius: "6px",
                                        width: "100%",
                                        fontWeight: "bold"
                                    }}
                                >
                                    Save
                                </button>
                            </form>
                        ) : (
                            <button
                                type="button"
                                className="primary-button-2"
                                onClick={() => {
                                    setMessage(null);
                                    setIsChangePassword(true);
                                }}
                                style={{
                                    padding: "8px 12px",
                                    cursor: "pointer",
                                    backgroundColor: 'var(--primary-button)',
                                    border: '1px solid var(--primary-button-border)',
                                    color: 'white',
                                    borderRadius: "6px",
                                    fontWeight: "bold",
                                }}
                            >
                                Change password
                            </button>
                        )}
                    </div>
                </div>
            </Modal >
        </div >
    );
}