import { useState } from "react";

export default function EmailValidator({ onChange, value, style }: { onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void, value?: string, style?: React.CSSProperties }) {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEmail(value);

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        if (value && !emailRegex.test(value)) {
            setError("Please enter a valid email address.");
        } else {
            setError("");
        }

        if (onChange) {
            onChange(e);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label>Email:</label>
            <input
                type="email"
                value={value !== undefined ? value : email}
                onChange={handleEmailChange}
                style={style}
            />
            {error && <span style={{ color: 'red', fontSize: '0.85rem' }}>{error}</span>}
        </div>
    );
}