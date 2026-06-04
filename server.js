const express = require("express");
const cors = require("cors");
const https = require("https");

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.CLAUDE_API_KEY || "";

const app = express();

app.use(cors({ origin: "*", methods: ["POST", "OPTIONS"], allowedHeaders: ["Content-Type"] }));
app.use(express.json({ limit: "20mb" })); // aumentado para suportar imagens em base64

app.options("/analyze", cors());

app.post("/analyze", function(req, res) {
  const { messages, system, prompt } = req.body;

  // Suporta tanto o formato novo (messages + system) quanto o legado (prompt)
  let apiMessages;
  if (messages && Array.isArray(messages)) {
    apiMessages = messages;
  } else if (prompt) {
    apiMessages = [{ role: "user", content: prompt }];
  } else {
    return res.status(400).json({ error: "Missing messages or prompt" });
  }

  const payload = JSON.stringify({
    model: "claude-haiku-4-5-20251001",   // usa Opus para análise de imagem e chat de qualidade
    max_tokens: 1500,
    ...(system ? { system: system } : {}),
    messages: apiMessages
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
      try {
        res.status(apiRes.statusCode).json(JSON.parse(data));
      } catch(e) {
        res.status(500).json({ error: "Invalid response from Anthropic" });
      }
    });
  });

  apiReq.on("error", function(e) {
    res.status(500).json({ error: e.message });
  });

  apiReq.write(payload);
  apiReq.end();
});

app.listen(PORT, function() {
  console.log("GymLog API rodando na porta " + PORT);
});
