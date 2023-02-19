import { Nullable } from "../Types/Nullable";

export interface State {
    hoveredNode?: string;
    searchQuery: string;

    // State derived from query:
    selectedNode?: string;
    suggestions?: Set<string>;

    // State derived from hovered node:
    hoveredNeighbors?: Set<string>;

    draggedNode?: Nullable<string>;
    isDragging?: boolean;
}