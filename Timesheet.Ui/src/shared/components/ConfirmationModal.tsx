import { Modal } from "./Modal";

export function ConfirmationModal({
    isOpen,
    onClose,
    title,
    message,
    onConfirm,
}: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    onConfirm: () => void;
}) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="400px">
            <p style={{ marginBottom: '24px', color: 'var(--text-primary)', overflowWrap: 'break-word' }}>{message}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                    className="reject-button"
                    onClick={onClose}
                    style={{
                        padding: "8px 12px",
                        cursor: "pointer",
                        backgroundColor: 'var(--reject)',
                        border: '1px solid var(--reject-border)',
                        color: 'var(--text-primary)',
                        borderRadius: "6px",
                        fontWeight: "bold",
                    }}
                >
                    Cancel
                </button>
                <button
                    className="success-button"
                    onClick={() => {
                        onConfirm();
                        onClose();
                    }}
                    style={{
                        padding: "8px 12px",
                        cursor: "pointer",
                        backgroundColor: 'var(--success-2)',
                        border: '1px solid var(--success-border)',
                        color: 'white',
                        borderRadius: "6px",
                        fontWeight: "bold",
                    }}
                >
                    Confirm
                </button>
            </div>
        </Modal>
    );
}   