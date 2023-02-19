import Graph from "graphology";
import circular from "graphology-layout/circular";
import forceAtlas2 from "graphology-layout-forceatlas2";

import resources from '../data.json';

export class GraphService {    

    private _graph: Graph;
 
    constructor(graph: Graph) {
      this._graph = graph;
    }

    private readonly COLORS: Record<string, string> = {
        networkSecurityGroups: "#A52019",
        publicIPAddresses: "#FAD201",
        routeTables: "#B5B8B1",
        virtualNetworks: "#063971",
        virtualMachines: "#7FB5B5",
        networkInterfaces: "#5A75DB",
        subnets: "#999950"
    };

    private GetNodeTypeFromResourceId(resourceId: string): string {
        const resourceSplitted = resourceId.split("/");
        return resourceSplitted[resourceSplitted.length - 2]
    }

    public PopulateGraph() {
        resources.forEach((resource) => {
            const resourceNode = resource.Name;

            if (!this._graph.hasNode(resourceNode)) {

                this._graph.addNode(resourceNode, {
                    nodeType: this.GetNodeTypeFromResourceId(resource.Id),
                    label: resourceNode,
                });

            }

            resource.Associations.forEach((association) => {
                if (!this._graph.hasNode(association.Name)) {

                    this._graph.addNode(association.Name, {
                        nodeType: this.GetNodeTypeFromResourceId(association.ResourceId),
                        label: association.Name
                    });

                }

                if (!this._graph.hasEdge(resourceNode, association.Name)) {
                    this._graph.addEdge(resourceNode, association.Name, { weight: 1 });
                }
            });
        });
    }

    public ColorNodes() {
        this._graph.forEachNode((node, attributes) =>
            this._graph.setNodeAttribute(node, "color", this.COLORS[attributes.nodeType as string]),
        );
    }

    public UseDegreesForNodeSizes() {
        const degrees = this._graph.nodes().map((node: any) => this._graph.degree(node));
        const minDegree = Math.min(...degrees);
        const maxDegree = Math.max(...degrees);
        const minSize = 5;
        const maxSize = 15;

        this._graph.forEachNode((node: any) => {
            const degree = this._graph.degree(node);
            this._graph.setNodeAttribute(
                node,
                "size",
                minSize + ((degree - minDegree) / (maxDegree - minDegree)) * (maxSize - minSize),
            );
        });
    }

    public PositionAndRunForceAtlas2() {
        circular.assign(this._graph);
        const settings = forceAtlas2.inferSettings(this._graph);
        forceAtlas2.assign(this._graph, { settings, iterations: 600 });
    }
}