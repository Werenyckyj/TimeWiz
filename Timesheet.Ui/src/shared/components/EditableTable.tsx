import { useState } from "react";

export interface ColumnDef<T> {
    header: string;
    accessor: keyof T;
    type?: "text" | "number" | "readonly" | "select" | "date" | "checkbox";
    renderCell?: (row: T) => React.ReactNode;
    width?: string;
    maxLength?: number;
    options?: SelectOptions[];
    isRequired?: boolean;
}

export interface SelectOptions {
    value: string | number;
    label: string;
}

interface EditableTableProps<T extends { id: string | number }> {
    data: T[];
    columns: ColumnDef<T>[];
    onAdd?: (newRecord: Partial<T>) => Promise<void>;
    onEdit?: (updatedRecord: T) => Promise<void>;
    onDelete?: (id: string | number) => Promise<void>;
    isAdding: boolean;
    setIsAdding: (val: boolean) => void;
    extraRowActions?: (row: T) => { label: string; onClick: () => void }[];
}

export function EditableTable<T extends { id: string | number }>({
    data,
    columns,
    onAdd,
    onEdit,
    onDelete,
    isAdding,
    setIsAdding,
    extraRowActions
}: EditableTableProps<T>) {

    const [editingId, setEditingId] = useState<string | number | null>(null);
    const [draft, setDraft] = useState<Partial<T>>({});
    const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);

    const cancelAdd = () => {
        setIsAdding(false);
        setDraft({});
    };

    const commitAdd = async () => {
        if (onAdd) {
            await onAdd(draft);
        }
        setIsAdding(false);
        setDraft({});
    };

    const startEdit = (row: T) => {
        setIsAdding(false);
        setEditingId(row.id);

        const rowWithRoleFix = { ...row };
        if ('role' in rowWithRoleFix && rowWithRoleFix.role && typeof rowWithRoleFix.role === 'object') {
            const roleObj = rowWithRoleFix.role as { id: string | number };
            (rowWithRoleFix as Record<string, unknown>).roleId = roleObj.id;
        }

        setDraft(rowWithRoleFix);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setDraft({});
    };

    const commitEdit = async () => {
        if (onEdit) {
            await onEdit(draft as T);
        }
        setEditingId(null);
        setDraft({});
    };

    const handleDraftChange = <K extends keyof T>(accessor: K, value: T[K]) => {
        setDraft(prev => ({ ...prev, [accessor]: value }));
    };

    const hasActions = !!(onEdit || onDelete || extraRowActions || onAdd);

    return (
        <div style={{
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            overflow: 'visible', // OPRAVA: Musí být visible, aby Kebab menu vyjelo ven
            backgroundColor: '#ffffff',
            paddingBottom: openMenuId ? '140px' : '0', // OPRAVA: Přidá místo pod tabulkou pro menu
            transition: 'padding 0.2s ease'
        }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'left', tableLayout: 'fixed' }}>

                <thead style={{ backgroundColor: '#f8fafc' }}>
                    <tr>
                        {columns.map((col, idx) => (
                            <th key={idx} style={{
                                padding: '12px 16px',
                                fontWeight: '600',
                                color: '#334155',
                                width: col.width || 'auto',
                                borderBottom: '2px solid #e2e8f0',
                                borderTopLeftRadius: idx === 0 ? '8px' : '0',
                                borderTopRightRadius: (!hasActions && idx === columns.length - 1) ? '8px' : '0'
                            }}>
                                {col.header}
                            </th>
                        ))}
                        {hasActions && (
                            <th style={{ padding: '12px 16px', fontWeight: '600', color: '#334155', textAlign: 'right', width: '180px', borderBottom: '2px solid #e2e8f0', borderTopRightRadius: '8px' }}>Action</th>
                        )}
                    </tr>
                </thead>

                <tbody>
                    {isAdding && (
                        <tr style={{ backgroundColor: '#f0f9ff' }}>
                            {columns.map((col, idx) => (
                                <td key={idx} style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
                                    {col.type === 'readonly' ? (
                                        "—"
                                    ) : col.type === 'checkbox' ? (
                                        <input
                                            type="checkbox"
                                            checked={!!draft[col.accessor]}
                                            onChange={e => handleDraftChange(col.accessor, e.target.checked as T[typeof col.accessor])}
                                            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                        />
                                    ) : col.type === 'select' ? (
                                        <select
                                            value={(draft[col.accessor] as string | number) || ""}
                                            onChange={e => handleDraftChange(col.accessor, e.target.value as T[typeof col.accessor])}
                                            style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }}
                                        >
                                            <option value="">-- Vyberte --</option>
                                            {col.options?.map(opt => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type={col.type || "text"}
                                            value={
                                                col.type === 'date' && draft[col.accessor]
                                                    ? String(draft[col.accessor]).split('T')[0]
                                                    : (draft[col.accessor] as string) || ""
                                            }
                                            onChange={e => handleDraftChange(col.accessor, e.target.value as T[typeof col.accessor])}
                                            style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }}
                                        />
                                    )}
                                </td>
                            ))}
                            <td style={{ padding: '12px 16px', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>
                                <button onClick={commitAdd} style={{ marginRight: '8px', padding: '4px 8px', cursor: 'pointer', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: 'white' }}>Save</button>
                                <button onClick={cancelAdd} style={{ padding: '4px 8px', cursor: 'pointer', border: '1px solid #fecaca', color: '#ef4444', borderRadius: '4px', backgroundColor: '#fef2f2' }}>Cancel</button>
                            </td>
                        </tr>
                    )}

                    {data.map((row) => {
                        const isEditingThisRow = editingId === row.id;

                        return (
                            <tr key={row.id} style={{ backgroundColor: isEditingThisRow ? '#f0f9ff' : 'transparent' }}>
                                {columns.map((col, idx) => (
                                    <td key={idx} style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
                                        {isEditingThisRow && col.type !== 'readonly' ? (
                                            col.type === 'checkbox' ? (
                                                <input
                                                    type="checkbox"
                                                    checked={!!draft[col.accessor]}
                                                    onChange={e => handleDraftChange(col.accessor, e.target.checked as T[typeof col.accessor])}
                                                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                                />
                                            ) : col.type === 'select' ? (
                                                <select
                                                    required={col.isRequired}
                                                    value={(draft[col.accessor] as string | number) || ""}
                                                    onChange={e => handleDraftChange(col.accessor, e.target.value as T[typeof col.accessor])}
                                                    style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }}
                                                >
                                                    <option value="">-- Vyberte --</option>
                                                    {col.options?.map(opt => (
                                                        <option key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input
                                                    required={col.isRequired}
                                                    type={col.type || "text"}
                                                    value={
                                                        col.type === 'date' && draft[col.accessor]
                                                            ? String(draft[col.accessor]).split('T')[0]
                                                            : (draft[col.accessor] as string) || ""
                                                    }
                                                    onChange={e => handleDraftChange(col.accessor, e.target.value as T[typeof col.accessor])}
                                                    style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }}
                                                />
                                            )
                                        ) : (
                                            col.renderCell ? col.renderCell(row) : (row[col.accessor] as React.ReactNode)
                                        )}
                                    </td>
                                ))}

                                {hasActions ? <td style={{ padding: '12px 16px', textAlign: 'right', position: 'relative', borderBottom: '1px solid #e2e8f0' }}>
                                    {isEditingThisRow ? (
                                        <>
                                            <button onClick={() => commitEdit()} style={{ marginRight: '8px', padding: '4px 8px', cursor: 'pointer', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: 'white' }}>Save</button>
                                            <button onClick={cancelEdit} style={{ padding: '4px 8px', cursor: 'pointer', border: '1px solid #fecaca', color: '#ef4444', borderRadius: '4px', backgroundColor: '#fef2f2' }}>Cancel</button>
                                        </>
                                    ) : (
                                        <div style={{ position: 'relative', display: 'inline-block' }}>
                                            <button
                                                onClick={() => setOpenMenuId(openMenuId === row.id ? null : row.id)}
                                                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', padding: '4px 8px', fontWeight: 'bold', color: '#64748b' }}
                                            >
                                                ⋮
                                            </button>
                                            {openMenuId === row.id && (
                                                <>
                                                    <div
                                                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }}
                                                        onClick={() => setOpenMenuId(null)}
                                                    />

                                                    <div style={{ position: 'absolute', right: 0, top: '100%', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 50, minWidth: '140px', padding: '4px 0', textAlign: 'left' }}>
                                                        <button
                                                            onClick={() => { startEdit(row); setOpenMenuId(null); }}
                                                            style={{ display: 'block', width: '100%', padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', color: '#334155' }}
                                                        >
                                                            Edit
                                                        </button>

                                                        {extraRowActions && extraRowActions(row).map((action, i) => (
                                                            <button
                                                                key={i}
                                                                onClick={() => { action.onClick(); setOpenMenuId(null); }}
                                                                style={{ display: 'block', width: '100%', padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', color: '#334155' }}
                                                            >
                                                                {action.label}
                                                            </button>
                                                        ))}

                                                        <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '4px 0' }} />

                                                        <button
                                                            onClick={() => {
                                                                if (onDelete) {
                                                                    onDelete(row.id);
                                                                }
                                                                setOpenMenuId(null);
                                                            }}
                                                            style={{ display: 'block', width: '100%', padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', color: '#ef4444' }}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </td> : null}
                            </tr>
                        );
                    })}

                    {data.length === 0 && !isAdding && (
                        <tr>
                            <td colSpan={columns.length + 1} style={{ padding: '24px', textAlign: 'center', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                                Žádná data k zobrazení.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}