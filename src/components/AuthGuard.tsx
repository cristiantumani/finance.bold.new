import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user is not verified, redirect to verification page
  if (!user.email_confirmed_at) {
    return <Navigate to={`/verify?email=${encodeURIComponent(user.email!)}`} replace />;
  }

  return <>{children}</>;
}