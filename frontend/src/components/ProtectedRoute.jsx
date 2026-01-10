import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken } from '../lib/auth';

export default function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const token = getToken();

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
    }
  }, [token, navigate]);

  if (!token) {
    return null; // or a loading spinner
  }

  return children;
}
