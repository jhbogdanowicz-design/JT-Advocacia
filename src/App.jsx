import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';

export default function App() {
  const [session, setSession] = useState(null);
  const [view, setView] = useState('login'); // 'login' | 'register' | 'dashboard'
  const [loading, setLoading] = useState(true);
  
  // Theme state: default to 'dark' or loaded from local storage
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  // Apply theme class to document body
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Fetch active session on mount
  useEffect(() => {
    async function initSession() {
      try {
        const { data: { session: activeSession }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (activeSession) {
          setSession(activeSession);
          setView('dashboard');
        } else {
          setSession(null);
          setView('login');
        }
      } catch (err) {
        console.error('Erro ao recuperar sessão:', err.message);
      } finally {
        setLoading(false);
      }
    }

    initSession();

    // Listen to real-time auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      if (currentSession) {
        setView('dashboard');
      } else {
        setView('login');
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSessionUpdate = (newSession) => {
    setSession(newSession);
    if (newSession) {
      setView('dashboard');
    }
  };

  const handleLogout = () => {
    setSession(null);
    setView('login');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#0A192F', color: '#C5A880', fontSize: '1.2rem', fontFamily: 'Cinzel, serif', letterSpacing: '2px' }}>
        Verificando credenciais...
      </div>
    );
  }

  // Routing Logic with Theme variables passed down
  if (session) {
    return <Dashboard session={session} onLogout={handleLogout} theme={theme} onToggleTheme={toggleTheme} />;
  }

  if (view === 'register') {
    return <Register onViewChange={setView} onSessionUpdate={handleSessionUpdate} theme={theme} onToggleTheme={toggleTheme} />;
  }

  return <Login onViewChange={setView} onSessionUpdate={handleSessionUpdate} theme={theme} onToggleTheme={toggleTheme} />;
}
