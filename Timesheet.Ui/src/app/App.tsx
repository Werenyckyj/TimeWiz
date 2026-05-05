import { useEffect, useState } from "react";
import { useAuth } from "../features/auth/hooks/useAuth";
import { AuthProvider } from "../features/auth/store/AtuhProvider";
import { canApprove } from "../shared/others/canApprove";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "../features/auth/views/Login";
import Forgot from "../features/auth/views/Forgot";
import Reset from "../features/auth/views/Reset";
import { MainLayout } from "../shared/layout/MainLayout";
import { ProtectedRoute } from "../shared/components/ProtectedRoute";
import Dashboard from "../features/dashboard/views/Dashboard";
import { ProjectsProvider } from "../features/projects/store/ProjectsProvider";
import { TimesheetProvider } from "../features/timesheets/stroe/TimesheetProvider";
import Timesheets from "../features/timesheets/views/Timesheets";
import Reports from "../features/reports/views/Reports";
import Approval from "../features/timesheets/views/Approval";
import Projects from "../features/projects/views/Projects";
import { UsersProvider } from "../features/users/store/UsersProvider";
import Users from "../features/users/views/Users";
import UserDetail from "../features/users/views/UserDetail";
import { CompaniesProvider } from "../features/companies/store/CompaniesProvider";
import Companies from "../features/companies/views/Companies";
import NotFound from "../shared/views/NotFound";

function App() {
    return (
        <AuthProvider>
            <AppRoutes />
        </AuthProvider>
    );
}

export default App;


function AppRoutes() {
    const { user } = useAuth();
    const [userCanApprove, setUserCanApprove] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const updateApproval = async () => {
            const result = user?.nameid && user?.role === 'Externist'
                ? await canApprove(Number(user.nameid))
                : false;

            if (!cancelled) {
                setUserCanApprove(result);
            }
        };

        void updateApproval();

        return () => {
            cancelled = true;
        };
    }, [user?.nameid, user?.role]);

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/forgot" element={<Forgot />} />
                <Route path="/reset-password" element={<Reset />} />

                <Route element={<MainLayout />}>
                    <Route element={<ProtectedRoute allowedRoles={['Admin', 'Manager', 'Employee', 'Externist']} />} >
                        <Route path="/" element={<Navigate to="/dashboard" />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/timesheets" element={<ProjectsProvider><TimesheetProvider><Timesheets /></TimesheetProvider></ProjectsProvider>} />
                        <Route path="/reports" element={<Reports />} />

                        {user?.role === 'Externist' && userCanApprove && (
                            <Route path="/approvals" element={<ProjectsProvider><TimesheetProvider><Approval /></TimesheetProvider></ProjectsProvider>} />
                        )}
                    </Route>

                    <Route element={<ProtectedRoute allowedRoles={['Admin', 'Manager']} />} >
                        <Route path="/approvals" element={<ProjectsProvider><TimesheetProvider><Approval /></TimesheetProvider></ProjectsProvider>} />
                        <Route path="/projects" element={<ProjectsProvider><Projects /></ProjectsProvider>} />
                        <Route path="/users" element={<UsersProvider><Users /></UsersProvider>} />
                        <Route path="/users/:id" element={<UserDetail />} />
                    </Route>

                    <Route element={<ProtectedRoute allowedRoles={['Admin']} />} >
                        <Route path="/companies" element={<CompaniesProvider><Companies /></CompaniesProvider>} />
                    </Route>
                </Route>

                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
}