import { useState } from "react";
import { motion } from "framer-motion";
import {
  Brain, ArrowRight, Shield, ExternalLink, Youtube, BookOpen,
  Lightbulb, Code2, Globe, Shapes, BriefcaseBusiness,
  BarChart3, TrendingUp,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Checkbox } from "@/components/ui/checkbox";

export interface RubricScores {
  understanding: number;
  analysis: number;
  application: number;
  clarity: number;
  depth: number;
}

export interface ExplorationNode {
  query: string;
  answer: string;
  concepts: string[];
  references?: { title: string; url: string; type: string }[];
  safetyNote?: string;
  explanationMode?: string;
  rubricScores?: RubricScores;
}

interface ExplorationCardProps {
  node: ExplorationNode;
  index: number;
  isLatest: boolean;
  mode: string;
  onConceptClick: (concept: string) => void;
  onExplanationMode: (query: string, explMode: string) => void;
}

const allExplanationModes = [
  { id: "simple", label: "Simple", icon: Lightbulb, desc: "Easy to understand", color: "text-emerald-400", modes: ["child", "student", "parent", "professional", "research"] },
  { id: "technical", label: "Technical", icon: Code2, desc: "In-depth technical", color: "text-blue-400", modes: ["student", "professional", "research"] },
  { id: "reallife", label: "Real-life", icon: Globe, desc: "Real examples", color: "text-amber-400", modes: ["student", "professional", "parent", "research"] },
  { id: "analogy", label: "Analogy", icon: Shapes, desc: "Creative metaphors", color: "text-purple-400", modes: ["student", "professional", "parent", "research"] },
  { id: "interview", label: "Interview", icon: BriefcaseBusiness, desc: "Interview prep", color: "text-pink-400", modes: ["student", "professional", "research"] },
];

const rubricLabels: Record<string, { label: string; icon: typeof Brain }> = {
  understanding: { label: "Core Concepts", icon: Brain },
  analysis: { label: "Critical Analysis", icon: TrendingUp },
  application: { label: "Application", icon: Globe },
  clarity: { label: "Clarity", icon: Lightbulb },
  depth: { label: "Depth", icon: BarChart3 },
};

const ExplorationCard = ({ node, index, isLatest, mode, onConceptClick, onExplanationMode }: ExplorationCardProps) => {
  const modeLabel = node.explanationMode
    ? allExplanationModes.find((m) => m.id === node.explanationMode)?.label
    : null;

  // Filter explanation modes based on the current user mode
  const explanationModes = allExplanationModes.filter((m) => m.modes.includes(mode));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="glass-panel overflow-hidden"
    >
      {/* Header with gradient accent */}
      <div className={`px-6 pt-5 pb-4 border-b border-border/30 ${
        mode === "child" ? "bg-gradient-to-r from-emerald-500/5 to-yellow-500/5" :
        mode === "research" ? "bg-gradient-to-r from-violet-500/5 to-blue-500/5" :
        "bg-gradient-to-r from-primary/5 to-accent/5"
      }`}>
        <div className="flex items-start gap-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.1 }}
            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              mode === "child" ? "bg-emerald-500/15 border border-emerald-500/20" :
              mode === "research" ? "bg-violet-500/15 border border-violet-500/20" :
              "bg-primary/10 border border-primary/20"
            }`}
          >
            <span className="text-xs font-bold text-primary">{index + 1}</span>
          </motion.div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-foreground mb-0.5 truncate">{node.query}</h3>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">Level {index + 1}</span>
              {modeLabel && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {modeLabel} mode
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-5">
        {/* Child mode safety note */}
        {mode === "child" && node.safetyNote && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="text-xs text-emerald-300">{node.safetyNote}</span>
          </motion.div>
        )}

        {/* Answer - markdown rendered */}
        <div className={`mb-5 text-foreground/85 text-sm leading-relaxed prose prose-invert prose-sm max-w-none prose-p:my-2 prose-headings:text-foreground prose-strong:text-primary prose-table:border-border prose-th:border-border prose-td:border-border prose-th:bg-secondary/50 prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2 ${
          mode === "child" ? "text-base leading-relaxed" : ""
        }`}>
          <ReactMarkdown>{node.answer}</ReactMarkdown>
        </div>

        {/* Rubric scores */}
        {node.rubricScores && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-5 glass-panel p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">Response Quality Score</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {Math.round(
                  ((node.rubricScores.understanding + node.rubricScores.analysis +
                    node.rubricScores.application + node.rubricScores.clarity +
                    node.rubricScores.depth) / 50) * 100
                )}%
              </span>
            </div>
            <div className="space-y-2">
              {Object.entries(node.rubricScores).map(([key, value]) => {
                const info = rubricLabels[key];
                if (!info) return null;
                const RIcon = info.icon;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <RIcon className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-[11px] text-muted-foreground w-24 flex-shrink-0">{info.label}</span>
                    <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(value as number / 10) * 100}%` }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className={`h-full rounded-full ${
                          (value as number) >= 8 ? "bg-emerald-400" :
                          (value as number) >= 6 ? "bg-primary" : "bg-amber-400"
                        }`}
                      />
                    </div>
                    <span className="text-[11px] font-mono text-foreground w-5 text-right">{value as number}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Explanation modes — filtered by user mode */}
        {isLatest && explanationModes.length > 0 && (
          <div className="mb-5">
            <p className="text-xs text-muted-foreground mb-2.5 font-medium">Explain this differently:</p>
            <div className="flex flex-wrap gap-2">
              {explanationModes.map((opt) => (
                <motion.button
                  key={opt.id}
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onExplanationMode(node.query, opt.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary/60 border border-border text-xs hover:border-primary/30 transition-all group ${
                    node.explanationMode === opt.id ? "border-primary/40 bg-primary/10" : ""
                  }`}
                >
                  <opt.icon className={`w-3.5 h-3.5 ${opt.color} group-hover:scale-110 transition-transform`} />
                  <div className="text-left">
                    <div className="text-foreground/80 font-medium">{opt.label}</div>
                    <div className="text-[9px] text-muted-foreground">{opt.desc}</div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Concept Chips with checkboxes — ordered simple→hard */}
        {isLatest && <ConceptSelector concepts={node.concepts} onConceptClick={onConceptClick} />}

        {/* References */}
        {node.references && node.references.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3 h-3" />
              References & Resources
            </p>
            <div className="flex flex-wrap gap-2">
              {node.references.map((ref, i) => (
                <a key={i} href={ref.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/40 border border-border text-xs text-muted-foreground hover:text-primary hover:border-primary/30 transition-all">
                  {ref.type === "video" ? <Youtube className="w-3 h-3" /> : <ExternalLink className="w-3 h-3" />}
                  {ref.title}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

/* ── Concept Selector with checkboxes ── */
const ConceptSelector = ({ concepts, onConceptClick }: { concepts: string[]; onConceptClick: (c: string) => void }) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleConcept = (concept: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(concept)) next.delete(concept);
      else next.add(concept);
      return next;
    });
  };

  const exploreSelected = () => {
    const joined = Array.from(selected).join(", ");
    onConceptClick(joined);
    setSelected(new Set());
  };

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
        <Brain className="w-3 h-3" />
        Key concepts — simple → advanced
      </p>
      <p className="text-[10px] text-muted-foreground mb-3">
        Click arrow for one, or check multiple then explore together
      </p>
      <div className="space-y-1.5">
        {concepts.map((concept, i) => (
          <motion.div
            key={concept}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
              selected.has(concept)
                ? "bg-primary/10 border-primary/40"
                : "bg-primary/5 border-primary/20 hover:border-primary/30"
            }`}
          >
            <Checkbox
              checked={selected.has(concept)}
              onCheckedChange={() => toggleConcept(concept)}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <span className="flex-1 text-sm text-foreground/80">{concept}</span>
            <span className="text-[9px] text-muted-foreground mr-1">
              {i === 0 ? "Basic" : i === concepts.length - 1 ? "Advanced" : `Level ${i + 1}`}
            </span>
            <motion.button
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onConceptClick(concept)}
              className="p-1 rounded hover:bg-primary/20 text-primary transition-colors"
              title={`Explore "${concept}"`}
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          </motion.div>
        ))}
      </div>
      {selected.size > 1 && (
        <motion.button
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={exploreSelected}
          className="mt-3 w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 transition-all"
        >
          <Brain className="w-4 h-4" />
          Explore {selected.size} concepts together
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      )}
    </div>
  );
};

export default ExplorationCard;
