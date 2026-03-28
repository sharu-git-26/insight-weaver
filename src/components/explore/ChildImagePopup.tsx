import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ChildImagePopupProps {
  topic: string;
  show: boolean;
  onClose: () => void;
}

const ChildImagePopup = ({ topic, show, onClose }: ChildImagePopupProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);

  const generateImage = async () => {
    if (loading || hasRequested) return;
    setLoading(true);
    setHasRequested(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: { topic },
      });

      if (error) throw error;
      if (data?.imageUrl) {
        setImageUrl(data.imageUrl);
      } else {
        throw new Error("No image returned");
      }
    } catch (err) {
      console.error("Image generation failed:", err);
      toast.error("Could not generate image. Try again later!");
      setHasRequested(false);
    }
    setLoading(false);
  };

  // Auto-generate when shown
  if (show && !hasRequested && !loading) {
    generateImage();
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-panel p-6 max-w-lg w-full glow-primary"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-primary" />
                <h3 className="font-display font-semibold text-foreground text-sm">
                  🎨 Picture for: {topic}
                </h3>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-square rounded-xl overflow-hidden bg-secondary/30 border border-border flex items-center justify-center">
              {loading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <span className="text-sm text-muted-foreground">Drawing a picture for you... 🎨</span>
                </div>
              ) : imageUrl ? (
                <img src={imageUrl} alt={`Illustration about ${topic}`} className="w-full h-full object-cover" />
              ) : (
                <div className="text-sm text-muted-foreground">Failed to load image</div>
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-3 text-center">
              AI-generated illustration to help visualize the concept ✨
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChildImagePopup;
