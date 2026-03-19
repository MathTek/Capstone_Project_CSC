import { Menu, X, Sun, Moon, Shield, LogOut, Bell } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { getUserById } from '../services/api';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const notificationRef = useRef<HTMLDivElement>(null);


  const navItems = [
    { id: '/', label: 'Home' },
    { id: '/dashboard', label: 'Dashboard' },
    { id: '/scan-history', label: 'Scan History' },
    { id: '/family-pool', label: 'Family Pool' },
    { id: '/education', label: 'Learn More' },
  ];

  const handleNavigate = (page: string) => {
    navigate(page);
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMenuOpen(false);
  };

  const handleNotificationClick = () => {
    setShowNotifications((prev) => !prev);
    if (!showNotifications) {
      setNotificationCount(0);
    }
  };

  useEffect(() => {
    const userId = parseInt(localStorage.getItem("csc_user_id") || "0");
        const ws = new WebSocket(`ws://localhost:8000/ws/${userId}`);
        ws.onmessage = async (msg) => {
            if (typeof msg.data === "string") {
                if (msg.data.startsWith("family_invite:") && msg.data.includes(`${userId}`)) {
                    const localedate = new Date().toLocaleString();
                    setNotifications((prev) => [...prev, "You have been invited in a family pool. Please check the Family Pool page for details.     " + localedate]);
                    setNotificationCount((prev) => prev + 1);
                }
                if (msg.data.startsWith("family_accept:") && !msg.data.includes(`${userId}`)) {
                  const localedate = new Date().toLocaleString();
                  const user = await getUserById(localStorage.getItem('csc_token'), parseInt(msg.data.split(":")[1]));
                  setNotifications((prev) => [...prev, `A family pool invitation has been accepted by ${user.username}.     ${localedate}`]);
                  setNotificationCount((prev) => prev + 1);
                }
                if ( msg.data.startsWith("family_remove:") && msg.data.includes(`${userId}`) && msg.data.includes("kick")) {
                    const localedate = new Date().toLocaleString();
                    setNotifications((prev) => [...prev, "You have been removed from a family pool.     " + localedate]);
                    setNotificationCount((prev) => prev + 1);
                }
                if ( msg.data.startsWith("family_remove:") && !msg.data.includes(`${userId}`)) {
                  if (msg.data.includes("decline")) {
                    const localedate = new Date().toLocaleString();
                    const user = await getUserById(localStorage.getItem('csc_token'), parseInt(msg.data.split(":")[1]));
                    setNotifications((prev) => [...prev, `A family pool invitation has been declined by ${user.username}.     ${localedate}`]);
                    setNotificationCount((prev) => prev + 1);
                  }
                  if (msg.data.includes("leave")) {
                    const localedate = new Date().toLocaleString();
                    const user = await getUserById(localStorage.getItem('csc_token'), parseInt(msg.data.split(":")[1]));
                    setNotifications((prev) => [...prev, `${user.username} has left the family pool.     ${localedate}`]);
                    setNotificationCount((prev) => prev + 1);
                  }
                }

             }
        };
        return () => ws.close();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
      setNotifications([]);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleNavigate('home')}>
            <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">CyberSafeCheck</span>
          </div>

          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.id
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {item.label}
              </button>
            ))}
            <div className=" dark:border-gray-700 mx-2">
              <div className="relative">
                <button className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={handleNotificationClick} aria-label="Notifications">
                  <Bell className="w-5 h-5" />
                </button>
              </div>
              {notificationCount > 0 && (
                <div className="absolute top-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {notificationCount}
                </div>
              )}
              {showNotifications && (
                <div ref={notificationRef} className="absolute  mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                  <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Notifications</h3>
                    {notifications.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No new notifications.</p>
                    ) : (
                      notifications.map((notification, index) => {
                        const match = notification.match(/(.*?)(\s{3,})([\d\/:,\s]+)$/);
                        if (match) {
                          return (
                            <div key={index} className="mb-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                              <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                                {match[1]}
                                <span className="ml-2 text-blue-600 dark:text-blue-400 font-semibold">{match[3]}</span>
                              </p>
                            </div>
                          );
                        } else {
                          return (
                            <div key={index} className="mb-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                              <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                                {notification}
                              </p>
                            </div>
                          );
                        }
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={toggleTheme}
              className="ml-4 p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="ml-2 p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                aria-label="Logout"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => handleNavigate('/login')}
                className="ml-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium text-sm transition-colors"
              >
                Login
              </button>
            )}
          </div>

          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.id
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {item.label}
              </button>
            ))}
            <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            ) : (
              <button
                onClick={() => handleNavigate('/login')}
                className="w-full text-left px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              >
                Login
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
