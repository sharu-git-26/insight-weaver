import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Star, Send, X, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const FeedbackPanel = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async () => {
    if (!rating && !feedback.trim()) return;
    setIsSending(true);

    try {
      const { error } = await supabase.functions.invoke("send-feedback", {
        body: {
          rating,
          feedback: feedback.trim(),
          userEmail: user?.email || "anonymous",
          timestamp: new Date().toISOString(),
        },
      });

      if (error) throw error;

      setSubmitted(true);
      toast.success("Feedback sent successfully!");
      setTimeout(() => {
        setSubmitted(false);
        setIsOpen(false);
        setRating(0);
        setFeedback("");
      }, 2000);
    } catch (err) {
      console.error("Feedback send error:", err);
      toast.error("Failed to send feedback. Please try again.");
    }

    setIsSending(false);
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-40 p-3 rounded-full bg-primary text-primary-foreground shadow-lg glow-primary"
        title="Send Feedback"
      >
        <MessageSquare className="w-5 h-5" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-80 glass-panel p-5 glow-primary"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-foreground text-sm">Feedback</h3>
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {submitted ? (
              <div className="text-center py-6">
                <CheckCircle className="w-10 h-10 text-primary mx-auto mb-2" />
                <p className="text-sm text-foreground">Thank you for your feedback!</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-3">Rate your experience</p>
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => setRating(s)}>
                      <Star className={`w-6 h-6 transition-colors ${s <= rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`} />
                    </button>
                  ))}
                </div>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Tell us what you think or suggest improvements..."
                  className="w-full bg-secondary/50 border border-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none h-20 mb-3"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={isSending}
                  className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Send className="w-3 h-3" />
                  )}
                  {isSending ? "Sending..." : "Submit"}
                </motion.button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FeedbackPanel;
