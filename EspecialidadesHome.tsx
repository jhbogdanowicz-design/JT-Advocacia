import React from "react";

// 1. Tipagem TypeScript para as Especialidades
export interface Specialty {
  id: number;
  titulo: string;
  subtitulo?: string;
  foco: string;
  descricao: string;
  icone: React.ReactNode;
  destaque?: boolean;
}

// 2. Componente Funcional EspecialidadesHome
export const EspecialidadesHome: React.FC = () => {
  // 3. Array de Dados Dinâmico para fácil manutenção
  const specialties: Specialty[] = [
    {
      id: 1,
      titulo: "Direito Civil e Contratos",
      subtitulo: "Destaque Estratégico",
      destaque: true,
      foco: "Elaboração estratégica e assessoria preventiva",
      descricao:
        "Elaboração e análise de contratos de alta complexidade. Assessoria em direito de propriedade, direitos reais, renegociações de dívidas, prevenção de litígios e auditoria prévia para mitigar passivos em transações civis e comerciais.",
      icone: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          className="w-8 h-8 text-amber-500"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
      ),
    },
    {
      id: 2,
      titulo: "Compliance",
      foco: "Segurança corporativa e conformidade legal",
      descricao:
        "Implementação de programas de compliance robustos, adequação preventiva à LGPD, auditorias internas de conformidade regulatória, estruturação de canais de ética e integridade, e gestão estratégica de riscos operacionais e reputacionais.",
      icone: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          className="w-8 h-8 text-amber-500"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"
          />
        </svg>
      ),
    },
    {
      id: 3,
      titulo: "Direito do Trabalho e Previdenciário",
      foco: "Cálculos complexos e regimes de alta governança",
      descricao:
        "Defesa integral dos direitos trabalhistas de executivos e profissionais. Atuação em rescisões complexas, cálculos de passivos ocultos, estabilidades e assessoria em transição de carreira para regimes de alta governança corporativa.",
      icone: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          className="w-8 h-8 text-amber-500"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.25 14.15v4.25c0 .621-.504 1.125-1.125 1.125H4.875A1.125 1.125 0 013.75 18.4v-4.25m16.5 0a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25m16.5 0V7.493c0-.83-.49-1.576-1.25-1.897L13.5 3.321a2.25 2.25 0 00-2.25 0L4.75 5.596c-.76.32-1.25 1.067-1.25 1.897v6.657"
          />
        </svg>
      ),
    },
    {
      id: 4,
      titulo: "Direito Médico e da Saúde",
      foco: "Defesa médica, regulação de clínicas e planos de saúde",
      descricao:
        "Defesa de profissionais da saúde em processos ético-disciplinares e erro médico. Atuação em glosas hospitalares, regulação de clínicas e ações contra abusos de planos de saúde, garantindo a liberação de cirurgias e tratamentos vitais.",
      icone: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          className="w-8 h-8 text-amber-500"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008H12v-.008z"
          />
        </svg>
      ),
    },
  ];

  return (
    <section className="py-24 bg-[#0a1128] text-white relative overflow-hidden" id="atuacao">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="text-xs font-bold tracking-[0.2em] text-amber-500 uppercase border border-amber-500/20 px-3 py-1.5 rounded-full bg-amber-500/5">
            COMPETÊNCIA MULTIDISCIPLINAR
          </span>
          <h2 className="mt-6 text-4xl sm:text-5xl font-playfair font-semibold leading-tight text-slate-100">
            Nossas Especialidades Jurídicas
          </h2>
          <p className="mt-4 text-base text-slate-400 font-light leading-relaxed">
            Oferecemos representação jurídica de excelência focada em resultados estratégicos, aliando rigor acadêmico, proteção ativa de ativos e mitigação de riscos.
          </p>
        </div>

        {/* Responsive Specialties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {specialties.map((spec) => (
            <div
              key={spec.id}
              className={`group relative flex flex-col justify-between p-8 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md shadow-sm hover:shadow-xl hover:scale-[1.02] hover:border-amber-500/30 transition-all duration-300 ${
                spec.destaque
                  ? "lg:col-span-1 md:col-span-2 border-amber-500/20 shadow-amber-500/5"
                  : ""
              }`}
            >
              {/* Card Glow Effect on Hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 via-amber-500/0 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />

              <div>
                {/* Header card with icon and number */}
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-500 group-hover:scale-110 transition-transform duration-300">
                    {spec.icone}
                  </div>
                  <span className="text-3xl font-playfair italic text-slate-800 group-hover:text-amber-500/20 transition-colors duration-300 font-semibold select-none">
                    {String(spec.id).padStart(2, "0")}
                  </span>
                </div>

                {/* Subtitle tag if highlighted */}
                {spec.destaque && spec.subtitulo && (
                  <span className="text-[10px] font-bold tracking-wider text-amber-500 uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 inline-block mb-3">
                    {spec.subtitulo}
                  </span>
                )}

                {/* Card Titles */}
                <h3 className="text-xl font-semibold text-slate-100 group-hover:text-amber-500 transition-colors duration-200">
                  {spec.titulo}
                </h3>
                
                {spec.foco && (
                  <span className="block mt-1 text-xs font-medium text-amber-500/80">
                    {spec.foco}
                  </span>
                )}

                {/* Description */}
                <p className="mt-4 text-sm text-slate-400 font-light leading-relaxed group-hover:text-slate-300 transition-colors duration-200">
                  {spec.descricao}
                </p>
              </div>

              {/* Action indicator at bottom */}
              <div className="mt-6 pt-4 border-t border-slate-800/40 flex items-center gap-2 text-xs font-semibold text-slate-400 group-hover:text-amber-500 transition-colors duration-300">
                <span>Consulta Jurídica</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-3.5 h-3.5 translate-x-0 group-hover:translate-x-1.5 transition-transform duration-300"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
export default EspecialidadesHome;
