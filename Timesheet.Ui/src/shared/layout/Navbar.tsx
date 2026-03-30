import { useAuth } from "../../features/auth/hooks/useAuth";

export const Navbar = () => {
    const { logout, user } = useAuth();

    return (
        <nav style={{
            height: '60px', backgroundColor: '#1e293b', color: 'white',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '0 20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
            <h2 style={{ margin: 0 }}>⏳ Timesheet App</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span>👤 {user?.unique_name} <i>({user?.role})</i></span>
                <button
                    onClick={logout}
                    style={{ padding: '6px 12px', cursor: 'pointer', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px' }}
                >
                    Odhlásit
                </button>
            </div>
        </nav>);
}