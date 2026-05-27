import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Login({ onViewChange, onSessionUpdate }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        onSessionUpdate(data.session);
      }
    } catch (err) {
      console.error('Erro de login:', err.message);
      // Friendly messages based on standard postgres/supabase auth errors
      if (err.message.includes('Invalid login credentials') || err.message.includes('invalid_credentials')) {
        setErrorMsg('E-mail ou senha incorretos. Verifique suas credenciais.');
      } else if (err.message.includes('Email not confirmed')) {
        setErrorMsg('Por favor, confirme seu e-mail antes de fazer login.');
      } else {
        setErrorMsg('Ocorreu um erro ao tentar fazer login. Tente novamente mais tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand-header">
          <div className="brand-logo-txt">JT</div>
          <div className="brand-subtitle">JT ADVOCACIA</div>
        </div>

        <h2 className="auth-title">Acesse o Sistema</h2>

        {errorMsg && (
          <div className="alert alert-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">E-mail</label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="seuemail@adv.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Senha</label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="auth-footer-links">
          <a className="auth-link" onClick={() => onViewChange('register')}>
            Não tem uma conta? <span>Cadastre-se</span>
          </a>
        </div>
      </div>
    </div>
  );
}
