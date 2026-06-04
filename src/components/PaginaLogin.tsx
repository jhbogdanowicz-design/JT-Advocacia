import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const legalQuotes = [
  { text: "A justiça é a constante e firme vontade de dar a cada um o que é seu.", author: "Ulpiano" },
  { text: "A advocacia é a trincheira onde a liberdade humana se defende contra a opressão.", author: "Rui Barbosa" },
  { text: "O devido processo legal é a maior garantia civilizada contra o arbítrio estatal.", author: "Teoria Geral do Direito" },
  { text: "A dignidade da pessoa humana é o ponto de partida e o destino final de toda ordem jurídica.", author: "CF/1988" },
  { text: "A lei deve ser como a morte, que não poupa a ninguém.", author: "Montesquieu" }
];

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

  // Citação dinâmica sorteada
  const [activeQuote, setActiveQuote] = useState({ text: "", author: "" });

  // Estados para formulário de captura de clientes
  const [clientNome, setClientNome] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientArea, setClientArea] = useState("Civil");
  const [clientCase, setClientCase] = useState("");
  const [captureStatus, setCaptureStatus] = useState<string | null>(null);

  const handleClientCaptureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCaptureStatus("Abertura...");
    
    const subject = encodeURIComponent(`Consulta Jurídica - ${clientArea} - ${clientNome}`);
    const body = encodeURIComponent(
      `Nova solicitação de consulta jurídica recebida via portal:\n\n` +
      `Nome Completo: ${clientNome}\n` +
      `E-mail de Contato: ${clientEmail}\n` +
      `Telefone/WhatsApp: ${clientPhone}\n` +
      `Área de Interesse: ${clientArea}\n\n` +
      `Breve Relato do Caso:\n${clientCase}`
    );
    
    window.location.href = `mailto:janainat.prado@adv.oabsp.org.br?subject=${subject}&body=${body}`;
    setCaptureStatus("Enviado");
    
    setClientNome("");
    setClientEmail("");
    setClientPhone("");
    setClientCase("");
    setTimeout(() => setCaptureStatus(null), 3000);
  };

  useEffect(() => {
    const randomQuote = legalQuotes[Math.floor(Math.random() * legalQuotes.length)];
    setActiveQuote(randomQuote);
  }, []);

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
        const whitelist = ["nainaja@hotmail.com", "jhbogdanowicz@gmail.com"];
        if (!whitelist.includes(emailTrim.toLowerCase())) {
          setErrorMsg("Cadastro restrito. Este endereço de e-mail não possui autorização institucional para registro nesta banca.");
          setLoading(false);
          return;
        }

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
        const whitelist = ["nainaja@hotmail.com", "jhbogdanowicz@gmail.com"];
        if (!whitelist.includes(emailTrim.toLowerCase())) {
          setErrorMsg("Acesso restrito. Este endereço de e-mail não possui autorização institucional nesta banca.");
          setLoading(false);
          return;
        }

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
    <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col font-sans relative overflow-y-auto">

      {/* ── Pano de Fundo Suavizado — Gradiente Radial Difuso ── */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(212,175,55,0.06)_0%,rgba(15,30,54,0.0)_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_80%,rgba(15,30,54,0.35)_0%,rgba(7,10,19,0)_65%)] pointer-events-none" />

      {/* Background Subtle Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#d4af37]/3 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#0c1625]/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Hero and Login Panels Wrapper */}
      <div className="w-full flex flex-col md:flex-row flex-1">
        {/* ── PAINEL ESQUERDO: COMPOSIÇÃO HERO EDITORIAL (50% WIDTH) ── */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-white via-slate-50/50 to-slate-100/30 dark:bg-gradient-to-br dark:from-[#0c1524] dark:via-[#090e18] dark:to-[#070a13] flex flex-col justify-center items-center p-8 md:p-16 border-b md:border-b-0 md:border-r border-[#d4af37]/15 dark:border-[#d4af37]/10 relative overflow-hidden min-h-[320px] md:min-h-0">
        
        {/* Assinatura Corporativa (Top Left no desktop) */}
        <div className="absolute top-8 left-8 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white border border-[#d4af37]/50 flex items-center justify-center overflow-hidden shadow-sm">
            <img src="/logo-jt.png" alt="JT" className="w-full h-full object-contain p-0.5" />
          </div>
          <div>
            <h1 className="font-playfair font-extrabold text-xs tracking-widest text-[#0f1e36] dark:text-white uppercase">
              Janaina Tarabauca
            </h1>
            <p className="text-[7.5px] uppercase tracking-widest text-[#d4af37] font-bold">
              Advocacia
            </p>
          </div>
        </div>

        {/* Quadro Inspirador de Alta Costura Jurídica */}
        <div className="border border-[#d4af37]/20 rounded-xl p-8 max-w-sm text-center bg-slate-50/40 backdrop-blur-md dark:bg-[#0c1625]/25 dark:backdrop-blur-md relative shadow-lg">
          <span className="text-4xl text-[#d4af37]/30 font-serif absolute -top-4 left-6 bg-white dark:bg-[#090e18] px-2 leading-none">“</span>
          
          <h2 className="font-playfair text-[#0f1e36] dark:text-white text-base font-bold tracking-widest uppercase mb-3">
            Advocacia Estratégica
          </h2>
          
          <p className="font-playfair italic text-[#0f1e36]/90 dark:text-slate-200 text-sm leading-relaxed mb-4">
            {activeQuote.text}
          </p>
          <span className="text-[9px] uppercase tracking-widest text-[#d4af37] font-bold block mt-2">
            {activeQuote.author}
          </span>
        </div>
      </div>

      {/* ── PAINEL DIREITO: FORMULÁRIO DE ACESSO MINIMALISTA (50% WIDTH) ── */}
      <div className="w-full md:w-1/2 bg-[#070a13] flex flex-col justify-center items-center p-8 md:p-16 relative z-10">
        <div className="w-full max-w-sm space-y-8 bg-transparent">
          
          {/* Título de Entrada */}
          <div className="space-y-2">
            <h3 className="font-playfair font-extrabold text-2xl text-white uppercase tracking-wider">
              Acesso Restrito
            </h3>
            <p className="text-slate-400 text-xs font-light leading-relaxed">
              Identifique-se para acessar o painel de controle administrativo do ecossistema.
            </p>
          </div>

          {/* Feedback de Erro ou Sucesso */}
          {errorMsg && (
            <div className="border border-red-500/25 bg-red-950/15 text-red-400 p-3 rounded-xl text-xs font-semibold leading-relaxed">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="border border-emerald-500/25 bg-emerald-950/15 text-emerald-400 p-3 rounded-xl text-xs font-semibold leading-relaxed">
              {successMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {isSignUp && (
              <div className="space-y-4 animate-slideDown">
                
                {/* Tratamento & Nome Completo */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Cargo
                    </label>
                    <select
                      value={tratamento}
                      onChange={(e) => setTratamento(e.target.value)}
                      className="w-full bg-transparent border-b border-slate-700 text-slate-200 text-xs py-2 px-1 focus:border-[#d4af37] outline-none cursor-pointer"
                    >
                      <option value="Dra." className="bg-[#070a13]">Dra.</option>
                      <option value="Dr." className="bg-[#070a13]">Dr.</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Laura Azevedo"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="w-full bg-transparent border-b border-slate-700 text-slate-200 placeholder-slate-600 text-xs py-2 px-1 focus:border-[#d4af37] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Número da OAB */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Credencial da OAB/UF *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: OAB/SP 123.456"
                    value={oab}
                    onChange={(e) => setOab(e.target.value)}
                    className="w-full bg-transparent border-b border-slate-700 text-slate-200 placeholder-slate-600 text-xs py-2 px-1 focus:border-[#d4af37] focus:outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            {/* E-mail de Acesso */}
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                E-mail Institucional *
              </label>
              <input
                type="email"
                required
                placeholder="exemplo@advocacia.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-b border-slate-700 text-slate-200 placeholder-slate-650 text-xs py-2 px-1 focus:border-[#d4af37] focus:outline-none transition-colors"
              />
            </div>

            {/* Senha de Acesso */}
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Senha *
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={handlePasswordChange}
                className="w-full bg-transparent border-b border-slate-700 text-slate-200 placeholder-slate-650 text-xs py-2 px-1 focus:border-[#d4af37] focus:outline-none transition-colors"
              />
            </div>

            {/* Medidor de Força de Senha no Cadastro */}
            {isSignUp && password && (
              <div className="space-y-1.5 animate-fadeIn">
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${passwordStrengthColor}`}
                    style={{ width: `${(passwordStrength / 4) * 100}%` }}
                  />
                </div>
                <p className="text-[9px] font-bold tracking-wider uppercase text-slate-400">
                  Força: {passwordStrengthLabel}
                </p>
              </div>
            )}

            {/* Confirmar Senha */}
            {isSignUp && (
              <div className="animate-slideDown">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Confirmar Senha *
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="w-full bg-transparent border-b border-slate-700 text-slate-200 placeholder-slate-650 text-xs py-2 px-1 focus:border-[#d4af37] focus:outline-none transition-colors"
                />
              </div>
            )}

            {/* Botão de Envio (Ghost button dourado premium) */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-transparent text-white border border-[#d4af37] hover:bg-[#d4af37] hover:text-[#0f1e36] rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 active:scale-[0.98] shadow-sm flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
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

          {/* Alternador de Cadastro/Login */}
          <div className="text-center border-t border-slate-800/80 pt-4 text-xs font-light">
            {isSignUp ? (
              <p className="text-slate-450">
                Já possui uma credencial?{" "}
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className="text-[#d4af37] font-bold hover:underline cursor-pointer"
                >
                  Faça login
                </button>
              </p>
            ) : (
              <p className="text-slate-450">
                Solicitar nova credencial?{" "}
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

      </div>

      {/* ── SEÇÃO: CANAIS DE ATENDIMENTO E TRIAGEM JURÍDICA ── */}
      <div className="w-full bg-[#fafafc] dark:bg-[#090e18] py-16 px-6 md:px-16 border-t border-slate-200 dark:border-[#d4af37]/15 z-10">
        <div className="max-w-6xl mx-auto space-y-12">
          
          {/* Título da Seção */}
          <div className="text-center space-y-3">
            <h2 className="font-playfair text-[#0f1e36] dark:text-[#d4af37] text-2xl md:text-3xl font-extrabold uppercase tracking-widest">
              Canais de Atendimento e Triagem Jurídica
            </h2>
            <p className="text-base text-slate-650 dark:text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
              Selecione o canal ideal para sua necessidade jurídica. Oferecemos contato direto via WhatsApp Corporativo ou abertura de consulta formal.
            </p>
          </div>

          {/* Grid de 2 Colunas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            
            {/* Coluna 1: Conexão Direta */}
            <div className="bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-8 flex flex-col justify-between shadow-sm relative overflow-hidden transition-all hover:shadow-md">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37]/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#0f1e36]/5 dark:bg-[#d4af37]/10 flex items-center justify-center text-2xl text-[#0f1e36] dark:text-[#d4af37]">
                    💬
                  </div>
                  <div>
                    <h3 className="font-playfair text-base md:text-lg font-bold text-[#0f1e36] dark:text-white uppercase tracking-wider">
                      Conexão Direta
                    </h3>
                    <p className="text-xs text-[#d4af37] font-bold uppercase tracking-widest mt-0.5">
                      WhatsApp Corporativo
                    </p>
                  </div>
                </div>

                <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  Entre em contato diretamente via WhatsApp Corporativo. Canal dedicado a orientações preliminares, esclarecimento de fluxos de trabalho e alinhamento de reuniões institucionais com nossa banca.
                </p>

                <ul className="space-y-3 text-sm text-slate-550 dark:text-slate-400">
                  <li className="flex items-center gap-2.5">
                    <span className="text-[#d4af37] font-bold">✓</span> Comunicação corporativa direta
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="text-[#d4af37] font-bold">✓</span> Direcionamento ao advogado responsável pelo tema
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="text-[#d4af37] font-bold">✓</span> Atendimento em horário comercial estruturado
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                <a
                  href="https://wa.me/5511999999999"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 bg-[#0f1e36] hover:bg-[#1b335c] dark:bg-transparent text-white dark:text-[#d4af37] border border-[#0f1e36] dark:border-[#d4af37] dark:hover:bg-[#d4af37] dark:hover:text-[#0f1e36] rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-md flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
                >
                  <span className="text-sm">💬</span> Acessar WhatsApp Corporativo
                </a>
              </div>
            </div>

            {/* Coluna 2: Consulta Formal */}
            <div className="bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-8 shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-playfair text-base md:text-lg font-bold text-[#0f1e36] dark:text-white uppercase tracking-wider">
                    Abertura de Consulta Institucional
                  </h3>
                  <p className="text-xs text-[#d4af37] font-bold uppercase tracking-widest mt-0.5">
                    Seu relato será analisado sob sigilo profissional
                  </p>
                </div>

                <form 
                  onSubmit={handleClientCaptureSubmit} 
                  action="https://formspree.io/f/janainat.prado@adv.oabsp.org.br" 
                  method="POST" 
                  className="space-y-4"
                >
                  {/* Nome Completo */}
                  <div>
                    <label className="block text-sm font-bold text-[#0f1e36] dark:text-slate-200 uppercase tracking-wider mb-1">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      name="nome"
                      required
                      placeholder="Ex: Laura Azevedo"
                      value={clientNome}
                      onChange={(e) => setClientNome(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#070a13] border border-slate-200 dark:border-slate-800 text-[#0f1e36] dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/35 transition-colors"
                    />
                  </div>

                  {/* Grid Email / Telefone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-[#0f1e36] dark:text-slate-200 uppercase tracking-wider mb-1">
                        E-mail de Contato *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="laura@exemplo.com"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#070a13] border border-slate-200 dark:border-slate-800 text-[#0f1e36] dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/35 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#0f1e36] dark:text-slate-200 uppercase tracking-wider mb-1">
                        Telefone / WhatsApp *
                      </label>
                      <input
                        type="tel"
                        name="telefone"
                        required
                        placeholder="(11) 99999-0000"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#070a13] border border-slate-200 dark:border-slate-800 text-[#0f1e36] dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/35 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Área de Interesse */}
                  <div>
                    <label className="block text-sm font-bold text-[#0f1e36] dark:text-slate-200 uppercase tracking-wider mb-1">
                      Área de Interesse *
                    </label>
                    <select
                      name="area"
                      value={clientArea}
                      onChange={(e) => setClientArea(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#070a13] border border-slate-200 dark:border-slate-800 text-[#0f1e36] dark:text-slate-100 text-sm py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#d4af37] cursor-pointer"
                    >
                      <option value="Direito Empresarial" className="bg-white dark:bg-[#070a13]">Direito Empresarial</option>
                      <option value="Civil" className="bg-white dark:bg-[#070a13]">Civil</option>
                      <option value="Trabalhista" className="bg-white dark:bg-[#070a13]">Trabalhista</option>
                      <option value="Administrativo" className="bg-white dark:bg-[#070a13]">Administrativo</option>
                      <option value="Outros" className="bg-white dark:bg-[#070a13]">Outros</option>
                    </select>
                  </div>

                  {/* Relato do Caso */}
                  <div>
                    <label className="block text-sm font-bold text-[#0f1e36] dark:text-slate-200 uppercase tracking-wider mb-1">
                      Descrição do Caso / Dúvida Jurídica *
                    </label>
                    <textarea
                      name="mensagem"
                      required
                      rows={4}
                      placeholder="Descreva detalhadamente a sua situação ou dúvida jurídica..."
                      value={clientCase}
                      onChange={(e) => setClientCase(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#070a13] border border-slate-200 dark:border-slate-800 text-[#0f1e36] dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/35 transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#0f1e36] dark:bg-transparent text-white dark:text-[#d4af37] border border-[#0f1e36] dark:border-[#d4af37] hover:bg-[#1b335c] dark:hover:bg-[#d4af37] dark:hover:text-[#0f1e36] rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 active:scale-[0.98] shadow-sm flex items-center justify-center cursor-pointer"
                  >
                    {captureStatus === "Abertura..." ? "Processando..." : captureStatus === "Enviado" ? "Mensagem Preparada!" : "Enviar Solicitação Formal"}
                  </button>
                </form>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
