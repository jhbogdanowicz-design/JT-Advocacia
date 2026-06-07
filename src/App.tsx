import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import PortalCliente from "./components/PortalCliente"; // Importação do novo componente
import EspecialidadesHome from "../EspecialidadesHome"; // Suas seções atuais

export default function App() {
  // Estado para controlar se exibe o site público ou a Área do Cliente
  const [exibirPortal, setExibirPortal] = useState(window.location.pathname === "/portal");

  useEffect(() => {
    // Sincroniza o estado com a URL do navegador
    const handlePopState = () => {
      const isPortal = window.location.pathname === "/portal";
      setExibirPortal(isPortal);
      if (isPortal) {
        document.documentElement.classList.add("route-portal");
      } else {
        document.documentElement.classList.remove("route-portal");
      }
    };

    window.addEventListener("popstate", handlePopState);
    
    // Executa no carregamento inicial da página
    handlePopState();

    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const voltarParaSitePublico = () => {
    window.history.pushState({}, "", "/");
    setExibirPortal(false);
    document.documentElement.classList.remove("route-portal");
    // Despacha evento popstate para garantir sincronização global
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 transition-colors duration-200">
      {/* ── PORTAL DO CLIENTE (SEMPRE MONTADO EM SEGUNDO PLANO PARA PRÉ-CARREGAMENTO) ── */}
      <div className={exibirPortal ? "block animate-fade-in relative" : "hidden"}>
        {/* Botão de escape flutuante no topo direito para voltar ao site público */}
        <div className="absolute top-4 right-4 z-50">
          <button 
            onClick={voltarParaSitePublico}
            className="text-[10px] font-bold text-slate-400 hover:text-[#0f1e36] dark:hover:text-[#d4af37] uppercase tracking-wider bg-white dark:bg-[#111c30] hover:bg-slate-100 dark:hover:bg-[#18263f] border border-slate-200 dark:border-[#d4af37]/20 px-3 py-1.5 rounded-lg shadow-sm transition-all"
          >
            ← Voltar ao site principal
          </button>
        </div>
        
        {/* Renderiza o Portal do Cliente */}
        <PortalCliente transacaoId="ID-TESTE-123" areaInteresse="Consumidor" onSucessoFaturamento={() => {}} />
      </div>

      {/* ── SITE INSTITUCIONAL PÚBLICO ── */}
      <div className={exibirPortal ? "hidden" : "block"}>
        {/* Passamos as funções de abrir o portal e área restrita para a Navbar */}
        <Navbar 
          onAcessarPortalCliente={() => {
            window.history.pushState({}, "", "/portal");
            setExibirPortal(true);
            document.documentElement.classList.add("route-portal");
            window.dispatchEvent(new PopStateEvent("popstate"));
          }} 
          onAcessarAreaRestrita={() => {
            window.history.pushState({}, "", "/");
            setExibirPortal(false);
            document.documentElement.classList.remove("route-portal");
            window.dispatchEvent(new PopStateEvent("popstate"));
            if (typeof (window as any).switchPublicView === "function") {
              (window as any).switchPublicView("login");
            }
          }}
        />
        {/* Suas seções atuais do site institucional público */}
        <EspecialidadesHome />
      </div>
    </div>
  );
}
