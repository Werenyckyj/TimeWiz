import { useState } from "react";

export function PasswordField({ formData, setFormData }: { formData: { password: string }, setFormData: React.Dispatch<React.SetStateAction<{ password: string }>> }) {
    const [showPassword, setShowPassword] = useState(false);

    return (<div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
            required
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={e => setFormData({ ...formData, password: e.target.value })}
            style={{ padding: '8px', paddingRight: '36px', borderRadius: '4px', border: '1px solid var(--border-color)', width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--bg-secondary)' }}
        />

        <button
            type="button"
            className="button-secondary"
            onClick={() => setShowPassword(!showPassword)}
            style={{
                position: 'absolute', right: '8px',
                background: 'none', border: 'none',
                cursor: 'pointer', color: 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px'
            }}
        >
            {showPassword ? (
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
            ) : (
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
            )}
        </button>
    </div>);
}