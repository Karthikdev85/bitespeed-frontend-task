import { Handle } from "reactflow";

export default function CustomHandle(props) {
  return (
    <Handle
      style={{
        width: 5,
        height: 5,
        background: "#424242",
        border: "2px solid #ECEFF1",
      }}
      {...props}
    />
  );
}
