import { defineConfig } from "vite";
import dotenv from "dotenv";

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

export default defineConfig({
  server: {
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // Intercepta requisições locais para a API do projeto
        if (req.url && (req.url.startsWith("/api/gerar-estrategia") || req.url.startsWith("/api/analisar-"))) {
          try {
            // Só aceitamos método POST ou OPTIONS (CORS)
            if (req.method === "OPTIONS") {
              res.writeHead(200, {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
              });
              res.end();
              return;
            }

            if (req.method !== "POST") {
              res.writeHead(405, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Method Not Allowed. Use POST." }));
              return;
            }

            // Buffer para ler o corpo da requisição
            let body = "";
            for await (const chunk of req) {
              body += chunk;
            }

            // Faz o parse do corpo da requisição
            const parsedBody = body ? JSON.parse(body) : {};

            // Cria um adapter simulando as extensões de req/res do Vercel/Express
            const adaptedReq = {
              body: parsedBody,
              headers: req.headers,
              method: req.method,
              url: req.url,
            };

            const adaptedRes = {
              statusCode: 200,
              headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
              },
              status(code) {
                this.statusCode = code;
                return this;
              },
              setHeader(name, value) {
                this.headers[name] = value;
                return this;
              },
              json(data) {
                res.writeHead(this.statusCode, this.headers);
                res.end(JSON.stringify(data));
              },
              send(data) {
                res.writeHead(this.statusCode, this.headers);
                res.end(typeof data === "string" ? data : JSON.stringify(data));
              }
            };

            // Importa dinamicamente a serverless function local para processar a chamada
            const handlerPath = req.url.startsWith("/api/gerar-estrategia") 
              ? "./api/gerar-estrategia.js" 
              : "./api/analisar-processo.js";
            const { default: handler } = await import(handlerPath);
            await handler(adaptedReq, adaptedRes);
            return;
          } catch (error) {
            console.error("Erro capturado no middleware local do Vite:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                error: "Internal Server Error no middleware local.",
                details: error.message,
              })
            );
            return;
          }
        }
        next();
      });
    },
  },
});
