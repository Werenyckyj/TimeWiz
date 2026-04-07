import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";

export const MainLayout = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', margin: 0, fontFamily: 'sans-serif', height: '100vh' }}>
            <Navbar />
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <Sidebar />
                <main style={{ flex: 1, padding: '30px', overflowY: 'auto', backgroundColor: 'var(--bg-secondary)' }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}