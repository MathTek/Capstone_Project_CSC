import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import DashboardInteractive from './pages/DashboardInteractive';
import RiskVisualization from './pages/RiskVisualization';
import Education from './pages/Education';
import Login from './pages/Login';
import Register from './pages/Register';
import ScanHistory from './pages/ScanHistory';
import ScanDetails from './pages/ScanDetails';

function AppContent() {
  const location = useLocation();
  const hideNavigation = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {!hideNavigation && <Navigation />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardInteractive />
            </ProtectedRoute>
          }
        />
        <Route
          path="/scan-history"
          element={
            <ProtectedRoute>
              <ScanHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/risks"
          element={
            <ProtectedRoute>
              <RiskVisualization />
            </ProtectedRoute>
          }
        />
        <Route
          path="/scan/:id"
          element={
            <ProtectedRoute>
              <ScanDetails />
            </ProtectedRoute>
          }
        />
        <Route path="/education" element={<Education />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
