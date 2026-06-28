import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function ViewerRoute({ children }) {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  return children;
}
