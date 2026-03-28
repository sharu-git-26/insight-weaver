import { motion } from "framer-motion";
import { RotateCcw, ChevronRight, Sparkles, MapPin } from "lucide-react";

interface ExplorationPathProps {
  nodes: { query: string }[];
  onNodeClick: (index: number) => void;
  onReset: () => void;
}

const ExplorationPath = ({ nodes, onNodeClick, onReset }: ExplorationPathProps) => {
  if (nodes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-xs">Your exploration path will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-foreground">
            Depth: {nodes.length}
          </span>
        </div>
        <button
          onClick={onReset}
          className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-md hover:bg-destructive/10"
          title="Reset exploration"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {nodes.map((node, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <button
            onClick={() => onNodeClick(i)}
            className={`w-full text-left flex items-start gap-2 px-3 py-2 rounded-lg text-xs transition-all group ${
              i === nodes.length - 1
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            }`}
          >
            {/* Vertical line connector */}
            <div className="flex flex-col items-center flex-shrink-0 mt-0.5">
              <div
                className={`w-2 h-2 rounded-full ${
                  i === nodes.length - 1 ? "bg-primary" : "bg-muted-foreground/40"
                }`}
              />
              {i < nodes.length - 1 && (
                <div className="w-px h-4 bg-border mt-0.5" />
              )}
            </div>
            <span className="leading-tight">
              {node.query.length > 35 ? node.query.slice(0, 35) + "…" : node.query}
            </span>
          </button>
        </motion.div>
      ))}
    </div>
  );
};

export default ExplorationPath;
