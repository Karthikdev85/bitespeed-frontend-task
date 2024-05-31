import {
  BezierEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
} from "reactflow";

export default function CustomEdge(props) {
  const { id, sourceX, sourceY, targetX, sourcePosition, targetPosition } =
    props;
  const { setEdges } = useReactFlow();
  const [edgePath, labelX, labelY] = getBezierPath(props);
  return (
    <>
      <BezierEdge {...props} path={edgePath} />;
      <EdgeLabelRenderer style={{ position: "relative" }}>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 15,
            pointerEvents: "all",
            padding: 24,
          }}
          className="nodrag nopan"
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
      </EdgeLabelRenderer>
    </>
  );
}
