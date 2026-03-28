import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, X, Search, Lightbulb, Brain, ChevronRight, Mail } from "lucide-react";

const SUPPORT_EMAIL = "ashashivanna670@gmail.com";

const guides = [
  {
    title: "How to explore topics",
    content: "Type any question in the search bar or click a suggested topic. Each answer reveals key concepts you can click to go deeper.",
    icon: Search,
  },
  {
    title: "Using search refinement",
    content: "After each answer, use Balance, Simplify, or Go Deeper to adjust the explanation style to your needs.",
    icon: Lightbulb,
  },
  {
    title: "Understanding your score",
    content: "Your score increases as you explore more topics and go deeper. Hit milestones to unlock achievements!",
    icon: Brain,
  },
  {
    title: "Voice search",
    content: "Click the microphone icon to speak your question. Works best in Chrome and Edge browsers.",
    icon: Search,
  },
];

const HelpDesk = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [openGuide, setOpenGuide] = useState<number | null>(null);

  const handleEmailSupport = () => {
    const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=RUE%20Support%20Request`;
    // Use window.open for iframe compatibility, fallback to anchor click
    const a = document.createElement("a");
    a.href = mailtoUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-20 z-40 p-3 rounded-full bg-secondary border border-border text-foreground/70 hover:text-primary shadow-lg transition-colors"
        title="Help"
      >
        <HelpCircle className="w-5 h-5" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-80 bg-card border-l border-border p-6 overflow-y-auto shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-foreground text-lg">Help Desk</h2>
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-6">
              Need help getting started? Browse the guides below.
            </p>

            <div className="space-y-2">
              {guides.map((guide, i) => (
                <div key={i} className="glass-panel overflow-hidden">
                  <button
                    onClick={() => setOpenGuide(openGuide === i ? null : i)}
                    className="w-full p-3 flex items-center gap-3 text-left hover:bg-secondary/30 transition-colors"
                  >
                    <guide.icon className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-sm text-foreground flex-1">{guide.title}</span>
                    <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${openGuide === i ? "rotate-90" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {openGuide === i && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <p className="px-3 pb-3 text-xs text-muted-foreground leading-relaxed">{guide.content}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 glass-panel text-center">
              <p className="text-xs text-muted-foreground mb-3">Still need help?</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleEmailSupport}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 text-sm text-primary hover:bg-primary/15 transition-all"
              >
                <Mail className="w-4 h-4" />
                Email Support
              </motion.button>
              <p className="text-[10px] text-muted-foreground mt-2">
                Opens your email app — just type your message and send!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default HelpDesk;
