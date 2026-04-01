import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Topbar from '../components/Topbar';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

export default function Schedules() {
    const { user } = useAuth();
    const [schedules, setSchedules] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const [form, setForm] = useState({
        title: '', description: '', courseId: '', classDate: '', startTime: '', endTime: '', venue: '', classType: 'physical', meetingLink: ''
    });

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
                        const schedRes = await API.get(`/schedules/course/${courseRes.data[0]._id}`);
                        setSchedules(schedRes.data);
                    }
                } else {
                    const schedRes = await API.get('/schedules/upcoming');
                    setSchedules(schedRes.data);
                }
            } catch (err) {
                toast.error('Failed to load schedules');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [isLecturer]);

    const handleCourseChange = async (cid) => {
        setForm(f => ({ ...f, courseId: cid }));
        if (!cid) return;
        setLoading(true);
        try {
            const { data } = await API.get(`/schedules/course/${cid}`);
            setSchedules(data);
        } catch {
            toast.error('Failed to load schedules');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const { data } = await API.post('/schedules', form);
            toast.success('Class scheduled successfully');
            setSchedules([...schedules, data].sort((a, b) => new Date(a.classDate) - new Date(b.classDate)));
            setShowModal(false);
            setForm({ ...form, title: '', description: '', classDate: '', startTime: '', endTime: '', venue: '', meetingLink: '' });
        } catch (err) {
            toast.error('Failed to create schedule');
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return {
            day: date.getDate().toString().padStart(2, '0'),
            month: date.toLocaleString('default', { month: 'short' }),
            full: date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        };
    };

    return (
        <div className="page-body">
            <Topbar title="Class Schedule" actions={
                isLecturer && (
                    <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
                        + Add Schedule
                    </button>
                )
            } />

            <div className="page-header" style={{ marginTop: '24px' }}>
                <p>Keep track of your upcoming physical and online classes.</p>
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
            ) : schedules.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📅</div>
                    <h3>No Upcoming Classes</h3>
                    <p>Your schedule is clear right now. Enjoy your free time!</p>
                </div>
            ) : (
                <div className="card">
                    <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px' }}>Upcoming Classes</h3>
                    {schedules.map(sched => {
                        const { day, month, full } = formatDate(sched.classDate);
                        return (
                            <div key={sched._id} className="schedule-card">
                                <div className="schedule-date-block">
                                    <div className="day">{day}</div>
                                    <div className="month">{month}</div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h4 style={{ fontSize: '16px', fontWeight: '700' }}>
                                            {!isLecturer && `${sched.course?.courseCode} - `}{sched.title}
                                        </h4>
                                        <span className={`badge ${sched.classType === 'online' ? 'badge-blue' : 'badge-green'}`}>
                                            {sched.classType.toUpperCase()}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '8px' }}>
                                        {full} • {sched.startTime} to {sched.endTime}
                                    </p>
                                    <p style={{ fontSize: '14px', marginBottom: '8px' }}>{sched.description}</p>
                                    {sched.classType === 'online' && sched.meetingLink ? (
                                        <a href={sched.meetingLink} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', fontSize: '12px' }}>
                                            🔗 Join Meeting
                                        </a>
                                    ) : (
                                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>📍 Venue: {sched.venue}</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {showModal && isLecturer && (
                <Modal title="Schedule Class" onClose={() => setShowModal(false)} footer={
                    <button className="btn btn-primary" onClick={handleCreate}>Save Schedule</button>
                }>
                    <div className="form-group">
                        <label className="form-label">Target Course</label>
                        <select className="form-select" value={form.courseId} onChange={e => setForm({ ...form, courseId: e.target.value })}>
                            {courses.map(c => <option key={c._id} value={c._id}>{c.courseCode} - {c.title}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Topic / Title</label>
                        <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                    </div>
                    <div className="form-grid-2">
                        <div className="form-group">
                            <label className="form-label">Date</label>
                            <input type="date" className="form-input" value={form.classDate} onChange={e => setForm({ ...form, classDate: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Type</label>
                            <select className="form-select" value={form.classType} onChange={e => setForm({ ...form, classType: e.target.value })}>
                                <option value="physical">Physical</option>
                                <option value="online">Online / Virtual</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Start Time</label>
                            <input type="time" className="form-input" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">End Time</label>
                            <input type="time" className="form-input" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} required />
                        </div>
                    </div>
                    {form.classType === 'physical' ? (
                        <div className="form-group">
                            <label className="form-label">Venue / Room</label>
                            <input className="form-input" value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} />
                        </div>
                    ) : (
                        <div className="form-group">
                            <label className="form-label">Meeting URL (Zoom/Meet)</label>
                            <input type="url" className="form-input" value={form.meetingLink} onChange={e => setForm({ ...form, meetingLink: e.target.value })} placeholder="https://..." />
                        </div>
                    )}
                    <div className="form-group">
                        <label className="form-label">Brief Description</label>
                        <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What will be covered?" />
                    </div>
                </Modal>
            )}
        </div>
    );
}
