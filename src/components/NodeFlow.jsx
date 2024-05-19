import ReactFlow, {
  Background,
  Controls,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import Panel from "./Panel";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNodes } from "../context/NodesContext";
import MessageNode from "./MessageNode";
import CustomEdge from "./CustomEdge";

const initialNodes = [
  {
    id: "1",
    type: "message",
    data: { label: "Dummy node" },
    position: { x: 250, y: 5 },
    selected: false,
  },
  // {
  //   id: "2",
  //   data: { label: "Target Node 1" },
  //   position: { x: 100, y: 100 },
  //   selected: false,
  // },
  // {
  //   id: "3",
  //   data: { label: "Target Node 2" },
  //   position: { x: 400, y: 100 },
  //   selected: false,
  // },
];

const nodeTypes = {
  message: MessageNode,
};
const edgeTypes = {
  "custom-edge": CustomEdge,
};

const getId = () => crypto.randomUUID();
export default function NodeFlow() {
  // const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const { totalNodes, setTotalNodes, totalEdges, setTotalEdges } = useNodes();

  const handleClick = (e) => {
    if (e.target.classList[0] !== "react-flow__pane") {
      setSelectedNodeId("");
      const selectedNode = nodes.find((n) => n.selected);

      if (selectedNode) {
        setShowSettingsPanel(true);
        setSelectedNodeId(selectedNode.id);
      }
    } else {
      setShowSettingsPanel(false);
      setSelectedNodeId("");
    }
  };

  useEffect(() => {
    if (totalNodes.length !== nodes.length) {
      setTotalNodes([...nodes]);
      setShowSettingsPanel(false);
      setSelectedNodeId("");
    }
  }, [nodes]);

  useEffect(() => {
    setTotalEdges([...edges]);
  }, [edges]);

  const onConnect = useCallback(
    (connections) => {
      const edge = {
        ...connections,
        animated: true,
        id: crypto.randomUUID(),
        type: "custom-edge",
        sourceHandle: "right",
        targetHandle: "left",
        markerEnd: { type: MarkerType.Arrow },
      };
      setTotalEdges((prevEdge) => [...prevEdge, edge]);
      setEdges((prevEdge) => {
        // const hasOutgoingEdge = prevEdge.some(
        //   (edge) => edge.source === connections.source
        // );
        // console.log(hasOutgoingEdge);
        // if (hasOutgoingEdge) {
        //   return prevEdge.map((edge) =>
        //     edge.source === connections.source
        //       ? { ...edge, target: connections.target }
        //       : edge
        //   );
        // }
        return addEdge(edge, prevEdge);
      });
    },
    [edges]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/reactflow");
      if (typeof type === "undefined" || !type) {
        return;
      }
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const newNode = {
        id: getId(),
        type,
        position,
        data: { label: `${type} node` },
        selected: false,
      };
      setNodes((nds) => {
        return [
          ...nds.map((n) => {
            n.selected = false;
            return n;
          }),
          newNode,
        ];
      });
      setTotalNodes((prevNodes) => [...prevNodes, newNode]);
    },
    [reactFlowInstance]
  );

  const isValidConnection = (connection) => {
    // Allow connections if the source node has no outgoing edge or if replacing an existing one
    const sourceNodeOutgoingEdge = edges.find(
      (edge) => edge.source === connection.source
    );
    return (
      !sourceNodeOutgoingEdge ||
      sourceNodeOutgoingEdge.target === connection.target
    );
  };
  return (
    <div className="dndflow">
      <ReactFlowProvider className="reactflow-wrapper">
        <div style={{ width: "70vw" }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onClick={handleClick}
            isValidConnection={isValidConnection}
            fitView
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>
        <Panel
          selectedNodeId={selectedNodeId}
          showSettingsPanel={showSettingsPanel}
          setShowSettingsPanel={setShowSettingsPanel}
        />
      </ReactFlowProvider>
    </div>
  );
}
