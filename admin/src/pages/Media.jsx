import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { Container, Row, Col, Card, Button, Table, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FaUpload, FaTrash, FaDownload } from 'react-icons/fa';

function Media() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [eventId, setEventId] = useState('');
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 1,
    currentPage: 1,
    limit: 20
  });

  useEffect(() => {
    fetchMedia();
  }, [pagination.currentPage]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/admin/media?page=${pagination.currentPage}&limit=${pagination.limit}`);
      // Supposons que la réponse soit paginée : { total, pages, currentPage, data }
      const data = response.data;
      setMedia(data.data || []);
      setPagination({
        total: data.total,
        pages: data.pages,
        currentPage: data.currentPage,
        limit: data.limit || pagination.limit
      });
    } catch (err) {
      setError('Erreur de chargement');
      console.error('Erreur chargement médias:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Veuillez sélectionner un fichier');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (eventId) formData.append('event_id', eventId);

    setUploading(true);
    try {
      await API.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Fichier uploadé avec succès');
      setShowUploadModal(false);
      setSelectedFile(null);
      setEventId('');
      fetchMedia();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur upload');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce fichier ?')) return;
    try {
      await API.delete(`/admin/media/${id}`);
      toast.success('Fichier supprimé');
      fetchMedia();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur suppression');
    }
  };

  const downloadFile = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && media.length === 0) return <Spinner animation="border" />;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <Container fluid>
      <h2>Gestion des médias</h2>
      <Button variant="primary" onClick={() => setShowUploadModal(true)} className="mb-3">
        <FaUpload className="me-2" /> Uploader un fichier
      </Button>

      {media.length === 0 ? (
        <Alert variant="info">Aucun média trouvé.</Alert>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>ID</th>
              <th>Fichier</th>
              <th>Nom original</th>
              <th>Type</th>
              <th>Taille (Ko)</th>
              <th>Uploadé par</th>
              <th>Événement</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {media.map(item => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>
                  {item.mimetype?.startsWith('image/') ? (
                    <img src={item.path} alt={item.original_name} style={{ maxHeight: '50px' }} />
                  ) : (
                    <span>{item.filename}</span>
                  )}
                </td>
                <td>{item.original_name}</td>
                <td>{item.mimetype}</td>
                <td>{Math.round(item.size / 1024)}</td>
                <td>{item.uploader?.email}</td>
                <td>{item.event?.title || '-'}</td>
                <td>{new Date(item.createdAt).toLocaleString()}</td>
                <td>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => downloadFile(item.path, item.original_name)}
                    className="me-2"
                  >
                    <FaDownload />
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(item.id)}>
                    <FaTrash />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* Modal d'upload */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Uploader un fichier</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Fichier</Form.Label>
              <Form.Control type="file" onChange={handleFileChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>ID de l'événement (optionnel)</Form.Label>
              <Form.Control
                type="number"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                placeholder="Lier à un événement"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUploadModal(false)}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleUpload} disabled={uploading}>
            {uploading ? 'Upload...' : 'Uploader'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default Media;