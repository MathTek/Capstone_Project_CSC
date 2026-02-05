import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  onNavigate: (page: string) => void;
}

export default function ProtectedRoute({ children, onNavigate }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    onNavigate('login');
    return null;
  }

  return <>{children}</>;
}
