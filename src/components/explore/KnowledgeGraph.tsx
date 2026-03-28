import { motion } from "framer-motion";
import { Network } from "lucide-react";

interface KnowledgeGraphProps {
  nodes: { query: string; depth: number }[];
  onNodeClick: (index: number) => void;
}

const KnowledgeGraph = ({ nodes, onNodeClick }: KnowledgeGraphProps) => {
  if (nodes.length === 0) return null;

  const width = 280;
  const nodeH = 28;
  const gap = 8;
  const totalH = nodes.length * (nodeH + gap);

  return (
    <div className="glass-panel p-3">
      <div className="flex items-center gap-2 mb-3">
        <Network className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold text-foreground">Knowledge Graph</span>
      </div>
      <div className="overflow-y-auto max-h-[240px] scrollbar-thin">
        <svg width={width} height={totalH} className="w-full">
          {nodes.map((node, i) => {
            const x = 10 + node.depth * 20;
            const y = i * (nodeH + gap);
            const textMaxW = width - x - 20;

            return (
              <g key={i}>
                {/* Connector line to parent */}
                {i > 0 && (
                  <line
                    x1={10 + nodes[i - 1].depth * 20 + 6}
                    y1={(i - 1) * (nodeH + gap) + nodeH / 2}
                    x2={x + 6}
                    y2={y + nodeH / 2}
                    stroke="hsl(174 72% 56% / 0.3)"
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                  />
                )}
                {/* Node */}
                <motion.g
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => onNodeClick(i)}
                  className="cursor-pointer"
                >
                  <rect
                    x={x}
                    y={y}
                    width={textMaxW}
                    height={nodeH}
                    rx={6}
                    fill={i === nodes.length - 1 ? "hsl(174 72% 56% / 0.15)" : "hsl(220 18% 10% / 0.8)"}
                    stroke={i === nodes.length - 1 ? "hsl(174 72% 56% / 0.4)" : "hsl(220 14% 18%)"}
                    strokeWidth={1}
                  />
                  <circle cx={x + 10} cy={y + nodeH / 2} r={3} fill="hsl(174 72% 56%)" />
                  <text
                    x={x + 20}
                    y={y + nodeH / 2 + 4}
                    fontSize={10}
                    fill="hsl(210 40% 96%)"
                    className="select-none"
                  >
                    {node.query.length > 25 ? node.query.slice(0, 25) + "…" : node.query}
                  </text>
                </motion.g>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default KnowledgeGraph;
