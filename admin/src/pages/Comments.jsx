import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../admin/src/contexts/AuthContext';
import API from '../../src/services/api';
import { Table, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { FaTrash, FaStar, FaRegStar } from 'react-icons/fa';
import { toast } from 'react-toastify';

function Comments() {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      const response = await API.get('/admin/comments');
      setComments(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = async (commentId, currentHidden) => {
    try {
      await API.put(`/admin/comments/${commentId}/hide`, { hidden: !currentHidden });
      toast.success(`Commentaire ${!currentHidden ? 'masqué' : 'affiché'}`);
      fetchComments();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const toggleFeatured = async (commentId, currentFeatured) => {
    try {
      await API.put(`/admin/comments/${commentId}/featured`, { featured: !currentFeatured });
      toast.success(currentFeatured ? 'Retiré des vedettes' : 'Mis en vedette');
      fetchComments();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const deleteComment = async (commentId) => {
    if (!window.confirm('Supprimer définitivement ce commentaire ?')) return;
    try {
      await API.delete(`/admin/comments/${commentId}`);
      toast.success('Commentaire supprimé');
      fetchComments();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  if (loading) return <Spinner animation="border" />;
  if (error) return <Alert variant="danger">{error}</Alert>;

  const isSuperAdmin = user?.role === 'superadmin';

  return (
    <div>
      <h2>Gestion des commentaires</h2>
      {comments.length === 0 ? (
        <Alert variant="info">Aucun commentaire trouvé.</Alert>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>ID</th>
              <th>Auteur</th>
              <th>Cible</th>
              <th>Commentaire</th>
              <th>Statut</th>
              <th>Vedette</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {comments.map(comment => (
              <tr key={comment.id}>
                <td>{comment.id}</td>
                <td>{comment.author?.email || comment.author?.name || 'Inconnu'}</td>
                <td>
                  {comment.target ? (
                    <>
                      {comment.target_type === 'Event' ? 'Événement : ' : 'Article : '}
                      {comment.target.title}
                    </>
                  ) : (
                    'N/A'
                  )}
                </td>
                <td>{comment.content}</td>
                <td>
                  <Badge bg={comment.hidden ? 'secondary' : 'success'}>
                    {comment.hidden ? 'Masqué' : 'Visible'}
                  </Badge>
                </td>
                <td>
                  {isSuperAdmin && (
                    <Button
                      variant="link"
                      className="p-0 me-2"
                      onClick={() => toggleFeatured(comment.id, comment.featured)}
                    >
                      {comment.featured ? (
                        <FaStar style={{ color: '#f97316' }} />
                      ) : (
                        <FaRegStar style={{ color: '#6c757d' }} />
                      )}
                    </Button>
                  )}
                </td>
                <td>
                  {isSuperAdmin && (
                    <>
                      <Button
                        size="sm"
                        variant={comment.hidden ? 'success' : 'warning'}
                        className="me-2"
                        onClick={() => toggleVisibility(comment.id, comment.hidden)}
                      >
                        {comment.hidden ? 'Afficher' : 'Masquer'}
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => deleteComment(comment.id)}
                      >
                        <FaTrash />
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}

export default Comments;