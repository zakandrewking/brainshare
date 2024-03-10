import { Box, Button } from "@mui/material";
// TODO code split this
import ReactFlow, { Controls, Panel } from "reactflow";

import "reactflow/dist/style.css";

const initialNodes = [
  { id: "1", position: { x: 0, y: 0 }, data: { label: "1" } },
  { id: "2", position: { x: 0, y: 100 }, data: { label: "2" } },
];
const initialEdges = [{ id: "e1-2", source: "1", target: "2" }];

export default function GraphView({
  handleClose,
}: {
  handleClose: () => void;
}) {
  return (
    <Box
      sx={{
        width: "300px",
        height: "300px",
      }}
    >
      <ReactFlow
        nodes={initialNodes}
        edges={initialEdges}
        proOptions={{ hideAttribution: true }}
        panOnScroll
        panOnScrollSpeed={1}
      >
        <Controls position="bottom-right" />
        <Panel position="bottom-left">
          <Button onClick={handleClose}>Close</Button>
        </Panel>
      </ReactFlow>
    </Box>
  );
}
