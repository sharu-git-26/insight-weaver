import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Search, ArrowRight, Loader2,
  Baby, GraduationCap, Briefcase, Users, FlaskConical,
  PanelLeftClose, PanelLeftOpen, Sparkles, LogOut, ImageIcon, Plus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import rueLogo from "@/assets/rue-logo.png";
import UnderstandingScore from "@/components/explore/UnderstandingScore";
import KnowledgeMap from "@/components/explore/KnowledgeMap";
import ExplorationCard, { type ExplorationNode, type RubricScores } from "@/components/explore/ExplorationCard";
import ExplorationPath from "@/components/explore/ExplorationPath";
import VoiceSearchButton from "@/components/explore/VoiceSearchButton";
import FeedbackPanel from "@/components/explore/FeedbackPanel";
import HelpDesk from "@/components/explore/HelpDesk";
import ChildImagePopup from "@/components/explore/ChildImagePopup";


const modeConfig: Record<string, { label: string; emoji: string; icon: typeof Brain; color: string }> = {
  child: { label: "Child", emoji: "🧒", icon: Baby, color: "text-emerald-400" },
  student: { label: "Student", emoji: "📚", icon: GraduationCap, color: "text-blue-400" },
  professional: { label: "Professional", emoji: "💼", icon: Briefcase, color: "text-amber-400" },
  parent: { label: "Parent", emoji: "👨‍👩‍👧", icon: Users, color: "text-pink-400" },
  research: { label: "Research", emoji: "🔬", icon: FlaskConical, color: "text-violet-400" },
};

const modeSuggestions: Record<string, string[]> = {
  child: ["What are stars made of? ⭐", "Why is the sky blue? 🌈", "How do computers think? 🤖"],
  student: ["Explain photosynthesis", "What is calculus used for?", "How does DNA replication work?"],
  professional: ["Emerging AI trends 2026", "What is RAG architecture?", "Explain quantum computing in business"],
  parent: ["How to explain internet safety?", "What is screen time balance?", "How to discuss AI with kids?"],
  research: ["Statistical significance vs p-hacking", "Transformer attention mechanisms", "Meta-analysis methodology"],
};

const ExplorePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const mode = searchParams.get("mode") || "student";
  const currentMode = modeConfig[mode] || modeConfig.student;

  const [query, setQuery] = useState("");
  const [explorationStack, setExplorationStack] = useState<ExplorationNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [maxDepth, setMaxDepth] = useState(0);
  const [leftOpen, setLeftOpen] = useState(true);
  const [latestRubric, setLatestRubric] = useState<RubricScores | null>(null);
  const [sessionId] = useState(() => crypto.randomUUID());

  // Child mode image popup
  const [childImageTopic, setChildImageTopic] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  // Save exploration to database
  const saveExploration = useCallback(
    async (node: ExplorationNode, depthLevel: number) => {
      if (!user) return;
      try {
        const insertData: any = {
          user_id: user.id,
          mode,
          query: node.query,
          answer: node.answer,
          concepts: node.concepts,
          refs: JSON.parse(JSON.stringify(node.references || [])),
          explanation_mode: node.explanationMode || null,
          rubric_scores: node.rubricScores ? JSON.parse(JSON.stringify(node.rubricScores)) : null,
          depth_level: depthLevel,
          session_id: sessionId,
        };
        await supabase.from("explorations").insert(insertData);
      } catch (err) {
        console.error("Failed to save exploration:", err);
      }
    },
    [user, mode, sessionId]
  );

  const handleAsk = useCallback(
    async (q: string, style?: "balance" | "simplify" | "deeper", explanationMode?: string) => {
      if (!q.trim()) return;
      setIsLoading(true);
      setQuery("");

      try {
        const { data, error } = await supabase.functions.invoke("explore-ai", {
          body: { query: q, mode, style, explanationMode },
        });

        if (error) {
          console.error("Edge function error:", error);
          toast.error("Failed to get AI response. Please try again.");
          setIsLoading(false);
          return;
        }

        if (data?.error) {
          toast.error(data.error);
          setIsLoading(false);
          return;
        }

        const rubric = data.rubricScores || null;
        if (rubric) setLatestRubric(rubric);

        const node: ExplorationNode = {
          query: q,
          answer: data.answer || "No response received.",
          concepts: data.concepts || ["Related Topics", "Deep Dive", "Applications"],
          references: data.references || [],
          safetyNote: mode === "child" ? "✅ Content verified safe for young learners" : undefined,
          explanationMode: explanationMode || undefined,
          rubricScores: rubric,
        };

        setExplorationStack((prev) => {
          const next = [...prev, node];
          if (next.length > maxDepth) setMaxDepth(next.length);
          return next;
        });

        // Save to database
        saveExploration(node, explorationStack.length);

        // Show image popup for child mode
        if (mode === "child") {
          setChildImageTopic(q);
        }
      } catch (err) {
        console.error("Request failed:", err);
        toast.error("Connection error. Please try again.");
      }

      setIsLoading(false);
    },
    [mode, maxDepth, saveExploration, explorationStack.length]
  );

  const handlePathClick = (index: number) => {
    setExplorationStack((prev) => prev.slice(0, index + 1));
  };

  const handleReset = () => {
    setExplorationStack([]);
    setQuery("");
    setLatestRubric(null);
  };

  const handleRestoreSession = (nodes: ExplorationNode[]) => {
    setExplorationStack(nodes);
    setMaxDepth(nodes.length);
    if (nodes.length > 0 && nodes[nodes.length - 1].rubricScores) {
      setLatestRubric(nodes[nodes.length - 1].rubricScores!);
    }
  };

  const handleExplanationMode = (q: string, explMode: string) => {
    handleAsk(q, undefined, explMode);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleNewChat = () => {
    handleReset();
    toast.success("New chat started!");
  };

  // Extract display name from email
  const displayName = user?.email
    ? user.email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Explorer";

  const graphNodes = explorationStack.map((n, i) => ({ query: n.query, depth: i }));

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background bg-gradient-mesh flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-xl bg-background/60 sticky top-0 z-50">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLeftOpen(!leftOpen)}
              className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors hidden lg:flex"
              title="Toggle sidebar"
            >
              {leftOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>
            <img src={rueLogo} alt="RUE" className="w-8 h-8" width={512} height={512} />
            <span className="font-display font-bold text-foreground">RUE</span>
            <span className="text-muted-foreground text-sm hidden sm:inline">Recursive Understanding Engine</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden md:inline">Hi, {displayName} 👋</span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNewChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-sm text-primary hover:bg-primary/20 transition-all"
              title="Start new chat"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Chat</span>
            </motion.button>
            <button
              onClick={() => navigate("/mode-select")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border text-sm hover:border-primary/30 transition-colors"
            >
              <span>{currentMode.emoji}</span>
              <span className="text-foreground/80">{currentMode.label}</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border text-sm text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-all"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* SINGLE LEFT SIDEBAR */}
        <AnimatePresence>
          {leftOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="hidden lg:flex flex-col border-r border-border/50 bg-background/80 overflow-hidden flex-shrink-0"
            >
              <div className="p-4 space-y-4 overflow-y-auto flex-1" style={{ scrollbarWidth: "thin" }}>
                <UnderstandingScore
                  explorationCount={explorationStack.length}
                  maxDepth={maxDepth}
                  mode={mode}
                  latestRubric={latestRubric}
                />

                <div className="border-t border-border/30 pt-4">
                  <KnowledgeMap
                    currentNodes={graphNodes}
                    currentSessionId={sessionId}
                    mode={mode}
                    onNodeClick={handlePathClick}
                    onRestoreSession={handleRestoreSession}
                  />
                </div>

                <div className="border-t border-border/30 pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-display font-semibold text-foreground">Exploration Path</span>
                  </div>
                  <ExplorationPath nodes={explorationStack} onNodeClick={handlePathClick} onReset={handleReset} />
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* MAIN CONTENT */}
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* Mobile score bar */}
          <div className="lg:hidden p-3 border-b border-border/30">
            <div className="flex items-center gap-3">
              <Brain className="w-5 h-5 text-primary" />
              <div>
                <div className="text-xs text-muted-foreground">Score</div>
                <div className="text-lg font-display font-bold text-foreground">
                  {explorationStack.length * 10 + maxDepth * 5}
                </div>
              </div>
              <div className="flex-1" />
              <div className="text-center">
                <div className="text-[10px] text-muted-foreground">Explored</div>
                <div className="text-sm font-bold text-primary">{explorationStack.length}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-muted-foreground">Depth</div>
                <div className="text-sm font-bold text-accent">{maxDepth}</div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="max-w-3xl mx-auto">
              {/* Empty state */}
              {explorationStack.length === 0 && !isLoading && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
                  <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity }}>
                    <Brain className="w-16 h-16 text-primary mx-auto mb-6 opacity-60" />
                  </motion.div>
                  <h2 className="text-2xl font-display font-bold text-foreground mb-3">
                    Hi {displayName}! 👋 What do you want to understand?
                  </h2>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                    Ask any question. We'll break it down layer by layer until you truly get it.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
                    {(modeSuggestions[mode] || modeSuggestions.student).map((suggestion) => (
                      <motion.button key={suggestion} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleAsk(suggestion)} className="px-4 py-2 rounded-full bg-secondary/50 border border-border text-sm text-foreground/80 hover:border-primary/40 hover:text-primary transition-all">
                        {suggestion}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Cards */}
              <div className="space-y-6">
                <AnimatePresence>
                  {explorationStack.map((node, i) => (
                    <ExplorationCard
                      key={`${i}-${node.explanationMode || "default"}`}
                      node={node}
                      index={i}
                      isLatest={i === explorationStack.length - 1}
                      mode={mode}
                      onConceptClick={(c) => handleAsk(c)}
                      onExplanationMode={handleExplanationMode}
                    />
                  ))}
                </AnimatePresence>

                {isLoading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-6 flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      {mode === "child" ? "🧠 Thinking of a fun way to explain..." : "Analyzing and breaking down concepts..."}
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Child mode: show image button for latest card */}
              {mode === "child" && explorationStack.length > 0 && !isLoading && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setChildImageTopic(explorationStack[explorationStack.length - 1].query)}
                  className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 text-sm text-primary hover:bg-primary/20 transition-all mx-auto"
                >
                  <ImageIcon className="w-4 h-4" />
                  Show me a picture! 🎨
                </motion.button>
              )}

              {/* Input */}
              <div className="sticky bottom-0 mt-8 pb-4 bg-gradient-to-t from-background via-background/95 to-transparent pt-6">
                <div className="glass-panel p-2 glow-primary">
                  <form onSubmit={(e) => { e.preventDefault(); handleAsk(query); }} className="flex items-center gap-2">
                    <Search className="w-5 h-5 text-muted-foreground ml-3 flex-shrink-0" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={explorationStack.length === 0 ? "Ask any question to begin exploring..." : "Ask a follow-up or type a concept..."}
                      className="flex-1 bg-transparent py-3 px-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                      disabled={isLoading}
                    />
                    <VoiceSearchButton onResult={(text) => { setQuery(text); handleAsk(text); }} disabled={isLoading} />
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit" disabled={isLoading || !query.trim()} className="bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-30 transition-opacity flex items-center gap-1.5">
                      Explore
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Child image popup */}
      {childImageTopic && (
        <ChildImagePopup
          topic={childImageTopic}
          show={!!childImageTopic}
          onClose={() => setChildImageTopic(null)}
        />
      )}

      {/* Floating panels */}
      <FeedbackPanel />
      <HelpDesk />
    </div>
  );
};

export default ExplorePage;
