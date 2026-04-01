import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Topbar from '../components/Topbar';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

export default function Scores() {
    const { user } = useAuth();
    const [courses, setCourses] = useState([]);
    const [scores, setScores] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // Search state (Student)
    const [searchReg, setSearchReg] = useState(user?.regNumber || '');

    // Form state (Lecturer)
    const [form, setForm] = useState({
        courseId: '', regNumber: '', studentName: '', score: '', totalMarks: 100, examType: 'CA', remark: '', semester: 'First'
    });

    const isLecturer = user?.role === 'lecturer';

    useEffect(() => {
        if (isLecturer) {
            API.get('/courses/my-courses').then(({ data }) => {
                setCourses(data);
                if (data.length > 0) {
                    setForm(f => ({ ...f, courseId: data[0]._id }));
                    fetchScoresForLecturer(data[0]._id);
                }
            });
        } else if (searchReg) {
            handleSearch();
        }
    }, [isLecturer]);

    const fetchScoresForLecturer = async (cid) => {
        if (!cid) return;
        setLoading(true);
        try {
            const { data } = await API.get(`/scores/course/${cid}`);
            setScores(data);
        } catch {
            toast.error('Failed to load scores');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        if (!searchReg) return toast.error('Enter a registration number');
        setLoading(true);
        try {
            const { data } = await API.get(`/scores/search?regNumber=${searchReg}`);
            setScores(data);
            if (e) toast.success(`Found ${data.length} results`);
        } catch (err) {
            setScores([]);
            if (e) toast.error(err.response?.data?.message || 'No scores found');
        } finally {
            setLoading(false);
        }
    };

    const handlePost = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const { data } = await API.post('/scores/single', form);
            toast.success('Score posted successfully');
            setScores([data, ...scores]);
            setShowModal(false);
            setForm({ ...form, regNumber: '', studentName: '', score: '', remark: '' });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to post score');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-body">
            <Topbar title={isLecturer ? "Manage Scores" : "Check Results"} actions={
                isLecturer && (
                    <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
                        + Post Score
                    </button>
                )
            } />

            {!isLecturer && (
                <div className="score-search-hero">
                    <h2>Student Result Checker</h2>
                    <p>Enter your registration number to retrieve your CA and Exam scores.</p>
                    <form className="score-search-form" onSubmit={handleSearch}>
                        <input
                            placeholder="e.g. CS/2020/001"
                            value={searchReg}
                            onChange={e => setSearchReg(e.target.value)}
                        />
                        <button className="btn btn-primary" type="submit" disabled={loading}>
                            {loading ? 'Searching...' : 'Check Status'}
                        </button>
                    </form>
                </div>
            )}

            {isLecturer && (
                <div className="page-header" style={{ marginTop: '24px' }}>
                    <p>Post and manage student assessment scores.</p>
                    <div style={{ marginTop: '16px', maxWidth: '300px' }}>
                        <label className="form-label">Filter by Course</label>
                        <select className="form-select" value={form.courseId} onChange={e => {
                            setForm({ ...form, courseId: e.target.value });
                            fetchScoresForLecturer(e.target.value);
                        }}>
                            {courses.map(c => <option key={c._id} value={c._id}>{c.courseCode} - {c.title}</option>)}
                        </select>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="loading-center"><div className="spinner" /></div>
            ) : scores.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">🎯</div>
                    <h3>No Records Found</h3>
                    <p>{isLecturer ? 'No scores posted for this course.' : 'We couldn\'t find any scores linked to this registration number.'}</p>
                </div>
            ) : (
                <div className="card">
                    <table className="table-wrap">
                        <thead>
                            <tr>
                                <th>Course</th>
                                <th>Reg No.</th>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Score</th>
                                <th>Grade</th>
                                {isLecturer && <th>Action</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {scores.map(s => (
                                <tr key={s._id}>
                                    <td style={{ fontWeight: '600' }}>{s.course?.courseCode}</td>
                                    <td><span className="badge badge-gray">{s.regNumber}</span></td>
                                    <td>{s.studentName}</td>
                                    <td>{s.examType}</td>
                                    <td>
                                        <span style={{ fontWeight: '800', fontSize: '16px' }}>
                                            {s.score} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/ {s.totalMarks}</span>
                                        </span>
                                    </td>
                                    <td><span className={`grade-${s.grade}`}>{s.grade}</span></td>
                                    {isLecturer && (
                                        <td>
                                            <button className="btn btn-icon">🗑</button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && isLecturer && (
                <Modal title="Post Student Score" onClose={() => setShowModal(false)} footer={
                    <button className="btn btn-primary" onClick={handlePost} disabled={loading}>
                        {loading ? 'Posting...' : 'Save Record'}
                    </button>
                }>
                    <div className="form-group">
                        <label className="form-label">Target Course</label>
                        <select className="form-select" value={form.courseId} onChange={e => setForm({ ...form, courseId: e.target.value })}>
                            {courses.map(c => <option key={c._id} value={c._id}>{c.courseCode} - {c.title}</option>)}
                        </select>
                    </div>
                    <div className="form-grid-2">
                        <div className="form-group">
                            <label className="form-label">Registration Number</label>
                            <input className="form-input" value={form.regNumber} onChange={e => setForm({ ...form, regNumber: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Student Name</label>
                            <input className="form-input" value={form.studentName} onChange={e => setForm({ ...form, studentName: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Exam Type</label>
                            <select className="form-select" value={form.examType} onChange={e => setForm({ ...form, examType: e.target.value })}>
                                <option value="CA">Continuous Assessment (CA)</option>
                                <option value="Test 1">Test 1</option>
                                <option value="Mid-Semester">Mid-Semester</option>
                                <option value="Assignment">Assignment</option>
                                <option value="Final Exam">Final Exam</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Total Marks Obtainable</label>
                            <input type="number" className="form-input" value={form.totalMarks} onChange={e => setForm({ ...form, totalMarks: e.target.value })} min="1" required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Score Attained</label>
                            <input type="number" className="form-input" value={form.score} onChange={e => setForm({ ...form, score: e.target.value })} min="0" required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Semester</label>
                            <select className="form-select" value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })}>
                                <option value="First">First Semester</option>
                                <option value="Second">Second Semester</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Lecturer Remark</label>
                        <input className="form-input" value={form.remark} onChange={e => setForm({ ...form, remark: e.target.value })} placeholder="e.g. Excellent performance" />
                    </div>
                </Modal>
            )}
        </div>
    );
}
