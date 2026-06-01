import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).send("OK");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Método não permitido. Utilize POST." });
    return;
  }

  const { fatosNarrados, tipoPeca, motor, areaInteresse, promptCustom } = req.body;

  if (!fatosNarrados || !tipoPeca) {
    res.status(400).json({ error: "Parâmetros 'fatosNarrados' e 'tipoPeca' são obrigatórios." });
    return;
  }

  const activeMotor = motor || "jusia";
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    console.error("Erro: GOOGLE_API_KEY não foi encontrada nas variáveis de ambiente.");
    res.status(500).json({
      error: "Configuração do servidor inválida. Chave de API da IA ausente no arquivo .env do servidor.",
    });
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.2, // Baixa temperatura para maximizar a precisão jurídica
      },
    });

    // Determina a área de direito dinamicamente
    let areaDireito = "Direito";
    const area = (areaInteresse || "").toLowerCase();
    if (area.includes("médico") || area.includes("medico") || area.includes("saúde") || area.includes("saude")) {
      areaDireito = "Direito Médico e da Saúde";
    } else if (area.includes("trabalhista") || area.includes("trabalho")) {
      areaDireito = "Direito do Trabalho";
    } else if (area.includes("civil")) {
      areaDireito = "Direito Civil";
    } else if (area.includes("penal") || area.includes("criminal")) {
      areaDireito = "Direito Penal";
    } else if (area.includes("tributário") || area.includes("tributario")) {
      areaDireito = "Direito Tributário";
    }

    let systemPromptPrefix = "";
    if (activeMotor === "jusia") {
      systemPromptPrefix = `Você é o JUS IA, o principal e mais renomado motor de inteligência artificial jurídica do Brasil, especializado em ${areaDireito} de alto nível. Seu linguajar é formal, erudito e extremamente embasado nas leis vigentes. `;
    } else if (activeMotor === "openai") {
      systemPromptPrefix = `Atue como o motor OpenAI GPT-4o especializado em ${areaDireito} brasileiro. Seu texto deve ser direto, moderno, preciso e tecnicamente impecável. `;
    } else {
      systemPromptPrefix = `Atue como o motor Google Gemini Pro especializado em ${areaDireito} brasileiro. Elabore um parecer completo com linguagem fluida e abrangência doutrinária. `;
    }

    const prompt = promptCustom || `${systemPromptPrefix}Com base nos Fatos Narrados e Observações Gerais do cliente anexados a seguir, elabore uma minuta jurídica profissional contendo: 1) Dos Fatos (resumo cronológico técnico); 2) Do Direito (fundamentação baseada em doutrina e legislação aplicável); 3) Dos Pedidos e do Pedido de Liminar (se aplicável ao tipo de peça selecionado). Use uma linguagem extremamente técnica, formal e robusta.

Fatos do cliente: 
"${fatosNarrados}"

Tipo de Peça Processual a ser gerada: 
"${tipoPeca}"

Responda redigindo a petição ou tese de defesa completa, com qualificações e espaços para preenchimento posterior.`;

    console.log(`[esbocar-peca] Iniciando chamada para o motor ${activeMotor.toUpperCase()} via Gemini SDK...`);
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    console.log("[esbocar-peca] Geração de peça processual realizada com sucesso.");
    res.status(200).json({ texto: responseText });

  } catch (error) {
    console.error("Erro interno ao gerar peça processual via IA:", error);
    res.status(500).json({
      error: "Ocorreu um erro ao processar o esboço da peça processual com a IA.",
      details: error.message,
    });
  }
}
