import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";

// Interfaces Tipadas
export interface ClienteRef {
  nome: string;
  whatsapp?: string;
}

export interface ProcessoRef {
  numero_processo: string;
  titulo: string;
}

export interface AnotacoesMetadata {
  plataforma?: "google_meet" | "teams" | "zoom" | "outro";
  online?: boolean;
  anotacoes?: string;
}

export interface Compromisso {
  id: string;
  advogado_id: string;
  cliente_id?: string;
  processo_id?: string;
  titulo: string;
  tipo: "Audiência" | "Reunião" | "Reunião Online" | "Atendimento Presencial" | "Atendimento" | "Prazo Processual";
  data_hora: string;
  local_link?: string;
  status: "Agendado" | "Realizado" | "Cancelado";
  anotacoes_pos_evento?: string;
  created_at: string;
  // Propriedades unidas via Supabase Joins
  clientes?: ClienteRef | null;
  processos?: ProcessoRef | null;
}

type ViewMode = "calendar" | "status";
type CalendarTab = "month" | "week";

export const AgendaPainel: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [calendarTab, setCalendarTab] = useState<CalendarTab>("month");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  const [compromissos, setCompromissos] = useState<Compromisso[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Para filtros adicionais rápidos
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  
  // Buscar compromissos do Supabase
  const fetchCompromissos = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuário não autenticado. Por favor, faça login.");
      }

      const { data, error: fetchErr } = await supabase
        .from("compromissos")
        .select(`
          id,
          advogado_id,
          cliente_id,
          processo_id,
          titulo,
          tipo,
          data_hora,
          local_link,
          status,
          anotacoes_pos_evento,
          created_at,
          clientes ( nome, whatsapp ),
          processos ( numero_processo, titulo )
        `)
        .eq("advogado_id", user.id)
        .order("data_hora", { ascending: true });

      if (fetchErr) throw fetchErr;

      const list: Compromisso[] = (data || []).map((item: any) => {
        const clientesObj = Array.isArray(item.clientes) ? item.clientes[0] : item.clientes;
        const processosObj = Array.isArray(item.processos) ? item.processos[0] : item.processos;
        
        return {
          ...item,
          clientes: clientesObj || null,
          processos: processosObj || null
        };
      });

      setCompromissos(list);
    } catch (err: any) {
      console.error("Erro ao carregar compromissos:", err.message);
      setError(err.message || "Erro desconhecido ao carregar compromissos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompromissos();
  }, []);

  // Handler para cumprir compromisso
  const handleMarcarComoRealizado = async (id: string) => {
    try {
      const { error: patchError } = await supabase
        .from("compromissos")
        .update({ status: "Realizado" })
        .eq("id", id);

      if (patchError) throw patchError;
      
      setCompromissos(prev =>
        prev.map(c => c.id === id ? { ...c, status: "Realizado" } : c)
      );
    } catch (err: any) {
      alert("Erro ao atualizar o status: " + err.message);
    }
  };

  // Handler para cancelar compromisso
  const handleCancelarCompromisso = async (id: string) => {
    if (!window.confirm("Deseja realmente cancelar este compromisso?")) return;
    try {
      const { error: patchError } = await supabase
        .from("compromissos")
        .update({ status: "Cancelado" })
        .eq("id", id);

      if (patchError) throw patchError;

      setCompromissos(prev =>
        prev.map(c => c.id === id ? { ...c, status: "Cancelado" } : c)
      );
    } catch (err: any) {
      alert("Erro ao cancelar o compromisso: " + err.message);
    }
  };

  const parseMetadata = (anotacoes?: string): AnotacoesMetadata => {
    if (!anotacoes) return {};
    if (anotacoes.startsWith("{") && anotacoes.endsWith("}")) {
      try {
        return JSON.parse(anotacoes);
      } catch {
        return {};
      }
    }
    return {};
  };

  const formatarHora = (dataStr: string) => {
    const d = new Date(dataStr);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  // ==========================================
  // CONFIGURAÇÃO DOS FORMATOS VISUAIS E CORES
  // ==========================================
  const obterEstiloPorTipo = (tipo: string) => {
    const t = tipo.toLowerCase();
    if (t.includes("audiência") || t.includes("audiencia")) {
      return {
        borderClass: "border-l-4 border-red-500",
        bgClass: "bg-red-50 hover:bg-red-100/50 border border-red-200 text-red-700",
        textClass: "text-red-700",
        badge: "🔴 Audiência"
      };
    } else if (t.includes("prazo")) {
      return {
        borderClass: "border-l-4 border-[#d4af37]",
        bgClass: "bg-amber-50 hover:bg-amber-100/50 border border-amber-200 text-amber-800",
        textClass: "text-amber-800",
        badge: "⚜️ Prazo Processual"
      };
    } else {
      return {
        borderClass: "border-l-4 border-blue-500",
        bgClass: "bg-blue-50 hover:bg-blue-100/50 border border-blue-200 text-blue-700",
        textClass: "text-blue-700",
        badge: "🔵 Reunião / Atendimento"
      };
    }
  };

  // Filtro rápido de tipo
  const compromissosFiltrados = useMemo(() => {
    if (filtroTipo === "todos") return compromissos;
    return compromissos.filter(c => {
      const estilo = obterEstiloPorTipo(c.tipo);
      if (filtroTipo === "audiencia") return estilo.badge.includes("Audiência");
      if (filtroTipo === "prazo") return estilo.badge.includes("Prazo");
      if (filtroTipo === "reuniao") return estilo.badge.includes("Reunião");
      return true;
    });
  }, [compromissos, filtroTipo]);

  // ==========================================
  // LOGICA E COMPONENTES DAS COLUNAS DE STATUS
  // ==========================================
  const columnsStatus = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const pendentes: Compromisso[] = [];
    const emAndamento: Compromisso[] = [];
    const concluidos: Compromisso[] = [];

    compromissosFiltrados.forEach(c => {
      if (c.status === "Realizado") {
        concluidos.push(c);
      } else if (c.status === "Cancelado") {
        concluidos.push(c);
      } else {
        const dataComp = new Date(c.data_hora);
        const dataCompZero = new Date(dataComp);
        dataCompZero.setHours(0, 0, 0, 0);

        if (dataCompZero.getTime() === hoje.getTime()) {
          emAndamento.push(c);
        } else {
          pendentes.push(c);
        }
      }
    });

    return { pendentes, emAndamento, concluidos };
  }, [compromissosFiltrados]);

  // ==========================================
  // LOGICA E COMPONENTES DO CALENDÁRIO MENSAL (FORÇADO MODO CLARO)
  // ==========================================
  const gridCalendarioMes = useMemo(() => {
    const ano = currentDate.getFullYear();
    const mes = currentDate.getMonth();

    const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
    const totalDiasMes = new Date(ano, mes + 1, 0).getDate();
    const totalDiasMesAnterior = new Date(ano, mes, 0).getDate();

    const grid = [];

    // Preencher dias do mês anterior (trailing days)
    for (let i = primeiroDiaSemana - 1; i >= 0; i--) {
      const diaNum = totalDiasMesAnterior - i;
      grid.push({
        dayNum: diaNum,
        isCurrentMonth: false,
        date: new Date(ano, mes - 1, diaNum)
      });
    }

    // Preencher dias do mês atual
    for (let i = 1; i <= totalDiasMes; i++) {
      grid.push({
        dayNum: i,
        isCurrentMonth: true,
        date: new Date(ano, mes, i)
      });
    }

    // Preencher dias do próximo mês (leading days)
    const celulasRestantes = 42 - grid.length;
    for (let i = 1; i <= celulasRestantes; i++) {
      grid.push({
        dayNum: i,
        isCurrentMonth: false,
        date: new Date(ano, mes + 1, i)
      });
    }

    return grid;
  }, [currentDate]);

  // Navegação
  const irParaMesAnterior = () => {
    const novo = new Date(currentDate);
    novo.setMonth(novo.getMonth() - 1);
    setCurrentDate(novo);
  };

  const irParaProximoMes = () => {
    const novo = new Date(currentDate);
    novo.setMonth(novo.getMonth() + 1);
    setCurrentDate(novo);
  };

  const irParaSemanaAnterior = () => {
    const novo = new Date(currentDate);
    novo.setDate(novo.getDate() - 7);
    setCurrentDate(novo);
  };

  const irParaProximaSemana = () => {
    const novo = new Date(currentDate);
    novo.setDate(novo.getDate() + 7);
    setCurrentDate(novo);
  };

  const irParaHoje = () => {
    setCurrentDate(new Date());
  };

  // Grade da Visualização Semanal
  const gridCalendarioSemana = useMemo(() => {
    const grid = [];
    const dataInicial = new Date(currentDate);
    dataInicial.setDate(currentDate.getDate() - currentDate.getDay());

    for (let i = 0; i < 7; i++) {
      const d = new Date(dataInicial);
      d.setDate(dataInicial.getDate() + i);
      grid.push(d);
    }
    return grid;
  }, [currentDate]);

  const obterCompromissosDoDia = (dataVerificacao: Date) => {
    return compromissosFiltrados.filter(c => {
      const dataComp = new Date(c.data_hora);
      return (
        dataComp.getDate() === dataVerificacao.getDate() &&
        dataComp.getMonth() === dataVerificacao.getMonth() &&
        dataComp.getFullYear() === dataVerificacao.getFullYear()
      );
    });
  };

  // Renderizador de Card de Compromisso no Quadro Status
  const renderCardCompromissoStatus = (comp: Compromisso) => {
    const estilo = obterEstiloPorTipo(comp.tipo);
    const meta = parseMetadata(comp.anotacoes_pos_evento);
    const isOnline = meta.online === true || comp.tipo === "Reunião Online" || (comp.local_link && (comp.local_link.includes("meet.google.com") || comp.local_link.includes("teams.microsoft.com")));
    
    return (
      <div 
        key={comp.id} 
        className={`group bg-white border border-slate-200 rounded-xl p-4.5 space-y-3 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 relative overflow-hidden`}
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full blur-xl pointer-events-none"></div>
        
        {/* Header do Card */}
        <div className="flex justify-between items-start">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 uppercase tracking-wider ${estilo.textClass}`}>
            {estilo.badge}
          </span>
          <span className="text-[10px] text-slate-500 font-semibold bg-slate-50 px-1.5 py-0.5 rounded">
            ⏱️ {formatarHora(comp.data_hora)}
          </span>
        </div>

        {/* Titulo */}
        <h4 className="text-sm font-semibold text-[#0f1e36] group-hover:text-[#d4af37] transition-colors leading-snug flex items-center gap-1.5">
          {isOnline && <span title="Reunião Virtual Ativa">🎥</span>}
          {comp.titulo}
        </h4>

        {/* Localização / Link */}
        {comp.tipo !== "Prazo Processual" && comp.local_link && (
          <div className="text-xs text-slate-600 bg-slate-50 rounded px-2.5 py-1.5 flex items-center justify-between gap-2 border border-slate-100">
            <span className="truncate flex items-center gap-1 font-mono text-[11px]">
              {isOnline ? "🔗 Link:" : "📍 Local:"} <strong className="text-slate-800 ml-1">{comp.local_link}</strong>
            </span>
            {isOnline && (
              <a 
                href={comp.local_link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[10px] text-[#d4af37] font-bold shrink-0 hover:underline flex items-center gap-0.5"
              >
                Entrar ↗
              </a>
            )}
          </div>
        )}

        {/* Informações Unidas de Processos/Clientes */}
        <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5 text-[11px] text-slate-500">
          {comp.clientes && (
            <div className="flex items-center gap-1">
              <span>👤 Cliente:</span>
              <span className="text-slate-700 font-medium truncate">{comp.clientes.nome}</span>
            </div>
          )}
          {comp.processos && (
            <div className="flex items-center gap-1">
              <span>⚖️ Proc:</span>
              <span className="text-slate-700 font-mono text-[10px] truncate">{comp.processos.numero_processo}</span>
            </div>
          )}
        </div>

        {/* Ações Rápidas */}
        <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex gap-2">
            {comp.status === "Agendado" && (
              <button 
                onClick={() => handleMarcarComoRealizado(comp.id)}
                type="button" 
                className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-0.5"
              >
                ✓ Cumprir
              </button>
            )}
            {comp.status === "Agendado" && (
              <button 
                onClick={() => handleCancelarCompromisso(comp.id)}
                type="button" 
                className="text-red-600 hover:text-red-700 font-bold"
              >
                ✕ Cancelar
              </button>
            )}
          </div>
          <span className={`text-[10px] font-semibold ${comp.status === "Realizado" ? "text-emerald-600" : comp.status === "Cancelado" ? "text-red-600" : "text-amber-600"}`}>
            Status: {comp.status}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6 space-y-6">
      
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📅</span>
            <h1 className="font-playfair font-bold text-2xl tracking-wide text-[#0f1e36]">
              Agenda & Prazos Judiciais
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-light">
            Painel integrado de controle para a Dra. Janaina Tarabauca Advocacia.
          </p>
        </div>

        {/* Controles de Modo de Visualização e Filtro Rápido */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Seletor Rápido de Categoria */}
          <select 
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 focus:outline-none focus:border-[#d4af37] cursor-pointer"
          >
            <option value="todos">🔍 Todos Eventos</option>
            <option value="audiencia">🔴 Audiências</option>
            <option value="reuniao">🔵 Reuniões</option>
            <option value="prazo">⚜️ Prazos</option>
          </select>

          {/* Toggle Switch Visual (Calendário vs Status) */}
          <div className="bg-slate-100 border border-slate-200 rounded-xl p-1 flex gap-1">
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
                viewMode === "calendar"
                  ? "bg-[#d4af37] text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span>📅</span> Calendário
            </button>
            <button
              onClick={() => setViewMode("status")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
                viewMode === "status"
                  ? "bg-[#d4af37] text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span>📋</span> Status
            </button>
          </div>
        </div>
      </div>

      {/* CONTROLES DE NAVEGAÇÃO DO CALENDÁRIO */}
      {viewMode === "calendar" && (
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white rounded-xl border border-slate-200 px-6 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={irParaHoje}
              className="bg-slate-50 border border-slate-200 hover:border-slate-300 text-xs text-slate-700 px-3.5 py-1.5 rounded-lg transition-colors font-medium"
            >
              Hoje
            </button>
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg">
              <button 
                onClick={calendarTab === "month" ? irParaMesAnterior : irParaSemanaAnterior}
                className="px-3 py-1.5 text-slate-500 hover:text-slate-700 text-sm font-bold border-r border-slate-200 transition-colors"
                title="Voltar"
              >
                ◀
              </button>
              <button 
                onClick={calendarTab === "month" ? irParaProximoMes : irParaProximaSemana}
                className="px-3 py-1.5 text-slate-500 hover:text-slate-700 text-sm font-bold transition-colors"
                title="Avançar"
              >
                ▶
              </button>
            </div>
            <h2 className="text-base font-semibold tracking-wide text-[#d4af37] font-playfair ml-2">
              {currentDate.toLocaleDateString("pt-BR", calendarTab === "month" 
                ? { month: "long", year: "numeric" } 
                : { day: "2-digit", month: "short", year: "numeric" }
              ).toUpperCase()}
            </h2>
          </div>

          {/* Abas internas do Calendário: Mês vs Semana */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-0.5 flex">
            <button
              onClick={() => setCalendarTab("month")}
              className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                calendarTab === "month"
                  ? "bg-white text-slate-700 shadow-sm border border-slate-200/50"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setCalendarTab("week")}
              className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                calendarTab === "week"
                  ? "bg-white text-slate-700 shadow-sm border border-slate-200/50"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Semanal
            </button>
          </div>
        </div>
      )}

      {/* CONTAINER DO FLUXO PRINCIPAL */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-20 flex flex-col items-center justify-center space-y-4 shadow-sm">
          <div className="w-10 h-10 border-4 border-slate-100 border-t-[#d4af37] rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500">Sincronizando compromissos com o banco de dados...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-3 shadow-sm">
          <span className="text-2xl">⚠️</span>
          <h3 className="text-red-700 font-bold text-sm">Falha na Sincronização</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">{error}</p>
          <button 
            onClick={fetchCompromissos}
            className="bg-[#d4af37] text-white hover:bg-[#f3e5ab] text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      ) : (
        <div className="transition-all duration-300">
          
          {/* FORMATO 1: CALENDÁRIO INTELIGENTE (FORÇADO bg-white E text-slate-700) */}
          {viewMode === "calendar" && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              
              {/* VISUALIZAÇÃO MENSAL */}
              {calendarTab === "month" && (
                <div className="w-full overflow-x-auto">
                  <div className="min-w-[700px] bg-white">
                    {/* Linha dos Dias da Semana */}
                    <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                      {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(day => (
                        <div key={day} className="py-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Grade de Células do Calendário */}
                    <div className="grid grid-cols-7 grid-rows-6 border-slate-200 bg-white">
                      {gridCalendarioMes.map((cell, idx) => {
                        const cellCompromissos = obterCompromissosDoDia(cell.date);
                        const éHoje = new Date().toDateString() === cell.date.toDateString();

                        return (
                          <div
                            key={idx}
                            className={`min-h-[110px] border-r border-b border-slate-200 p-2 flex flex-col space-y-1.5 transition-colors relative ${
                              cell.isCurrentMonth ? "bg-white text-[#0f1e36]" : "bg-slate-50/50 text-slate-400 opacity-60"
                            } ${éHoje ? "bg-[#d4af37]/5" : ""}`}
                          >
                            {/* Dia do Mês */}
                            <div className="flex justify-between items-center">
                              <span className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded-md ${
                                éHoje 
                                  ? "bg-[#d4af37] text-white" 
                                  : "text-slate-600"
                              }`}>
                                {cell.dayNum}
                              </span>
                              {cellCompromissos.length > 0 && (
                                <span className="text-[9px] bg-slate-100 text-slate-500 font-semibold px-1 rounded-full border border-slate-200">
                                  {cellCompromissos.length}
                                </span>
                              )}
                            </div>

                            {/* Mini-Cards dos Compromissos do Dia */}
                            <div className="flex-1 overflow-y-auto space-y-1 max-h-[85px] scrollbar-thin">
                              {cellCompromissos.slice(0, 3).map(comp => {
                                const estilo = obterEstiloPorTipo(comp.tipo);
                                const meta = parseMetadata(comp.anotacoes_pos_evento);
                                const isOnline = meta.online === true || comp.tipo === "Reunião Online";
                                return (
                                  <div
                                    key={comp.id}
                                    className={`px-1.5 py-0.5 text-[9px] leading-tight rounded border-l-2 font-medium truncate tracking-wide flex items-center justify-between ${estilo.borderClass} ${estilo.bgClass}`}
                                    title={`${comp.titulo} - ${formatarHora(comp.data_hora)}`}
                                  >
                                    <span className="truncate flex-1 font-semibold">
                                      {isOnline && <span className="mr-0.5">🎥</span>}
                                      {comp.titulo}
                                    </span>
                                    <span className="text-slate-500 text-[8px] font-mono ml-0.5">{formatarHora(comp.data_hora)}</span>
                                  </div>
                                );
                              })}
                              {cellCompromissos.length > 3 && (
                                <div className="text-[8px] text-[#d4af37] text-center font-bold">
                                  + {cellCompromissos.length - 3} mais
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* VISUALIZAÇÃO SEMANAL */}
              {calendarTab === "week" && (
                <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-slate-200 bg-white">
                  {gridCalendarioSemana.map((day, idx) => {
                    const cellCompromissos = obterCompromissosDoDia(day);
                    const éHoje = new Date().toDateString() === day.toDateString();
                    const diaNome = day.toLocaleDateString("pt-BR", { weekday: "short" });

                    return (
                      <div
                        key={idx}
                        className={`p-4 min-h-[350px] space-y-4 transition-colors ${
                          éHoje ? "bg-[#d4af37]/5" : "bg-white"
                        }`}
                      >
                        {/* Cabeçalho do Dia */}
                        <div className="border-b border-slate-200 pb-3 flex justify-between items-center bg-white">
                          <div className="flex flex-col bg-white">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              {diaNome}
                            </span>
                            <span className={`text-sm font-extrabold font-mono mt-0.5 ${
                              éHoje ? "text-[#d4af37]" : "text-[#0f1e36]"
                            }`}>
                              {day.getDate()} / {day.getMonth() + 1}
                            </span>
                          </div>
                          {cellCompromissos.length > 0 && (
                            <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full border border-slate-200">
                              {cellCompromissos.length}
                            </span>
                          )}
                        </div>

                        {/* Lista de Compromissos do Dia */}
                        <div className="space-y-2.5 overflow-y-auto max-h-[400px]">
                          {cellCompromissos.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 text-[10px] font-light italic">
                              Sem compromissos
                            </div>
                          ) : (
                            cellCompromissos.map(comp => {
                              const estilo = obterEstiloPorTipo(comp.tipo);
                              const meta = parseMetadata(comp.anotacoes_pos_evento);
                              const isOnline = meta.online === true || comp.tipo === "Reunião Online";
                              return (
                                <div
                                  key={comp.id}
                                  className={`p-3 rounded-lg border-l-3 ${estilo.borderClass} ${estilo.bgClass} flex flex-col space-y-2 text-[11px] hover:shadow transition-shadow cursor-pointer`}
                                >
                                  <div className="flex justify-between items-start gap-1">
                                    <span className="font-mono text-slate-500 text-[9px] font-bold">
                                      ⏱️ {formatarHora(comp.data_hora)}
                                    </span>
                                    <span className={`text-[8px] font-semibold px-1 rounded uppercase bg-slate-100 ${estilo.textClass}`}>
                                      {comp.status}
                                    </span>
                                  </div>
                                  <h4 className="font-bold text-[#0f1e36] line-clamp-2 leading-tight">
                                    {isOnline && <span className="mr-1">🎥</span>}
                                    {comp.titulo}
                                  </h4>
                                  
                                  {comp.clientes && (
                                    <span className="text-[9.5px] text-slate-500 font-light truncate">
                                      👤 {comp.clientes.nome}
                                    </span>
                                  )}
                                  
                                  {comp.tipo !== "Prazo Processual" && comp.local_link && (
                                    <span className="text-[9px] text-[#d4af37] font-mono truncate">
                                      📍 {comp.local_link}
                                    </span>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* FORMATO 2: QUADRO STATUS DE PRODUTIVIDADE */}
          {viewMode === "status" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* COLUNA 1: PENDENTE / AGENDADO */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4.5 flex flex-col space-y-4 shadow-sm">
                <div className="flex justify-between items-center pb-3.5 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-500">📋</span>
                    <h3 className="font-bold text-sm text-[#0f1e36]">
                      Pendentes / Agendados
                    </h3>
                  </div>
                  <span className="text-xs bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full border border-slate-200">
                    {columnsStatus.pendentes.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3.5 max-h-[600px] pr-1">
                  {columnsStatus.pendentes.length === 0 ? (
                    <div className="text-center py-20 text-slate-400 text-xs font-light italic">
                      Nenhum compromisso pendente.
                    </div>
                  ) : (
                    columnsStatus.pendentes.map(c => renderCardCompromissoStatus(c))
                  )}
                </div>
              </div>

              {/* COLUNA 2: EM ANDAMENTO (Compromissos de Hoje) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4.5 flex flex-col space-y-4 shadow-sm ring-1 ring-[#d4af37]/10">
                <div className="flex justify-between items-center pb-3.5 border-b border-[#d4af37]/20">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-500">⚡</span>
                    <h3 className="font-bold text-sm text-[#0f1e36] flex items-center gap-1.5">
                      Foco de Hoje <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    </h3>
                  </div>
                  <span className="text-xs bg-[#d4af37]/10 text-[#d4af37] font-bold px-2 py-0.5 rounded-full border border-[#d4af37]/20">
                    {columnsStatus.emAndamento.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3.5 max-h-[600px] pr-1">
                  {columnsStatus.emAndamento.length === 0 ? (
                    <div className="text-center py-20 text-slate-400 text-xs font-light italic">
                      Sem compromissos agendados para hoje.
                    </div>
                  ) : (
                    columnsStatus.emAndamento.map(c => renderCardCompromissoStatus(c))
                  )}
                </div>
              </div>

              {/* COLUNA 3: CONCLUÍDO (Prazos Cumpridos e Histórico) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4.5 flex flex-col space-y-4 shadow-sm">
                <div className="flex justify-between items-center pb-3.5 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span>
                    <h3 className="font-bold text-sm text-[#0f1e36]">
                      Concluídos / Histórico
                    </h3>
                  </div>
                  <span className="text-xs bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full border border-slate-200">
                    {columnsStatus.concluidos.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3.5 max-h-[600px] pr-1">
                  {columnsStatus.concluidos.length === 0 ? (
                    <div className="text-center py-20 text-slate-400 text-xs font-light italic">
                      Nenhum compromisso finalizado.
                    </div>
                  ) : (
                    columnsStatus.concluidos.map(c => renderCardCompromissoStatus(c))
                  )}
                </div>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
};
