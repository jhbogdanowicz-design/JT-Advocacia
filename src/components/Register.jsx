import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Register({ onViewChange, onSessionUpdate }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [oab, setOab] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Validations
    if (!nome || !email || !password || !confirmPassword) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('As senhas não coincidem. Certifique-se de digitar a mesma senha.');
      return;
    }

    setLoading(true);
    try {
      // Call Supabase Auth SignUp with metadata so that the database trigger handles creation
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome,
            oab: oab || null,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        // Logged in immediately (email confirmation disabled)
        setSuccessMsg('Cadastro realizado com sucesso!');
        setTimeout(() => {
          onSessionUpdate(data.session);
        }, 1500);
      } else if (data.user) {
        // Email confirmation enabled on project
        setSuccessMsg('Cadastro realizado! Por favor, verifique seu e-mail para confirmar a conta e fazer login.');
        setNome('');
        setEmail('');
        setOab('');
        setPassword('');
        setConfirmPassword('');
      } else {
        throw new Error('Falha inesperada no cadastro.');
      }
    } catch (err) {
      console.error('Erro de cadastro:', err.message);
      if (err.message.includes('User already registered') || err.message.includes('already exists')) {
        setErrorMsg('Este e-mail já está cadastrado no sistema.');
      } else {
        setErrorMsg('Ocorreu um erro ao tentar criar a conta: ' + err.message);
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

        <h2 className="auth-title">Crie sua Conta</h2>

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

        {successMsg && (
          <div className="alert alert-success">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-nome">Nome Completo *</label>
            <input
              id="reg-nome"
              type="text"
              className="form-input"
              placeholder="Janaina Tarabauca"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">E-mail *</label>
            <input
              id="reg-email"
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
            <label className="form-label" htmlFor="reg-oab">Número da OAB (Opcional)</label>
            <input
              id="reg-oab"
              type="text"
              className="form-input"
              placeholder="OAB/SP 123456"
              value={oab}
              onChange={(e) => setOab(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Senha * (min. 6 caracteres)</label>
            <input
              id="reg-password"
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

          <div className="form-group">
            <label className="form-label" htmlFor="reg-confirm">Confirmar Senha *</label>
            <input
              id="reg-confirm"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Criando Conta...' : 'Criar Conta'}
          </button>
        </form>

        <div className="auth-footer-links">
          <a className="auth-link" onClick={() => onViewChange('login')}>
            Já tem conta? <span>Faça login</span>
          </a>
        </div>
      </div>
    </div>
  );
}
