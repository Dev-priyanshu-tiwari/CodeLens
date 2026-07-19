import type { AnalysisResult } from "@/types/analysis";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export async function analyzeCode(
  code: string,
  language: string,
  depth: string,
  explanationLang: string = "english"
): Promise<AnalysisResult> {
  const response = await fetch(`${API_URL}/api/analyze-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, language, depth, explanationLang }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "Failed to analyze code");
  }

  return data as AnalysisResult;
}
