import { Nullable } from "../Types/Nullable";

interface State {
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

export { State }