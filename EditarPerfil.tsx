import React, { useState, useEffect, useRef, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

// Inicialização opcional do Supabase (será injetado ou herdado)
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface AdvogadoProfile {
  id: string;
  nome: string;
  email: string;
  oab?: string;
  tratamento?: string; // "Dr." ou "Dra."
  telefone?: string;
  assinatura_digital_url?: string;
}

export const EditarPerfil: React.FC = () => {
  // Estado dos dados do perfil
  const [profile, setProfile] = useState<AdvogadoProfile>({
    id: "",
    nome: "",
    email: "",
    oab: "",
    tratamento: "Dr.",
    telefone: "",
    assinatura_digital_url: "",
  });

  // Estados de Controle de UI
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // ── Otimizações do Canvas & Assinatura (Refs & State) ──────────────────────────
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const lastPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Estado reativo apenas para visualização/salvamento Base64
  const [signatureUrl, setSignatureUrl] = useState<string>("");
  const [hasCaptured, setHasCaptured] = useState<boolean>(false);

  // Efeito para carregar dados do usuário autenticado no início
  useEffect(() => {
    async function loadUserProfile() {
      try {
        setLoading(true);
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          throw new Error("Usuário não autenticado no Supabase.");
        }

        // Busca dados adicionais na tabela public.advogados
        const { data: dbData, error: dbError } = await supabase
          .from("advogados")
          .select("nome, oab, tratamento, telefone, assinatura_digital_url")
          .eq("id", user.id)
          .single();

        if (dbError && dbError.code !== "PGRST116") { // Ignora se não houver registros
          console.warn("Erro ao buscar dados adicionais na tabela public.advogados:", dbError.message);
        }

        const loadedSignature = dbData?.assinatura_digital_url || user.user_metadata?.assinatura_digital_url || "";

        setProfile({
          id: user.id,
          email: user.email || "",
          nome: dbData?.nome || user.user_metadata?.nome || "",
          oab: dbData?.oab || user.user_metadata?.oab || "",
          tratamento: dbData?.tratamento || user.user_metadata?.tratamento || "Dr.",
          telefone: dbData?.telefone || user.user_metadata?.telefone || "",
          assinatura_digital_url: loadedSignature,
        });

        if (loadedSignature) {
          setSignatureUrl(loadedSignature);
          setHasCaptured(true);
        }
      } catch (err: any) {
        showToast(err.message || "Erro ao carregar dados do perfil.", "error");
      } finally {
        setLoading(false);
      }
    }

    loadUserProfile();
  }, []);

  // Exibição temporária de Toast
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Máscara dinâmica para o campo de telefone
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 11) v = v.substring(0, 11);

    if (v.length > 10) {
      v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
      v = v.replace(/(\d{5})(\d)/, "$1-$2");
    } else if (v.length > 5) {
      v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
      v = v.replace(/(\d{4})(\d)/, "$1-$2");
    } else if (v.length > 2) {
      v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
    }
    setProfile({ ...profile, telefone: v });
  };

  // ── Handlers Otimizados do HTML5 Canvas (Bypass State lag) ──────────────────────────
  
  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Ajusta a largura fisicamente ao wrapper parent
    canvas.width = canvas.parentElement?.clientWidth || 450;
    canvas.height = 130;

    // Configuração do traço
    ctx.strokeStyle = "#D4AF37"; // Dourado Institucional
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  // Inicializa canvas quando o DOM carrega
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(initCanvas, 100);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Redimensionamento sem perda
  useEffect(() => {
    const handleResize = () => {
      if (!signatureUrl) {
        initCanvas();
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [signatureUrl]);

  // Capturar coordenadas com suporte a DPI
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ("touches" in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const handleStartDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;

    isDrawingRef.current = true;
    lastPosRef.current = coords;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const handleDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();

    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    lastPosRef.current = coords;
  };

  const handleEndDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Atualiza base64 no término do desenho para lag zero
    const dataUrl = canvas.toDataURL("image/png");
    setSignatureUrl(dataUrl);
    setHasCaptured(true);
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureUrl("");
    setHasCaptured(false);
  };

  // ── Importação de Assinatura Externa (Upload de Arquivo) ──────────────────────────

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Por favor, selecione um arquivo de imagem válido (PNG ou JPEG).", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Str = event.target?.result as string;
      if (base64Str) {
        setSignatureUrl(base64Str);
        setHasCaptured(true);
        showToast("Assinatura importada com sucesso!", "success");

        // Limpa o canvas para consistência visual
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Envio do formulário de atualização
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.nome.trim()) {
      showToast("O Nome Completo é obrigatório.", "error");
      return;
    }

    try {
      setLoading(true);

      // 1. Atualiza nos metadados do Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          nome: profile.nome.trim(),
          oab: profile.oab?.trim(),
          tratamento: profile.tratamento,
          telefone: profile.telefone,
          assinatura_digital_url: signatureUrl || undefined,
        }
      });
      if (authError) throw authError;

      // 2. Sincroniza na tabela public.advogados do banco relacional
      const { error: dbError } = await supabase
        .from("advogados")
        .update({
          nome: profile.nome.trim(),
          oab: profile.oab?.trim(),
          tratamento: profile.tratamento,
          telefone: profile.telefone,
          assinatura_digital_url: signatureUrl || null,
        })
        .eq("id", profile.id);
      if (dbError) throw dbError;

      showToast("Perfil profissional updated com sucesso!", "success");
    } catch (err: any) {
      showToast(err.message || "Erro ao salvar alterações do perfil.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A13] text-[#F8FAFC] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Radial Glow Effect */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#0A192F]/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Floating Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-300 ${
            toast.type === "success"
              ? "bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]"
              : "bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]"
          }`}
        >
          <span className="text-lg">
            {toast.type === "success" ? "✓" : "⚠"}
          </span>
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      )}

      {/* Main Profile Card */}
      <div className="w-full max-w-xl bg-[#0F172A]/80 border border-[#1E293B]/80 rounded-2xl p-8 backdrop-blur-xl shadow-2xl relative z-10">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#1E293B]">
          <div>
            <h2 className="text-2xl font-playfair font-semibold tracking-wide text-slate-100">
              Perfil Profissional
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-light">
              Gerencie suas informações profissionais no ecossistema JT - Janaina Tarabauca Advocacia.
            </p>
          </div>
          <span className="text-xs font-bold text-[#D4AF37] border border-[#D4AF37]/30 px-3 py-1.5 rounded-full bg-[#D4AF37]/5 uppercase tracking-wider select-none">
            Advogado
          </span>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin" />
            <p className="text-sm text-slate-400 font-light">Carregando dados da conta...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Treatment Selector & Full Name */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-1 flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-300">Tratamento</label>
                <select
                  value={profile.tratamento}
                  onChange={(e) => setProfile({ ...profile, tratamento: e.target.value })}
                  className="w-full h-11 bg-[#0F172A] border border-[#1E293B] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-lg text-sm text-slate-200 px-3 transition-colors outline-none cursor-pointer"
                >
                  <option value="Dr.">Dr.</option>
                  <option value="Dra.">Dra.</option>
                </select>
              </div>

              <div className="md:col-span-3 flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-300">Nome Completo *</label>
                <input
                  type="text"
                  value={profile.nome}
                  onChange={(e) => setProfile({ ...profile, nome: e.target.value })}
                  placeholder="Nome Sobrenome"
                  required
                  className="w-full h-11 bg-[#0F172A] border border-[#1E293B] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-lg text-sm text-slate-200 px-4 transition-colors outline-none"
                />
              </div>
            </div>

            {/* Read-only E-mail Field */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-slate-300">Endereço de E-mail</label>
                <span className="text-[10px] text-slate-500 font-medium select-none">
                  (Não editável - Segurança Auth)
                </span>
              </div>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full h-11 bg-[#1E293B]/40 border border-[#1E293B]/60 rounded-lg text-sm text-slate-400 px-4 cursor-not-allowed outline-none select-all"
              />
            </div>

            {/* OAB/UF & Telephone Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-300">Número da OAB/UF *</label>
                <input
                  type="text"
                  value={profile.oab}
                  onChange={(e) => setProfile({ ...profile, oab: e.target.value })}
                  placeholder="Ex: OAB/SP 123456"
                  required
                  className="w-full h-11 bg-[#0F172A] border border-[#1E293B] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-lg text-sm text-slate-200 px-4 transition-colors outline-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-300">Telefone / Contato</label>
                <input
                  type="text"
                  value={profile.telefone}
                  onChange={handlePhoneChange}
                  placeholder="Ex: (11) 99999-9999"
                  className="w-full h-11 bg-[#0F172A] border border-[#1E293B] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-lg text-sm text-slate-200 px-4 transition-colors outline-none"
                />
              </div>
            </div>

            {/* 📝 SEÇÃO: ASSINATURA INSTITUCIONAL DIGITAL */}
            <div className="border-t border-[#1E293B]/80 pt-6 space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-playfair font-semibold tracking-wide text-slate-100">
                  Assinatura Institucional Digital
                </h3>
                <p className="text-[11px] text-slate-400 font-light leading-relaxed">
                  Desenhe sua assinatura no quadro abaixo de forma fluida ou faça upload de um arquivo de imagem pronto (PNG/JPEG) para validação e injeção automática em contratos.
                </p>
              </div>

              {/* Grid 2 Colunas: Desenho à Esquerda | Preview/Upload à Direita */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Lado Esquerdo: Canvas para desenhar */}
                <div className="flex flex-col gap-2.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    ✏️ Desenhar Rubrica
                  </span>
                  
                  <div className="relative border border-dashed border-[#1E293B] bg-[#070A13] rounded-xl overflow-hidden shadow-inner group hover:border-[#D4AF37]/50 transition-colors">
                    <canvas
                      ref={canvasRef}
                      onMouseDown={handleStartDrawing}
                      onMouseMove={handleDraw}
                      onMouseUp={handleEndDrawing}
                      onMouseLeave={handleEndDrawing}
                      onTouchStart={handleStartDrawing}
                      onTouchMove={handleDraw}
                      onTouchEnd={handleEndDrawing}
                      className="w-full h-[130px] block cursor-crosshair bg-white/[0.02] dark:bg-[#070A13] select-none"
                    />
                    
                    {/* Botão flutuante para Limpar */}
                    {hasCaptured && (
                      <button
                        type="button"
                        onClick={handleClearCanvas}
                        className="absolute bottom-2.5 right-2.5 px-2.5 py-1 text-[9px] font-black uppercase bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded transition-all focus:outline-none cursor-pointer"
                      >
                        Limpar
                      </button>
                    )}
                  </div>
                </div>

                {/* Lado Direito: Preview & Upload */}
                <div className="flex flex-col justify-between gap-4">
                  
                  {/* Upload */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      📤 OU IMPORTE UM ARQUIVO
                    </span>
                    
                    <label className="flex flex-col items-center justify-center h-[90px] border border-dashed border-[#1E293B] bg-[#070A13] hover:bg-[#0d1627] hover:border-[#D4AF37]/50 rounded-xl cursor-pointer transition-all select-none">
                      <div className="flex flex-col items-center justify-center text-center px-4 py-3 space-y-1">
                        <span className="text-lg">📁</span>
                        <span className="text-[10px] font-semibold text-slate-300">Escolha uma imagem pronta</span>
                        <span className="text-[8.5px] text-slate-500 font-light">Formatos recomendados: PNG ou JPEG</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Preview & Status */}
                  {signatureUrl ? (
                    <div className="bg-[#10B981]/5 border border-[#10B981]/25 rounded-xl p-3 flex items-center justify-between gap-3 animate-fadeIn">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-extrabold text-[#10B981] uppercase tracking-wider flex items-center gap-1">
                          ● Assinatura Digital Ativa
                        </span>
                        <span className="text-[8.5px] text-slate-400 font-light">Pronta para assinatura nos contratos</span>
                      </div>
                      
                      {/* Miniatura renderizada com Base64 */}
                      <div className="bg-white p-1 rounded border border-slate-200 shadow-sm max-h-[50px] max-w-[120px] flex items-center justify-center overflow-hidden">
                        <img
                          src={signatureUrl}
                          alt="Rubrica Digital Preview"
                          className="max-h-[40px] max-w-[110px] object-contain"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#1E293B]/20 border border-[#1E293B]/40 rounded-xl p-3 flex items-center justify-center text-center">
                      <span className="text-[9.5px] text-slate-500 font-light italic">
                        Nenhuma rubrica digital cadastrada.
                      </span>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Buttons */}
            <div className="pt-2 flex justify-end gap-3 border-t border-[#1E293B]/60">
              <button
                type="submit"
                disabled={loading}
                className="h-11 px-6 rounded-lg bg-[#D4AF37] hover:bg-[#F3E5AB] text-[#070A13] font-semibold text-sm transition-all duration-200 shadow-lg shadow-[#D4AF37]/10 flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
export default EditarPerfil;
