import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

interface PaginaLoginProps {
  onAuthSuccess: (session: any) => void;
}

export const PaginaLogin: React.FC<PaginaLoginProps> = ({ onAuthSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [nome, setNome] = useState("");
  const [oab, setOab] = useState("");
  const [tratamento, setTratamento] = useState("Dra.");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Estados de força da senha
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordStrengthLabel, setPasswordStrengthLabel] = useState("Insira a senha");
  const [passwordStrengthColor, setPasswordStrengthColor] = useState("bg-slate-700");

  useEffect(() => {
    // Limpar estados sensíveis ao alternar entre login e cadastro
    setEmail("");
    setPassword("");
    setPasswordConfirm("");
    setNome("");
    setOab("");
    setTratamento("Dra.");
    setErrorMsg(null);
    setSuccessMsg(null);
    setPasswordStrength(0);
    setPasswordStrengthLabel("Insira a senha");
    setPasswordStrengthColor("bg-slate-700");
  }, [isSignUp]);

  const evaluatePasswordStrength = (pass: string) => {
    if (!pass) {
      setPasswordStrength(0);
      setPasswordStrengthLabel("Insira a senha");
      setPasswordStrengthColor("bg-slate-700");
      return;
    }

    let strength = 0;
    if (pass.length >= 8) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[@#$_!%^&*()\-+=\[\]{}|;':",./<>?]/.test(pass)) strength++;

    setPasswordStrength(strength);

    if (strength <= 1) {
      setPasswordStrengthLabel("Fraca (Mínimo 8 chars com A-Z, 0-9, @#$_)");
      setPasswordStrengthColor("bg-red-500");
    } else if (strength === 2) {
      setPasswordStrengthLabel("Média (Adicione números/símbolos)");
      setPasswordStrengthColor("bg-amber-500");
    } else if (strength === 3) {
      setPasswordStrengthLabel("Média-Forte (Quase lá)");
      setPasswordStrengthColor("bg-yellow-400");
    } else if (strength === 4) {
      setPasswordStrengthLabel("Forte (Excelente)");
      setPasswordStrengthColor("bg-emerald-500");
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPassword(val);
    if (isSignUp) {
      evaluatePasswordStrength(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const emailTrim = email.trim();
    if (!emailTrim || !password) {
      setErrorMsg("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // Validação estrita de força da senha
        if (passwordStrength < 4) {
          setErrorMsg("Senha insuficiente! A senha deve ter ao menos 8 caracteres, incluindo pelo menos 1 letra maiúscula, 1 número e 1 caractere especial (ex: @, #, $, _).");
          setLoading(false);
          return;
        }

        if (password !== passwordConfirm) {
          setErrorMsg("A confirmação de senha não coincide com a senha digitada.");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: emailTrim,
          password: password,
          options: {
            data: {
              nome: nome.trim(),
              oab: oab.trim() || "Não Informado",
              tratamento: tratamento,
            },
          },
        });

        if (error) throw error;

        const isConfirmed = data.user && data.user.identities && data.user.identities.length > 0;
        if (isConfirmed && data.session) {
          setSuccessMsg("Cadastro realizado com sucesso! Conectando...");
          setTimeout(() => {
            // Wipar dados locais antes de prosseguir por segurança
            setPassword("");
            setPasswordConfirm("");
            onAuthSuccess(data.session);
          }, 1000);
        } else {
          setSuccessMsg("Conta pré-criada! Por favor, verifique seu e-mail para confirmar o cadastro.");
          // Wipar estados sensíveis por segurança
          setPassword("");
          setPasswordConfirm("");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailTrim,
          password: password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            throw new Error("E-mail ou senha incorretos. Por favor, tente novamente.");
          } else if (error.message.includes("Email not confirmed")) {
            throw new Error("Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.");
          }
          throw error;
        }

        setSuccessMsg("Login bem-sucedido! Acessando painel...");
        setTimeout(() => {
          // Wipar credenciais
          setPassword("");
          onAuthSuccess(data.session);
        }, 1000);
      }
    } catch (err: any) {
      console.error("Erro na autenticação:", err.message);
      setErrorMsg(err.message || "Ocorreu um erro ao processar sua solicitação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1e36] text-[#F8FAFC] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#d4af37]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#0c1625]/30 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-white text-[#0f1e36] border border-slate-200 rounded-2xl p-8 shadow-2xl relative z-10">
        
        {/* LOGO PREMIUM E NOME INSTITUCIONAL */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="bg-white rounded-xl border-2 border-[#d4af37]/60 flex items-center justify-center shadow-lg overflow-hidden mb-3" style={{ width: 64, height: 64 }}>
            <img
              src="/logo-jt.png"
              alt="Logo Janaina Tarabauca Advogados"
              className="w-full h-full object-contain p-1"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = "flex";
              }}
            />
            <span
              className="font-playfair font-extrabold text-[#0f1e36] text-xl hidden items-center justify-center w-full h-full"
              aria-hidden="true"
            >
              JT
            </span>
          </div>
          <h2 className="font-playfair font-bold text-xl tracking-wide text-[#0f1e36]">
            Janaina Tarabauca
          </h2>
          <p className="text-[10px] font-extrabold tracking-widest text-[#d4af37] uppercase mt-0.5">
            Advogados Associados
          </p>
        </div>

        {/* FEEDBACK MESSAGES */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-xs font-semibold mb-4 leading-relaxed flex items-start gap-2">
            <span className="text-sm">⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-xs font-semibold mb-4 leading-relaxed flex items-start gap-2">
            <span className="text-sm">✓</span>
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {isSignUp && (
            <>
              {/* Tratamento & Nome */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Cargo
                  </label>
                  <select
                    value={tratamento}
                    onChange={(e) => setTratamento(e.target.value)}
                    className="w-full h-10 bg-slate-50 border border-slate-300 focus:border-[#d4af37] rounded-lg text-xs text-slate-800 px-2 outline-none cursor-pointer"
                  >
                    <option value="Dra.">Dra.</option>
                    <option value="Dr.">Dr.</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full h-10 bg-slate-50 border border-slate-300 focus:border-[#d4af37] rounded-lg text-xs text-slate-800 px-3 outline-none"
                  />
                </div>
              </div>

              {/* OAB */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Número da OAB/UF *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: OAB/SP 123.456"
                  value={oab}
                  onChange={(e) => setOab(e.target.value)}
                  className="w-full h-10 bg-slate-50 border border-slate-300 focus:border-[#d4af37] rounded-lg text-xs text-slate-800 px-3 outline-none"
                />
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              E-mail de Acesso *
            </label>
            <input
              type="email"
              required
              placeholder="exemplo@adv.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 bg-slate-50 border border-slate-300 focus:border-[#d4af37] rounded-lg text-xs text-slate-800 px-3 outline-none"
            />
          </div>

          {/* Senha */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Senha de Acesso *
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={handlePasswordChange}
              className="w-full h-10 bg-slate-50 border border-slate-300 focus:border-[#d4af37] rounded-lg text-xs text-slate-800 px-3 outline-none"
            />
          </div>

          {/* Validação Visual de Senha no Cadastro */}
          {isSignUp && password && (
            <div className="space-y-1">
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${passwordStrengthColor}`}
                  style={{ width: `${(passwordStrength / 4) * 100}%` }}
                />
              </div>
              <p
                className="text-[9px] font-bold"
                style={{
                  color:
                    passwordStrength <= 1
                      ? "#EF4444"
                      : passwordStrength === 2
                      ? "#F59E0B"
                      : passwordStrength === 3
                      ? "#EAB308"
                      : "#10B981",
                }}
              >
                {passwordStrengthLabel}
              </p>
            </div>
          )}

          {isSignUp && (
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Confirmar Senha *
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="w-full h-10 bg-slate-50 border border-slate-300 focus:border-[#d4af37] rounded-lg text-xs text-slate-800 px-3 outline-none"
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-[#0f1e36] text-white hover:bg-slate-800 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center border-b-2 border-[#d4af37] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processando...
              </span>
            ) : isSignUp ? (
              "Confirmar Cadastro"
            ) : (
              "Entrar na Plataforma"
            )}
          </button>
        </form>

        {/* Toggle between Login and Sign Up */}
        <div className="text-center mt-6 border-t border-slate-100 pt-4 text-xs">
          {isSignUp ? (
            <p className="text-slate-500">
              Já possui uma conta?{" "}
              <button
                type="button"
                onClick={() => setIsSignUp(false)}
                className="text-[#d4af37] font-bold hover:underline cursor-pointer"
              >
                Faça login
              </button>
            </p>
          ) : (
            <p className="text-slate-500">
              Não tem uma conta?{" "}
              <button
                type="button"
                onClick={() => setIsSignUp(true)}
                className="text-[#d4af37] font-bold hover:underline cursor-pointer"
              >
                Cadastre-se
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
