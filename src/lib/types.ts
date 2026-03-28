export interface GraphNode {
  id: string;
  term: string;
  depth: number;
  explored: boolean;
  parentId?: string;
}
