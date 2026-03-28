import { motion, AnimatePresence } from "framer-motion";
import { Brain, Trophy, Star, Zap, Target, Flame, PartyPopper, BarChart3, TrendingUp, Globe, Lightbulb, Award, X } from "lucide-react";
import { useState, useEffect } from "react";
import type { RubricScores } from "./ExplorationCard";

interface UnderstandingScoreProps {
  explorationCount: number;
  maxDepth: number;
  mode?: string;
  latestRubric?: RubricScores | null;
}

const milestones = [
  { score: 5, label: "Curious Mind", icon: Star, color: "text-yellow-400", emoji: "⭐" },
  { score: 15, label: "Knowledge Seeker", icon: Zap, color: "text-blue-400", emoji: "⚡" },
  { score: 30, label: "Deep Thinker", icon: Target, color: "text-purple-400", emoji: "🎯" },
  { score: 50, label: "Master Explorer", icon: Flame, color: "text-orange-400", emoji: "🔥" },
  { score: 100, label: "Wisdom Keeper", icon: Trophy, color: "text-primary", emoji: "🏆" },
];

const confettiEmojis = ["🎉", "⭐", "🌟", "✨", "🏆", "🎊", "💫"];
const childConfetti = ["🦄", "🌈", "🎈", "🍭", "🦋", "🎀", "🌸", "🐱", "🐶", "🎠"];

const rubricLabels: Record<string, { label: string; icon: typeof Brain }> = {
  understanding: { label: "Core Concepts", icon: Brain },
  analysis: { label: "Critical Analysis", icon: TrendingUp },
  application: { label: "Application", icon: Globe },
  clarity: { label: "Clarity", icon: Lightbulb },
  depth: { label: "Depth", icon: BarChart3 },
};

const UnderstandingScore = ({ explorationCount, maxDepth, mode, latestRubric }: UnderstandingScoreProps) => {
  const score = explorationCount * 10 + maxDepth * 5;
  const [showReward, setShowReward] = useState<string | null>(null);
  const [lastMilestone, setLastMilestone] = useState(0);
  const [particles, setParticles] = useState<{ id: number; emoji: string; x: number; y: number; delay: number }[]>([]);
  const [showRewardsPanel, setShowRewardsPanel] = useState(false);

  const currentMilestone = milestones.filter((m) => score >= m.score).pop();
  const nextMilestone = milestones.find((m) => score < m.score);
  const progress = nextMilestone
    ? ((score - (currentMilestone ? currentMilestone.score : 0)) /
        (nextMilestone.score - (currentMilestone ? currentMilestone.score : 0))) *
      100
    : 100;

  useEffect(() => {
    if (currentMilestone && currentMilestone.score > lastMilestone) {
      setShowReward(currentMilestone.label);
      setLastMilestone(currentMilestone.score);

      const emojis = mode === "child" ? childConfetti : confettiEmojis;
      const newParticles = Array.from({ length: 16 }, (_, i) => ({
        id: Date.now() + i,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        x: Math.random() * 300 - 150,
        y: -(Math.random() * 200 + 60),
        delay: Math.random() * 0.3,
      }));
      setParticles(newParticles);

      const t = setTimeout(() => {
        setShowReward(null);
        setParticles([]);
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [currentMilestone, lastMilestone, mode]);

  const CurrentMilestoneIcon = currentMilestone?.icon || Star;
  const unlockedMilestones = milestones.filter((m) => score >= m.score);

  return (
    <div className="relative space-y-4">
      {/* Score display */}
      <div className="text-center">
        <motion.div
          animate={showReward ? { scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] } : {}}
          transition={{ duration: 0.6 }}
          className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-2"
        >
          <Brain className="w-8 h-8 text-primary" />
        </motion.div>
        <motion.div
          key={score}
          initial={{ scale: 1.5, color: "hsl(174, 72%, 56%)" }}
          animate={{ scale: 1, color: "hsl(210, 40%, 96%)" }}
          className="text-3xl font-display font-bold"
        >
          {score}
        </motion.div>
        <div className="text-[11px] text-muted-foreground">Understanding Score</div>
      </div>

      {/* Progress to next milestone */}
      <div>
        <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5">
          <span className="flex items-center gap-1">
            <CurrentMilestoneIcon className={`w-3 h-3 ${currentMilestone?.color || "text-muted-foreground"}`} />
            {currentMilestone?.label || "Beginner"}
          </span>
          <span>{nextMilestone?.label || "Max"}</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="glass-panel p-2 text-center">
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Explored</div>
          <motion.div key={explorationCount} initial={{ scale: 1.5 }} animate={{ scale: 1 }} className="text-lg font-bold text-primary">
            {explorationCount}
          </motion.div>
        </div>
        <div className="glass-panel p-2 text-center">
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Depth</div>
          <motion.div key={maxDepth} initial={{ scale: 1.5 }} animate={{ scale: 1 }} className="text-lg font-bold text-accent">
            {maxDepth}
          </motion.div>
        </div>
      </div>

      {/* Latest rubric scores */}
      {latestRubric && (
        <div className="glass-panel p-3">
          <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-2">Quality Metrics</div>
          <div className="space-y-1.5">
            {Object.entries(latestRubric).map(([key, value]) => {
              const info = rubricLabels[key];
              if (!info) return null;
              const RIcon = info.icon;
              return (
                <div key={key} className="flex items-center gap-1.5">
                  <RIcon className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-[10px] text-muted-foreground w-20 flex-shrink-0 truncate">{info.label}</span>
                  <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(value as number / 10) * 100}%` }}
                      transition={{ duration: 0.6 }}
                      className={`h-full rounded-full ${
                        (value as number) >= 8 ? "bg-emerald-400" :
                        (value as number) >= 6 ? "bg-primary" : "bg-amber-400"
                      }`}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-foreground/70 w-4 text-right">{value as number}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reward Icon Button */}
      <div className="flex justify-center">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowRewardsPanel(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 text-sm text-primary hover:bg-primary/15 transition-all"
        >
          <Award className="w-4 h-4" />
          <span className="font-medium">Rewards</span>
          {unlockedMilestones.length > 0 && (
            <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {unlockedMilestones.length}
            </span>
          )}
        </motion.button>
      </div>

      {/* Rewards Panel Dialog */}
      <AnimatePresence>
        {showRewardsPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center"
            onClick={() => setShowRewardsPanel(false)}
          >
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative glass-panel p-6 w-80 max-h-[70vh] overflow-y-auto glow-primary border-primary/30 z-[101]"
            >
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-primary" />
                <h3 className="font-display font-bold text-foreground text-lg">Your Rewards</h3>
              </div>
              <div className="space-y-2">
                {milestones.map((m) => {
                  const MIcon = m.icon;
                  const unlocked = score >= m.score;
                  return (
                    <div
                      key={m.score}
                      className={`flex items-center gap-3 py-3 px-3 rounded-lg text-sm transition-all ${
                        unlocked ? "bg-primary/10 border border-primary/20" : "opacity-40"
                      }`}
                    >
                      <span className="text-xl">{m.emoji}</span>
                      <div className="flex-1">
                        <div className={`font-medium ${unlocked ? "text-foreground" : "text-muted-foreground"}`}>{m.label}</div>
                        <div className="text-[10px] text-muted-foreground">Score: {m.score}+</div>
                      </div>
                      {unlocked ? (
                        <span className="text-emerald-400 text-sm">✅</span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">🔒</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => setShowRewardsPanel(false)}
                className="mt-4 w-full py-2 rounded-lg bg-secondary/50 border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== REWARD POPUP OVERLAY — center screen, auto dismiss ===== */}
      <AnimatePresence>
        {showReward && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center"
            onClick={() => { setShowReward(null); setParticles([]); }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/40 backdrop-blur-sm"
            />

            {particles.map((p) => (
              <motion.span
                key={p.id}
                initial={{ opacity: 1, x: 0, y: 0, scale: 0 }}
                animate={{
                  opacity: [1, 1, 0],
                  x: p.x,
                  y: p.y,
                  scale: [0, 1.8, 0.6],
                  rotate: [0, Math.random() * 540 - 270],
                }}
                transition={{ duration: 3, ease: "easeOut", delay: p.delay }}
                className="absolute text-3xl z-[101]"
              >
                {p.emoji}
              </motion.span>
            ))}

            <motion.div
              initial={{ opacity: 0, scale: 0.2, y: 60, rotateX: 45 }}
              animate={{ opacity: 1, scale: [0.2, 1.15, 1], y: 0, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.3, y: -40 }}
              transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
              className="relative glass-panel px-10 py-8 glow-primary border-primary/30 text-center z-[102]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => { setShowReward(null); setParticles([]); }}
                className="absolute top-3 right-3 p-1 rounded-full bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors z-[103]"
              >
                <X className="w-4 h-4" />
              </button>
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-xl border-2 border-primary/30"
              />

              <motion.div animate={{ rotate: [0, -20, 20, -10, 10, 0], y: [0, -5, 0] }} transition={{ duration: 1, delay: 0.3 }}>
                {mode === "child" ? (
                  <PartyPopper className="w-14 h-14 text-yellow-400 mx-auto mb-3" />
                ) : (
                  <Trophy className="w-14 h-14 text-yellow-400 mx-auto mb-3" />
                )}
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <div className="text-xl font-display font-bold text-foreground mb-1">
                  {mode === "child" ? "🎉 Yay! Amazing! 🎉" : "🏆 Achievement Unlocked!"}
                </div>
                <motion.div initial={{ scale: 0.8 }} animate={{ scale: [0.8, 1.1, 1] }} transition={{ delay: 0.6 }} className="text-lg text-primary font-bold font-display">
                  {showReward}
                </motion.div>
                {mode === "child" ? (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-sm text-muted-foreground mt-3">
                    You're a superstar! Keep exploring! 🌟🦄✨
                  </motion.p>
                ) : (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-xs text-muted-foreground mt-3">
                    Keep exploring to unlock more achievements
                  </motion.p>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UnderstandingScore;
