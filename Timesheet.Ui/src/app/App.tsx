import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../features/auth/views/Login';
import { AuthProvider } from '../features/auth/store/AtuhProvider';
import { useAuth } from '../features/auth/hooks/useAuth';
import type { JSX } from 'react';
import { MainLayout } from '../shared/layout/MainLayout';
import Timesheets from '../features/timesheets/views/Timesheets';
import Companies from '../features/companies/views/Companies';
import { CompaniesProvider } from '../features/companies/store/CompaniesProvider';
import Users from '../features/users/views/Users';
import { UsersProvider } from '../features/users/store/UsersProvider';
import { ProjectsProvider } from '../features/projects/store/ProjectsProvider';
import Projects from '../features/projects/views/Projects';

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
                        <Route path="/projects" element={<ProjectsProvider><Projects /></ProjectsProvider>} />
                        <Route path="/users" element={<UsersProvider><Users /></UsersProvider>} />
                        <Route path="/companies" element={<CompaniesProvider><Companies /></CompaniesProvider>} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
export default App;