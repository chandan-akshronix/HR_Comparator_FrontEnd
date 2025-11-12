import { useState, useEffect } from 'react';
import { HomePage } from './components/HomePage';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';
import { Toaster } from './components/ui/sonner';
import { getAuthToken, clearAuthToken } from './services/api';

type View = 'home' | 'login' | 'dashboard';

export default function App() {
  // Check if user is already logged in on mount
  const [currentView, setCurrentView] = useState<View>(() => {
    const token = getAuthToken();
    return token ? 'dashboard' : 'home';
  });
  const [isLoading, setIsLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const verifyAuth = async () => {
      const token = getAuthToken();
      
      if (token) {
        // Optional: Verify token is still valid with backend
        try {
          // You can add a /auth/verify endpoint to check token validity
          // For now, we'll just trust the token exists
          setCurrentView('dashboard');
        } catch (error) {
          console.error('Token validation failed:', error);
          clearAuthToken();
          setCurrentView('home');
        }
      }
      
      setIsLoading(false);
    };

    verifyAuth();
  }, []);

  const handleGetStarted = () => {
    setCurrentView('login');
  };

  const handleLogin = () => {
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    clearAuthToken(); // Clear token from localStorage
    setCurrentView('home');
  };

  const handleBackToHome = () => {
    setCurrentView('home');
  };

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {currentView === 'home' && (
        <HomePage onGetStarted={handleGetStarted} onLogin={() => setCurrentView('login')} />
      )}
      {currentView === 'login' && (
        <LoginPage onLogin={handleLogin} onBackToHome={handleBackToHome} />
      )}
      {currentView === 'dashboard' && (
        <Dashboard onLogout={handleLogout} />
      )}
      <Toaster />
    </div>
  );
}
