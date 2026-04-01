import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Topbar from '../components/Topbar';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

export default function Announcements() {
    const { user } = useAuth();
    const [announcements, setAnnouncements] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const [form, setForm] = useState({ title: '', content: '', courseId: '', priority: 'normal' });

    const isLecturer = user?.role === 'lecturer';

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                if (isLecturer) {
                    const courseRes = await API.get('/courses/my-courses');
                    setCourses(courseRes.data);
                    if (courseRes.data.length > 0) {
                        setForm(f => ({ ...f, courseId: courseRes.data[0]._id }));
                        const annRes = await API.get(`/announcements/course/${courseRes.data[0]._id}`);
                        setAnnouncements(annRes.data);
                    }
                } else {
                    const annRes = await API.get('/announcements/my-feed');
                    setAnnouncements(annRes.data);
                }
            } catch (err) {
                toast.error('Failed to load announcements');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [isLecturer]);

    // Lecturer change course to view specific announcements
    const handleCourseChange = async (cid) => {
        setForm(f => ({ ...f, courseId: cid }));
        if (!cid) return;
        setLoading(true);
        try {
            const { data } = await API.get(`/announcements/course/${cid}`);
            setAnnouncements(data);
        } catch {
            toast.error('Failed to switch course');
        } finally {
            setLoading(false);
        }
    };

    const handlePost = async (e) => {
        e.preventDefault();
        try {
            const { data } = await API.post('/announcements', form);
            toast.success('Announcement posted');
            setAnnouncements([data, ...announcements]);
            setShowModal(false);
            setForm({ ...form, title: '', content: '', priority: 'normal' });
        } catch (err) {
            toast.error('Failed to post announcement');
        }
    };

    return (
        <div className="page-body">
            <Topbar title="Announcements" actions={
                isLecturer && (
                    <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
                        + Post Announcement
                    </button>
                )
            } />

            <div className="page-header" style={{ marginTop: '24px' }}>
                <p>Stay updated with the latest news and important notices from your courses.</p>
                {isLecturer && (
                    <div style={{ marginTop: '16px', maxWidth: '300px' }}>
                        <label className="form-label">Filter by Course</label>
                        <select className="form-select" value={form.courseId} onChange={e => handleCourseChange(e.target.value)}>
                            {courses.map(c => <option key={c._id} value={c._id}>{c.courseCode} - {c.title}</option>)}
                        </select>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="loading-center"><div className="spinner" /></div>
            ) : announcements.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📢</div>
                    <h3>No Announcements</h3>
                    <p>No new updates or news at this time.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {announcements.map(ann => (
                        <div key={ann._id} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: '800' }}>{ann.title}</h3>
                                <span className={`badge priority-${ann.priority}`}>
                                    {ann.priority.toUpperCase()}
                                </span>
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                                {isLecturer ? 'Posted by me' : `From: ${ann.course?.courseCode} - ${ann.postedBy?.name}`} •
                                {' '}{new Date(ann.createdAt).toLocaleDateString()}
                            </div>
                            <p style={{ color: 'var(--text)', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                                {ann.content}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {showModal && isLecturer && (
                <Modal title="Post Announcement" onClose={() => setShowModal(false)} footer={
                    <button className="btn btn-primary" onClick={handlePost}>Publish Now</button>
                }>
                    <div className="form-group">
                        <label className="form-label">Target Course</label>
                        <select className="form-select" value={form.courseId} onChange={e => setForm({ ...form, courseId: e.target.value })}>
                            {courses.map(c => <option key={c._id} value={c._id}>{c.courseCode} - {c.title}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Title</label>
                        <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Priority</label>
                        <select className="form-select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                            <option value="low">Low (Info)</option>
                            <option value="normal">Normal</option>
                            <option value="high">High (Important)</option>
                            <option value="urgent">Urgent (Action Required)</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Message Content</label>
                        <textarea className="form-textarea" style={{ minHeight: '120px' }} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} required />
                    </div>
                </Modal>
            )}
        </div>
    );
}
