import { type ReactNode, useEffect } from "react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    maxWidth?: string;
}

export function Modal({ isOpen, onClose, title, children, maxWidth }: ModalProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            onMouseDown={onClose}
        >
            <div
                style={{ backgroundColor: 'var(--bg-primary)', borderRadius: '8px', width: '100%', maxWidth: maxWidth || '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', margin: '10px' }}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'start', overflowWrap: 'break-word' }}>
                    <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.25rem', flex: 1, minWidth: 0, whiteSpace: 'normal', overflowWrap: 'anywhere' }}>{title}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)', lineHeight: 1 }}>&times;</button>
                </div>

                <div style={{ padding: '24px', overflowY: 'auto' }}>
                    {children}
                </div>
            </div>
        </div>
    );
}