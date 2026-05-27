import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function Dashboard({ session, onLogout, theme, onToggleTheme }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    clientes: 0,
    processos: 0,
    compromissos: 0
  });

  useEffect(() => {
    async function loadDashboardData() {
      if (!session?.user) return;
      
      setLoading(true);
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('advogados')
          .select('nome, email, oab')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.warn('Erro ao obter perfil. Pode ser que o trigger ainda esteja executando ou não sincronizou:', profileError.message);
          setProfile({
            nome: session.user.user_metadata?.nome || 'Advogado Associado',
            email: session.user.email,
            oab: session.user.user_metadata?.oab || 'OAB não cadastrada'
          });
        } else {
          setProfile(profileData);
        }

        const [clientsRes, processesRes, appointmentsRes] = await Promise.all([
          supabase.from('clientes').select('id', { count: 'exact', head: true }),
          supabase.from('processos').select('id', { count: 'exact', head: true }),
          supabase.from('compromissos').select('id', { count: 'exact', head: true })
        ]);

        setStats({
          clientes: clientsRes.count || 0,
          processos: processesRes.count || 0,
          compromissos: appointmentsRes.count || 0
        });

      } catch (err) {
        console.error('Erro ao carregar dados do dashboard:', err.message);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [session]);

  const handleLogoutClick = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Erro ao fazer logout:', error.message);
    }
    onLogout();
  };

  if (loading && !profile) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-gold)', fontSize: '1.2rem', fontFamily: 'Cinzel, serif', letterSpacing: '2px' }}>
        Carregando painel de segurança...
      </div>
    );
  }

  const lawyerName = profile?.nome || 'Dr(a). Advogado';
  const lawyerOab = profile?.oab || 'OAB não informada';

  return (
    <div className="dashboard-container">
      {/* Navigation */}
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <span className="nav-logo">JT ADVOCACIA</span>
        </div>
        
        <div className="nav-user">
          {/* Theme Toggle Button inside Navbar */}
          <button 
            className="btn-theme-toggle" 
            onClick={onToggleTheme} 
            type="button"
            title={theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
            style={{ width: '36px', height: '36px', marginRight: '0.5rem' }}
          >
            {theme === 'light' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            )}
          </button>

          <div className="user-badge">
            <span>{lawyerName}</span>
            <span className="oab-text">{lawyerOab}</span>
          </div>
          <button className="btn-outline-gold" onClick={handleLogoutClick}>
            Sair
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Welcome Banner */}
        <section className="welcome-section">
          <h1 className="welcome-title">Bem-vindo, {lawyerName}</h1>
          <p className="welcome-subtitle">Painel de Controle Jurídico Integrado e Seguro</p>
        </section>

        {/* Stats Grid */}
        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Clientes Cadastrados</div>
            <div className="stat-value">{stats.clientes}</div>
            <div className="stat-desc">Clientes vinculados à sua carteira</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-label">Processos Ativos</div>
            <div className="stat-value">{stats.processos}</div>
            <div className="stat-desc">Ações sob seu patrocínio direto</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-label">Compromissos e Prazos</div>
            <div className="stat-value">{stats.compromissos}</div>
            <div className="stat-desc">Agenda ativa para os próximos dias</div>
          </div>
        </section>

        {/* Sections Grid */}
        <section className="sections-grid">
          {/* Processes Panel Skeleton */}
          <div className="card-panel">
            <div className="panel-header">
              <h2 className="panel-title">Gestão de Processos Judiciais</h2>
              <button className="btn-outline-gold" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}>+ Novo Processo</button>
            </div>
            
            <div className="empty-placeholder">
              <div className="empty-icon">⚖️</div>
              <div className="empty-title">Nenhum processo em andamento</div>
              <p className="empty-desc">Todos os dados inseridos aqui são protegidos por Row Level Security e pertencem exclusivamente a você.</p>
            </div>
          </div>

          {/* Agenda Panel Skeleton */}
          <div className="card-panel">
            <div className="panel-header">
              <h2 className="panel-title">Agenda & Compromissos</h2>
              <button className="btn-outline-gold" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}>+ Agendar</button>
            </div>
            
            <div className="empty-placeholder" style={{ padding: '3rem 1rem' }}>
              <div className="empty-icon" style={{ fontSize: '2rem' }}>📅</div>
              <div className="empty-title">Nenhum prazo cadastrado</div>
              <p className="empty-desc" style={{ fontSize: '0.8rem' }}>Adicione audiências, reuniões ou prazos CNJ.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
