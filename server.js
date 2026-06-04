const express = require("express");
const cors = require("cors");
const https = require("https");

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.CLAUDE_API_KEY || "";

const app = express();

// CORS explícito — funciona mesmo com Traefik na frente
app.use(cors({
  origin: "*",
  methods: ["POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

app.options("/analyze", cors()); // preflight explícito

app.post("/analyze", function(req, res) {
  const prompt = req.body && req.body.prompt;
  if (!prompt) {
    return res.status(400).json({ error: "Missing prompt" });
  }

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
      res.status(apiRes.statusCode).json(JSON.parse(data));
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
