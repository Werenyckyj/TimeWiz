import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { useState } from "react";

export const MainLayout = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', margin: 0, fontFamily: 'sans-serif', height: '100vh' }}>

            <Navbar toggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <Sidebar isOpen={isMobileMenuOpen} closeMenu={() => setIsMobileMenuOpen(false)} />
                <div className={'mobile-overlay ' + (isMobileMenuOpen ? 'open' : '')} onClick={() => setIsMobileMenuOpen(false)} />
                <main style={{ flex: 1, padding: '30px', overflowY: 'auto', backgroundColor: 'var(--bg-secondary)' }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}