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
import { canApprove } from "../../../shared/others/canApprove";

interface MultiSelectProps {
    options: { value: string; label: string }[];
    selectedValues: string[];
    onChange: (values: string[]) => void;
    placeholder: string;
}

const MultiSelect = ({ options, selectedValues, onChange, placeholder }: MultiSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleOption = (val: string) => {
        if (selectedValues.includes(val)) {
            onChange(selectedValues.filter(v => v !== val));
        } else {
            onChange([...selectedValues, val]);
        }
    };

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{ padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', cursor: 'pointer', minHeight: '38px', display: 'flex', alignItems: 'center', boxSizing: 'border-box' }}
            >
                {selectedValues.length === 0 ? placeholder : `${selectedValues.length} selected`}
            </div>
            {isOpen && (
                <>
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }} onClick={() => setIsOpen(false)} />
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', zIndex: 11, maxHeight: '200px', overflowY: 'auto', borderRadius: '4px', marginTop: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                        {options.map(opt => (
                            <div
                                key={opt.value}
                                onClick={() => toggleOption(opt.value)}
                                style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                            >
                                <input type="checkbox" checked={selectedValues.includes(opt.value)} readOnly style={{ cursor: 'pointer' }} />
                                <span>{opt.label}</span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

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
    return { dateFrom: formatDate(firstDay), dateTo: formatDate(lastDay) };
};

type GroupByOption = "none" | "date" | "projectName" | "status" | "userName" | "companyName";

type ReportRow = {
    id: string | number;
    date: string;
    isoDate: string;
    projectName: string;
    userId: number;
    userName: string;
    companyName: string;
    status: string;
    hours: number;
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

    const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

    const [reportData, setReportData] = useState<TsWeek[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const [sortField, setSortField] = useState<keyof ReportRow | "">("");
    const [order, setOrder] = useState<'asc' | 'desc'>("asc");
    const [tableData, setTableData] = useState<ReportRow[]>([]);
    const [groupBy, setGroupBy] = useState<GroupByOption>("none");

    useEffect(() => { handleTimeSpanChange('this'); }, []);

    const detailedData = useMemo(() => {
        const flatData = reportData.flatMap(ts => {
            const userinfo = usersList.data.find(u => u.id === ts.userId) ?? null;
            const companyinfo = companiesList.data.find(c => c.id === userinfo?.companyId) ?? null;

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
                    userName: userinfo ? `${userinfo.name} ${userinfo.surname}` : "Unknown",
                    companyName: companyinfo?.name || "N/A",
                    status: ts.status,
                    hours: entry.hours
                }));
        });

        let finalData: ReportRow[] = [];

        if (groupBy === "none") {
            finalData = flatData;
        } else {
            const groups: Record<string, ReportRow> = {};
            flatData.forEach(row => {
                const groupKey = row[groupBy as keyof ReportRow]?.toString() || "Unknown";

                if (!groups[groupKey]) {
                    groups[groupKey] = {
                        ...row,
                        id: `group-${groupKey}`,
                        date: groupBy === "date" ? row.date : "---",
                        projectName: groupBy === "projectName" ? row.projectName : "---",
                        userName: groupBy === "userName" ? row.userName : "---",
                        companyName: groupBy === "companyName" ? row.companyName : "---",
                        status: groupBy === "status" ? row.status : "---",
                        hours: 0
                    };
                }
                groups[groupKey].hours += row.hours;
            });
            finalData = Object.values(groups);
        }

        if (sortField) {
            return finalData.sort((a, b) => {
                if (a[sortField] === null) return 1;
                if (b[sortField] === null) return -1;
                if (a[sortField] === null && b[sortField] === null) return 0;

                if (typeof a[sortField] === 'number') {
                    return ((a[sortField] as number) - (b[sortField] as number)) * (order === 'asc' ? 1 : -1);
                }

                return (a[sortField].toString().localeCompare(b[sortField].toString(), "en", { numeric: true }) * (order === 'asc' ? 1 : -1));
            });
        }
        return finalData.sort((a, b) => {
            if (a.isoDate && b.isoDate && a.isoDate !== "---" && b.isoDate !== "---") {
                return a.isoDate.localeCompare(b.isoDate);
            }

            if (groupBy !== "none") {
                const groupKey = groupBy as keyof ReportRow;

                if (a[groupKey] === null) return 1;
                if (b[groupKey] === null) return -1;

                return a[groupKey].toString().localeCompare(b[groupKey].toString(), "en", { numeric: true });
            }

            return 0;
        });
    }, [reportData, dateFrom, dateTo, usersList, companiesList, groupBy, sortField, order]);

    useEffect(() => { setTableData(detailedData); }, [detailedData]);

    useEffect(() => { setTableData(detailedData); }, [detailedData]);

    const handleTimeSpanChange = (mode: 'last' | 'this' | 'custom') => {
        setTimeSpanMode(mode);
        if (mode === 'this') {
            const dates = getMonthDates(0);
            setDateFrom(dates.dateFrom); setDateTo(dates.dateTo);
            fetchReport(dates.dateFrom, dates.dateTo);
        } else if (mode === 'last') {
            const dates = getMonthDates(-1);
            setDateFrom(dates.dateFrom); setDateTo(dates.dateTo);
            fetchReport(dates.dateFrom, dates.dateTo);
        }
    };

    const fetchReport = async (overrideDateFrom?: string, overrideDateTo?: string) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();

            const finalDateFrom = overrideDateFrom !== undefined ? overrideDateFrom : dateFrom;
            const finalDateTo = overrideDateTo !== undefined ? overrideDateTo : dateTo;

            if (finalDateFrom) params.append("dateFrom", finalDateFrom);
            if (finalDateTo) params.append("dateTo", finalDateTo);

            selectedProjectIds.forEach(id => params.append("projectIds", id));
            selectedStatuses.forEach(status => params.append("statuses", status));

            if (!isTeamReport && currentUser?.nameid) {
                params.append("userIds", currentUser.nameid.toString());
            } else if (isTeamReport) {
                selectedUserIds.forEach(id => params.append("userIds", id));
                selectedCompanyIds.forEach(id => params.append("companyIds", id));
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

    const exportToCSV = () => {
        if (detailedData.length === 0) {
            alert("No data to export.");
            return;
        }
        const header = ["Date", "Project", ...(isTeamReport ? ["Employee Name"] : []), "Status", "Hours"];
        const rows: string[][] = detailedData.map((row) => {
            const cols = [row.date, row.projectName];
            if (isTeamReport) cols.push(row.userName);
            cols.push(row.status, row.hours.toString());
            return cols;
        });

        const csvContent = [header, ...rows].join("\n");
        const csv_file = new Blob([csvContent], { type: "text/csv" });
        const download_link = document.createElement("a");
        download_link.download = `${title.replace(/\s+/g, '_').toLowerCase()}_${dateFrom}_to_${dateTo}.csv`;
        download_link.href = window.URL.createObjectURL(csv_file);
        download_link.style.display = "none";
        document.body.appendChild(download_link);
        download_link.click();
    };

    const handleSortingChange = (accessor: keyof ReportRow) => {
        const newOrder = accessor === sortField && order === 'asc' ? 'desc' : 'asc';
        setSortField(accessor);
        setOrder(newOrder);
    };

    const columns: { header: string; accessor: keyof ReportRow; type: "text" | "number" }[] = [
        { header: "Date", accessor: "date", type: "text" },
        { header: "Project", accessor: "projectName", type: "text" },
        { header: "Employee Name", accessor: "userName", type: "text" },
        { header: "Company name", accessor: "companyName", type: "text" },
        { header: "Status", accessor: "status", type: "text" },
        { header: "Hours", accessor: "hours", type: "number" }
    ];

    const activeBtnStyle = { backgroundColor: 'var(--primary-button)', color: 'white', borderColor: 'var(--primary-button-border)' };
    const inactiveBtnStyle = { backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' };

    return (
        <div
            style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>{title}</h2>
                <button className="success-button" onClick={exportToCSV} style={{ padding: '8px 16px', backgroundColor: 'var(--success-2)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                    ⬇ Export CSV
                </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <button className={(timeSpanMode === 'last' ? 'primary-button-2' : 'primary-button')} onClick={() => handleTimeSpanChange('last')} style={{ padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', border: '1px solid', ...(timeSpanMode === 'last' ? activeBtnStyle : inactiveBtnStyle) }}>Last month</button>
                <button className={(timeSpanMode === 'this' ? 'primary-button-2' : 'primary-button')} onClick={() => handleTimeSpanChange('this')} style={{ padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', border: '1px solid', ...(timeSpanMode === 'this' ? activeBtnStyle : inactiveBtnStyle) }}>This month</button>
                <button className={(timeSpanMode === 'custom' ? 'primary-button-2' : 'primary-button')} onClick={() => handleTimeSpanChange('custom')} style={{ padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', border: '1px solid', ...(timeSpanMode === 'custom' ? activeBtnStyle : inactiveBtnStyle) }}>Own time span</button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '1.5rem', backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', alignItems: 'flex-end' }}>
                <div className="date-wrapper" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Date From</label>
                        <input type="date" className="date-input" value={dateFrom} disabled={timeSpanMode !== 'custom'} onChange={(e) => setDateFrom(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Date To</label>
                        <input type="date" className="date-input" value={dateTo} disabled={timeSpanMode !== 'custom'} onChange={(e) => setDateTo(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '150px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Projects</label>
                    <MultiSelect
                        options={projectsList.data.map(p => ({ value: p.id.toString(), label: p.name }))}
                        selectedValues={selectedProjectIds}
                        onChange={setSelectedProjectIds}
                        placeholder="All Projects"
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '150px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Statuses</label>
                    <MultiSelect
                        options={[
                            { value: "Draft", label: "Draft" },
                            { value: "Submitted", label: "Submitted" },
                            { value: "Approved", label: "Approved" },
                            { value: "Rejected", label: "Rejected" },
                        ]}
                        selectedValues={selectedStatuses}
                        onChange={setSelectedStatuses}
                        placeholder="All Statuses"
                    />
                </div>

                {isTeamReport && (
                    <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '150px' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Employees</label>
                            <MultiSelect
                                options={usersList.data.map(u => ({ value: u.id.toString(), label: `${u.name} ${u.surname}` }))}
                                selectedValues={selectedUserIds}
                                onChange={setSelectedUserIds}
                                placeholder="All Employees"
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '150px' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Companies</label>
                            <MultiSelect
                                options={companiesList.data.map(c => ({ value: c.id.toString(), label: c.name }))}
                                selectedValues={selectedCompanyIds}
                                onChange={setSelectedCompanyIds}
                                placeholder="All Companies"
                            />
                        </div>
                    </>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '150px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Group By</label>
                    <select
                        value={groupBy}
                        onChange={(e) => setGroupBy(e.target.value as GroupByOption)}
                        style={{
                            padding: '8px',
                            borderRadius: '4px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            width: '100%',
                            height: '42px',
                            boxSizing: 'border-box',
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="none">No Grouping</option>
                        <option value="date">Date</option>
                        <option value="projectName">Project</option>
                        <option value="status">Status</option>
                        {isTeamReport && (
                            <>
                                <option value="userName">Employee Name</option>
                                <option value="companyName">Company Name</option>
                            </>
                        )}
                    </select>
                </div>

                <div style={{ display: 'flex' }}>
                    <button
                        className="primary-button-2"
                        onClick={() => fetchReport()}
                        disabled={isLoading}
                        style={{
                            padding: '0 24px',
                            backgroundColor: 'var(--primary-button)',
                            color: 'white',
                            border: '1px solid var(--primary-button-border)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            height: '42px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        {isLoading ? 'Loading...' : 'Generate'}
                    </button>
                </div>
            </div>

            <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: 'var(--bg-secondary)' }}>
                        <tr>
                            {columns.map(col => {
                                if (!isTeamReport && (col.accessor === 'userName' || col.accessor === 'companyName')) return null;
                                return (
                                    <th className="secondary-button" key={col.accessor} style={{ padding: '12px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }} onClick={() => handleSortingChange(col.accessor)}>
                                        {col.header}
                                    </th>
                                )
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {detailedData.length === 0 ? (
                            <tr><td colSpan={isTeamReport ? 5 : 4} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>No entries found for the selected period.</td></tr>
                        ) : (
                            tableData.map((data) => (
                                <tr key={data.id} style={{ backgroundColor: 'var(--bg-primary)' }}>
                                    {columns.map(({ accessor }) => {
                                        const tData = data[accessor];
                                        if (!isTeamReport && (accessor === 'userName' || accessor === 'companyName')) return null;
                                        return <td key={accessor} style={{ padding: '12px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>{tData !== null ? tData : "N/A"}</td>
                                    })}
                                </tr>
                            ))
                        )}
                        {detailedData.length > 0 && (
                            <tr style={{ backgroundColor: 'var(--bg-secondary)', borderTop: '2px solid var(--border-color)' }}>
                                <td colSpan={isTeamReport ? 4 : 3} style={{ padding: '12px', color: 'var(--text-primary)', textAlign: 'right', fontWeight: 'bold' }}>Total Hours in period:</td>
                                <td style={{ padding: '12px', color: 'var(--text-primary)', fontWeight: 'bold' }}>{detailedData.reduce((sum, row) => sum + row.hours, 0)}h</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div >
    );
};

export default function Reports() {
    const { user } = useAuth();
    const [userCanApprove, setUserCanApprove] = useState(false);
    const canSeeTeamReport = user?.role === 'Admin' || user?.role === 'Manager' || (user?.role === 'Externist' && userCanApprove);

    const [projects, setProjects] = useState<Projects>({ count: 0, data: [] });
    const [users, setUsers] = useState<Users>({ count: 0, data: [] });
    const [companies, setCompanies] = useState<Companies>({ count: 0, data: [] });

    useEffect(() => {
        const loadFiltersData = async () => {
            if (user?.nameid) {
                canApprove(Number(user.nameid)).then(setUserCanApprove);
            }

            try {
                const projectsData = { data: await ProjectsRepository.getUserProjects(Number(user?.nameid)) };
                setProjects(projectsData ? { count: projectsData.data.length, data: projectsData.data } : { count: 0, data: [] });

                if (canSeeTeamReport) {
                    const usersData = await UsersRepository.getUsers();
                    setUsers(usersData ?? { count: 0, data: [] });

                    const companiesData = await CompaniesRepository.getCompanies();
                    setCompanies(companiesData
                        ? {
                            ...companiesData,
                            data: [...companiesData.data, { name: "No Company", id: 0, cin: "" }]
                        }
                        : { count: 0, data: [{ name: "No Company", id: 0, cin: "" }] });
                }
            } catch (error) {
                console.error("Failed to load filter options", error);
            }
        };

        loadFiltersData();
    }, [canSeeTeamReport, user?.nameid]);

    return (
        <div className="main-content">

            <ReportBlock title="My Personal Report" isTeamReport={false} currentUser={user} projectsList={projects} usersList={users} companiesList={companies} />

            {canSeeTeamReport && (
                <>
                    <div style={{
                        height: '4px',
                        background: 'linear-gradient(90deg, transparent 0%, var(--border-color) 15%, var(--border-color) 85%, transparent 100%)',
                        margin: '4rem 0',
                        opacity: 1
                    }} />

                    <ReportBlock title="Team & Projects Report" isTeamReport={true} currentUser={user} projectsList={projects} usersList={users} companiesList={companies} />
                </>
            )}
        </div>
    );
}