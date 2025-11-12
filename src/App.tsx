import { useState } from 'react';
import { HomePage } from './components/HomePage';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';
import { Toaster } from './components/ui/sonner';

type View = 'home' | 'login' | 'dashboard';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('home');

  const handleGetStarted = () => {
    setCurrentView('login');
  };

  const handleLogin = () => {
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setCurrentView('home');
  };

  const handleBackToHome = () => {
    setCurrentView('home');
  };

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
