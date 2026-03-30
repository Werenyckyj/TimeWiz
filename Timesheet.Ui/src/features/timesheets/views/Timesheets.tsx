import { useAuth } from "../../auth/hooks/useAuth";

export default function Timesheets() {
    const { user } = useAuth();

    return (
        <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
            <h1>Timesheets</h1>
            <p>Welcome to the Timesheets page, {user?.unique_name}!</p>
        </div>
    );
}