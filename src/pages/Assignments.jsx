import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Topbar from '../components/Topbar';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

export default function Assignments() {
    const { user } = useAuth();
    const [courses, setCourses] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [totalMarks, setTotalMarks] = useState(100);
    const [courseId, setCourseId] = useState('');
    const [file, setFile] = useState(null);

    const isLecturer = user?.role === 'lecturer';

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                if (isLecturer) {
                    const res = await API.get('/courses/my-courses');
                    setCourses(res.data);
                    if (res.data.length > 0) {
                        setCourseId(res.data[0]._id);
                        const assignRes = await API.get(`/assignments/course/${res.data[0]._id}`);
                        setAssignments(assignRes.data);
                    }
                } else {
                    const assignRes = await API.get('/assignments/my-feed');
                    setAssignments(assignRes.data);
                }
            } catch (err) {
                toast.error('Failed to load assignments');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [isLecturer]);

    const handleCourseChange = async (cid) => {
        setCourseId(cid);
        if (!cid) return;
        setLoading(true);
        try {
            const { data } = await API.get(`/assignments/course/${cid}`);
            setAssignments(data);
        } catch {
            toast.error('Failed to switch course');
        } finally {
            setLoading(false);
        }
    };

    const handlePost = async (e) => {
        e.preventDefault();
        if (!courseId || !title || !dueDate) return toast.error('Please fill required fields');

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('dueDate', dueDate);
        formData.append('totalMarks', totalMarks);
        formData.append('courseId', courseId);
        if (file) formData.append('attachment', file);

        try {
            setLoading(true);
            await API.post('/assignments', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success('Assignment posted!');
            setShowModal(false);

            // Reset form
            setTitle(''); setDescription(''); setDueDate(''); setTotalMarks(100); setFile(null);
            handleCourseChange(courseId);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to post assignment');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (id, fileName) => {
        try {
            const res = await API.get(`/assignments/download/${id}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            toast.error('Failed to download attachment');
        }
    };

    return (
        <div className="page-body">
            <Topbar title="Assignments" actions={
                isLecturer && (
                    <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
                        + Post Assignment
                    </button>
                )
            } />

            <div className="page-header" style={{ marginTop: '24px' }}>
                <p>Review, download, and track your coursework submissions.</p>
                {isLecturer && (
                    <div style={{ marginTop: '16px', maxWidth: '300px' }}>
                        <label className="form-label">Filter by Course</label>
                        <select className="form-select" value={courseId} onChange={e => handleCourseChange(e.target.value)}>
                            {courses.map(c => <option key={c._id} value={c._id}>{c.courseCode} - {c.title}</option>)}
                        </select>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="loading-center"><div className="spinner" /></div>
            ) : assignments.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📝</div>
                    <h3>No Pending Assignments</h3>
                    <p>You have no active assignments for this course. Enjoy the free time!</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                    {assignments.map(ass => {
                        const isOverdue = new Date(ass.dueDate) < new Date();
                        return (
                            <div key={ass._id} className="card" style={{ borderTop: `4px solid ${isOverdue ? 'var(--danger)' : 'var(--primary)'}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: '800' }}>{ass.title}</h3>
                                    <span className={`badge ${isOverdue ? 'badge-red' : 'badge-amber'}`}>
                                        {isOverdue ? 'OVERDUE' : `${ass.totalMarks} Marks`}
                                    </span>
                                </div>
                                {!isLecturer && (
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                                        Course: {ass.course?.courseCode} - By {ass.postedBy?.name}
                                    </p>
                                )}
                                <div style={{ marginBottom: '16px' }}>
                                    <p style={{ fontSize: '13px', fontWeight: '600', color: isOverdue ? 'var(--danger)' : 'var(--success)' }}>
                                        ⏰ Due: {new Date(ass.dueDate).toLocaleDateString()} at {new Date(ass.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                <p style={{ fontSize: '14px', color: 'var(--text)', whiteSpace: 'pre-wrap', marginBottom: '16px' }}>
                                    {ass.description}
                                </p>
                                {ass.attachmentPath && (
                                    <button className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => handleDownload(ass._id, ass.attachmentName)}>
                                        ⬇ Download Attachment
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {showModal && isLecturer && (
                <Modal title="Post New Assignment" onClose={() => setShowModal(false)} footer={
                    <button className="btn btn-primary" onClick={handlePost} disabled={loading}>
                        {loading ? 'Posting...' : 'Post Assignment'}
                    </button>
                }>
                    <div className="form-group">
                        <label className="form-label">Target Course</label>
                        <select className="form-select" value={courseId} onChange={e => setCourseId(e.target.value)}>
                            {courses.map(c => <option key={c._id} value={c._id}>{c.courseCode} - {c.title}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Title</label>
                        <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} required />
                    </div>
                    <div className="form-grid-2">
                        <div className="form-group">
                            <label className="form-label">Due Date & Time</label>
                            <input type="datetime-local" className="form-input" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Total Marks</label>
                            <input type="number" className="form-input" value={totalMarks} onChange={e => setTotalMarks(e.target.value)} min="1" required />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description / Instructions</label>
                        <textarea className="form-textarea" value={description} onChange={e => setDescription(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Attachment (Optional PDF/Word)</label>
                        <div className={`file-upload-area ${file ? 'has-file' : ''}`}>
                            <input type="file" id="assignFile" onChange={e => setFile(e.target.files[0])} style={{ display: 'none' }} />
                            <label htmlFor="assignFile" style={{ cursor: 'pointer', display: 'block', width: '100%', height: '100%' }}>
                                <div style={{ fontSize: '24px', marginBottom: '8px' }}>📎</div>
                                {file ? <strong>{file.name}</strong> : 'Click to browse or drag attachment'}
                            </label>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
