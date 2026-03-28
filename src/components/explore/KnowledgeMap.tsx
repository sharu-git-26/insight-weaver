import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Network, ChevronRight, Trash2, Clock, History, Maximize2, X, GitBranch, Layers } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { ExplorationNode, RubricScores } from "./ExplorationCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/* ── Types ── */
interface HistorySession {
  session_id: string;
  mode: string;
  queries: string[];
  created_at: string;
  nodes: ExplorationNode[];
}

interface TreeNode {
  label: string;
  mode: string;
  depth: number;
  children: TreeNode[];
  isSession?: boolean;
  sessionId?: string;
}

interface KnowledgeMapProps {
  currentNodes: { query: string; depth: number }[];
  currentSessionId: string;
  mode: string;
  onNodeClick: (index: number) => void;
  onRestoreSession: (nodes: ExplorationNode[]) => void;
}

const modeColors: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  child: { bg: "fill-emerald-500/15", border: "stroke-emerald-500/40", text: "fill-emerald-300", dot: "fill-emerald-400" },
  student: { bg: "fill-blue-500/15", border: "stroke-blue-500/40", text: "fill-blue-300", dot: "fill-blue-400" },
  professional: { bg: "fill-amber-500/15", border: "stroke-amber-500/40", text: "fill-amber-300", dot: "fill-amber-400" },
  parent: { bg: "fill-pink-500/15", border: "stroke-pink-500/40", text: "fill-pink-300", dot: "fill-pink-400" },
  research: { bg: "fill-violet-500/15", border: "stroke-violet-500/40", text: "fill-violet-300", dot: "fill-violet-400" },
};

const modeLabels: Record<string, string> = {
  child: "🧒 Child", student: "📚 Student", professional: "💼 Professional",
  parent: "👨‍👩‍👧 Parent", research: "🔬 Research",
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
};

/* ── Sidebar compact view ── */
const KnowledgeMap = ({ currentNodes, currentSessionId, mode, onNodeClick, onRestoreSession }: KnowledgeMapProps) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadHistory();
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("explorations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      if (error) throw error;

      const grouped: Record<string, HistorySession> = {};
      for (const row of data || []) {
        if (row.session_id === currentSessionId) continue;
        if (!grouped[row.session_id]) {
          grouped[row.session_id] = { session_id: row.session_id, mode: row.mode, queries: [], created_at: row.created_at, nodes: [] };
        }
        grouped[row.session_id].queries.push(row.query);
        grouped[row.session_id].nodes.push({
          query: row.query, answer: row.answer, concepts: row.concepts || [],
          references: Array.isArray(row.refs) ? (row.refs as any[]) : [],
          explanationMode: row.explanation_mode || undefined,
          rubricScores: row.rubric_scores as unknown as RubricScores | undefined,
        });
      }
      setSessions(Object.values(grouped).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (err) { console.error("Failed to load history:", err); }
    setIsLoading(false);
  };

  const deleteSession = async (sessionId: string) => {
    if (!user) return;
    await supabase.from("explorations").delete().eq("session_id", sessionId).eq("user_id", user.id);
    setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
  };

  // Build tree for fullscreen view
  const treeData = useMemo(() => {
    const roots: TreeNode[] = [];

    // Current session
    if (currentNodes.length > 0) {
      const current: TreeNode = { label: "Current Session", mode, depth: 0, children: [], isSession: true };
      let parent = current;
      currentNodes.forEach((n, i) => {
        const child: TreeNode = { label: n.query, mode, depth: i + 1, children: [] };
        if (i === 0) current.children.push(child);
        else parent.children.push(child);
        parent = child;
      });
      roots.push(current);
    }

    // History sessions grouped by mode
    const byMode: Record<string, HistorySession[]> = {};
    sessions.forEach((s) => {
      if (!byMode[s.mode]) byMode[s.mode] = [];
      byMode[s.mode].push(s);
    });

    Object.entries(byMode).forEach(([m, modeSessions]) => {
      const modeRoot: TreeNode = { label: modeLabels[m] || m, mode: m, depth: 0, children: [], isSession: true };
      modeSessions.forEach((s) => {
        const sessNode: TreeNode = { label: s.queries[0] || "Session", mode: m, depth: 1, children: [], isSession: true, sessionId: s.session_id };
        let parent = sessNode;
        s.queries.slice(1).forEach((q, i) => {
          const child: TreeNode = { label: q, mode: m, depth: i + 2, children: [] };
          parent.children.push(child);
          parent = child;
        });
        modeRoot.children.push(sessNode);
      });
      roots.push(modeRoot);
    });

    return roots;
  }, [currentNodes, sessions, mode]);

  return (
    <>
      <div className="glass-panel p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">Knowledge Map</span>
          </div>
          <button
            onClick={() => setFullscreen(true)}
            className="p-1 rounded hover:bg-secondary/50 text-muted-foreground hover:text-primary transition-colors"
            title="View fullscreen graph"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Current session mini-graph */}
        {currentNodes.length > 0 && (
          <div className="mb-3">
            <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider">Current · {modeLabels[mode]}</p>
            <div className="space-y-0.5 max-h-32 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
              {currentNodes.map((node, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => onNodeClick(i)}
                  className={`w-full text-left flex items-center gap-1.5 px-2 py-1 rounded text-[11px] transition-colors hover:bg-secondary/40 ${
                    i === currentNodes.length - 1 ? "text-primary font-medium" : "text-muted-foreground"
                  }`}
                  style={{ paddingLeft: `${8 + node.depth * 12}px` }}
                >
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${i === currentNodes.length - 1 ? "bg-primary" : "bg-muted-foreground/40"}`} />
                  <span className="truncate">{node.query}</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* History sessions */}
        <div className="border-t border-border/30 pt-2">
          <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider flex items-center gap-1">
            <History className="w-3 h-3" /> Past Sessions
          </p>
          {isLoading ? (
            <div className="text-center py-3">
              <Clock className="w-3 h-3 mx-auto text-muted-foreground animate-pulse" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-[10px] text-muted-foreground text-center py-2">No past sessions</p>
          ) : (
            <div className="space-y-0.5 max-h-40 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
              {sessions.map((s) => (
                <div key={s.session_id} className="rounded overflow-hidden">
                  <button
                    onClick={() => setExpanded(expanded === s.session_id ? null : s.session_id)}
                    className="w-full p-2 flex items-center gap-1.5 text-left hover:bg-secondary/30 transition-colors"
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      s.mode === "child" ? "bg-emerald-400" : s.mode === "student" ? "bg-blue-400" :
                      s.mode === "professional" ? "bg-amber-400" : s.mode === "parent" ? "bg-pink-400" : "bg-violet-400"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-foreground truncate">{s.queries[0]}</p>
                      <p className="text-[9px] text-muted-foreground">{formatDate(s.created_at)} · {s.queries.length} deep · {modeLabels[s.mode]}</p>
                    </div>
                    <ChevronRight className={`w-3 h-3 text-muted-foreground transition-transform ${expanded === s.session_id ? "rotate-90" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {expanded === s.session_id && (
                      <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="px-2 pb-2 space-y-0.5">
                          {s.queries.map((q, i) => (
                            <p key={i} className="text-[10px] text-muted-foreground truncate" style={{ paddingLeft: `${8 + i * 8}px` }}>
                              <span className="text-primary/50">↳</span> {q}
                            </p>
                          ))}
                          <div className="flex gap-2 pt-1">
                            <button onClick={() => onRestoreSession(s.nodes)} className="text-[10px] text-primary hover:underline">Restore</button>
                            <button onClick={() => deleteSession(s.session_id)} className="text-[10px] text-destructive hover:underline flex items-center gap-0.5">
                              <Trash2 className="w-2.5 h-2.5" /> Delete
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen interactive graph */}
      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent className="max-w-[95vw] w-[95vw] max-h-[90vh] h-[90vh] bg-background/95 backdrop-blur-xl border-border p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-5 pb-3 border-b border-border/30">
            <DialogTitle className="flex items-center gap-2 text-foreground font-display">
              <Network className="w-5 h-5 text-primary" />
              Knowledge Map — Full View
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-6">
            <FullscreenGraph
              treeData={treeData}
              onRestoreSession={(sid) => {
                const s = sessions.find((x) => x.session_id === sid);
                if (s) { onRestoreSession(s.nodes); setFullscreen(false); }
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

/* ── Fullscreen interactive tree ── */
interface FullscreenGraphProps {
  treeData: TreeNode[];
  onRestoreSession: (sessionId: string) => void;
}

interface LayoutNode {
  node: TreeNode;
  x: number;
  y: number;
  parentX?: number;
  parentY?: number;
}

const FullscreenGraph = ({ treeData, onRestoreSession }: FullscreenGraphProps) => {
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

  // Flatten tree into positioned nodes
  const { layoutNodes, svgWidth, svgHeight } = useMemo(() => {
    const nodes: LayoutNode[] = [];
    const nodeW = 200;
    const nodeH = 36;
    const gapX = 40;
    const gapY = 60;
    let currentX = 40;

    const layoutTree = (treeNode: TreeNode, depth: number, parentX?: number, parentY?: number) => {
      const x = currentX;
      const y = 40 + depth * (nodeH + gapY);
      nodes.push({ node: treeNode, x, y, parentX, parentY });

      if (treeNode.children.length === 0) {
        currentX += nodeW + gapX;
      } else {
        treeNode.children.forEach((child) => {
          layoutTree(child, depth + 1, x + nodeW / 2, y + nodeH);
        });
      }
    };

    treeData.forEach((root) => {
      layoutTree(root, 0);
      currentX += 20; // gap between root groups
    });

    return {
      layoutNodes: nodes,
      svgWidth: Math.max(currentX, 600),
      svgHeight: Math.max(...nodes.map((n) => n.y + 60), 400),
    };
  }, [treeData]);

  if (treeData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No exploration data yet</p>
          <p className="text-xs mt-1">Start exploring to build your knowledge map</p>
        </div>
      </div>
    );
  }

  const nodeW = 200;
  const nodeH = 36;

  return (
    <div className="overflow-auto w-full h-full" style={{ scrollbarWidth: "thin" }}>
      <svg width={svgWidth} height={svgHeight} className="min-w-full">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Gradient for connectors per mode */}
          {Object.entries(modeColors).map(([m]) => (
            <linearGradient key={m} id={`grad-${m}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={
                m === "child" ? "hsl(160 72% 50%)" : m === "student" ? "hsl(217 72% 60%)" :
                m === "professional" ? "hsl(38 92% 50%)" : m === "parent" ? "hsl(340 72% 60%)" : "hsl(270 72% 60%)"
              } stopOpacity="0.6" />
              <stop offset="100%" stopColor={
                m === "child" ? "hsl(160 72% 50%)" : m === "student" ? "hsl(217 72% 60%)" :
                m === "professional" ? "hsl(38 92% 50%)" : m === "parent" ? "hsl(340 72% 60%)" : "hsl(270 72% 60%)"
              } stopOpacity="0.2" />
            </linearGradient>
          ))}
        </defs>

        {/* Connector lines */}
        {layoutNodes.filter((n) => n.parentX != null).map((n, i) => (
          <motion.path
            key={`line-${i}`}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: i * 0.02 }}
            d={`M ${n.parentX} ${n.parentY} C ${n.parentX} ${n.parentY! + 30}, ${n.x + nodeW / 2} ${n.y - 30}, ${n.x + nodeW / 2} ${n.y}`}
            fill="none"
            stroke={`url(#grad-${n.node.mode})`}
            strokeWidth={2}
            strokeDasharray={n.node.isSession ? "none" : "6 3"}
          />
        ))}

        {/* Nodes */}
        {layoutNodes.map((ln, i) => {
          const isHovered = hoveredLabel === ln.node.label;
          const isSession = ln.node.isSession;
          const modeColor = ln.node.mode;
          const dotColor = modeColor === "child" ? "hsl(160 72% 50%)" : modeColor === "student" ? "hsl(217 72% 60%)" :
            modeColor === "professional" ? "hsl(38 92% 50%)" : modeColor === "parent" ? "hsl(340 72% 60%)" : "hsl(270 72% 60%)";

          return (
            <motion.g
              key={`node-${i}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.03 }}
              onMouseEnter={() => setHoveredLabel(ln.node.label)}
              onMouseLeave={() => setHoveredLabel(null)}
              onClick={() => ln.node.sessionId && onRestoreSession(ln.node.sessionId)}
              className={ln.node.sessionId ? "cursor-pointer" : ""}
            >
              {/* Shadow/glow */}
              {isHovered && (
                <rect x={ln.x - 2} y={ln.y - 2} width={nodeW + 4} height={nodeH + 4} rx={10} fill={dotColor} opacity={0.15} filter="url(#glow)" />
              )}
              <rect
                x={ln.x} y={ln.y} width={nodeW} height={nodeH} rx={8}
                fill={isSession ? "hsl(220 18% 13%)" : "hsl(220 18% 10%)"}
                stroke={isHovered ? dotColor : "hsl(220 14% 20%)"}
                strokeWidth={isHovered ? 2 : 1}
                opacity={0.95}
              />
              {/* Mode dot */}
              <circle cx={ln.x + 14} cy={ln.y + nodeH / 2} r={4} fill={dotColor} />
              {/* Depth indicator */}
              {!isSession && ln.node.depth > 0 && (
                <text x={ln.x + nodeW - 12} y={ln.y + nodeH / 2 + 3} fontSize={8} fill="hsl(220 14% 45%)" textAnchor="end">
                  L{ln.node.depth}
                </text>
              )}
              {/* Label */}
              <text x={ln.x + 26} y={ln.y + nodeH / 2 + 4} fontSize={isSession ? 11 : 10} fontWeight={isSession ? 600 : 400}
                fill={isHovered ? dotColor : "hsl(210 40% 90%)"} className="select-none">
                {ln.node.label.length > 22 ? ln.node.label.slice(0, 22) + "…" : ln.node.label}
              </text>
            </motion.g>
          );
        })}

        {/* Legend */}
        <g transform={`translate(${svgWidth - 180}, 10)`}>
          <rect x={0} y={0} width={170} height={Object.keys(modeLabels).length * 20 + 30} rx={8} fill="hsl(220 18% 10% / 0.9)" stroke="hsl(220 14% 20%)" />
          <text x={12} y={18} fontSize={10} fontWeight={600} fill="hsl(210 40% 80%)">Mode Legend</text>
          {Object.entries(modeLabels).map(([m, label], idx) => {
            const dotColor = m === "child" ? "hsl(160 72% 50%)" : m === "student" ? "hsl(217 72% 60%)" :
              m === "professional" ? "hsl(38 92% 50%)" : m === "parent" ? "hsl(340 72% 60%)" : "hsl(270 72% 60%)";
            return (
              <g key={m} transform={`translate(12, ${30 + idx * 20})`}>
                <circle cx={6} cy={0} r={4} fill={dotColor} />
                <text x={16} y={4} fontSize={10} fill="hsl(210 40% 80%)">{label}</text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};

export default KnowledgeMap;
