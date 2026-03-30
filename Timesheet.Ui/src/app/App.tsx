import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../features/auth/views/Login';
import { AuthProvider } from '../features/auth/store/AtuhProvider';
import { useAuth } from '../features/auth/hooks/useAuth';
import type { JSX } from 'react';
import { MainLayout } from '../shared/layout/MainLayout';
import Timesheets from '../features/timesheets/views/Timesheets';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? children : <Navigate to="/login" />;
}

const Dashboard = () => {
    const { user } = useAuth();
    return (
        <div>
            <h1>Dashboard</h1>
            <p>Welcome, {user?.unique_name}!</p>
        </div>
    );
};

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Navigate to="/login" />} />
                    <Route path="/login" element={<Login />} />

                    <Route
                        element={<ProtectedRoute><MainLayout /></ProtectedRoute>}
                    >
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/timesheets" element={<Timesheets />} />
                        <Route path="/reports" element={<h2>Reporty</h2>} />
                        <Route path="/approvals" element={<h2>Schvalování</h2>} />
                        <Route path="/projects" element={<h2>Projekty</h2>} />
                        <Route path="/users" element={<h2>Uživatelé</h2>} />
                        <Route path="/companies" element={<h2>Společnosti</h2>} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
export default App;