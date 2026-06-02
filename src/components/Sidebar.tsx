import React, { useState } from "react";
import { ModalManual } from "./ModalManual";

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  user?: {
    name: string;
    oab: string;
    avatar?: string;
  };
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  user = { name: "Dra. Janaina Tarabauca", oab: "OAB/SP 123.456" },
  onLogout
}) => {
  const [manualAberto, setManualAberto] = useState(false);
  const menuItems = [
    {
      id: "clientes",
      label: "Prontuário de Clientes",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    },
    {
      id: "contratos",
      label: "Gestão de Contratos",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <path d="M12 9H8" />
        </svg>
      )
    },
    {
      id: "processos",
      label: "Processos",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      )
    },
    {
      id: "financeiro",
      label: "Financeiro",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      )
    },
    {
      id: "agenda",
      label: "Agenda",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      )
    },
    {
      id: "dashboard",
      label: "Dashboard",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      )
    }
  ];

  return (
    <aside className="w-64 bg-[#0b1625] text-slate-100 flex flex-col h-screen border-r border-[#d4af37]/20 shrink-0 print:hidden font-sans">
      {/* LOGO — IDENTIDADE PREMIUM */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#d4af37]/15">
        <div className="bg-white rounded-lg border border-[#d4af37]/50 flex items-center justify-center shadow-md shrink-0 overflow-hidden" style={{width: 44, height: 44}}>
          <img
            src="/logo-jt.png"
            alt="Logo Janaina Tarabauca Advogados"
            className="w-full h-full object-contain p-0.5"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = "flex";
            }}
          />
          <span
            className="font-playfair font-extrabold text-[#0f1e36] text-base hidden items-center justify-center w-full h-full"
            aria-hidden="true"
          >
            JT
          </span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[11px] font-extrabold tracking-widest text-slate-100 uppercase leading-tight truncate">
            Janaina Tarabauca
          </span>
          <span className="text-[9px] font-bold tracking-wider text-[#d4af37] uppercase mt-0.5">
            Advocacia
          </span>
        </div>
      </div>

      {/* LINKS DE NAVEGAÇÃO */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {menuItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                isActive
                  ? "bg-[#d4af37] text-[#0f1e36] shadow-md shadow-[#d4af37]/20 font-bold"
                  : "text-slate-400 hover:bg-slate-900/30 hover:text-slate-200"
              }`}
            >
              <span className={`shrink-0 ${isActive ? "text-[#0f1e36]" : "text-[#d4af37]"}`}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* FOOTER USER / LOGOUT */}
      <div className="p-4 border-t border-[#d4af37]/15 space-y-3">
        <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-slate-900/20 transition-colors">
          <div className="w-9 h-9 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center font-bold text-xs text-[#d4af37]">
            {user.avatar || user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col truncate">
            <span className="text-xs font-bold text-slate-200 truncate">{user.name}</span>
            <span className="text-[9px] text-slate-500 truncate font-mono">{user.oab}</span>
          </div>
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Sair</span>
          </button>
        )}

        {/* Divisória e link discreto do Manual no Rodapé */}
        <div className="pt-2 mt-2 border-t border-[#d4af37]/15 print:hidden">
          <button 
            type="button"
            onClick={() => setManualAberto(true)} 
            className="w-full text-left text-[11px] text-slate-400 hover:text-[#d4af37] transition-all py-1.5 px-3 uppercase tracking-wider font-bold flex items-center gap-2 cursor-pointer"
          >
            <span>❓ Manual do Usuário (PDF)</span>
          </button>
        </div>
      </div>

      {/* Render do Modal */}
      <ModalManual isOpen={manualAberto} onClose={() => setManualAberto(false)} />
    </aside>
  );
};
