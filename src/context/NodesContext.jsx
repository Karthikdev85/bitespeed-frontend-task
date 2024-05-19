import React, { createContext, useState, useContext } from "react";

// context for the nodes and edges
const NodesContext = createContext();

export const NodesProvider = ({ children }) => {
  const [totalNodes, setTotalNodes] = useState([]);
  const [totalEdges, setTotalEdges] = useState([]);

  return (
    <NodesContext.Provider
      value={{ totalNodes, setTotalNodes, totalEdges, setTotalEdges }}
    >
      {children}
    </NodesContext.Provider>
  );
};

// Custom hook to use the NodesContext
export const useNodes = () => {
  return useContext(NodesContext);
};
