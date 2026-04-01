import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [isRegister, setIsRegister] = useState(false);
    const [role, setRole] = useState('student');
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '', regNumber: '', department: '', level: '100' });

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const endpoint = isRegister ? '/auth/register' : '/auth/login';
            const payload = isRegister ? { ...form, role } : { email: form.email, password: form.password };
            const { data } = await API.post(endpoint, payload);
            login(data);
            toast.success(`Welcome${isRegister ? '' : ' back'}, ${data.name}!`);
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">
                    <div className="logo-circle">🎓</div>
                    <h1>ARMS</h1>
                    <p>Campus Academic Resource Management System</p>
                </div>

                <div className="auth-tabs">
                    <button className={`auth-tab ${!isRegister ? 'active' : ''}`} onClick={() => setIsRegister(false)}>
                        Sign In
                    </button>
                    <button className={`auth-tab ${isRegister ? 'active' : ''}`} onClick={() => setIsRegister(true)}>
                        Register
                    </button>
                </div>

                {isRegister && (
                    <div className="auth-tabs" style={{ marginBottom: '18px' }}>
                        <button className={`auth-tab ${role === 'student' ? 'active' : ''}`} onClick={() => setRole('student')}>
                            👨‍🎓 Student
                        </button>
                        <button className={`auth-tab ${role === 'lecturer' ? 'active' : ''}`} onClick={() => setRole('lecturer')}>
                            👨‍🏫 Lecturer
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {isRegister && (
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input name="name" className="form-input" placeholder="Enter your full name"
                                value={form.name} onChange={handleChange} required />
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input name="email" type="email" className="form-input" placeholder="your@email.com"
                            value={form.email} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input name="password" type="password" className="form-input" placeholder="••••••••"
                            value={form.password} onChange={handleChange} required />
                    </div>

                    {isRegister && role === 'student' && (
                        <>
                            <div className="form-group">
                                <label className="form-label">Registration Number</label>
                                <input name="regNumber" className="form-input" placeholder="e.g. CS/2020/001"
                                    value={form.regNumber} onChange={handleChange} required />
                            </div>
                            <div className="form-grid-2">
                                <div className="form-group">
                                    <label className="form-label">Department</label>
                                    <input name="department" className="form-input" placeholder="e.g. Computer Science"
                                        value={form.department} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Level</label>
                                    <select name="level" className="form-select" value={form.level} onChange={handleChange}>
                                        <option>100</option><option>200</option><option>300</option>
                                        <option>400</option><option>500</option>
                                    </select>
                                </div>
                            </div>
                        </>
                    )}

                    {isRegister && role === 'lecturer' && (
                        <div className="form-group">
                            <label className="form-label">Department</label>
                            <input name="department" className="form-input" placeholder="e.g. Computer Science"
                                value={form.department} onChange={handleChange} />
                        </div>
                    )}

                    <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }}
                        type="submit" disabled={loading}>
                        {loading ? '⏳ Please wait...' : isRegister ? '🚀 Create Account' : '🔐 Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}
