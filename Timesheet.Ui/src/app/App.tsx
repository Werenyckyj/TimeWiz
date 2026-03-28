import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../features/auth/views/Login';
import { AuthProvider } from '../features/auth/store/AtuhProvider';
import { useAuth } from '../features/auth/hooks/useAuth';
import type { JSX } from 'react';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? children : <Navigate to="/login" />;
}

const Dashboard = () => {
    const { logout } = useAuth();
    return (
        <div style={{ padding: '2rem' }}>
            <h1>Timesheet! 🚀</h1>
            <p>Main page</p>
            <button onClick={logout}>Logout</button>
        </div>
    );
};

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
export default App;