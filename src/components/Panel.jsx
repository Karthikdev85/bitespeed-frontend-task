import { useEffect, useState } from "react";
import { useReactFlow } from "reactflow";

export default function Panel({
  selectedNodeId,
  showSettingsPanel,
  setShowSettingsPanel,
}) {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };
  const { setNodes, getNodes } = useReactFlow();
  const [input, setInput] = useState(
    () => getNodes().find((n) => n.id === selectedNodeId)?.data.label || ""
  );

  useEffect(() => {
    setInput((mess) => {
      const node = getNodes().find((n) => n.id === selectedNodeId);
      return node?.data.label;
    });
  }, [selectedNodeId]);

  function handleMessageInput(e) {
    setInput(e.target.value);
    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        if (node.selected) {
          return {
            ...node,
            data: {
              ...node.data,
              label: e.target.value,
            },
          };
        }
        return node;
      })
    );
  }
  return (
    <aside>
      <div
        className="message-node"
        onDragStart={(event) => onDragStart(event, "message")}
        draggable
      >
        {" "}
        <svg fill="currentColor" viewBox="0 0 16 16" height="1em" width="1em">
          <path d="M5 8a1 1 0 11-2 0 1 1 0 012 0zm4 0a1 1 0 11-2 0 1 1 0 012 0zm3 1a1 1 0 100-2 1 1 0 000 2z" />
          <path d="M2.165 15.803l.02-.004c1.83-.363 2.948-.842 3.468-1.105A9.06 9.06 0 008 15c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.76.743 3.37 1.97 4.6a10.437 10.437 0 01-.524 2.318l-.003.011a10.722 10.722 0 01-.244.637c-.079.186.074.394.273.362a21.673 21.673 0 00.693-.125zm.8-3.108a1 1 0 00-.287-.801C1.618 10.83 1 9.468 1 8c0-3.192 3.004-6 7-6s7 2.808 7 6c0 3.193-3.004 6-7 6a8.06 8.06 0 01-2.088-.272 1 1 0 00-.711.074c-.387.196-1.24.57-2.634.893a10.97 10.97 0 00.398-2z" />
        </svg>
        <span>Message</span>
      </div>
      {showSettingsPanel && (
        <SettingsPanel
          input={input}
          handleMessageInput={handleMessageInput}
          setShowSettingsPanel={setShowSettingsPanel}
        />
      )}
    </aside>
  );
}

function SettingsPanel({ input, handleMessageInput, setShowSettingsPanel }) {
  return (
    <div className="settings-panel">
      <div className="settings-panel-header">
        <span
          onClick={() => setShowSettingsPanel(false)}
          style={{ cursor: "pointer" }}
        >
          <svg
            viewBox="0 0 1024 1024"
            fill="currentColor"
            height="2em"
            width="2em"
          >
            <path d="M872 474H286.9l350.2-304c5.6-4.9 2.2-14-5.2-14h-88.5c-3.9 0-7.6 1.4-10.5 3.9L155 487.8a31.96 31.96 0 000 48.3L535.1 866c1.5 1.3 3.3 2 5.2 2h91.5c7.4 0 10.8-9.2 5.2-14L286.9 550H872c4.4 0 8-3.6 8-8v-60c0-4.4-3.6-8-8-8z" />
          </svg>
        </span>
        <span style={{ fontSize: "1.2rem", paddingBottom: 3 }}>Message</span>
      </div>
      <div className="message-cont">
        <h2>Text</h2>
        <textarea
          className="message-input"
          value={input}
          onChange={handleMessageInput}
        ></textarea>
      </div>
    </div>
  );
}
