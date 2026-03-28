import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, X, Search, Lightbulb, Brain, ChevronRight, Mail, Send, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const SUPPORT_EMAIL = "ashashivanna670@gmail.com";

const guides = [
  { title: "How to explore topics", content: "Type any question in the search bar or click a suggested topic. Each answer reveals key concepts you can click to go deeper.", icon: Search },
  { title: "Using search refinement", content: "After each answer, use Balance, Simplify, or Go Deeper to adjust the explanation style to your needs.", icon: Lightbulb },
  { title: "Understanding your score", content: "Your score increases as you explore more topics and go deeper. Hit milestones to unlock achievements!", icon: Brain },
  { title: "Voice search", content: "Click the microphone icon to speak your question. Works best in Chrome and Edge browsers.", icon: Search },
];

const HelpDesk = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [openGuide, setOpenGuide] = useState<number | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSendEmail = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error("Please fill in both subject and message");
      return;
    }
    setIsSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-feedback", {
        body: {
          rating: 0,
          feedback: `[SUPPORT REQUEST]\nSubject: ${subject}\n\n${body}`,
          userEmail: user?.email || "anonymous",
          timestamp: new Date().toISOString(),
        },
      });
      if (error) throw error;
      setSent(true);
      toast.success("Support email sent!");
      setTimeout(() => { setSent(false); setShowCompose(false); setSubject(""); setBody(""); }, 2000);
    } catch (err) {
      console.error("Email send error:", err);
      toast.error("Failed to send email. Please try again.");
    }
    setIsSending(false);
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
              <button onClick={() => { setIsOpen(false); setShowCompose(false); }} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!showCompose ? (
              <>
                <p className="text-sm text-muted-foreground mb-6">Need help getting started? Browse the guides below.</p>
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
                    onClick={() => setShowCompose(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 text-sm text-primary hover:bg-primary/15 transition-all"
                  >
                    <Mail className="w-4 h-4" />
                    Email Support
                  </motion.button>
                </div>
              </>
            ) : (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {sent ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 text-primary mx-auto mb-3" />
                    <p className="text-foreground font-medium">Email sent successfully!</p>
                    <p className="text-xs text-muted-foreground mt-1">We'll get back to you soon.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <button onClick={() => setShowCompose(false)} className="text-xs text-muted-foreground hover:text-primary transition-colors">← Back to guides</button>
                    <h3 className="text-sm font-semibold text-foreground">Compose Support Email</h3>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">To</label>
                      <div className="w-full bg-secondary/30 border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground">{SUPPORT_EMAIL}</div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">From</label>
                      <div className="w-full bg-secondary/30 border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground">{user?.email || "anonymous"}</div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Subject</label>
                      <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What do you need help with?" className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Message</label>
                      <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Describe your issue in detail..." rows={6} className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSendEmail} disabled={isSending} className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity">
                      {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {isSending ? "Sending..." : "Send Email"}
                    </motion.button>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default HelpDesk;
