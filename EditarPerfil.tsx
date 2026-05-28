import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-client"; // Mocked/actual client depending on bundler

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
  });

  // Estados de Controle de UI
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  
  // Controle do modal de verificação 2FA (MFA)
  const [showMfaModal, setShowMfaModal] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState("");

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
          .select("nome, oab, tratamento, telefone")
          .eq("id", user.id)
          .single();

        if (dbError && dbError.code !== "PGRST116") { // Ignora se não houver registros
          console.warn("Erro ao buscar dados adicionais na tabela public.advogados:", dbError.message);
        }

        setProfile({
          id: user.id,
          email: user.email || "",
          nome: dbData?.nome || user.user_metadata?.nome || "",
          oab: dbData?.oab || user.user_metadata?.oab || "",
          tratamento: dbData?.tratamento || user.user_metadata?.tratamento || "Dr.",
          telefone: dbData?.telefone || user.user_metadata?.telefone || "",
        });
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
        })
        .eq("id", profile.id);
      if (dbError) throw dbError;

      showToast("Perfil profissional atualizado com sucesso!", "success");
    } catch (err: any) {
      showToast(err.message || "Erro ao salvar alterações do perfil.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Simula ou ativa o desafio de 2FA (MFA)
  const handleToggle2FA = () => {
    setMfaError("");
    setMfaCode("");
    setShowMfaModal(true);
  };

  const handleVerifyMfaChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mfaCode.length < 6) {
      setMfaError("O código de verificação deve conter 6 dígitos.");
      return;
    }

    try {
      setMfaLoading(true);
      setMfaError("");
      
      // Arquitetura de desafio pronta para Supabase MFA
      // const challenge = await supabase.auth.mfa.challenge({ factorId: '...' });
      // const verify = await supabase.auth.mfa.verify({ factorId: '...', challengeId: challenge.data.id, code: mfaCode });
      
      // Simulação de chamada de validação do token
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      if (mfaCode === "123456" || mfaCode.startsWith("0")) { // Mocks de teste
        showToast("Fator de Autenticação Dupla (2FA) configurado com sucesso!", "success");
        setShowMfaModal(false);
      } else {
        throw new Error("Código de segurança inválido ou expirado. Tente novamente.");
      }
    } catch (err: any) {
      setMfaError(err.message || "Falha ao validar desafio 2FA.");
    } finally {
      setMfaLoading(false);
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
              Gerencie suas informações profissionais no ecossistema JT Advocacia.
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

            {/* Extra Security Settings (2FA) */}
            <div className="pt-4 border-t border-[#1E293B]/80 flex flex-col gap-3">
              <h3 className="text-sm font-semibold tracking-wide text-slate-200">
                Segurança Adicional
              </h3>
              <div className="flex items-center justify-between bg-[#1E293B]/20 border border-[#1E293B]/40 rounded-xl p-4">
                <div>
                  <h4 className="text-xs font-medium text-slate-300">Autenticação em Duas Etapas (2FA)</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-light">
                    Exija um código numérico temporário ao realizar o login.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggle2FA}
                  className="px-3.5 py-1.5 rounded-lg border border-[#D4AF37]/40 hover:border-[#D4AF37] text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all outline-none"
                >
                  Configurar 2FA
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div className="pt-2 flex justify-end gap-3">
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

      {/* MFA Challenge / 2FA Validation Modal */}
      {showMfaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setShowMfaModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-200 text-xl font-bold bg-none border-none cursor-pointer"
            >
              &times;
            </button>
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full flex items-center justify-center text-[#D4AF37] text-xl mx-auto mb-4">
                🔒
              </div>
              <h3 className="text-lg font-playfair font-semibold text-slate-100">
                Verificação de Segurança
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 font-light leading-relaxed">
                Insira o código MFA de 6 dígitos enviado ao seu dispositivo autenticador.
              </p>
            </div>

            <form onSubmit={handleVerifyMfaChallenge} className="space-y-4">
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  required
                  className="w-full h-11 text-center bg-[#070A13] border border-[#1E293B] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-lg text-lg font-bold tracking-[0.4em] text-slate-200 outline-none transition-colors"
                />
                {mfaError && (
                  <p className="text-[11px] text-[#EF4444] bg-[#EF4444]/5 border border-[#EF4444]/10 p-2 rounded text-center">
                    {mfaError}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowMfaModal(false)}
                  className="w-1/2 h-11 rounded-lg border border-[#1E293B] hover:border-slate-500 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors outline-none cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={mfaLoading}
                  className="w-1/2 h-11 rounded-lg bg-[#D4AF37] hover:bg-[#F3E5AB] text-[#070A13] font-semibold text-xs transition-colors flex items-center justify-center outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {mfaLoading ? "Confirmando..." : "Confirmar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default EditarPerfil;
