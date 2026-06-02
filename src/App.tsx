import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import PaginaLogin from "./components/PaginaLogin";
import PaginaProcessos from "./components/PaginaProcessos";
import PaginaContratos from "./components/PaginaContratos";
import PaginaFinanceiro from "./components/PaginaFinanceiro";
import PaginaBiblioteca from "./components/PaginaBiblioteca";
import ManualUsuario from "./components/ManualUsuario";
import AgendaPainel from "./components/AgendaPainel";

/**
 * ── SISTEMA DE ROTAS CENTRALIZADO - JANAINA TARABAUCA ADVOCACIA ──
 * Componente principal de rotas e segurança de visualizações do ecossistema digital.
 */
export const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Rota de Boas-Vindas e Autenticação de Acesso */}
        <Route path="/login" element={<PaginaLogin />} />

        {/* Módulos do Painel Jurídico e Administrativo */}
        <Route path="/processos" element={<PaginaProcessos />} />
        <Route path="/contratos" element={<PaginaContratos />} />
        <Route path="/financeiro" element={<PaginaFinanceiro />} />
        <Route path="/agenda" element={<AgendaPainel />} />
        
        {/* Central de Conhecimento e Acervo (Direito Médico) */}
        <Route path="/biblioteca" element={<PaginaBiblioteca />} />

        {/* Manual de Operação e Diretrizes de Governança */}
        <Route path="/manual" element={<ManualUsuario />} />

        {/* Redirecionamento Padrão de Segurança */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
