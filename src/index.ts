import Sigma from "sigma";
import Graph from "graphology";
import { EdgeDisplayData, NodeDisplayData } from "sigma/types";

import { GraphService } from './Services/GraphService'
import { State } from './Models/State'

const GRAPH: Graph = new Graph();

var graphService = new GraphService(GRAPH);

graphService.PopulateGraph();
graphService.ColorNodes();
graphService.UseDegreesForNodeSizes();
graphService.PositionAndRunForceAtlas2();

const container = document.getElementById("sigma-container") as HTMLElement;
const searchInput = document.getElementById("search-input") as HTMLInputElement;
const renderer = new Sigma(GRAPH, container);

const state: State = { searchQuery: "" };


// On mouse down on a node
//  - enable the drag mode
//  - save in the dragged node in the state
//  - highlight the node
//  - disable the camera so its state is not updated
renderer.on("downNode", (e) => {
  state.isDragging = true;
  state.draggedNode = e.node;
  GRAPH.setNodeAttribute(state.draggedNode, "highlighted", true);
});

// On mouse move, if the drag mode is enabled, change the position of the draggedNode
renderer.getMouseCaptor().on("mousemovebody", (e) => {
  if (!state.isDragging || !state.draggedNode) return;

  // Get new position of node
  const pos = renderer.viewportToGraph(e);

  GRAPH.setNodeAttribute(state.draggedNode, "x", pos.x);
  GRAPH.setNodeAttribute(state.draggedNode, "y", pos.y);

  // Prevent sigma to move camera:
  e.preventSigmaDefault();
  e.original.preventDefault();
  e.original.stopPropagation();
});

// On mouse up, reset the autoscale and the dragging mode
renderer.getMouseCaptor().on("mouseup", () => {
  if (state.draggedNode) {
    GRAPH.removeNodeAttribute(state.draggedNode, "highlighted");
  }
  state.isDragging = false;
  state.draggedNode = null;
});

// Disable the autoscale at the first down interaction
renderer.getMouseCaptor().on("mousedown", () => {
  if (!renderer.getCustomBBox()) renderer.setCustomBBox(renderer.getBBox());
});

function setSearchQuery(query: string) {
  state.searchQuery = query;

  if (searchInput.value !== query) searchInput.value = query;

  if (query) {
    const lcQuery = query.toLowerCase();
    const suggestions = GRAPH
      .nodes()
      .map((n) => ({ id: n, label: GRAPH.getNodeAttribute(n, "label") as string }))
      .filter(({ label }) => label.toLowerCase().includes(lcQuery));

    // If single perfect match then remove the suggestions, and consider the user has selected a node through the datalist
    // autocomplete:
    if (suggestions.length === 1 && suggestions[0].label === query) {
      state.selectedNode = suggestions[0].id;
      state.suggestions = undefined;
    }
    // Else display the suggestions list:
    else {
      state.selectedNode = undefined;
      state.suggestions = new Set(suggestions.map(({ id }) => id));
    }
  }
  // If the query is empty, then reset the selectedNode / suggestions state:
  else {
    state.selectedNode = undefined;
    state.suggestions = undefined;
  }

  renderer.refresh();
}

function setHoveredNode(node?: string) {
  if (node) {
    state.hoveredNode = node;
    state.hoveredNeighbors = new Set(GRAPH.neighbors(node));
  } else {
    state.hoveredNode = undefined;
    state.hoveredNeighbors = undefined;
  }

  renderer.refresh();
}

searchInput.addEventListener("input", () => {
  setSearchQuery(searchInput.value || "");
});
searchInput.addEventListener("blur", () => {
  setSearchQuery("");
});

renderer.on("enterNode", ({ node }) => {
  setHoveredNode(node);
});
renderer.on("leaveNode", () => {
  setHoveredNode(undefined);
});

// Render nodes accordingly to the internal state:
// 1. If a node is selected, it is highlighted
// 2. If there is query, all non-matching nodes are greyed
// 3. If there is a hovered node, all non-neighbor nodes are greyed
renderer.setSetting("nodeReducer", (node, data) => {
  const res: Partial<NodeDisplayData> = { ...data };

  if (state.hoveredNeighbors && !state.hoveredNeighbors.has(node) && state.hoveredNode !== node) {
    res.label = "";
    res.color = "#f6f6f6";
  }

  if (state.selectedNode === node) {
    res.highlighted = true;
  } else if (state.suggestions && !state.suggestions.has(node)) {
    res.label = "";
    res.color = "#f6f6f6";
  }

  return res;
});

// Render edges accordingly to the internal state:
// 1. If a node is hovered, the edge is hidden if it is not connected to the node
// 2. If there is a query, the edge is only visible if it connects two suggestions
renderer.setSetting("edgeReducer", (edge, data) => {
  const res: Partial<EdgeDisplayData> = { ...data };

  if (state.hoveredNode && !GRAPH.hasExtremity(edge, state.hoveredNode)) {
    res.hidden = true;
  }

  if (state.suggestions && (!state.suggestions.has(GRAPH.source(edge)) || !state.suggestions.has(GRAPH.target(edge)))) {
    res.hidden = true;
  }

  return res;
});