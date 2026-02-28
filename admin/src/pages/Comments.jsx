import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { Table, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';

function Comments() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      const response = await API.get('/admin/comments');
      // La réponse peut être un tableau direct ou un objet avec data
      const commentsData = response.data?.data || response.data;
      setComments(Array.isArray(commentsData) ? commentsData : []);
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

  if (loading) return <Spinner animation="border" />;
  if (error) return <Alert variant="danger">{error}</Alert>;

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
              <th>Événement</th>
              <th>Commentaire</th>
              <th>Note</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {comments.map(comment => (
              <tr key={comment.id}>
                <td>{comment.id}</td>
                <td>{comment.user?.email}</td>
                <td>{comment.event?.title}</td>
                <td>{comment.content}</td>
                <td>{comment.rating} / 5</td>
                <td>
                  <Badge bg={comment.hidden ? 'secondary' : 'success'}>
                    {comment.hidden ? 'Masqué' : 'Visible'}
                  </Badge>
                </td>
                <td>
                  <Button 
                    size="sm" 
                    variant={comment.hidden ? 'success' : 'warning'} 
                    onClick={() => toggleVisibility(comment.id, comment.hidden)}
                  >
                    {comment.hidden ? 'Afficher' : 'Masquer'}
                  </Button>
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