import { useCallback, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  type NodeTypes,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion } from 'framer-motion';
import { X, Network } from 'lucide-react';
import type { GraphNode } from '@/lib/types';

interface KnowledgeGraphProps {
  graphNodes: GraphNode[];
  onNodeClick: (term: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

function ConceptNode({ data }: { data: { label: string; explored: boolean; depth: number } }) {
  const depthColors = [
    'bg-primary text-primary-foreground',
    'bg-accent text-accent-foreground',
    'bg-secondary text-secondary-foreground',
    'bg-muted text-muted-foreground',
  ];
  const colorClass = depthColors[Math.min(data.depth, depthColors.length - 1)];

  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} className="!bg-primary !w-2 !h-2" />
      <div className={`px-4 py-2 rounded-xl border shadow-md backdrop-blur-sm ${colorClass} ${data.explored ? 'border-primary/40' : 'border-dashed border-muted-foreground/40'}`}>
        <span className="text-xs font-medium whitespace-nowrap">{data.label}</span>
        {!data.explored && <span className="ml-1.5 text-[10px] opacity-60">?</span>}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-primary !w-2 !h-2" />
    </div>
  );
}

const nodeTypes: NodeTypes = { concept: ConceptNode as any };

export default function KnowledgeGraph({ graphNodes, onNodeClick, isOpen, onClose }: KnowledgeGraphProps) {
  const { flowNodes, flowEdges } = useMemo(() => {
    if (!graphNodes.length) return { flowNodes: [] as Node[], flowEdges: [] as Edge[] };

    const levelGroups: Record<number, GraphNode[]> = {};
    graphNodes.forEach(n => {
      if (!levelGroups[n.depth]) levelGroups[n.depth] = [];
      levelGroups[n.depth].push(n);
    });

    const fNodes: Node[] = [];
    const fEdges: Edge[] = [];

    Object.entries(levelGroups).forEach(([depthStr, nodes]) => {
      const depth = parseInt(depthStr);
      const totalWidth = nodes.length * 220;
      const startX = -(totalWidth / 2);

      nodes.forEach((node, i) => {
        fNodes.push({
          id: node.id,
          type: 'concept',
          position: { x: startX + i * 220, y: depth * 140 },
          data: { label: node.term, explored: node.explored, depth: node.depth },
        });

        if (node.parentId) {
          fEdges.push({
            id: `e-${node.parentId}-${node.id}`,
            source: node.parentId,
            target: node.id,
            animated: !node.explored,
            style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
          });
        }
      });
    });

    return { flowNodes: fNodes, flowEdges: fEdges };
  }, [graphNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  useEffect(() => {
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [flowNodes, flowEdges, setNodes, setEdges]);

  const handleNodeClick = useCallback((_: any, node: Node) => {
    onNodeClick(node.data.label as string);
  }, [onNodeClick]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Network className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Knowledge Graph</h2>
              <span className="text-xs text-muted-foreground">{graphNodes.length} concepts</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 relative">
          {graphNodes.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">Ask a question to start building your knowledge graph</p>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={handleNodeClick}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.3 }}
              minZoom={0.2}
              maxZoom={2}
              proOptions={{ hideAttribution: true }}
            >
              <Background color="hsl(var(--muted-foreground) / 0.15)" gap={20} size={1} />
              <Controls className="!bg-card/80 !border-border !rounded-xl !shadow-lg [&>button]:!bg-secondary/60 [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-primary/20" />
            </ReactFlow>
          )}
        </div>

        <div className="flex items-center gap-4 p-3 border-t border-border/50 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-primary/40 border border-primary/60 inline-block" /> Explored
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full border border-dashed border-muted-foreground/40 inline-block" /> Unexplored
          </span>
          <span>Click a node to explore it</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
