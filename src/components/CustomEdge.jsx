import { BezierEdge, getBezierPath, useReactFlow } from "reactflow";

export default function CustomEdge(props) {
  const { id, sourceX, sourceY, targetX, sourcePosition, targetPosition } =
    props;
  const { setEdges } = useReactFlow();
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    sourcePosition,
    targetPosition,
  });
  return (
    <>
      <BezierEdge {...props} />;
      {/* <EdgeLabelRenderer style={{ position: "relative" }}>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 12,
              pointerEvents: "all",
            }}
          >
            <button
              className="edgebutton"
              onClick={(e) => {
                setEdges((prevEdges) => prevEdges.filter((e) => e.id !== id));
                e.stopPropagation();
              }}
            >
              x
            </button>
          </div>
        </EdgeLabelRenderer> */}
    </>
  );
}
