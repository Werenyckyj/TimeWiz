import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../features/auth/views/Login';
import { AuthProvider } from '../features/auth/store/AtuhProvider';
import { MainLayout } from '../shared/layout/MainLayout';
import Timesheets from '../features/timesheets/views/Timesheets';
import Companies from '../features/companies/views/Companies';
import { CompaniesProvider } from '../features/companies/store/CompaniesProvider';
import Users from '../features/users/views/Users';
import { UsersProvider } from '../features/users/store/UsersProvider';
import { ProjectsProvider } from '../features/projects/store/ProjectsProvider';
import Projects from '../features/projects/views/Projects';
import { ProtectedRoute } from '../shared/components/ProtectedRoute';
import { TimesheetProvider } from '../features/timesheets/stroe/TimesheetProvider';
import Approval from '../features/timesheets/views/Approval';
import Dashboard from '../features/dashboard/views/Dashboard';
import Reports from '../features/reports/views/Reports';
import UserDetail from '../features/users/views/UserDetail';
import Forgot from '../features/auth/views/Forgot';
import Reset from '../features/auth/views/Reset';
import NotFound from '../shared/views/NotFound';

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route element={<ProtectedRoute allowedRoles={['Admin', 'Manager', 'Employee', 'External']} />} >
                        <Route path="/" element={<Navigate to="/login" />} />
                    </Route>
                    <Route path="/login" element={<Login />} />
                    <Route path="/forgot" element={<Forgot />} />
                    <Route path="/reset-password" element={<Reset />} />
                    <Route
                        element={<MainLayout />}
                    >
                        <Route element={<ProtectedRoute allowedRoles={['Admin', 'Manager', 'Employee', 'External']} />} >
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/timesheets" element={<ProjectsProvider><TimesheetProvider><Timesheets /></TimesheetProvider></ProjectsProvider>} />
                            <Route path="/reports" element={<Reports />} />
                        </Route>
                        <Route element={<ProtectedRoute allowedRoles={['Admin', 'Manager']} />} >
                            <Route path="/approvals" element={<ProjectsProvider><TimesheetProvider><Approval /></TimesheetProvider></ProjectsProvider>} />
                            <Route path="/projects" element={<ProjectsProvider><Projects /></ProjectsProvider>} />
                            <Route path="/users/:id" element={<UserDetail />} />
                        </Route>
                        <Route element={<ProtectedRoute allowedRoles={['Admin']} />} >
                            <Route path="/users" element={<UsersProvider><Users /></UsersProvider>} />
                            <Route path="/companies" element={<CompaniesProvider><Companies /></CompaniesProvider>} />
                        </Route>
                    </Route>

                    <Route path="*" element={<NotFound />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
export default App;