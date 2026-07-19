import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";

app.post("/api/analyze-code", async (req, res) => {
  try {
    const { code, language, depth, explanationLang } = req.body;

    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return res.status(400).json({ error: "Code is required" });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY not configured on server" });
    }

    const languageInstruction =
      explanationLang === "hinglish"
        ? "Write every text field (summary, explanation, concepts, issues) in Hinglish — a natural Hindi-English mix written in Latin/Roman script (not Devanagari), the way Indian developers actually talk. Keep code, technical terms, and keywords in English."
        : "Write every text field in clear English.";

    const prompt = `Analyze the following ${
      language && language !== "auto" ? language : ""
    } code at ${depth || "intermediate"} level.
${languageInstruction}
Return ONLY valid JSON with this exact structure, no markdown fences, no extra text:
{
  "language": "detected language name",
  "summary": "2-3 sentence overview of what this code does",
  "lines": [{"code": "line or block of code", "explanation": "what it does"}],
  "concepts": ["array", "of", "programming", "concepts", "used"],
  "issues": [{"type": "warning|improvement|error", "text": "description"}],
  "complexity": {"time": "O(n) notation", "space": "O(n) notation"}
}
Code:
\`\`\`
${code}
\`\`\``;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", response.status, errText);
      if (response.status === 429) {
        return res.status(429).json({ error: "Rate limit exceeded. Please try again in a moment." });
      }
      return res.status(500).json({ error: "AI service error" });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error("Unexpected Gemini response:", JSON.stringify(data));
      return res.status(500).json({ error: "Empty response from AI service" });
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        return res.status(500).json({ error: "Could not parse AI response as JSON" });
      }
      parsed = JSON.parse(match[0]);
    }

    return res.json(parsed);
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`CodeLens backend running on http://localhost:${PORT}`);
});