const http = require("http");
const https = require("https");

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.CLAUDE_API_KEY || "";

const server = http.createServer(function(req, res) {
  // CORS — permite chamadas do seu app no GitHub Pages
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Responde preflight do browser
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Só aceita POST em /analyze
  if (req.method !== "POST" || req.url !== "/analyze") {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  // Lê o body da requisição
  let body = "";
  req.on("data", function(chunk) { body += chunk.toString(); });
  req.on("end", function() {
    let parsed;
    try { parsed = JSON.parse(body); } catch(e) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid JSON" }));
      return;
    }

    const prompt = parsed.prompt;
    if (!prompt) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Missing prompt" }));
      return;
    }

    // Chama a API da Anthropic
    const payload = JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }]
    });

    const options = {
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Length": Buffer.byteLength(payload)
      }
    };

    const apiReq = https.request(options, function(apiRes) {
      let data = "";
      apiRes.on("data", function(chunk) { data += chunk; });
      apiRes.on("end", function() {
        res.writeHead(apiRes.statusCode, { "Content-Type": "application/json" });
        res.end(data);
      });
    });

    apiReq.on("error", function(e) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: e.message }));
    });

    apiReq.write(payload);
    apiReq.end();
  });
});

server.listen(PORT, function() {
  console.log("GymLog API rodando na porta " + PORT);
});
