import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Network, ChevronRight, Trash2, Clock, History, Maximize2, X, GitBranch, Layers } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { ExplorationNode, RubricScores } from "./ExplorationCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  MarkerType,
  Position,
  Handle,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

/* ── Types ── */
interface HistorySession {
  session_id: string;
  mode: string;
  queries: string[];
  created_at: string;
  nodes: ExplorationNode[];
}

interface KnowledgeMapProps {
  currentNodes: { query: string; depth: number }[];
  currentSessionId: string;
  mode: string;
  onNodeClick: (index: number) => void;
  onRestoreSession: (nodes: ExplorationNode[]) => void;
}

const modeColorMap: Record<string, { bg: string; border: string; glow: string; dot: string; text: string }> = {
  child: { bg: "rgba(16, 185, 129, 0.12)", border: "rgba(16, 185, 129, 0.5)", glow: "rgba(16, 185, 129, 0.25)", dot: "#10b981", text: "#6ee7b7" },
  student: { bg: "rgba(59, 130, 246, 0.12)", border: "rgba(59, 130, 246, 0.5)", glow: "rgba(59, 130, 246, 0.25)", dot: "#3b82f6", text: "#93c5fd" },
  professional: { bg: "rgba(245, 158, 11, 0.12)", border: "rgba(245, 158, 11, 0.5)", glow: "rgba(245, 158, 11, 0.25)", dot: "#f59e0b", text: "#fcd34d" },
  parent: { bg: "rgba(236, 72, 153, 0.12)", border: "rgba(236, 72, 153, 0.5)", glow: "rgba(236, 72, 153, 0.25)", dot: "#ec4899", text: "#f9a8d4" },
  research: { bg: "rgba(139, 92, 246, 0.12)", border: "rgba(139, 92, 246, 0.5)", glow: "rgba(139, 92, 246, 0.25)", dot: "#8b5cf6", text: "#c4b5fd" },
};

const modeLabels: Record<string, string> = {
  child: "🧒 Child", student: "📚 Student", professional: "💼 Professional",
  parent: "👨‍👩‍👧 Parent", research: "🔬 Research",
};

const depthColors = [
  { bg: "rgba(56, 189, 248, 0.15)", border: "rgba(56, 189, 248, 0.6)", text: "#7dd3fc" },
  { bg: "rgba(52, 211, 153, 0.15)", border: "rgba(52, 211, 153, 0.6)", text: "#6ee7b7" },
  { bg: "rgba(251, 191, 36, 0.15)", border: "rgba(251, 191, 36, 0.6)", text: "#fcd34d" },
  { bg: "rgba(244, 114, 182, 0.15)", border: "rgba(244, 114, 182, 0.6)", text: "#f9a8d4" },
  { bg: "rgba(167, 139, 250, 0.15)", border: "rgba(167, 139, 250, 0.6)", text: "#c4b5fd" },
  { bg: "rgba(248, 113, 113, 0.15)", border: "rgba(248, 113, 113, 0.6)", text: "#fca5a5" },
];

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
};

/* ── Custom Node Component ── */
interface GraphNodeData {
  label: string;
  depth: number;
  mode: string;
  isExplored: boolean;
  isCurrent: boolean;
  isSession: boolean;
  onClick?: () => void;
  [key: string]: unknown;
}

const GraphNode = ({ data }: { data: GraphNodeData }) => {
  const dc = depthColors[data.depth % depthColors.length];
  const mc = modeColorMap[data.mode] || modeColorMap.student;
  const isCurrent = data.isCurrent;
  const isExplored = data.isExplored;
  const isSession = data.isSession;

  return (
    <div
      onClick={data.onClick}
      className="relative group transition-all duration-300"
      style={{ cursor: data.onClick ? "pointer" : "default" }}
    >
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0 !w-0 !h-0" />
      {isCurrent && (
        <div
          className="absolute -inset-1.5 rounded-xl animate-pulse-glow"
          style={{ background: mc.glow, filter: "blur(8px)" }}
        />
      )}
      <div
        className="relative px-4 py-2.5 rounded-xl backdrop-blur-sm transition-all duration-200 group-hover:scale-105"
        style={{
          background: isSession ? "rgba(30, 41, 59, 0.9)" : isCurrent ? mc.bg : dc.bg,
          border: `1.5px ${isExplored ? "solid" : "dashed"} ${isCurrent ? mc.border : isSession ? "rgba(100,116,139,0.4)" : dc.border}`,
          boxShadow: isCurrent ? `0 0 20px ${mc.glow}` : "none",
          minWidth: isSession ? 160 : 140,
          maxWidth: 220,
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{
              background: isSession ? mc.dot : isCurrent ? mc.dot : dc.border,
              boxShadow: `0 0 6px ${isSession ? mc.dot : dc.border}`,
            }}
          />
          <span
            className="text-xs font-medium truncate select-none"
            style={{ color: isSession ? mc.text : isCurrent ? mc.text : dc.text }}
          >
            {data.label.length > 28 ? data.label.slice(0, 28) + "…" : data.label}
          </span>
        </div>
        {!isSession && data.depth > 0 && (
          <div
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold"
            style={{ background: dc.border, color: "#0f172a" }}
          >
            {data.depth}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0 !w-0 !h-0" />
    </div>
  );
};

const nodeTypes = { graphNode: GraphNode };

/* ── Fullscreen React Flow Graph ── */
interface FullscreenGraphProps {
  currentNodes: { query: string; depth: number }[];
  sessions: HistorySession[];
  mode: string;
  onNodeClick: (index: number) => void;
  onRestoreSession: (nodes: ExplorationNode[]) => void;
}

const FullscreenGraph = ({ currentNodes, sessions, mode, onNodeClick, onRestoreSession }: FullscreenGraphProps) => {
  const { flowNodes, flowEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const mc = modeColorMap[mode] || modeColorMap.student;

    if (currentNodes.length > 0) {
      const rootId = "current-root";
      nodes.push({
        id: rootId,
        type: "graphNode",
        position: { x: 400, y: 50 },
        data: { label: `🎯 Current Session (${modeLabels[mode]})`, depth: 0, mode, isExplored: true, isCurrent: false, isSession: true },
      });

      currentNodes.forEach((n, i) => {
        const nodeId = `current-${i}`;
        const parentId = i === 0 ? rootId : `current-${i - 1}`;
        const xOffset = (i % 2 === 0 ? -1 : 1) * (Math.floor(i / 2) * 30);
        nodes.push({
          id: nodeId,
          type: "graphNode",
          position: { x: 400 + xOffset, y: 140 + i * 100 },
          data: { label: n.query, depth: n.depth, mode, isExplored: true, isCurrent: i === currentNodes.length - 1, isSession: false, onClick: () => onNodeClick(i) },
        });
        edges.push({
          id: `e-${parentId}-${nodeId}`,
          source: parentId,
          target: nodeId,
          animated: i === currentNodes.length - 1,
          style: { stroke: mc.border, strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: mc.dot, width: 12, height: 12 },
        });
      });
    }

    let sessionX = currentNodes.length > 0 ? 800 : 200;
    sessions.forEach((session, si) => {
      const sessionMc = modeColorMap[session.mode] || modeColorMap.student;
      const sessRootId = `sess-${si}`;
      nodes.push({
        id: sessRootId,
        type: "graphNode",
        position: { x: sessionX, y: 50 },
        data: { label: `${modeLabels[session.mode]} · ${formatDate(session.created_at)}`, depth: 0, mode: session.mode, isExplored: true, isCurrent: false, isSession: true, onClick: () => onRestoreSession(session.nodes) },
      });
      session.queries.forEach((q, qi) => {
        const nodeId = `sess-${si}-q-${qi}`;
        const parentId = qi === 0 ? sessRootId : `sess-${si}-q-${qi - 1}`;
        nodes.push({
          id: nodeId,
          type: "graphNode",
          position: { x: sessionX + (qi % 2 === 0 ? -20 : 20), y: 140 + qi * 90 },
          data: { label: q, depth: qi + 1, mode: session.mode, isExplored: true, isCurrent: false, isSession: false, onClick: () => onRestoreSession(session.nodes) },
        });
        edges.push({
          id: `e-${parentId}-${nodeId}`,
          source: parentId,
          target: nodeId,
          style: { stroke: sessionMc.border, strokeWidth: 1.5, strokeDasharray: "6 3" },
          markerEnd: { type: MarkerType.ArrowClosed, color: sessionMc.dot, width: 10, height: 10 },
        });
      });
      sessionX += 300;
    });

    return { flowNodes: nodes, flowEdges: edges };
  }, [currentNodes, sessions, mode, onNodeClick, onRestoreSession]);

  const [nodes, , onNodesChange] = useNodesState(flowNodes);
  const [edgesState, , onEdgesChange] = useEdgesState(flowEdges);

  useEffect(() => {
    onNodesChange(flowNodes.map(n => ({ type: "reset" as const, item: n })));
    onEdgesChange(flowEdges.map(e => ({ type: "reset" as const, item: e })));
  }, [flowNodes, flowEdges]);

  if (flowNodes.length === 0) {
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

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edgesState}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="hsl(220 14% 18%)" gap={20} size={1} />
        <Controls className="!bg-card/80 !border-border !rounded-xl !shadow-lg [&>button]:!bg-secondary/60 [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-primary/20" />
        <MiniMap
          nodeColor={(n) => {
            const d = n.data as GraphNodeData;
            const mc2 = modeColorMap[d.mode] || modeColorMap.student;
            return mc2.dot;
          }}
          maskColor="rgba(15, 23, 42, 0.8)"
          className="!bg-card/60 !border-border !rounded-xl"
        />
      </ReactFlow>
      {/* Depth legend */}
      <div className="absolute bottom-4 left-4 glass-panel p-3 z-10">
        <p className="text-[10px] text-muted-foreground font-semibold mb-2 uppercase tracking-wider">Depth</p>
        <div className="flex gap-2">
          {depthColors.slice(0, 5).map((dc2, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ background: dc2.border, boxShadow: `0 0 4px ${dc2.border}` }} />
              <span className="text-[9px] text-muted-foreground">L{i + 1}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-2 pt-2 border-t border-border/30">
          <div className="flex items-center gap-1">
            <div className="w-6 h-0.5 border-t-2 border-solid" style={{ borderColor: "rgba(148,163,184,0.4)" }} />
            <span className="text-[9px] text-muted-foreground">Explored</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-0.5 border-t-2 border-dashed" style={{ borderColor: "rgba(148,163,184,0.4)" }} />
            <span className="text-[9px] text-muted-foreground">History</span>
          </div>
        </div>
      </div>
    </div>
  );
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

        {currentNodes.length > 0 && (
          <div className="mb-3">
            <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider">Current · {modeLabels[mode]}</p>
            <div className="space-y-0.5 max-h-32 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
              {currentNodes.map((node, i) => {
                const dc = depthColors[i % depthColors.length];
                return (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => onNodeClick(i)}
                    className="w-full text-left flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] transition-all hover:scale-[1.02]"
                    style={{
                      paddingLeft: `${8 + node.depth * 12}px`,
                      background: i === currentNodes.length - 1 ? (modeColorMap[mode]?.bg || "transparent") : "transparent",
                      borderLeft: `2px solid ${dc.border}`,
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        background: dc.border,
                        boxShadow: i === currentNodes.length - 1 ? `0 0 6px ${dc.border}` : "none",
                      }}
                    />
                    <span className="truncate" style={{ color: i === currentNodes.length - 1 ? dc.text : "hsl(215 15% 55%)" }}>
                      {node.query}
                    </span>
                    {i === currentNodes.length - 1 && (
                      <span className="text-[8px] ml-auto flex-shrink-0 px-1.5 py-0.5 rounded-full font-bold"
                        style={{ background: dc.border, color: "#0f172a" }}>
                        L{node.depth}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

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
              {sessions.map((s) => {
                const mc = modeColorMap[s.mode] || modeColorMap.student;
                return (
                  <div key={s.session_id} className="rounded overflow-hidden">
                    <button
                      onClick={() => setExpanded(expanded === s.session_id ? null : s.session_id)}
                      className="w-full p-2 flex items-center gap-1.5 text-left hover:bg-secondary/30 transition-colors"
                    >
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: mc.dot, boxShadow: `0 0 4px ${mc.dot}` }} />
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
                                <span style={{ color: mc.dot }}>↳</span> {q}
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
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent className="max-w-[95vw] w-[95vw] max-h-[90vh] h-[90vh] bg-background/95 backdrop-blur-xl border-border p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-5 pb-3 border-b border-border/30">
            <DialogTitle className="flex items-center gap-2 text-foreground font-display">
              <Network className="w-5 h-5 text-primary" />
              Knowledge Graph
              <span className="text-xs text-muted-foreground font-normal ml-2">
                Drag to pan · Scroll to zoom · Click nodes to explore
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 h-[calc(90vh-80px)]">
            <FullscreenGraph
              currentNodes={currentNodes}
              sessions={sessions}
              mode={mode}
              onNodeClick={onNodeClick}
              onRestoreSession={onRestoreSession}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default KnowledgeMap;
