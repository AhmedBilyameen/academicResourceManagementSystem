import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const lecturerNav = [
    {
        section: 'Main', links: [
            { label: 'Dashboard', icon: '🏠', path: '/dashboard' },
            { label: 'My Courses', icon: '📚', path: '/courses' },
        ]
    },
    {
        section: 'Manage', links: [
            { label: 'Materials', icon: '📄', path: '/materials' },
            { label: 'Announcements', icon: '📢', path: '/announcements' },
            { label: 'Class Schedule', icon: '📅', path: '/schedules' },
            { label: 'Assignments', icon: '📝', path: '/assignments' },
            { label: 'Post Scores', icon: '🎯', path: '/scores' },
        ]
    },
];

const studentNav = [
    {
        section: 'Main', links: [
            { label: 'Dashboard', icon: '🏠', path: '/dashboard' },
            { label: 'My Courses', icon: '📚', path: '/courses' },
        ]
    },
    {
        section: 'Academic', links: [
            { label: 'Materials', icon: '📄', path: '/materials' },
            { label: 'Announcements', icon: '📢', path: '/announcements' },
            { label: 'Class Schedule', icon: '📅', path: '/schedules' },
            { label: 'Assignments', icon: '📝', path: '/assignments' },
            { label: 'Check Score', icon: '🎯', path: '/scores' },
        ]
    },
];

export default function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = user?.role === 'lecturer' ? lecturerNav : studentNav;
    const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="logo-icon">🎓</div>
                <div>
                    <h2>ARMS</h2>
                    <span>Academic Resource System</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((section) => (
                    <div key={section.section}>
                        <p className="sidebar-section-label">{section.section}</p>
                        {section.links.map((link) => (
                            <button
                                key={link.path}
                                className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
                                onClick={() => navigate(link.path)}
                            >
                                <span className="nav-icon">{link.icon}</span>
                                {link.label}
                            </button>
                        ))}
                    </div>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="user-avatar">{initials}</div>
                    <div className="user-info">
                        <div className="name">{user?.name}</div>
                        <div className="role">{user?.role}</div>
                    </div>
                    <button className="btn-icon" onClick={handleLogout} title="Logout">🚪</button>
                </div>
            </div>
        </aside>
    );
}
