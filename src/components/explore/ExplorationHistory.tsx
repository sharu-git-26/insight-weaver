import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, ChevronRight, Trash2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { ExplorationNode, RubricScores } from "./ExplorationCard";

interface HistorySession {
  session_id: string;
  mode: string;
  queries: string[];
  created_at: string;
  nodes: ExplorationNode[];
}

interface ExplorationHistoryProps {
  currentSessionId: string;
  onRestoreSession: (nodes: ExplorationNode[]) => void;
}

const ExplorationHistory = ({ currentSessionId, onRestoreSession }: ExplorationHistoryProps) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

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

      // Group by session_id
      const grouped: Record<string, HistorySession> = {};
      for (const row of data || []) {
        if (row.session_id === currentSessionId) continue;
        if (!grouped[row.session_id]) {
          grouped[row.session_id] = {
            session_id: row.session_id,
            mode: row.mode,
            queries: [],
            created_at: row.created_at,
            nodes: [],
          };
        }
        grouped[row.session_id].queries.push(row.query);
        grouped[row.session_id].nodes.push({
          query: row.query,
          answer: row.answer,
          concepts: row.concepts || [],
          references: Array.isArray(row.refs) ? (row.refs as any[]) : [],
          explanationMode: row.explanation_mode || undefined,
          rubricScores: row.rubric_scores as unknown as RubricScores | undefined,
        });
      }

      // Sort sessions by most recent first
      const sorted = Object.values(grouped).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setSessions(sorted);
    } catch (err) {
      console.error("Failed to load history:", err);
    }
    setIsLoading(false);
  };

  const deleteSession = async (sessionId: string) => {
    if (!user) return;
    try {
      await supabase.from("explorations").delete().eq("session_id", sessionId).eq("user_id", user.id);
      setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <Clock className="w-4 h-4 mx-auto mb-1 text-muted-foreground animate-pulse" />
        <p className="text-[10px] text-muted-foreground">Loading history…</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <History className="w-6 h-6 mx-auto mb-1 opacity-30" />
        <p className="text-xs">No past sessions yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 max-h-60 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
      {sessions.map((session) => (
        <div key={session.session_id} className="glass-panel overflow-hidden">
          <button
            onClick={() => setExpandedSession(expandedSession === session.session_id ? null : session.session_id)}
            className="w-full p-2.5 flex items-center gap-2 text-left hover:bg-secondary/30 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">
                {session.queries[0]?.length > 30 ? session.queries[0].slice(0, 30) + "…" : session.queries[0]}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {formatDate(session.created_at)} · {session.queries.length} queries · {session.mode}
              </p>
            </div>
            <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground transition-transform flex-shrink-0 ${expandedSession === session.session_id ? "rotate-90" : ""}`} />
          </button>
          <AnimatePresence>
            {expandedSession === session.session_id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-2.5 pb-2.5 space-y-1">
                  {session.queries.map((q, i) => (
                    <p key={i} className="text-[11px] text-muted-foreground truncate">
                      {i + 1}. {q}
                    </p>
                  ))}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => onRestoreSession(session.nodes)}
                      className="text-[10px] text-primary hover:underline"
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => deleteSession(session.session_id)}
                      className="text-[10px] text-destructive hover:underline flex items-center gap-0.5"
                    >
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
  );
};

export default ExplorationHistory;
