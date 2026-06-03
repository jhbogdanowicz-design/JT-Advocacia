import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

interface ModalCompromissoProps {
  clienteId?: string;
  processoId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

type TipoCompromisso = "Audiência" | "Reunião Online" | "Atendimento Presencial" | "Prazo Processual";
type PlataformaOnline = "google_meet" | "teams" | "zoom";

export const ModalCompromisso: React.FC<ModalCompromissoProps> = ({
  clienteId,
  processoId,
  onClose,
  onSuccess,
}) => {
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState<TipoCompromisso>("Atendimento Presencial");
  const [dataHora, setDataHora] = useState("");
  const [anotacoes, setAnotacoes] = useState("");
  
  // Outlook-style selection toggle
  const [isOnline, setIsOnline] = useState(false);
  
  // Estados específicos para Reunião Online
  const [plataforma, setPlataforma] = useState<PlataformaOnline>("google_meet");
  const [linkReuniao, setLinkReuniao] = useState("");
  const [erroLink, setErroLink] = useState<string | null>(null);
  
  // Estado para Local Físico
  const [localFisico, setLocalFisico] = useState("");

  const [loading, setLoading] = useState(false);

  // Auto-toggle online based on appointment type
  useEffect(() => {
    if (tipo === "Reunião Online") {
      setIsOnline(true);
    } else {
      setIsOnline(false);
    }
  }, [tipo]);

  const validarEFormatarLink = (url: string, plat: PlataformaOnline): boolean => {
    setLinkReuniao(url);
    if (!url) {
      setErroLink("O link da reunião é obrigatório para compromissos online.");
      return false;
    }

    const regexMeet = /^(https?:\/\/)?(www\.)?meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/;
    const regexTeams = /^(https?:\/\/)?(www\.)?teams\.microsoft\.com\/.+/;
    const regexZoom = /^(https?:\/\/)?(www\.)?([a-z0-9-]+\.)?zoom\.us\/(j|my|s)\/.+/;

    if (plat === "google_meet" && !regexMeet.test(url.trim())) {
      setErroLink("Formato de link inválido. O padrão deve ser meet.google.com/abc-defg-hij");
      return false;
    }

    if (plat === "teams" && !regexTeams.test(url.trim())) {
      setErroLink("Link inválido. Certifique-se de colar um link gerado pelo Microsoft Teams.");
      return false;
    }

    if (plat === "zoom" && !regexZoom.test(url.trim())) {
      setErroLink("Link inválido. O padrão esperado é zoom.us/j/... ou zoom.us/my/...");
      return false;
    }

    setErroLink(null);
    return true;
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let localFinal = "";
    
    // Outlook Logic: If online toggle is enabled and type is not deadline
    if (tipo !== "Prazo Processual") {
      if (isOnline) {
        const valido = validarEFormatarLink(linkReuniao, plataforma);
        if (!valido) return;
        localFinal = linkReuniao.trim();
      } else {
        localFinal = localFisico.trim();
      }
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error("Usuário não autenticado.");

      const { error } = await supabase.from("compromissos").insert([
        {
          advogado_id: user.id,
          cliente_id: clienteId || null,
          processo_id: processoId || null,
          titulo,
          tipo,
          data_hora: new Date(dataHora).toISOString(),
          local_link: localFinal,
          status: "Agendado",
          anotacoes_pos_evento: isOnline 
            ? JSON.stringify({ plataforma, online: true, anotacoes }) 
            : JSON.stringify({ online: false, anotacoes })
        }
      ]);

      if (error) throw error;
      
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || "Erro ao salvar o compromisso.");
    } finally {
      setLoading(false);
    }
  };

  // Determine if location section should be displayed
  const mostrarBlocoLocalizacao = tipo !== "Prazo Processual";

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="w-full max-w-xl mx-auto my-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-50 dark:bg-[#0b0f19] px-6 py-4 border-b border-slate-200 dark:border-slate-800/80 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[#d4af37] text-lg">📅</span>
            <h3 className="font-playfair font-semibold text-slate-800 dark:text-slate-100 text-lg tracking-wide">Agendar Novo Compromisso</h3>
          </div>
          <button onClick={onClose} type="button" className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-white font-bold text-lg p-1 transition-colors">✕</button>
        </div>

        {/* Formulário com Scroll e Rodapé Fixo */}
        <form onSubmit={handleSalvar} className="flex flex-col flex-1 overflow-hidden">
          {/* Scrollable Form Body */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1 min-h-0">
            {/* Título */}
            <div>
              <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest mb-1.5">Título do Evento</label>
              <input
                type="text"
                required
                placeholder="Ex: Reunião de Alinhamento Inicial"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#070a13] border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/30 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tipo */}
              <div>
                <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest mb-1.5">Tipo de Agendamento</label>
                <select
                  value={tipo}
                  onChange={(e) => {
                    const novoTipo = e.target.value as TipoCompromisso;
                    setTipo(novoTipo);
                    setErroLink(null);
                  }}
                  className="w-full bg-slate-50 dark:bg-[#070a13] border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#d4af37] cursor-pointer"
                >
                  <option value="Atendimento Presencial">Atendimento Presencial</option>
                  <option value="Reunião Online">🎥 Reunião Online</option>
                  <option value="Audiência">Audiência</option>
                  <option value="Prazo Processual">Prazo Processual</option>
                </select>
              </div>

              {/* Data e Hora */}
              <div>
                <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest mb-1.5">Data e Horário</label>
                <input
                  type="datetime-local"
                  required
                  value={dataHora}
                  onChange={(e) => setDataHora(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#070a13] border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/30"
                />
              </div>
            </div>

            {/* Outlook-style Location Workspace (Only if not deadline) */}
            {mostrarBlocoLocalizacao && (
              <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 transition-all duration-300">
                
                {/* Toggle Switch (Outlook style) */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
                  <div className="flex flex-col">
                    <span className="text-sm font-extrabold text-[#0f1e36] dark:text-white uppercase tracking-wider">
                      {tipo === "Audiência" ? "🎥 Audiência Virtual" : "🎥 Reunião Online"}
                    </span>
                    <span className="text-xs text-[#0f1e36] dark:text-slate-200 font-bold mt-0.5">
                      Habilitar salas de videoconferência
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-light mt-0.5">
                      Associe uma sala do Meet, Teams ou Zoom ao agendamento
                    </span>
                  </div>
                  
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isOnline}
                      onChange={(e) => {
                        setIsOnline(e.target.checked);
                        setErroLink(null);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700/60 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#d4af37] peer-checked:after:bg-white peer-checked:after:border-[#d4af37] after:shadow-md"></div>
                  </label>
                </div>

                {/* Conditional Content: Online Fields vs Physical Address */}
                {isOnline ? (
                  <div className="space-y-4">
                    {/* Plataformas */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Escolha a Plataforma</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => { setPlataforma("google_meet"); setErroLink(null); }}
                          className={`flex items-center justify-center gap-1.5 p-2.5 rounded-lg text-xs font-semibold border transition-all ${
                            plataforma === "google_meet"
                              ? "bg-[#0f1e36] text-white border-[#0f1e36] dark:bg-[#d4af37]/20 dark:text-[#d4af37] dark:border-[#d4af37]/60"
                              : "bg-white dark:bg-[#070a13] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:text-white"
                          }`}
                        >
                          🟢 Meet
                        </button>
                        <button
                          type="button"
                          onClick={() => { setPlataforma("teams"); setErroLink(null); }}
                          className={`flex items-center justify-center gap-1.5 p-2.5 rounded-lg text-xs font-semibold border transition-all ${
                            plataforma === "teams"
                              ? "bg-[#0f1e36] text-white border-[#0f1e36] dark:bg-[#d4af37]/20 dark:text-[#d4af37] dark:border-[#d4af37]/60"
                              : "bg-white dark:bg-[#070a13] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:text-white"
                          }`}
                        >
                          🔵 Teams
                        </button>
                        <button
                          type="button"
                          onClick={() => { setPlataforma("zoom"); setErroLink(null); }}
                          className={`flex items-center justify-center gap-1.5 p-2.5 rounded-lg text-xs font-semibold border transition-all ${
                            plataforma === "zoom"
                              ? "bg-[#0f1e36] text-white border-[#0f1e36] dark:bg-[#d4af37]/20 dark:text-[#d4af37] dark:border-[#d4af37]/60"
                              : "bg-white dark:bg-[#070a13] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:text-white"
                          }`}
                        >
                          🟡 Zoom
                        </button>
                      </div>
                    </div>

                    {/* Input link de reunião */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-350">Link da Sala Virtual</label>
                        <a
                          href={plataforma === "google_meet" ? "https://meet.google.com/new" : "https://teams.live.com/"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-[#0f1e36] dark:text-[#d4af37] hover:underline font-bold flex items-center gap-1"
                        >
                          <span>⚙️ Gerar link</span>
                          <span>↗</span>
                        </a>
                      </div>
                      <input
                        type="url"
                        required
                        placeholder={
                          plataforma === "google_meet"
                            ? "meet.google.com/abc-defg-hij"
                            : plataforma === "teams"
                            ? "teams.microsoft.com/..."
                            : "zoom.us/j/123456789"
                        }
                        value={linkReuniao}
                        onChange={(e) => validarEFormatarLink(e.target.value, plataforma)}
                        className={`w-full bg-white dark:bg-[#070a13] border rounded-lg px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none ${
                          erroLink 
                            ? "border-red-500/50 bg-red-50 dark:bg-red-950/10 focus:border-red-500" 
                            : "border-slate-300 dark:border-slate-800 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/20"
                        }`}
                      />
                      {erroLink && <p className="text-[10px] text-red-500 dark:text-red-400 mt-1.5 font-semibold">⚠️ {erroLink}</p>}
                    </div>
                  </div>
                ) : (
                  /* Physical location field */
                  <div>
                    <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest mb-1.5">📍 Local / Sala / Fórum</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Sala de Reuniões Principal, Fórum Cível Vara 2"
                      value={localFisico}
                      onChange={(e) => setLocalFisico(e.target.value)}
                      className="w-full bg-white dark:bg-[#070a13] border border-slate-350 dark:border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Observações / Pauta */}
            <div>
              <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest mb-1.5">Observações / Pauta</label>
              <textarea
                rows={3}
                placeholder="Notas prévias ou pauta da reunião..."
                value={anotacoes}
                onChange={(e) => setAnotacoes(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#070a13] border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/30"
              />
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-[#0b0f19] border-t border-slate-200 dark:border-slate-800/80 flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || (isOnline && !!erroLink)}
              className="bg-[#d4af37] text-[#070a13] hover:bg-[#f3e5ab] px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-[#d4af37]/10 disabled:opacity-40 cursor-pointer"
            >
              {loading ? "Processando..." : "Confirmar Agendamento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
