import React from "react";
import NodeFlow from "./components/NodeFlow";
import Header from "./components/Header";
// import Panel from "./components/Panel";
import { NodesProvider } from "./context/NodesContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function App() {
  return (
    <div>
      <NodesProvider>
        <Header />
        <div className="editor-panel">
          <NodeFlow />
          {/* <Panel /> */}
        </div>
      </NodesProvider>
    </div>
  );
}
