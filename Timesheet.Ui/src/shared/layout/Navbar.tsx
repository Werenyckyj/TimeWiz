import { useEffect, useState } from "react";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { UsersRepository } from "../../features/users/services/UsersRepository";
import type { ChangeUserPassword, User } from "../../features/users/types/users.type";
import { Modal } from "../components/Modal";
import { useTheme } from "../context/ThemeContext";
import switchIcon from "../../assets/night-mode.png";

export const Navbar = () => {
    const { user } = useAuth();
    const [userInfo, setUserInfo] = useState<User | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isChangePassword, setIsChangePassword] = useState(false);
    const [message, setMessage] = useState<string>("");
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
        setIsChangePassword(false);

        try {
            const payload = {
                userId: userInfo?.id,
                oldPassword: (e.currentTarget.elements[0] as HTMLInputElement).value,
                newPassword: (e.currentTarget.elements[1] as HTMLInputElement).value
            };

            if (payload.newPassword !== (e.currentTarget.elements[2] as HTMLInputElement).value) {
                alert("New password and confirmation do not match.");
                return;
            }

            await UsersRepository.changeUserPassword(payload as ChangeUserPassword);
            setIsChangePassword(false);
            setMessage("Password changed successfully.");
        } catch (error) {
            console.error("Error updating user information:", error);
            setMessage("Failed to change password.");
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
                <h2 style={{ margin: 0 }}>Timesheet App</h2>

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
                            onClick={() => { setMessage(""); setIsModalOpen(true); setIsChangePassword(false); }}
                            style={{
                                padding: '6px 12px',
                                cursor: 'pointer',
                                backgroundColor: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                color: 'var(--text-primary)',
                                minWidth: '300px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '10px',
                            }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                                <span>{userInfo?.name} {userInfo?.surname}</span>
                                <span style={{ color: 'var(--text-secondary)' }}>{userInfo?.role?.name}</span>
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
                                flexShrink: 0
                            }}>
                                {userInfo?.name?.charAt(0)}{userInfo?.surname?.charAt(0)}
                            </div>
                        </button>
                    </div>
                </div>

            </nav>
            <Modal isOpen={isModalOpen} onClose={() => { setMessage(""); setIsModalOpen(false); }} title="User Information">
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", color: 'var(--text-primary)' }}>
                    <div><strong>Name:</strong> {userInfo?.name} {userInfo?.surname}</div>
                    <div><strong>Username:</strong> {userInfo?.username}</div>
                    <div><strong>Email:</strong> {userInfo?.email}</div>
                    <div><strong>Role:</strong> {userInfo?.role?.name ?? "N/A"}</div>

                    {message && (
                        <div style={{ color: message[0] === 'F' ? '#ef4444' : '#10b981' }}>{message}</div>
                    )}

                    <div style={{ width: "100%", marginTop: "8px" }}>
                        {isChangePassword ? (
                            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Old Password *</label>
                                    <input
                                        required
                                        type="password"
                                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', width: '100%', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>New Password *</label>
                                        <input
                                            required
                                            type="password"
                                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', width: '100%', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Confirm New Password *</label>
                                        <input
                                            required
                                            type="password"
                                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', width: '100%', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    style={{
                                        padding: "8px 12px",
                                        cursor: "pointer",
                                        backgroundColor: "#10b981",
                                        color: "white",
                                        border: "none",
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
                                className="secondary-button"
                                onClick={() => {
                                    setMessage("");
                                    setIsChangePassword(true);
                                }}
                                style={{
                                    padding: "8px 12px",
                                    cursor: "pointer",
                                    backgroundColor: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-primary)',
                                    borderRadius: "6px"
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