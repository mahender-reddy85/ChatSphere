import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, getUser } from '../lib/auth';

export default function ProtectedRoute({ children, requireUsername = false }) {
  const navigate = useNavigate();
  const token = getToken();
  const user = getUser();

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    // If username is required but not set, redirect to setup username
    if (requireUsername && (!user || !user.username)) {
      navigate('/setup-username', { replace: true });
    }
  }, [token, user, navigate, requireUsername]);

  if (!token || (requireUsername && (!user || !user.username))) {
    return null; // or a loading spinner
  }

  return children;
}
