import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Topbar from '../components/Topbar';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

export default function Courses() {
    const { user } = useAuth();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('list'); // 'list' for all, 'create' for new course
    const [searchQuery, setSearchQuery] = useState('');

    // form state for creating course
    const [form, setForm] = useState({
        title: '', courseCode: '', description: '', department: '', level: 'All', semester: 'First'
    });

    const isLecturer = user?.role === 'lecturer';

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const endpoint = isLecturer ? '/courses/my-courses' : '/courses/enrolled';
            const { data } = await API.get(endpoint);
            setCourses(data);
        } catch (err) {
            toast.error('Failed to load courses');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCourses(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const { data } = await API.post('/courses', form);
            toast.success('Course created!');
            setCourses([data, ...courses]);
            setShowModal(false);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create');
        }
    };

    // Simple enrollment search placeholder
    const [allOpenCourses, setAllOpenCourses] = useState([]);
    const fetchAllOpen = async () => {
        const { data } = await API.get('/courses');
        setAllOpenCourses(data);
    };

    const handleEnroll = async (courseId) => {
        try {
            await API.post(`/courses/${courseId}/enroll`);
            toast.success('Enrolled successfully');
            fetchCourses();
            setShowModal(false);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to enroll');
        }
    };

    const filteredCourses = courses.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.courseCode.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="page-body">
            <Topbar title="My Courses" actions={
                isLecturer ? (
                    <button className="btn btn-primary btn-sm" onClick={() => { setModalType('create'); setShowModal(true); }}>
                        + Create Course
                    </button>
                ) : (
                    <button className="btn btn-primary btn-sm" onClick={() => { setModalType('enroll'); fetchAllOpen(); setShowModal(true); }}>
                        + Enroll in Course
                    </button>
                )
            } />

            <div className="search-bar" style={{ marginTop: '24px', marginBottom: '24px', maxWidth: '400px' }}>
                🔍 <input placeholder="Search assigned courses..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>

            {loading ? (
                <div className="loading-center"><div className="spinner" /></div>
            ) : filteredCourses.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📂</div>
                    <h3>No Courses Found</h3>
                    <p>You have not been assigned to any courses yet.</p>
                </div>
            ) : (
                <div className="stats-grid">
                    {filteredCourses.map(course => (
                        <div key={course._id} className="card card-sm">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <h3 style={{ fontSize: '15px', fontWeight: '700' }}>{course.title}</h3>
                                <span className="badge badge-blue">{course.courseCode}</span>
                            </div>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                                {isLecturer ? `${course.enrolledStudents?.length || 0} Students enrolled` : `Lecturer: ${course.lecturer?.name || 'Unknown'}`}
                            </p>
                            <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                                <span className="badge badge-gray">{course.Level || course.level} Lvl</span>
                                <span className="badge badge-gray">{course.semester} Sem</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && modalType === 'create' && (
                <Modal title="Create New Course" onClose={() => setShowModal(false)} footer={
                    <button className="btn btn-primary" onClick={handleCreate}>Save Course</button>
                }>
                    <div className="form-group">
                        <label className="form-label">Course Title</label>
                        <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                    </div>
                    <div className="form-grid-2">
                        <div className="form-group">
                            <label className="form-label">Course Code</label>
                            <input className="form-input" value={form.courseCode} onChange={e => setForm({ ...form, courseCode: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Level</label>
                            <select className="form-select" value={form.level} onChange={e => setForm({ ...form, level: e.target.value })}>
                                <option>100</option><option>200</option><option>300</option><option>400</option><option>All</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                    </div>
                </Modal>
            )}

            {showModal && modalType === 'enroll' && (
                <Modal title="Browse & Enroll" onClose={() => setShowModal(false)}>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {allOpenCourses.map(c => (
                            <div key={c._id} className="list-item">
                                <div className="list-item-icon blue">📘</div>
                                <div className="list-item-body">
                                    <div className="list-item-title">{c.title} ({c.courseCode})</div>
                                    <div className="list-item-sub">By {c.lecturer?.name} • {c.department}</div>
                                </div>
                                {!courses.find(myC => myC._id === c._id) ? (
                                    <button className="btn btn-success btn-sm" onClick={() => handleEnroll(c._id)}>Enroll</button>
                                ) : (
                                    <span className="badge badge-green">Enrolled</span>
                                )}
                            </div>
                        ))}
                    </div>
                </Modal>
            )}
        </div>
    );
}
