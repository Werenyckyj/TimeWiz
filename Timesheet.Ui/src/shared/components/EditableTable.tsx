import { useState } from "react";
import { ConfirmationModal } from "./ConfirmationModal";

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

export interface EditableTableProps<T extends { id: string | number }> {
    data: T[];
    columns: ColumnDef<T>[];
    onAdd?: (newRecord: Partial<T>) => Promise<void>;
    onEdit?: (updatedRecord: T) => Promise<void>;
    onDelete?: (id: string | number) => Promise<void>;
    isAdding?: boolean;
    setIsAdding?: (val: boolean) => void;
    extraRowActions?: (row: T) => { label: string; onClick: () => void }[];
    entityName?: string;
    nameAccessor?: keyof T;
}

export function EditableTable<T extends { id: string | number }>({
    data,
    columns,
    onAdd,
    onEdit,
    onDelete,
    isAdding,
    setIsAdding,
    extraRowActions,
    entityName = "item",
    nameAccessor
}: EditableTableProps<T>) {

    const [editingId, setEditingId] = useState<string | number | null>(null);
    const [draft, setDraft] = useState<Partial<T>>({});
    const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);
    const [openModalForId, setOpenModalForId] = useState<string | number | null>(null);

    const cancelAdd = () => {
        setIsAdding?.(false);
        setDraft({});
    };

    const commitAdd = async () => {
        if (onAdd) {
            await onAdd(draft);
        }
        setIsAdding?.(false);
        setDraft({});
    };

    const startEdit = (row: T) => {
        setIsAdding?.(false);
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
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            overflow: 'visible',
            backgroundColor: 'var(--bg-primary)',
            transition: 'padding 0.2s ease'
        }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'left', tableLayout: 'fixed' }}>

                <thead style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <tr>
                        {columns.map((col, idx) => (
                            <th key={idx} style={{
                                padding: '12px 16px',
                                fontWeight: '600',
                                color: 'var(--text-primary)',
                                width: col.width || 'auto',
                                borderBottom: '2px solid var(--border-color)',
                                borderTopLeftRadius: idx === 0 ? '8px' : '0',
                                borderTopRightRadius: (!hasActions && idx === columns.length - 1) ? '8px' : '0'
                            }}>
                                {col.header}
                            </th>
                        ))}
                        {hasActions && (
                            <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-primary)', textAlign: 'right', width: '180px', borderBottom: '2px solid var(--border-color)', borderTopRightRadius: '8px' }}>Action</th>
                        )}
                    </tr>
                </thead>

                <tbody>
                    {isAdding && (
                        <tr style={{ backgroundColor: 'var(--bg-hover)' }}>
                            {columns.map((col, idx) => (
                                <td data-label={col.header} key={idx} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                                    {col.type === 'readonly' ? (
                                        "—"
                                    ) : col.type === 'checkbox' ? (
                                        <input
                                            type="checkbox"
                                            checked={!!draft[col.accessor]}
                                            onChange={e => handleDraftChange(col.accessor, e.target.checked as T[typeof col.accessor])}
                                            style={{ width: '20px', height: '20px', cursor: 'pointer', backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
                                        />
                                    ) : col.type === 'select' ? (
                                        <select
                                            value={(draft[col.accessor] as string | number) || ""}
                                            onChange={e => handleDraftChange(col.accessor, e.target.value as T[typeof col.accessor])}
                                            style={{ width: '100%', padding: '6px', boxSizing: 'border-box', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                                        >
                                            <option value="">-- Select --</option>
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
                                            maxLength={col.maxLength}
                                            style={{ width: '100%', padding: '6px', boxSizing: 'border-box', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                                        />
                                    )}
                                </td>
                            ))}
                            {hasActions && <td data-label="Actions" style={{ padding: '12px 16px', textAlign: 'right', borderBottom: '1px solid var(--border-color)', alignItems: 'end' }}>
                                <div style={{ justifyContent: 'flex-end' }}>
                                    <button className="primary-button-2" onClick={commitAdd} style={{ marginRight: '8px', padding: '4px 8px', cursor: 'pointer', border: '1px solid var(--primary-button-border)', borderRadius: '4px', backgroundColor: 'var(--primary-button)', color: 'white' }}>
                                        Save
                                    </button>
                                    <button className="reject-button" onClick={cancelAdd} style={{ padding: '4px 8px', cursor: 'pointer', border: '1px solid var(--reject-border)', color: 'var(--reject-text)', borderRadius: '4px', backgroundColor: 'var(--reject)' }}>
                                        Cancel
                                    </button>
                                </div>
                            </td>}
                        </tr>
                    )}

                    {data.map((row) => {
                        const isEditingThisRow = editingId === row.id;

                        const rowActions: { label: string, onClick: () => void, color: string }[] = [];

                        if (onEdit) {
                            rowActions.push({ label: 'Edit', onClick: () => { startEdit(row); setOpenMenuId(null); }, color: 'white' });
                        }
                        if (extraRowActions) {
                            extraRowActions(row).forEach(action => {
                                rowActions.push({ label: action.label, onClick: () => { action.onClick(); setOpenMenuId(null); }, color: 'white' });
                            });
                        }
                        if (onDelete) {
                            rowActions.push({ label: 'Delete', onClick: () => { onDelete(row.id); setOpenMenuId(null); }, color: '#ef4444' });
                        }

                        return (
                            <tr key={row.id} style={{ backgroundColor: isEditingThisRow ? 'var(--bg-hover)' : 'transparent', color: 'var(--text-primary)' }}>
                                {columns.map((col, idx) => (
                                    <td data-label={col.header} key={idx} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
                                        {isEditingThisRow && col.type !== 'readonly' ? (
                                            col.type === 'checkbox' ? (
                                                <input
                                                    type="checkbox"
                                                    checked={!!draft[col.accessor]}
                                                    onChange={e => handleDraftChange(col.accessor, e.target.checked as T[typeof col.accessor])}
                                                    style={{ width: '20px', height: '20px', cursor: 'pointer', backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
                                                />
                                            ) : col.type === 'select' ? (
                                                <select
                                                    required={col.isRequired}
                                                    value={(draft[col.accessor] as string | number) || ""}
                                                    onChange={e => handleDraftChange(col.accessor, e.target.value as T[typeof col.accessor])}
                                                    style={{ width: '100%', padding: '6px', boxSizing: 'border-box', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                                                >
                                                    <option value="">-- Select --</option>
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
                                                    maxLength={col.maxLength}
                                                    onChange={e => handleDraftChange(col.accessor, e.target.value as T[typeof col.accessor])}
                                                    style={{ width: '100%', padding: '6px', boxSizing: 'border-box', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                                                />
                                            )
                                        ) : (
                                            col.renderCell ? col.renderCell(row) : (row[col.accessor] as React.ReactNode)
                                        )}
                                    </td>
                                ))}

                                {hasActions ? <td data-label="Actions" style={{ padding: '12px 16px', textAlign: 'right', position: 'relative', borderBottom: '1px solid var(--border-color)' }}>
                                    {isEditingThisRow ? (
                                        <div style={{ justifyContent: 'flex-end' }}>
                                            <button className="primary-button-2" onClick={() => commitEdit()} style={{ marginRight: '8px', padding: '4px 8px', cursor: 'pointer', border: '1px solid var(--primary-button-border)', borderRadius: '4px', backgroundColor: 'var(--primary-button)', color: 'white' }}>
                                                Save</button>
                                            <button className="reject-button" onClick={cancelEdit} style={{ padding: '4px 8px', cursor: 'pointer', border: '1px solid var(--reject-border)', color: 'var(--reject-text)', borderRadius: '4px', backgroundColor: 'var(--reject)' }}>
                                                Cancel</button>
                                        </div>
                                    ) : (rowActions.length === 1 ? (
                                        <button
                                            className="primary-button-2"
                                            onClick={rowActions[0].onClick}
                                            style={{
                                                padding: '4px 12px',
                                                cursor: 'pointer',
                                                border: '1px solid',
                                                borderColor: rowActions[0].color === '#ef4444' ? '#fecaca' : 'var(--primary-button-border)',
                                                borderRadius: '4px',
                                                backgroundColor: rowActions[0].color === '#ef4444' ? '#fef2f2' : 'var(--primary-button)',
                                                color: rowActions[0].color,
                                                fontWeight: '500'
                                            }}
                                        >
                                            {rowActions[0].label}
                                        </button>
                                    ) : rowActions.length > 1 ? (
                                        <div style={{ position: 'relative', display: 'inline-block' }}>
                                            <button
                                                onClick={() => setOpenMenuId(openMenuId === row.id ? null : row.id)}
                                                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', padding: '4px 8px', fontWeight: 'bold', color: 'var(--text-secondary)' }}
                                            >
                                                ⋮
                                            </button>
                                            {openMenuId === row.id && (
                                                <>
                                                    <div
                                                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }}
                                                        onClick={() => setOpenMenuId(null)}
                                                    />

                                                    <div style={{ position: 'absolute', right: 0, top: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 50, minWidth: '140px', padding: '4px 0', textAlign: 'left' }}>
                                                        <button
                                                            className="primary-button"
                                                            onClick={() => { startEdit(row); setOpenMenuId(null); }}
                                                            style={{ display: 'block', width: '100%', padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', color: 'var(--text-primary)' }}
                                                        >
                                                            Edit
                                                        </button>

                                                        {extraRowActions && extraRowActions(row).map((action, i) => (
                                                            <button
                                                                className="primary-button"
                                                                key={i}
                                                                onClick={() => { action.onClick(); setOpenMenuId(null); }}
                                                                style={{ display: 'block', width: '100%', padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', color: 'var(--text-primary)' }}
                                                            >
                                                                {action.label}
                                                            </button>
                                                        ))}

                                                        <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }} />

                                                        <button
                                                            className="primary-button"
                                                            onClick={() => {
                                                                setOpenModalForId(row.id);
                                                                setOpenMenuId(null);
                                                            }}
                                                            style={{ display: 'block', width: '100%', padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', color: '#ef4444' }}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>) : null
                                    )}
                                </td> : null}
                            </tr>
                        );
                    })}

                    {data.length === 0 && !isAdding && (
                        <tr>
                            <td
                                colSpan={columns.length + (hasActions ? 1 : 0)}
                                className="empty-state-cell"
                                style={{
                                    padding: '24px',
                                    textAlign: 'center',
                                    color: 'var(--text-secondary)',
                                    borderBottom: '1px solid var(--border-color)'
                                }}
                            >
                                No data available.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
            <ConfirmationModal
                isOpen={openModalForId !== null}
                onClose={() => setOpenModalForId(null)}
                title={`Delete ${entityName} ${openModalForId !== null && nameAccessor
                    ? String(data.find(r => r.id === openModalForId)?.[nameAccessor] || 'Unknown')
                    : 'Unknown'
                    }`}
                message={`Are you sure you want to delete this ${entityName}?`}
                onConfirm={async () => {
                    const row = data.find(r => r.id === openModalForId);
                    if (!row) return;

                    if (onDelete) {
                        await onDelete(row.id);
                    }
                    setOpenModalForId(null);
                }}
            />
        </div>
    );
}