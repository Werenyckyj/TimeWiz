import { useState } from "react";

export interface ColumnDef<T> {
    header: string;
    accessor: keyof T;
    type?: "text" | "number" | "readonly";
    renderCell?: (row: T) => React.ReactNode;
    width?: string;
    maxLength?: number;
}

interface EditableTableProps<T extends { id: string | number }> {
    data: T[];
    columns: ColumnDef<T>[];
    onAdd: (newRecord: Partial<T>) => Promise<void>;
    onEdit: (updatedRecord: T) => Promise<void>;
    onDelete: (id: string | number) => Promise<void>;
    isAdding: boolean;
    setIsAdding: (val: boolean) => void;
}

export function EditableTable<T extends { id: string | number }>({
    data,
    columns,
    onAdd,
    onEdit,
    onDelete,
    isAdding,
    setIsAdding
}: EditableTableProps<T>) {

    const [editingId, setEditingId] = useState<string | number | null>(null);
    const [draft, setDraft] = useState<Partial<T>>({});

    const cancelAdd = () => {
        setIsAdding(false);
        setDraft({});
    };

    const commitAdd = async () => {
        await onAdd(draft);
        setIsAdding(false);
        setDraft({});
    };

    const startEdit = (row: T) => {
        setIsAdding(false);
        setEditingId(row.id);
        setDraft(row);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setDraft({});
    };

    const commitEdit = async () => {
        await onEdit(draft as T);
        setEditingId(null);
        setDraft({});
    };

    const handleDraftChange = <K extends keyof T>(accessor: K, value: T[K]) => {
        setDraft(prev => ({ ...prev, [accessor]: value }));
    };

    return (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#ffffff' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', tableLayout: 'fixed' }}>

                <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <tr>
                        {columns.map((col, idx) => (
                            <th key={idx} style={{ padding: '12px 16px', fontWeight: '600', color: '#334155', width: col.width || 'auto' }}>
                                {col.header}
                            </th>
                        ))}
                        <th style={{ padding: '12px 16px', fontWeight: '600', color: '#334155', textAlign: 'right', width: '200px' }}>Akce</th>
                    </tr>
                </thead>

                <tbody>
                    {isAdding && (
                        <tr style={{ backgroundColor: '#f0f9ff' }}>
                            {columns.map((col, idx) => (
                                <td key={idx} style={{ padding: '12px 16px' }}>
                                    {col.type === 'readonly' ? (
                                        "—"
                                    ) : (
                                        <input
                                            type={col.type || "text"}
                                            value={(draft[col.accessor] as string) || ""}
                                            onChange={e => handleDraftChange(col.accessor, e.target.value as T[typeof col.accessor])}
                                            style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }}
                                            maxLength={col.maxLength}
                                        />
                                    )}
                                </td>
                            ))}
                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                <button onClick={commitAdd} style={{ marginRight: '8px', padding: '4px 8px', cursor: 'pointer' }}>Save</button>
                                <button onClick={cancelAdd} style={{ padding: '4px 8px', cursor: 'pointer', color: 'red' }}>Cancel</button>
                            </td>
                        </tr>
                    )}

                    {data.map((row) => {
                        const isEditingThisRow = editingId === row.id;

                        return (
                            <tr key={row.id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: isEditingThisRow ? '#f0f9ff' : 'transparent' }}>
                                {columns.map((col, idx) => (
                                    <td key={idx} style={{ padding: '12px 16px' }}>
                                        {isEditingThisRow && col.type !== 'readonly' ? (
                                            <input
                                                type={col.type || "text"}
                                                value={(draft[col.accessor] as string) || ""}
                                                onChange={e => handleDraftChange(col.accessor, e.target.value as T[typeof col.accessor])}
                                                style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }}
                                                maxLength={col.maxLength}
                                            />
                                        ) : (
                                            col.renderCell ? col.renderCell(row) : (row[col.accessor] as React.ReactNode)
                                        )}
                                    </td>
                                ))}

                                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                    {isEditingThisRow ? (
                                        <>
                                            <button onClick={() => commitEdit()} style={{ marginRight: '8px', padding: '4px 8px', cursor: 'pointer' }}>Save</button>
                                            <button onClick={cancelEdit} style={{ padding: '4px 8px', cursor: 'pointer', color: 'red' }}>Cancel</button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => startEdit(row)} style={{ marginRight: '8px', padding: '4px 8px', cursor: 'pointer' }}>Edit</button>
                                            <button onClick={() => onDelete(row.id)} style={{ padding: '4px 8px', cursor: 'pointer', color: 'red' }}>Delete</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        );
                    })}

                    {data.length === 0 && !isAdding && (
                        <tr>
                            <td colSpan={columns.length + 1} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                                Žádná data k zobrazení.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}