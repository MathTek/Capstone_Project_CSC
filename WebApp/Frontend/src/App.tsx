import { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import DashboardInteractive from './pages/DashboardInteractive';
import RiskVisualization from './pages/RiskVisualization';
import Education from './pages/Education';
import Login from './pages/Login';
import Register from './pages/Register';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('home');
  const { isAuthenticated } = useAuth();

  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return <Login onNavigate={setCurrentPage} />;
      case 'register':
        return <Register onNavigate={setCurrentPage} />;
      case 'home':
        return <Home onNavigate={setCurrentPage} />;
      case 'dashboard':
        return (
          <ProtectedRoute onNavigate={setCurrentPage}>
            <DashboardInteractive />
          </ProtectedRoute>
        );
      case 'risks':
        return (
          <ProtectedRoute onNavigate={setCurrentPage}>
            <RiskVisualization />
          </ProtectedRoute>
        );
      case 'education':
        return <Education />;
      default:
        return <Home onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {currentPage !== 'login' && currentPage !== 'register' && (
        <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />
      )}
      {renderPage()}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
