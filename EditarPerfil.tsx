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

interface ComponenteAssinaturaOtimizadoProps {
  initialSignatureUrl?: string;
  onSignatureSave: (base64: string) => void;
  onClear?: () => void;
}

export function ComponenteAssinaturaOtimizado({ 
  initialSignatureUrl,
  onSignatureSave,
  onClear
}: ComponenteAssinaturaOtimizadoProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialSignatureUrl || null);

  useEffect(() => {
    if (initialSignatureUrl) {
      setPreviewUrl(initialSignatureUrl);
    }
  }, [initialSignatureUrl]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isDrawing.current = true;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.strokeStyle = '#D4AF37'; // Usando o dourado institucional da marca
    ctx.lineWidth = 3;
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    const base64 = canvasRef.current?.toDataURL('image/png');
    if (base64) {
      setPreviewUrl(base64);
      onSignatureSave(base64);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPreviewUrl(base64);
        onSignatureSave(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setPreviewUrl(null);
      if (onClear) onClear();
    }
  };

  return (
    <div className="border border-slate-800 p-4 rounded-lg bg-slate-900 mt-4 w-full">
      <label className="block text-xs font-bold text-slate-300 uppercase mb-2">
        Assinatura Digital OAB
      </label>
      
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="w-full h-40 bg-[#070A13] border-2 border-dashed border-slate-700 rounded cursor-crosshair touch-none"
        width={500}
        height={160}
      />

      <div className="flex flex-wrap items-center justify-between gap-4 mt-3">
        <button type="button" onClick={clearCanvas} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded text-xs font-bold uppercase transition-all">
          Limpar Quadro
        </button>

        <label className="bg-[#D4AF37] hover:bg-[#F3E5AB] text-[#070A13] px-4 py-2 rounded text-xs font-bold uppercase cursor-pointer border-b border-[#D4AF37] transition-all">
          📥 Importar Assinatura (PNG/JPG)
          <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      {previewUrl && (
        <div className="mt-4 p-2 bg-emerald-950/30 border border-emerald-800 rounded">
          <p className="text-[10px] font-bold text-emerald-400 uppercase">✓ Assinatura Pronta:</p>
          <img src={previewUrl} alt="Preview" className="h-12 object-contain mt-1 bg-white p-1 rounded border border-slate-200" />
        </div>
      )}
    </div>
  );
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

  // Estado reativo apenas para visualização/salvamento Base64
  const [signatureUrl, setSignatureUrl] = useState<string>("");

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
            <ComponenteAssinaturaOtimizado
              initialSignatureUrl={signatureUrl}
              onSignatureSave={(base64) => setSignatureUrl(base64)}
              onClear={() => setSignatureUrl("")}
            />

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
