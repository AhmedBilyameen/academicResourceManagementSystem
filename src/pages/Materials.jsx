import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Topbar from '../components/Topbar';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

export default function Materials() {
    const { user } = useAuth();
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [materials, setMaterials] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState(null);

    const isLecturer = user?.role === 'lecturer';

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const endpoint = isLecturer ? '/courses/my-courses' : '/courses/enrolled';
                const { data } = await API.get(endpoint);
                setCourses(data);
                if (data.length > 0) {
                    setSelectedCourse(data[0]._id);
                    fetchMaterials(data[0]._id);
                }
            } catch (err) {
                toast.error('Failed to load courses');
            }
        };
        fetchCourses();
    }, [isLecturer]);

    const fetchMaterials = async (courseId) => {
        if (!courseId) return;
        setLoading(true);
        try {
            const { data } = await API.get(`/materials/course/${courseId}`);
            setMaterials(data);
        } catch (err) {
            toast.error('Failed to load materials');
        } finally {
            setLoading(false);
        }
    };

    const handleCourseChange = (e) => {
        const cid = e.target.value;
        setSelectedCourse(cid);
        fetchMaterials(cid);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return toast.error('Please select a file');

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('courseId', selectedCourse);
        formData.append('file', file);

        try {
            setLoading(true);
            await API.post('/materials', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success('Material uploaded successfully');
            setShowModal(false);
            setFile(null);
            setTitle('');
            setDescription('');
            fetchMaterials(selectedCourse);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Upload failed');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (id, fileName) => {
        try {
            const res = await API.get(`/materials/download/${id}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            toast.error('Download failed');
        }
    };

    return (
        <div className="page-body">
            <Topbar title="Learning Materials" actions={
                isLecturer && (
                    <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
                        + Upload Material
                    </button>
                )
            } />

            <div className="page-header" style={{ marginTop: '24px' }}>
                <p>Access lecture notes, past questions, and study guides.</p>
                <div style={{ marginTop: '16px', maxWidth: '300px' }}>
                    <label className="form-label">Select Course</label>
                    <select className="form-select" value={selectedCourse} onChange={handleCourseChange}>
                        {courses.map(c => <option key={c._id} value={c._id}>{c.courseCode} - {c.title}</option>)}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="loading-center"><div className="spinner" /></div>
            ) : materials.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📂</div>
                    <h3>No Materials Found</h3>
                    <p>No resources have been uploaded for this course yet.</p>
                </div>
            ) : (
                <div className="card">
                    <table className="table-wrap">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Description</th>
                                <th>File Type</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {materials.map(m => (
                                <tr key={m._id}>
                                    <td style={{ fontWeight: '600' }}>{m.title}</td>
                                    <td>{m.description || '-'}</td>
                                    <td><span className="badge badge-amber">{m.fileName.split('.').pop().toUpperCase()}</span></td>
                                    <td>{new Date(m.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <button className="btn btn-secondary btn-sm" onClick={() => handleDownload(m._id, m.fileName)}>
                                            ⬇ Download
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && isLecturer && (
                <Modal title="Upload New Material" onClose={() => setShowModal(false)} footer={
                    <button className="btn btn-primary" onClick={handleUpload} disabled={loading}>
                        {loading ? 'Uploading...' : 'Upload File'}
                    </button>
                }>
                    <div className="form-group">
                        <label className="form-label">Title</label>
                        <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description (Optional)</label>
                        <textarea className="form-textarea" value={description} onChange={e => setDescription(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Select File (PDF, DOCX, PPT)</label>
                        <div className={`file-upload-area ${file ? 'has-file' : ''}`}>
                            <input type="file" id="file" onChange={e => setFile(e.target.files[0])} style={{ display: 'none' }} />
                            <label htmlFor="file" style={{ cursor: 'pointer', display: 'block', width: '100%', height: '100%' }}>
                                <div style={{ fontSize: '24px', marginBottom: '8px' }}>📄</div>
                                {file ? <strong>{file.name}</strong> : 'Click to browse or drag and drop file here'}
                            </label>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
