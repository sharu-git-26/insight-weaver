import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Baby, GraduationCap, Briefcase, Users, FlaskConical, ArrowRight, Sparkles, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import rueLogo from "@/assets/rue-logo.png";
import { useEffect } from "react";

const modes = [
  { id: "child", label: "Child", description: "Simple words, fun examples, colorful explanations", icon: Baby, gradient: "from-emerald-500/20 to-teal-500/20", borderColor: "border-emerald-500/30", iconColor: "text-emerald-400", emoji: "🧒" },
  { id: "student", label: "Student", description: "Clear definitions, structured learning, exam-ready", icon: GraduationCap, gradient: "from-blue-500/20 to-cyan-500/20", borderColor: "border-blue-500/30", iconColor: "text-blue-400", emoji: "📚" },
  { id: "professional", label: "Professional", description: "Industry context, practical applications, concise", icon: Briefcase, gradient: "from-amber-500/20 to-orange-500/20", borderColor: "border-amber-500/30", iconColor: "text-amber-400", emoji: "💼" },
  { id: "parent", label: "Parent", description: "Easy to relay, age-appropriate guidance, supportive", icon: Users, gradient: "from-pink-500/20 to-rose-500/20", borderColor: "border-pink-500/30", iconColor: "text-pink-400", emoji: "👨‍👩‍👧" },
  { id: "research", label: "Research", description: "Technical depth, citations style, academic rigor", icon: FlaskConical, gradient: "from-violet-500/20 to-purple-500/20", borderColor: "border-violet-500/30", iconColor: "text-violet-400", emoji: "🔬" },
];

const ModeSelectPage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background bg-gradient-mesh flex flex-col items-center justify-center p-6 relative">
      <button
        onClick={handleLogout}
        className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50 border border-border text-sm text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-all"
      >
        <LogOut className="w-4 h-4" />
        Logout
      </button>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-6">
          <img src={rueLogo} alt="RUE" className="w-10 h-10" width={512} height={512} />
          <h1 className="text-xl font-display font-bold text-foreground">RUE</h1>
        </div>
        <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
          Choose Your <span className="text-gradient-primary">Learning Mode</span>
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Content adapts to match your perspective
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl w-full">
        {modes.map((mode, i) => (
          <motion.button key={mode.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} whileHover={{ scale: 1.03, y: -4 }} whileTap={{ scale: 0.98 }} onClick={() => navigate(`/explore?mode=${mode.id}`)} className={`glass-panel p-6 text-left group hover:glow-primary transition-all duration-300 ${mode.borderColor} hover:border-primary/50`}>
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mode.gradient} flex items-center justify-center mb-4`}>
              <span className="text-2xl">{mode.emoji}</span>
            </div>
            <h3 className="font-display font-semibold text-foreground text-lg mb-1 flex items-center gap-2">
              {mode.label}
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-primary" />
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{mode.description}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default ModeSelectPage;
