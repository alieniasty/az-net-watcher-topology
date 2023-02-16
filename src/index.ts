import Sigma from "sigma";
import Graph from "graphology";
import circular from "graphology-layout/circular";
import forceAtlas2 from "graphology-layout-forceatlas2";

import data from './data.json';

const graph: Graph = new Graph();

data.resources.forEach((resource) => {
  const resourceNode = resource.name;

  if (!graph.hasNode(resourceNode)) {
    graph.addNode(resourceNode, {
      nodeType: "resource",
      label: resourceNode,
    });
  }  

  resource.associations.forEach((association) => {
    if (!graph.hasNode(association.name)) {
      graph.addNode(association.name, { nodeType: "association", label: association.name });      
    }

    graph.addEdge(resourceNode, association.name, { weight: 1 });
  });
});

// Add colors to the nodes, based on node types:
const COLORS: Record<string, string> = { resource: "#FA5A3D", association: "#5A75DB" };
graph.forEachNode((node, attributes) =>
  graph.setNodeAttribute(node, "color", COLORS[attributes.nodeType as string]),
);

// Use degrees for node sizes:
const degrees = graph.nodes().map((node: any) => graph.degree(node));
const minDegree = Math.min(...degrees);
const maxDegree = Math.max(...degrees);
const minSize = 2,
  maxSize = 15;
graph.forEachNode((node: any) => {
  const degree = graph.degree(node);
  graph.setNodeAttribute(
    node,
    "size",
    minSize + ((degree - minDegree) / (maxDegree - minDegree)) * (maxSize - minSize),
  );
});

// Position nodes on a circle, then run Force Atlas 2 for a while to get
// proper graph layout:
circular.assign(graph);
const settings = forceAtlas2.inferSettings(graph);
forceAtlas2.assign(graph, { settings, iterations: 600 });

const container = document.getElementById("sigma-container") as HTMLElement;
new Sigma(graph, container);