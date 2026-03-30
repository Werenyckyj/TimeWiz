import { Link } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";

export const Sidebar = () => {
    const { user } = useAuth();

    return (
        <aside style={{
            width: '250px', backgroundColor: '#ffffff', borderRight: '1px solid #e2e8f0',
            padding: '20px 10px', display: 'flex', flexDirection: 'column'
        }}>
            <div className="list-group list-group-flush">
                <button type="button" className="list-group-item">
                    <Link to="/dashboard" className="link-body-emphasis link-offset-2 link-underline-opacity-25 link-underline-opacity-75-hover">📊 Dashboard</Link>
                </button>
                <button type="button" className="list-group-item ">
                    <Link to="/timesheets" className="link-body-emphasis link-offset-2 link-underline-opacity-25 link-underline-opacity-75-hover">📝 Moje výkazy</Link>
                </button>
                <button type="button" className="list-group-item">
                    <Link to="/reports" className="link-body-emphasis link-offset-2 link-underline-opacity-25 link-underline-opacity-75-hover">📈 Reporty</Link>
                </button>
                {(user?.role === 'Admin' || user?.role === 'Manager') && (
                    <>
                        <button type="button" className="list-group-item">
                            <Link to="/approvals" className="link-body-emphasis link-offset-2 link-underline-opacity-25 link-underline-opacity-75-hover">✅ Schvalování</Link>
                        </button>
                        <button type="button" className="list-group-item">
                            <Link to="/projects" className="link-body-emphasis link-offset-2 link-underline-opacity-25 link-underline-opacity-75-hover">📁 Projekty</Link>
                        </button>
                    </>
                )}

                {user?.role === 'Admin' && (
                    <>
                        <button type="button" className="list-group-item">
                            <Link to="/users" className="link-body-emphasis link-offset-2 link-underline-opacity-25 link-underline-opacity-75-hover">👥 Uživatelé</Link>
                        </button>
                        <button type="button" className="list-group-item">
                            <Link to="/companies" className="link-body-emphasis link-offset-2 link-underline-opacity-25 link-underline-opacity-75-hover">🏢 Společnosti</Link>
                        </button>
                    </>
                )}
            </div>
        </aside>
    );
}