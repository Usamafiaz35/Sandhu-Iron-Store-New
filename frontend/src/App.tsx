import { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [username, setUsername] = useState<string>(localStorage.getItem('username') || '');
  const [isVerifying, setIsVerifying] = useState(!!token);

  useEffect(() => {
    const verifyStoredToken = async () => {
      if (!token) {
        setIsVerifying(false);
        return;
      }

      try {
        const response = await fetch('/api/verify-token', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            setUsername(data.user.username || username);
          } else {
            handleLogout();
          }
        } else {
          handleLogout();
        }
      } catch (err) {
        console.error('Failed to verify token:', err);
        // If server is offline, keep the offline session if token exists, or prompt relogin.
        // For security, we allow staying in dashboard if token exists but network is offline.
      } finally {
        setIsVerifying(false);
      }
    };

    verifyStoredToken();
  }, [token]);

  const handleLoginSuccess = (newToken: string, loggedInUsername: string) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('username', loggedInUsername);
    setToken(newToken);
    setUsername(loggedInUsername);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setToken(null);
    setUsername('');
  };

  if (isVerifying) {
    return (
      <div className="auth-wrapper">
        <div className="bg-blobs">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
          <span className="spinner" style={{ width: '40px', height: '40px', borderColor: 'var(--border-color)', borderTopColor: 'var(--primary)', marginBottom: '16px' }}></span>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Verifying Session...</p>
        </div>
      </div>
    );
  }

  return token ? (
    <Dashboard username={username} onLogout={handleLogout} />
  ) : (
    <Login onLoginSuccess={handleLoginSuccess} />
  );
}

export default App;
