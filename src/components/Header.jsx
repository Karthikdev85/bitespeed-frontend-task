import { ToastContainer, Zoom, toast } from "react-toastify";
import { useNodes } from "../context/NodesContext";

const toastAttributes = {
  position: "top-center",
  autoClose: 800,
  hideProgressBar: true,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: "light",
  transition: Zoom,
};

export default function Header() {
  const { totalNodes, totalEdges } = useNodes();

  function handleFlowChanges() {
    if (totalEdges.length === 0 && totalNodes.length === 0) return;
    if (totalEdges.length === 0 && totalNodes.length > 1) {
      toast.error("Cannot save flow", toastAttributes);
      return;
    }

    // check whether any node more than 1 dosen't have linked target handles
    let allNodes = [...totalNodes];
    allNodes = allNodes.filter((n) => {
      const isNodePresent = totalEdges.find((e) => e.target === n.id);
      if (!isNodePresent) return n;
    });
    if (allNodes.length > 1) toast.error("Cannot save flow", toastAttributes);
    else toast.success("Saved flow", toastAttributes);
  }
  return (
    <div className="header">
      <ToastContainer limit={3} />
      <button className="btn-save" onClick={handleFlowChanges}>
        Save changes
      </button>
    </div>
  );
}
