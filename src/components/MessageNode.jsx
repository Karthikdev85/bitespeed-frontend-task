import { Position, useReactFlow } from "reactflow";
import CustomHandle from "./CustomHandle";
import { memo } from "react";

function MessageNode({ data, id }) {
  const { setNodes, setEdges } = useReactFlow();

  function addEditProp() {
    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        if (node.id === id) {
          node.selected = true;
        } else node.selected = false;
        return node;
      })
    );
  }
  function deleteNode(e) {
    e.stopPropagation();
    setNodes((prevNodes) =>
      prevNodes.filter((node) => {
        // node.selected = false;
        return node.id !== id;
      })
    );
    setEdges((prevEdges) => {
      const targetEdges = prevEdges.filter((e) => {
        return e.source !== id;
      });
      const totalEdges = targetEdges.filter((e) => {
        return e.target !== id;
      });
      return [...totalEdges];
    });
  }
  return (
    <>
      <div className="text-node" onClick={addEditProp}>
        <CustomHandle type="target" position={Position.Left} />
        <div className="text-node-header custom-drag-handle">
          <div>
            <svg
              fill="currentColor"
              viewBox="0 0 16 16"
              height="0.6em"
              width="0.6em"
              style={{ marginTop: 6 }}
            >
              <path d="M5 8a1 1 0 11-2 0 1 1 0 012 0zm4 0a1 1 0 11-2 0 1 1 0 012 0zm3 1a1 1 0 100-2 1 1 0 000 2z" />
              <path d="M2.165 15.803l.02-.004c1.83-.363 2.948-.842 3.468-1.105A9.06 9.06 0 008 15c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.76.743 3.37 1.97 4.6a10.437 10.437 0 01-.524 2.318l-.003.011a10.722 10.722 0 01-.244.637c-.079.186.074.394.273.362a21.673 21.673 0 00.693-.125zm.8-3.108a1 1 0 00-.287-.801C1.618 10.83 1 9.468 1 8c0-3.192 3.004-6 7-6s7 2.808 7 6c0 3.193-3.004 6-7 6a8.06 8.06 0 01-2.088-.272 1 1 0 00-.711.074c-.387.196-1.24.57-2.634.893a10.97 10.97 0 00.398-2z" />
            </svg>
            <span>Send Message</span>
          </div>
          <div
            style={{
              display: "flex",
              gap: 4,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <svg
              fill="currentColor"
              viewBox="0 0 16 16"
              height="0.6em"
              width="0.6em"
            >
              <path d="M2.678 11.894a1 1 0 01.287.801 10.97 10.97 0 01-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 01.71-.074A8.06 8.06 0 008 14c3.996 0 7-2.807 7-6 0-3.192-3.004-6-7-6S1 4.808 1 8c0 1.468.617 2.83 1.678 3.894zm-.493 3.905a21.682 21.682 0 01-.713.129c-.2.032-.352-.176-.273-.362a9.68 9.68 0 00.244-.637l.003-.01c.248-.72.45-1.548.524-2.319C.743 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7-3.582 7-8 7a9.06 9.06 0 01-2.347-.306c-.52.263-1.639.742-3.468 1.105z" />
              <path d="M4 5.5a.5.5 0 01.5-.5h7a.5.5 0 010 1h-7a.5.5 0 01-.5-.5zM4 8a.5.5 0 01.5-.5h7a.5.5 0 010 1h-7A.5.5 0 014 8zm0 2.5a.5.5 0 01.5-.5h4a.5.5 0 010 1h-4a.5.5 0 01-.5-.5z" />
            </svg>
            <button className="edgebutton" onClick={deleteNode}>
              x
            </button>
          </div>
        </div>
        <div className="text-node-body">
          <span style={{ width: "80%" }}>{data.label}</span>
        </div>
        <CustomHandle type="source" position={Position.Right} />
      </div>
    </>
  );
}

export default memo(MessageNode);
