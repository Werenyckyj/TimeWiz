import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import type { TsWeek } from "../../timesheets/types/tsWeek.type";
import { ReportRepository } from "../services/ReportRepository";
import type { UserTokenData } from "../../auth/store/AuthContext";
import type { Projects } from "../../projects/types/projects.type";
import type { Users } from "../../users/types/users.type";
import type { Companies } from "../../companies/types/companies.type";
import { ProjectsRepository } from "../../projects/services/ProjectsRepository";
import { UsersRepository } from "../../users/services/UsersRepository";
import { CompaniesRepository } from "../../companies/services/CompaniesRepository";

const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const getMonthDates = (monthOffset: number = 0) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + monthOffset;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    return {
        dateFrom: formatDate(firstDay),
        dateTo: formatDate(lastDay)
    };
};

interface ReportBlockProps {
    title: string;
    isTeamReport: boolean;
    currentUser: UserTokenData | null;
    projectsList: Projects;
    usersList: Users;
    companiesList: Companies;
}

const ReportBlock = ({ title, isTeamReport, currentUser, projectsList, usersList, companiesList }: ReportBlockProps) => {
    const [timeSpanMode, setTimeSpanMode] = useState<'last' | 'this' | 'custom'>('this');
    const [dateFrom, setDateFrom] = useState<string>("");
    const [dateTo, setDateTo] = useState<string>("");

    const [projectId, setProjectId] = useState<string>("");
    const [userId, setUserId] = useState<string>("");
    const [companyId, setCompanyId] = useState<string>("");

    const [reportData, setReportData] = useState<TsWeek[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        handleTimeSpanChange('this');
    }, []);

    const handleTimeSpanChange = (mode: 'last' | 'this' | 'custom') => {
        setTimeSpanMode(mode);
        if (mode === 'this') {
            const dates = getMonthDates(0);
            setDateFrom(dates.dateFrom); setDateTo(dates.dateTo);
        } else if (mode === 'last') {
            const dates = getMonthDates(-1);
            setDateFrom(dates.dateFrom); setDateTo(dates.dateTo);
        }
    };

    const fetchReport = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (dateFrom) params.append("dateFrom", dateFrom);
            if (dateTo) params.append("dateTo", dateTo);
            if (projectId) params.append("projectId", projectId);

            if (!isTeamReport && currentUser?.nameid) {
                params.append("userId", currentUser.nameid.toString());
            } else if (isTeamReport && userId) {
                params.append("userId", userId);
            }

            if (isTeamReport && companyId) {
                params.append("companyId", companyId);
            }

            const response = await ReportRepository.get(params.toString());
            setReportData(response.data);
        } catch (error) {
            console.error("Failed to fetch report", error);
            alert("Error loading report data.");
        } finally {
            setIsLoading(false);
        }
    };

    const detailedData = useMemo(() => {
        return reportData.flatMap(ts => {
            return (ts.tsEntries || [])
                .filter(entry => {
                    const eDate = new Date(entry.workDate).toISOString().split('T')[0];
                    return (!dateFrom || eDate >= dateFrom) && (!dateTo || eDate <= dateTo);
                })
                .filter(entry => entry.hours > 0)
                .map(entry => ({
                    id: entry.id,
                    date: new Date(entry.workDate).toLocaleDateString(),
                    isoDate: new Date(entry.workDate).toISOString().split('T')[0],
                    projectName: ts.project?.name || "Unknown",
                    userId: ts.userId,
                    status: ts.status,
                    hours: entry.hours
                }));
        }).sort((a, b) => a.isoDate.localeCompare(b.isoDate));
    }, [reportData, dateFrom, dateTo]);


    const exportToCSV = () => {
        if (detailedData.length === 0) {
            alert("No data to export.");
            return;
        }

        const headers = ["Date", "Project", "Employee ID", "Status", "Hours"];
        const csvRows = detailedData.map(row => {
            return [
                row.date,
                `"${row.projectName}"`,
                row.userId,
                row.status,
                row.hours
            ].join(",");
        });

        const csvContent = [headers.join(","), ...csvRows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `timesheet_${isTeamReport ? 'team' : 'personal'}_${dateFrom}_to_${dateTo}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const activeBtnStyle = { backgroundColor: '#3b82f6', color: 'white', borderColor: '#3b82f6' };
    const inactiveBtnStyle = { backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' };

    return (
        <div style={{ marginBottom: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>{title}</h2>
                <button
                    onClick={exportToCSV}
                    style={{ padding: '8px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    ⬇ Export Detailed CSV
                </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <button onClick={() => handleTimeSpanChange('last')} style={{ padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', border: '1px solid', ...(timeSpanMode === 'last' ? activeBtnStyle : inactiveBtnStyle) }}>
                    Last month
                </button>
                <button onClick={() => handleTimeSpanChange('this')} style={{ padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', border: '1px solid', ...(timeSpanMode === 'this' ? activeBtnStyle : inactiveBtnStyle) }}>
                    This month
                </button>
                <button onClick={() => handleTimeSpanChange('custom')} style={{ padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', border: '1px solid', ...(timeSpanMode === 'custom' ? activeBtnStyle : inactiveBtnStyle) }}>
                    Own time span
                </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '1.5rem', backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Date From</label>
                        <input type="date" value={dateFrom} disabled={timeSpanMode !== 'custom'} onChange={(e) => setDateFrom(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', width: '130px' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Date To</label>
                        <input type="date" value={dateTo} disabled={timeSpanMode !== 'custom'} onChange={(e) => setDateTo(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', width: '130px' }} />
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '150px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Project</label>
                    <select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                        <option value="">All Projects</option>
                        {projectsList.data.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                {isTeamReport && (
                    <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '150px' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Employee</label>
                            <select value={userId} onChange={(e) => setUserId(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                                <option value="">All Employees</option>
                                {usersList.data.map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.name} {u.surname} ({u.username})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '150px' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Company</label>
                            <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                                <option value="">All Companies</option>
                                {companiesList.data.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </>
                )}

                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button
                        onClick={fetchReport}
                        disabled={isLoading}
                        style={{ padding: '8px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', height: '38px', fontWeight: 'bold' }}
                    >
                        {isLoading ? 'Loading...' : 'Generate'}
                    </button>
                </div>
            </div>

            <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: 'var(--bg-secondary)' }}>
                        <tr>
                            <th style={{ padding: '12px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>Date</th>
                            <th style={{ padding: '12px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>Project</th>
                            {isTeamReport && (
                                <th style={{ padding: '12px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>Employee ID</th>
                            )}
                            <th style={{ padding: '12px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>Status</th>
                            <th style={{ padding: '12px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>Hours</th>
                        </tr>
                    </thead>
                    <tbody>
                        {detailedData.length === 0 ? (
                            <tr><td colSpan={isTeamReport ? 5 : 4} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>No entries found for the selected period.</td></tr>
                        ) : (
                            detailedData.map((row, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
                                    <td style={{ padding: '12px', color: 'var(--text-primary)' }}>{row.date}</td>
                                    <td style={{ padding: '12px', color: 'var(--text-primary)' }}>{row.projectName}</td>
                                    {isTeamReport && (
                                        <td style={{ padding: '12px', color: 'var(--text-primary)' }}>{row.userId}</td>
                                    )}
                                    <td style={{ padding: '12px', color: 'var(--text-primary)' }}>{row.status}</td>
                                    <td style={{ padding: '12px', color: 'var(--text-primary)', fontWeight: 'bold' }}>{row.hours}h</td>
                                </tr>
                            ))
                        )}
                        {detailedData.length > 0 && (
                            <tr style={{ backgroundColor: 'var(--bg-secondary)', borderTop: '2px solid var(--border-color)' }}>
                                <td colSpan={isTeamReport ? 4 : 3} style={{ padding: '12px', color: 'var(--text-primary)', textAlign: 'right', fontWeight: 'bold' }}>
                                    Total Hours in period:
                                </td>
                                <td style={{ padding: '12px', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                                    {detailedData.reduce((sum, row) => sum + row.hours, 0)}h
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default function Reports() {
    const { user } = useAuth();
    const canSeeTeamReport = user?.role === 'Admin' || user?.role === 'Manager';

    const [projects, setProjects] = useState<Projects>({ count: 0, data: [] });
    const [users, setUsers] = useState<Users>({ count: 0, data: [] });
    const [companies, setCompanies] = useState<Companies>({ count: 0, data: [] });

    useEffect(() => {
        const loadFiltersData = async () => {
            try {
                const projectsData = await ProjectsRepository.getProjects();
                setProjects(projectsData ?? { count: 0, data: [] });

                if (canSeeTeamReport) {
                    const usersData = await UsersRepository.getUsers();
                    setUsers(usersData ?? { count: 0, data: [] });

                    const companiesData = await CompaniesRepository.getCompanies();
                    setCompanies(companiesData ?? { count: 0, data: [] });
                }
            } catch (error) {
                console.error("Failed to load filter options", error);
            }
        };

        loadFiltersData();
    }, [canSeeTeamReport]);

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ margin: '0 0 2rem 0', color: 'var(--text-primary)' }}>Reports Center</h1>

            <ReportBlock
                title="My Personal Report"
                isTeamReport={false}
                currentUser={user}
                projectsList={projects}
                usersList={users}
                companiesList={companies}
            />

            {canSeeTeamReport && (
                <div style={{ borderTop: '2px dashed var(--border-color)', paddingTop: '2rem' }}>
                    <ReportBlock
                        title="Team & Projects Report"
                        isTeamReport={true}
                        currentUser={user}
                        projectsList={projects}
                        usersList={users}
                        companiesList={companies}
                    />
                </div>
            )}
        </div>
    );
}