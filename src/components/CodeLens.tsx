import { useState, useRef } from "react";
import { Hexagon, Clock, Sparkles, X, Trash2, Copy, Check, AlertTriangle, AlertCircle, Zap } from "lucide-react";
import type { AnalysisResult, HistoryItem } from "@/types/analysis";
import { SAMPLES } from "@/types/analysis";
import { analyzeCode } from "@/lib/api";
import { toast } from "sonner";

const CodeLens = () => {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("auto");
  const [depth, setDepth] = useState("intermediate");
  const [explanationLang, setExplanationLang] = useState("english");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const h = localStorage.getItem("codelens_history");
      return h ? JSON.parse(h) : [];
    } catch { return []; }
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumsRef = useRef<HTMLDivElement>(null);

  const lineCount = (code.split("\n").length) || 1;
  const lineNums = Array.from({ length: lineCount }, (_, i) => i + 1).join("\n");

  const syncScroll = () => {
    if (textareaRef.current && lineNumsRef.current) {
      lineNumsRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const loadSample = () => {
    const s = SAMPLES[Math.floor(Math.random() * SAMPLES.length)];
    setCode(s.code);
    setLanguage(s.lang);
  };

  const handleAnalyze = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await analyzeCode(code, language, depth, explanationLang);
      setResult(data);
      const item: HistoryItem = {
        id: Date.now(),
        code: code.slice(0, 120),
        lang: data.language,
        summary: data.summary.slice(0, 80),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        full: data,
        fullCode: code,
      };
      const newHistory = [item, ...history].slice(0, 20);
      setHistory(newHistory);
      try { localStorage.setItem("codelens_history", JSON.stringify(newHistory)); } catch {}
    } catch (err: any) {
      setError(err.message || "An error occurred");
      toast.error(err.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const copyResult = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadFromHistory = (item: HistoryItem) => {
    setCode(item.fullCode);
    setResult(item.full);
    setError(null);
    setSidebarOpen(false);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("codelens_history");
  };

  const issueIcon = (type: string) => {
    if (type === "warning") return <AlertTriangle className="w-4 h-4 text-yellow shrink-0" />;
    if (type === "error") return <AlertCircle className="w-4 h-4 text-red shrink-0" />;
    return <Zap className="w-4 h-4 text-cyan shrink-0" />;
  };

  return (
    <div className="min-h-screen relative">
      <div className="scanline" />
      <div className="max-w-[1280px] mx-auto p-5 min-h-screen flex flex-col relative z-10">
        {/* Header */}
        <header className="flex justify-between items-center mb-5 pb-5 border-b border-border flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <Hexagon className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold tracking-[4px] uppercase">
              CODE<span className="text-primary">LENS</span>
            </h1>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[11px] font-medium tracking-[2px] text-primary border border-primary/30 rounded-full px-3 py-1 bg-primary/[0.07]">
              ✦ Powered by Gemini AI
            </span>
            <button
              onClick={() => setSidebarOpen(true)}
              className="bg-surface-3 border border-border-hover rounded-[10px] px-3.5 py-1.5 text-xs text-secondary-foreground cursor-pointer transition-all hover:border-primary hover:text-foreground flex items-center gap-1.5"
            >
              <Clock className="w-4 h-4" />
              History
            </button>
          </div>
        </header>

        {/* Main panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-[600px]">
          {/* Input Panel */}
          <div className="bg-surface-2 border border-border-hover rounded-2xl flex flex-col overflow-hidden transition-colors focus-within:border-primary/30">
            <div className="flex justify-between items-center px-4 py-2.5 border-b border-border bg-surface-3">
              <div className="flex items-center gap-2 text-[11px] font-medium tracking-[3px] uppercase text-secondary-foreground">
                <div className="w-2 h-2 rounded-full bg-yellow shadow-[0_0_6px] shadow-yellow" />
                Input
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-muted border border-border-hover rounded-lg px-2 py-1 text-[11px] text-secondary-foreground outline-none cursor-pointer transition-colors hover:border-primary"
                >
                  <option value="auto">Auto-detect</option>
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="typescript">TypeScript</option>
                  <option value="rust">Rust</option>
                  <option value="go">Go</option>
                </select>
                <select
                  value={depth}
                  onChange={(e) => setDepth(e.target.value)}
                  className="bg-muted border border-border-hover rounded-lg px-2 py-1 text-[11px] text-secondary-foreground outline-none cursor-pointer transition-colors hover:border-primary"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="expert">Expert</option>
                </select>
                <select
                  value={explanationLang}
                  onChange={(e) => setExplanationLang(e.target.value)}
                  className="bg-muted border border-border-hover rounded-lg px-2 py-1 text-[11px] text-secondary-foreground outline-none cursor-pointer transition-colors hover:border-primary"
                >
                  <option value="english">English</option>
                  <option value="hinglish">Hinglish</option>
                </select>
                <button
                  onClick={() => setCode("")}
                  className="bg-muted border border-border rounded-lg p-1 text-muted-foreground cursor-pointer transition-all hover:text-red hover:border-red"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
              <div
                ref={lineNumsRef}
                className="bg-surface-3 border-r border-border px-2 py-4 text-xs leading-[1.7] text-muted-foreground text-right select-none min-w-[42px] whitespace-pre overflow-hidden"
              >
                {lineNums}
              </div>
              <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onScroll={syncScroll}
                placeholder="// Paste your code here..."
                className="flex-1 bg-transparent border-none outline-none resize-none p-4 text-[13px] leading-[1.7] text-foreground font-mono overflow-y-auto placeholder:text-muted-foreground"
              />
            </div>

            <div className="flex justify-between items-center px-4 py-2.5 border-t border-border bg-surface-3">
              <span className="text-[11px] text-muted-foreground">{code.length} chars</span>
              <div className="flex gap-2">
                <button
                  onClick={loadSample}
                  className="bg-muted border border-border-hover rounded-[10px] px-3.5 py-1.5 text-xs text-secondary-foreground cursor-pointer transition-all hover:text-foreground"
                >
                  Try sample
                </button>
                <button
                  onClick={handleAnalyze}
                  disabled={loading || !code.trim()}
                  className="flex items-center gap-2 bg-primary text-primary-foreground border-none rounded-[10px] px-4 py-2 text-[13px] font-semibold cursor-pointer transition-all shadow-[0_0_24px_rgba(124,109,250,0.3)] hover:translate-y-[-1px] hover:shadow-[0_0_36px_rgba(124,109,250,0.5)] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
                >
                  {loading ? (
                    <div className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {loading ? "Analyzing..." : "Explain Code"}
                </button>
              </div>
            </div>
          </div>

          {/* Output Panel */}
          <div className="bg-surface-2 border border-border-hover rounded-2xl flex flex-col overflow-hidden">
            <div className="flex justify-between items-center px-4 py-2.5 border-b border-border bg-surface-3">
              <div className="flex items-center gap-2 text-[11px] font-medium tracking-[3px] uppercase text-secondary-foreground">
                <div className="w-2 h-2 rounded-full bg-green shadow-[0_0_6px] shadow-green" />
                Explanation
              </div>
              <button
                onClick={copyResult}
                disabled={!result}
                className="bg-muted border border-border rounded-lg px-2.5 py-1 text-[11px] text-muted-foreground cursor-pointer transition-all hover:text-cyan hover:border-cyan disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col">
              {/* Empty state */}
              {!loading && !result && !error && (
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
                  <Hexagon className="w-12 h-12 text-primary opacity-25" />
                  <h3 className="text-base font-semibold text-foreground">Ready to decode</h3>
                  <p className="text-[13px] text-secondary-foreground leading-[1.7]">
                    Paste any code and hit<br />
                    <strong className="text-primary">Explain Code</strong> to get started
                  </p>
                  <div className="flex flex-col gap-2 w-full max-w-[260px] mt-3">
                    {["🔍 Line-by-line breakdown", "🧠 Logic & algorithm explained", "⚠️ Bugs & improvements flagged", "📚 Concepts & terms defined"].map((f) => (
                      <div key={f} className="bg-surface-3 border border-border rounded-[10px] px-3.5 py-2 text-xs text-secondary-foreground text-left">
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Loading state */}
              {loading && (
                <div className="flex-1 flex flex-col items-center justify-center gap-6">
                  <div className="w-[52px] h-[52px] border-[3px] border-muted border-t-primary border-r-cyan rounded-full" style={{ animation: "spin-fast 0.9s linear infinite" }} />
                  <div className="text-[13px] text-secondary-foreground tracking-[3px]" style={{ animation: "blink 1.4s ease-in-out infinite" }}>
                    ANALYZING...
                  </div>
                </div>
              )}

              {/* Error state */}
              {error && (
                <div className="bg-red/[0.06] border border-red/30 rounded-xl p-5">
                  <div className="text-[10px] uppercase tracking-[3px] text-red font-semibold mb-2">Error</div>
                  <div className="text-[13px] leading-[1.7] text-foreground">{error}</div>
                </div>
              )}

              {/* Result */}
              {result && (
                <div className="flex flex-col gap-6">
                  <div className="bg-primary/[0.07] border border-primary/20 rounded-xl p-5">
                    <div className="text-[10px] uppercase tracking-[3px] text-primary font-semibold mb-2">✦ Overview — {result.language}</div>
                    <div className="text-[13px] leading-[1.75] text-foreground">{result.summary}</div>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase tracking-[3px] text-secondary-foreground font-semibold mb-3 flex items-center gap-2">
                      Line-by-line breakdown
                      <span className="flex-1 h-px bg-border" />
                    </div>
                    <div className="flex flex-col gap-2.5">
                      {result.lines.map((l, i) => (
                        <div key={i} className="bg-surface-3 border border-border rounded-[10px] overflow-hidden hover:border-border-hover transition-colors">
                          <div className="bg-muted px-3.5 py-2.5 text-xs text-cyan border-b border-border whitespace-pre-wrap break-all">{l.code}</div>
                          <div className="px-3.5 py-2.5 text-xs leading-[1.7] text-secondary-foreground">{l.explanation}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase tracking-[3px] text-secondary-foreground font-semibold mb-3 flex items-center gap-2">
                      Concepts used
                      <span className="flex-1 h-px bg-border" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {result.concepts.map((c, i) => (
                        <span key={i} className="bg-green/[0.07] border border-green/20 rounded-full px-3 py-1 text-[11px] text-green">{c}</span>
                      ))}
                    </div>
                  </div>

                  {result.issues.length > 0 && (
                    <div>
                      <div className="text-[10px] uppercase tracking-[3px] text-secondary-foreground font-semibold mb-3 flex items-center gap-2">
                        Issues & suggestions
                        <span className="flex-1 h-px bg-border" />
                      </div>
                      <div className="flex flex-col gap-2">
                        {result.issues.map((issue, i) => (
                          <div key={i} className="flex gap-2.5 p-3 bg-surface-3 border border-border rounded-[10px] text-xs leading-[1.6] text-secondary-foreground">
                            {issueIcon(issue.type)}
                            <span>{issue.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-[10px] uppercase tracking-[3px] text-secondary-foreground font-semibold mb-3 flex items-center gap-2">
                      Complexity
                      <span className="flex-1 h-px bg-border" />
                    </div>
                    <div className="flex gap-2.5">
                      <div className="bg-surface-3 border border-border-hover rounded-[10px] px-3.5 py-2 text-xs text-secondary-foreground">
                        <strong className="text-yellow">Time:</strong> {result.complexity.time}
                      </div>
                      <div className="bg-surface-3 border border-border-hover rounded-[10px] px-3.5 py-2 text-xs text-secondary-foreground">
                        <strong className="text-yellow">Space:</strong> {result.complexity.space}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* History Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-background/70 z-[199] backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}
      <div className={`fixed top-0 right-0 w-80 h-full bg-surface-2 border-l border-border-hover z-[200] flex flex-col shadow-[-8px_0_40px_rgba(0,0,0,0.4)] transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex justify-between items-center p-5 border-b border-border">
          <span className="text-[11px] font-bold tracking-[3px] uppercase text-secondary-foreground">Recent Explanations</span>
          <button onClick={() => setSidebarOpen(false)} className="bg-muted border border-border rounded-lg p-1 text-muted-foreground cursor-pointer transition-all hover:text-red hover:border-red">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {history.length === 0 ? (
            <div className="flex items-center justify-center h-full text-[13px] text-muted-foreground">No history yet</div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                onClick={() => loadFromHistory(item)}
                className="bg-surface-3 border border-border rounded-[10px] p-3 cursor-pointer transition-all hover:border-primary"
              >
                <div className="text-[9px] uppercase tracking-[3px] text-primary mb-1">{item.lang}</div>
                <div className="text-[11px] text-secondary-foreground mb-1 whitespace-nowrap overflow-hidden text-ellipsis">{item.code}...</div>
                <div className="text-[10px] text-muted-foreground">{item.time}</div>
              </div>
            ))
          )}
        </div>
        <button
          onClick={clearHistory}
          className="mx-4 mb-4 p-2 border border-border rounded-[10px] text-[11px] text-muted-foreground cursor-pointer transition-all hover:border-red hover:text-red bg-transparent flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Clear history
        </button>
      </div>
    </div>
  );
};

export default CodeLens;
