import { useEffect, useState } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Topbar from '../components/Topbar';

export default function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({ courses: 0, materials: 0, announcements: 0, schedules: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                if (user.role === 'lecturer') {
                    const res = await API.get('/courses/my-courses');
                    setStats(s => ({ ...s, courses: res.data.length }));
                } else {
                    const res = await API.get('/courses/enrolled');
                    setStats(s => ({ ...s, courses: res.data.length }));
                }
                // Simplified counters for demo purposes
                setStats(s => ({ ...s, materials: Math.floor(Math.random() * 20 + 5) }));
                setStats(s => ({ ...s, announcements: Math.floor(Math.random() * 10 + 2) }));
                setStats(s => ({ ...s, schedules: Math.floor(Math.random() * 5 + 1) }));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [user]);

    return (
        <div className="page-body">
            <Topbar title="Dashboard" />
            <div className="page-header" style={{ marginTop: '24px' }}>
                <h1>Welcome Back, {user?.name.split(' ')[0]} 👋</h1>
                <p>Here's what's happening with your academic activities.</p>
            </div>

            {loading ? (
                <div className="loading-center"><div className="spinner" /></div>
            ) : (
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon blue">📚</div>
                        <div>
                            <div className="stat-value">{stats.courses}</div>
                            <div className="stat-label">{user.role === 'lecturer' ? 'My Courses' : 'Enrolled Courses'}</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon cyan">📄</div>
                        <div>
                            <div className="stat-value">{stats.materials}</div>
                            <div className="stat-label">Materials Available</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon amber">📢</div>
                        <div>
                            <div className="stat-value">{stats.announcements}</div>
                            <div className="stat-label">Recent Alerts</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon green">📅</div>
                        <div>
                            <div className="stat-value">{stats.schedules}</div>
                            <div className="stat-label">Upcoming Classes</div>
                        </div>
                    </div>
                </div>
            )}

            <div className="card" style={{ padding: '32px', textAlign: 'center', background: 'var(--bg-card2)' }}>
                <h2 style={{ fontSize: '20px', marginBottom: '12px' }}>Welcome to ARMS</h2>
                <p style={{ color: 'var(--text-muted)' }}>
                    The centralized environment to manage tertiary institution resources.<br />
                    Navigate using the sidebar to explore your courses, materials, and schedules.
                </p>
            </div>
        </div>
    );
}
