import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
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

  const { textoDocumento, userId } = req.body;
  if (!textoDocumento) {
    res.status(400).json({ error: "Nenhum conteúdo textual fornecido para análise." });
    return;
  }
  if (!userId) {
    res.status(400).json({ error: "Identificador do advogado é obrigatório para controle de cota." });
    return;
  }

  // 1. Inicializar Supabase Client no Backend
  const supabaseUrl = process.env.SUPABASE_URL || "https://cuvhkusitvhygnqbdcyb.supabase.co";
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1dmhrdXNpdHZoeWducWJkY3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MTgwNzQsImV4cCI6MjA5NTQ5NDA3NH0.lAJDZpOBwIyqJWV3e96Xf0ntrctv0TWQLGtjEbPa9ao";
  
  const supabaseServer = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // 2. Buscar perfil institucional do advogado
    const { data: lawyer, error: dbErr } = await supabaseServer
      .from("advogados")
      .select("*")
      .eq("id", userId)
      .single();

    if (dbErr || !lawyer) {
      res.status(404).json({ error: "Perfil de advogado institucional não encontrado no Supabase." });
      return;
    }

    // 3. Roteamento de Chave & Validação de Cotas
    let activeGeminiKey = "";
    let activeOpenaiKey = "";
    let isFreeQuery = true;

    // A. Checa se possui chave própria
    if (lawyer.user_gemini_key && lawyer.user_gemini_key.trim() !== "") {
      activeGeminiKey = lawyer.user_gemini_key.trim();
      isFreeQuery = false;
    }
    if (lawyer.user_openai_key && lawyer.user_openai_key.trim() !== "") {
      activeOpenaiKey = lawyer.user_openai_key.trim();
      isFreeQuery = false;
    }

    // B. Se não tiver chaves próprias, aplica validação de cota cortesia
    if (isFreeQuery) {
      const realizadas = lawyer.consultas_gratuitas_realizadas || 0;
      const maximo = lawyer.limite_gratuito_maximo || 5;

      if (realizadas >= maximo) {
        res.status(403).json({ error: "LIMITE_EXCEDIDO", message: "Cota de processamento gratuito esgotada." });
        return;
      }
      
      // Fallback para as chaves mestras do sistema
      activeGeminiKey = process.env.GOOGLE_API_KEY;
    }

    // 4. Determina qual modelo processará com base na rota ou no corpo
    // Vamos deduzir o motor da chamada com base na URL
    const url = req.url || "";
    let motor = "gemini";
    if (url.includes("analisar-chatgpt")) {
      motor = "chatgpt";
    } else if (url.includes("analisar-jusia") || url.includes("analisar-jus_ia")) {
      motor = "jus_ia";
    }

    let promptText = "";
    if (motor === "jus_ia" || motor === "jusia") {
      promptText = `
        Você é o JUS IA, o principal e mais renomado motor de inteligência artificial jurídica do Brasil, especializado em Direito Médico de alto nível.
        Analise o texto fornecido abaixo, que contém as instruções específicas e os fatos concatenados. Cumpra exatamente o comando instruído no Conteúdo do Documento.

        Conteúdo do Documento:
        ${textoDocumento}

        Regras cruciais:
        - Responda APENAS o objeto JSON correspondente, sem markdown ou explicações externas.
        - No campo "minuta_inicial_rascunho", monte a peça ou petição inicial completa, com qualificações e espaços para preenchimento, exatamente seguindo a estrutura padrão de contencioso de saúde solicitada no Conteúdo do Documento.
      `;
    } else {
      promptText = `
        Você é um assistente de IA sênior especialista em direito brasileiro, focado em auditoria técnica e aceleração de rotinas jurídicas.
        Analise o texto extraído do processo/peça fornecido abaixo e preencha rigorosamente a estrutura JSON solicitada.

        Conteúdo do Documento:
        ${textoDocumento}

        Regras cruciais:
        - Responda APENAS o objeto JSON correspondente, sem markdown ou explicações externas.
        - Na minuta inicial, monte um rascunho de petição formal em português com parágrafos bem estruturados e elegantes.
      `;
    }

    let jsonResponse;

    // FLUXO DE EXECUÇÃO OPENAI (Se usuário ativou ChatGPT com sua sk-...)
    if (motor === "chatgpt" && activeOpenaiKey) {
      console.log("Processando análise de processo via OpenAI (Chave Própria)...");
      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${activeOpenaiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          response_format: { type: "json_object" },
          temperature: 0.3,
          messages: [
            {
              role: "system",
              content: `Você é um advogado parecerista sênior brasileiro. Retorne um objeto JSON que obedeça rigorosamente a este esquema:
              {
                "resumo_executivo": "Resumo em um parágrafo dos fatos principais e do cenário atual do documento.",
                "tese_sugerida": "Linha argumentativa ou de defesa recomendada baseada no direito brasileiro.",
                "minuta_inicial_rascunho": "Esqueleto formal de petição ou manifestação inicial contendo Fatos, Fundamentos e Pedidos básicos.",
                "classificacao": {
                  "estagio": "Fase Inicial" | "Instrução" | "Sentença" | "Recurso" | "Execução",
                  "prioridade": "Baixa" | "Média" | "Alta" | "Urgente"
                }
              }`
            },
            {
              role: "user",
              content: promptText
            }
          ]
        })
      });

      if (!openaiResponse.ok) {
        const errorDetails = await openaiResponse.text();
        throw new Error(`OpenAI retornou erro: ${openaiResponse.statusText} - ${errorDetails}`);
      }

      const openaiResult = await openaiResponse.json();
      const contentText = openaiResult.choices[0].message.content;
      jsonResponse = JSON.parse(contentText);

    } else {
      // FLUXO DE EXECUÇÃO GEMINI (Padrão ou Chave do Usuário)
      const geminiKeyToUse = activeGeminiKey || process.env.GOOGLE_API_KEY;
      if (!geminiKeyToUse) {
        throw new Error("Chave de API do Gemini não configurada.");
      }

      console.log(`Processando análise de processo via Gemini (${isFreeQuery ? 'Cota Cortesia' : 'Chave Própria'})...`);
      const genAI = new GoogleGenerativeAI(geminiKeyToUse);

      const responseSchema = {
        type: "object",
        properties: {
          resumo_executivo: { type: "string" },
          tese_sugerida: { type: "string" },
          minuta_inicial_rascunho: { type: "string" },
          classificacao: {
            type: "object",
            properties: {
              estagio: { type: "string", enum: ["Fase Inicial", "Instrução", "Sentença", "Recurso", "Execução"] },
              prioridade: { type: "string", enum: ["Baixa", "Média", "Alta", "Urgente"] }
            },
            required: ["estagio", "prioridade"]
          }
        },
        required: ["resumo_executivo", "tese_sugerida", "minuta_inicial_rascunho", "classificacao"]
      };

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.3
        }
      });

      const result = await model.generateContent(promptText);
      const responseText = result.response.text();
      jsonResponse = JSON.parse(responseText);
    }

    // 5. Se foi processada com cota cortesia com sucesso, incrementa o contador!
    if (isFreeQuery) {
      const { error: updateErr } = await supabaseServer
        .from("advogados")
        .update({ consultas_gratuitas_realizadas: (lawyer.consultas_gratuitas_realizadas || 0) + 1 })
        .eq("id", userId);

      if (updateErr) {
        console.warn("Erro ao registrar cota cortesia no Supabase:", updateErr.message);
      }
    }

    res.status(200).json(jsonResponse);
  } catch (error) {
    console.error("Erro na esteira de análise:", error.message);
    res.status(500).json({ error: "Falha na análise analítica: " + error.message });
  }
}
