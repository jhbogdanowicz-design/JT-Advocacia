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

  /**
   * Gera a URL de disparo do WhatsApp com mensagem jurídica formatada.
   * Funciona para reuniões online (link dinâmico) e presenciais (endereço/sala).
   */
  const gerarLinkWhatsApp = (comp: Compromisso): string => {
    const nomeCliente = comp.clientes?.nome || "Cliente";
    const whatsapp = comp.clientes?.whatsapp || "";

    const dataObj = new Date(comp.data_hora);
    const dataFormatada = dataObj.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const horaFormatada = dataObj.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const meta = parseMetadata(comp.anotacoes_pos_evento);
    const isVirtual =
      meta.online === true ||
      comp.tipo === "Reunião Online" ||
      (comp.local_link &&
        (comp.local_link.includes("meet.google.com") ||
          comp.local_link.includes("teams.microsoft.com") ||
          comp.local_link.includes("zoom.us")));

    let blocoLocal = "";
    if (isVirtual && comp.local_link) {
      const plataforma = comp.local_link.includes("meet.google")
        ? "Google Meet"
        : comp.local_link.includes("teams.microsoft")
        ? "Microsoft Teams"
        : comp.local_link.includes("zoom.us")
        ? "Zoom"
        : "Sala Virtual";
      blocoLocal =
        `🎥 *Plataforma:* ${plataforma}\n` +
        `🔗 *Link de Acesso:* ${comp.local_link}`;
    } else if (comp.local_link) {
      blocoLocal = `📍 *Local:* ${comp.local_link}`;
    }

    const mensagem =
      `Prezado(a) *${nomeCliente}*,\n\n` +
      `Esperamos que esteja bem. Entramos em contato pelo escritório *JT — Janaina Tarabauca Advocacia* para confirmar o agendamento abaixo:\n\n` +
      `📋 *${comp.titulo}*\n` +
      `📅 *Data:* ${dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1)}\n` +
      `⏰ *Horário:* ${horaFormatada} (horário de Brasília)\n` +
      (blocoLocal ? `${blocoLocal}\n` : "") +
      `\nPedimos que confirme o recebimento desta mensagem respondendo *"Confirmado"*.\n\n` +
      `Em caso de impossibilidade, por favor entre em contato com antecedência mínima de 24 horas para reagendarmos.\n\n` +
      `_Atenciosamente,_\n` +
      `*Dra. Janaina Tarabauca*\n` +
      `OAB/SP 123.456 — Advocacia em Direito Médico e Saúde\n` +
      `📞 (11) 94753-4587 | 🌐 jtadvocacia.com.br`;

    const numero = whatsapp.replace(/\D/g, "");
    const base = numero ? `https://wa.me/55${numero}` : `https://wa.me/`;
    return `${base}?text=${encodeURIComponent(mensagem)}`;
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
        bgClass: "bg-red-50 dark:bg-red-950/20 hover:bg-red-100/50 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300",
        textClass: "text-red-700 dark:text-red-300",
        badge: "🔴 Audiência"
      };
    } else if (t.includes("prazo")) {
      return {
        borderClass: "border-l-4 border-[#d4af37]",
        bgClass: "bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100/50 dark:hover:bg-amber-900/30 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300",
        textClass: "text-amber-800 dark:text-amber-300",
        badge: "⚜️ Prazo Processual"
      };
    } else {
      return {
        borderClass: "border-l-4 border-blue-500",
        bgClass: "bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100/50 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-300",
        textClass: "text-blue-700 dark:text-blue-300",
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
        className={`group bg-white dark:bg-[#0c1625] border border-slate-200 dark:border-slate-800 rounded-xl p-4.5 space-y-3 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 relative overflow-hidden`}
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-full blur-xl pointer-events-none"></div>
        
        {/* Header do Card */}
        <div className="flex justify-between items-start">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 uppercase tracking-wider ${estilo.textClass}`}>
            {estilo.badge}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded">
            ⏱️ {formatarHora(comp.data_hora)}
          </span>
        </div>

        {/* Titulo */}
        <h4 className="text-sm font-semibold text-[#0f1e36] dark:text-slate-100 group-hover:text-[#d4af37] transition-colors leading-snug flex items-center gap-1.5">
          {isOnline && <span title="Reunião Virtual Ativa">🎥</span>}
          {comp.titulo}
        </h4>

        {/* Localização / Link */}
        {comp.tipo !== "Prazo Processual" && comp.local_link && (
          <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 rounded px-2.5 py-1.5 flex items-center justify-between gap-2 border border-slate-100 dark:border-slate-800">
            <span className="truncate flex items-center gap-1 font-mono text-[11px]">
              {isOnline ? "🔗 Link:" : "📍 Local:"} <strong className="text-slate-800 dark:text-slate-200 ml-1">{comp.local_link}</strong>
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
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          {comp.clientes && (
            <div className="flex items-center gap-1">
              <span>👤 Cliente:</span>
              <span className="text-slate-700 dark:text-slate-300 font-medium truncate">{comp.clientes.nome}</span>
            </div>
          )}
          {comp.processos && (
            <div className="flex items-center gap-1">
              <span>⚖️ Proc:</span>
              <span className="text-slate-700 dark:text-slate-300 font-mono text-[10px] truncate">{comp.processos.numero_processo}</span>
            </div>
          )}
        </div>

        {/* Ações Rápidas */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
          
          {/* Botão WhatsApp — visível para compromissos com cliente vinculado */}
          {comp.clientes && comp.status !== "Cancelado" && (
            <a
              href={gerarLinkWhatsApp(comp)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-[10px] uppercase tracking-wider px-3 py-2 rounded-lg transition-all shadow-sm shadow-emerald-500/20"
              title={`Enviar notificação de agendamento via WhatsApp para ${comp.clientes.nome}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              📲 Notificar via WhatsApp
            </a>
          )}

          <div className="flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex gap-2">
              {comp.status === "Agendado" && (
                <button 
                  onClick={() => handleMarcarComoRealizado(comp.id)}
                  type="button" 
                  className="text-emerald-600 hover:text-emerald-700 font-bold text-[10px] flex items-center gap-0.5"
                >
                  ✓ Cumprir
                </button>
              )}
              {comp.status === "Agendado" && (
                <button 
                  onClick={() => handleCancelarCompromisso(comp.id)}
                  type="button" 
                  className="text-red-600 hover:text-red-700 font-bold text-[10px]"
                >
                  ✕ Cancelar
                </button>
              )}
            </div>
            <span className={`text-[10px] font-semibold ${comp.status === "Realizado" ? "text-emerald-600" : comp.status === "Cancelado" ? "text-red-600" : "text-amber-600"}`}>
              {comp.status}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070a13] text-slate-800 dark:text-slate-100 p-6 space-y-6 relative overflow-hidden">

      {/* ── Pano de Fundo Suavizado — Gradiente Radial Difuso ── */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(212,175,55,0.04)_0%,rgba(15,30,54,0.0)_60%)] pointer-events-none print:hidden" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_80%,rgba(15,30,54,0.15)_0%,rgba(7,10,19,0)_65%)] pointer-events-none print:hidden" />
      
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#0c1625] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📅</span>
            <h1 className="font-playfair font-bold text-2xl tracking-wide text-[#0f1e36] dark:text-slate-100">
              Agenda & Prazos Judiciais
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-light">
            Painel integrado de controle para a Dra. Janaina Tarabauca Advocacia.
          </p>
        </div>

        {/* Controles de Modo de Visualização e Filtro Rápido */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Seletor Rápido de Categoria */}
          <select 
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-600 dark:text-slate-300 focus:outline-none focus:border-[#d4af37] cursor-pointer"
          >
            <option value="todos">🔍 Todos Eventos</option>
            <option value="audiencia">🔴 Audiências</option>
            <option value="reuniao">🔵 Reuniões</option>
            <option value="prazo">⚜️ Prazos</option>
          </select>

          {/* Toggle Switch Visual (Calendário vs Status) */}
          <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 flex gap-1">
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
                viewMode === "calendar"
                  ? "bg-[#d4af37] text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
              }`}
            >
              <span>📅</span> Calendário
            </button>
            <button
              onClick={() => setViewMode("status")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
                viewMode === "status"
                  ? "bg-[#d4af37] text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
              }`}
            >
              <span>📋</span> Status
            </button>
          </div>
        </div>
      </div>

      {/* CONTROLES DE NAVEGAÇÃO DO CALENDÁRIO */}
      {viewMode === "calendar" && (
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-[#0c1625] rounded-xl border border-slate-200 dark:border-slate-800 px-6 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={irParaHoje}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs text-slate-700 dark:text-slate-300 px-3.5 py-1.5 rounded-lg transition-colors font-medium"
            >
              Hoje
            </button>
            <div className="flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
              <button 
                onClick={calendarTab === "month" ? irParaMesAnterior : irParaSemanaAnterior}
                className="px-3 py-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 text-sm font-bold border-r border-slate-200 dark:border-slate-800 transition-colors"
                title="Voltar"
              >
                ◀
              </button>
              <button 
                onClick={calendarTab === "month" ? irParaProximoMes : irParaProximaSemana}
                className="px-3 py-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 text-sm font-bold transition-colors"
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
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 flex">
            <button
              onClick={() => setCalendarTab("month")}
              className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                calendarTab === "month"
                  ? "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm border border-slate-200/50 dark:border-slate-700/50"
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400"
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setCalendarTab("week")}
              className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                calendarTab === "week"
                  ? "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm border border-slate-200/50 dark:border-slate-700/50"
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400"
              }`}
            >
              Semanal
            </button>
          </div>
        </div>
      )}

      {/* CONTAINER DO FLUXO PRINCIPAL */}
      {loading ? (
        <div className="bg-white dark:bg-[#0c1625] rounded-2xl border border-slate-200 dark:border-slate-800 p-20 flex flex-col items-center justify-center space-y-4 shadow-sm">
          <div className="w-10 h-10 border-4 border-slate-100 dark:border-slate-800 border-t-[#d4af37] rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Sincronizando compromissos com o banco de dados...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl p-6 text-center space-y-3 shadow-sm">
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
            <div className="bg-white dark:bg-[#0c1625] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              
              {/* VISUALIZAÇÃO MENSAL */}
              {calendarTab === "month" && (
                <div className="w-full overflow-x-auto">
                  <div className="min-w-[700px] bg-white dark:bg-[#0c1625]">
                    {/* Linha dos Dias da Semana */}
                    <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                      {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(day => (
                        <div key={day} className="py-3 text-center text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Grade de Células do Calendário */}
                    <div className="grid grid-cols-7 grid-rows-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1625]">
                      {gridCalendarioMes.map((cell, idx) => {
                        const cellCompromissos = obterCompromissosDoDia(cell.date);
                        const éHoje = new Date().toDateString() === cell.date.toDateString();

                        return (
                          <div
                            key={idx}
                            className={`min-h-[110px] border-r border-b border-slate-200 dark:border-slate-800 p-2 flex flex-col space-y-1.5 transition-colors relative ${
                              cell.isCurrentMonth 
                                ? "bg-white text-[#0f1e36] dark:bg-slate-900 dark:text-slate-100" 
                                : "bg-slate-50/50 dark:bg-slate-900/40 text-slate-400 dark:text-slate-500 opacity-60"
                            } ${éHoje ? "bg-[#d4af37]/5 dark:bg-[#d4af37]/10" : ""}`}
                          >
                            {/* Dia do Mês */}
                            <div className="flex justify-between items-center">
                              <span className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded-md ${
                                éHoje 
                                  ? "bg-[#d4af37] text-white" 
                                  : "text-slate-600 dark:text-slate-300"
                              }`}>
                                {cell.dayNum}
                              </span>
                              {cellCompromissos.length > 0 && (
                                <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold px-1 rounded-full border border-slate-200 dark:border-slate-700">
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
                <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 bg-white dark:bg-[#0c1625]">
                  {gridCalendarioSemana.map((day, idx) => {
                    const cellCompromissos = obterCompromissosDoDia(day);
                    const éHoje = new Date().toDateString() === day.toDateString();
                    const diaNome = day.toLocaleDateString("pt-BR", { weekday: "short" });

                    return (
                      <div
                        key={idx}
                        className={`p-4 min-h-[350px] space-y-4 transition-colors ${
                          éHoje ? "bg-[#d4af37]/5 dark:bg-[#d4af37]/10" : "bg-white dark:bg-[#0c1625]"
                        }`}
                      >
                        {/* Cabeçalho do Dia */}
                        <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex justify-between items-center bg-white dark:bg-[#0c1625]">
                          <div className="flex flex-col bg-white dark:bg-[#0c1625]">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                              {diaNome}
                            </span>
                            <span className={`text-sm font-extrabold font-mono mt-0.5 ${
                              éHoje ? "text-[#d4af37]" : "text-[#0f1e36] dark:text-slate-100"
                            }`}>
                              {day.getDate()} / {day.getMonth() + 1}
                            </span>
                          </div>
                          {cellCompromissos.length > 0 && (
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                              {cellCompromissos.length}
                            </span>
                          )}
                        </div>

                        {/* Lista de Compromissos do Dia */}
                        <div className="space-y-2.5 overflow-y-auto max-h-[400px]">
                          {cellCompromissos.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-[10px] font-light italic">
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
                                  <h4 className="font-bold text-[#0f1e36] dark:text-slate-100 line-clamp-2 leading-tight">
                                    {isOnline && <span className="mr-1">🎥</span>}
                                    {comp.titulo}
                                  </h4>
                                  
                                  {comp.clientes && (
                                    <span className="text-[9.5px] text-slate-500 dark:text-slate-400 font-light truncate">
                                      👤 {comp.clientes.nome}
                                    </span>
                                  )}
                                  
                                  {comp.tipo !== "Prazo Processual" && comp.local_link && (
                                    <span className="text-[9px] text-[#d4af37] font-mono truncate">
                                      📍 {comp.local_link}
                                    </span>
                                  )}

                                  {/* WhatsApp button no card semanal */}
                                  {comp.clientes && comp.status !== "Cancelado" && (
                                    <a
                                      href={gerarLinkWhatsApp(comp)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="mt-1 flex items-center justify-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[8px] uppercase tracking-wide px-2 py-1 rounded-md transition-all w-full"
                                      title="Enviar notificação via WhatsApp"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 shrink-0">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                      </svg>
                                      WhatsApp
                                    </a>
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
              <div className="bg-white dark:bg-[#0c1625] rounded-2xl border border-slate-200 dark:border-slate-800 p-4.5 flex flex-col space-y-4 shadow-sm">
                <div className="flex justify-between items-center pb-3.5 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-500">📋</span>
                    <h3 className="font-bold text-sm text-[#0f1e36] dark:text-slate-100">
                      Pendentes / Agendados
                    </h3>
                  </div>
                  <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                    {columnsStatus.pendentes.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3.5 max-h-[600px] pr-1">
                  {columnsStatus.pendentes.length === 0 ? (
                    <div className="text-center py-20 text-slate-400 dark:text-slate-500 text-xs font-light italic">
                      Nenhum compromisso pendente.
                    </div>
                  ) : (
                    columnsStatus.pendentes.map(c => renderCardCompromissoStatus(c))
                  )}
                </div>
              </div>

              {/* COLUNA 2: EM ANDAMENTO (Compromissos de Hoje) */}
              <div className="bg-white dark:bg-[#0c1625] rounded-2xl border border-slate-200 dark:border-slate-800 p-4.5 flex flex-col space-y-4 shadow-sm ring-1 ring-[#d4af37]/10">
                <div className="flex justify-between items-center pb-3.5 border-b border-[#d4af37]/20 dark:border-[#d4af37]/30">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-500">⚡</span>
                    <h3 className="font-bold text-sm text-[#0f1e36] dark:text-slate-100 flex items-center gap-1.5">
                      Foco de Hoje <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    </h3>
                  </div>
                  <span className="text-xs bg-[#d4af37]/10 dark:bg-[#d4af37]/20 text-[#d4af37] font-bold px-2 py-0.5 rounded-full border border-[#d4af37]/20 dark:border-[#d4af37]/30">
                    {columnsStatus.emAndamento.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3.5 max-h-[600px] pr-1">
                  {columnsStatus.emAndamento.length === 0 ? (
                    <div className="text-center py-20 text-slate-400 dark:text-slate-500 text-xs font-light italic">
                      Sem compromissos agendados para hoje.
                    </div>
                  ) : (
                    columnsStatus.emAndamento.map(c => renderCardCompromissoStatus(c))
                  )}
                </div>
              </div>

              {/* COLUNA 3: CONCLUÍDO (Prazos Cumpridos e Histórico) */}
              <div className="bg-white dark:bg-[#0c1625] rounded-2xl border border-slate-200 dark:border-slate-800 p-4.5 flex flex-col space-y-4 shadow-sm">
                <div className="flex justify-between items-center pb-3.5 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span>
                    <h3 className="font-bold text-sm text-[#0f1e36] dark:text-slate-100">
                      Concluídos / Histórico
                    </h3>
                  </div>
                  <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                    {columnsStatus.concluidos.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3.5 max-h-[600px] pr-1">
                  {columnsStatus.concluidos.length === 0 ? (
                    <div className="text-center py-20 text-slate-400 dark:text-slate-500 text-xs font-light italic">
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

