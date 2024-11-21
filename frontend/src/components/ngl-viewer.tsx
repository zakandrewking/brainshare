/**
 * courtesy of claude
 */

import { Loader2 } from "lucide-react";
import * as NGL from "ngl";
import React, { useEffect, useRef, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// // Note: We need to load NGL from CDN
// const NGLScript = () => {
//   useEffect(() => {
//     const script = document.createElement("script");
//     script.src =
//       "https://cdnjs.cloudflare.com/ajax/libs/ngl/2.0.0-dev.37/ngl.js";
//     script.async = true;
//     document.body.appendChild(script);
//     return () => {
//       document.body.removeChild(script);
//     };
//   }, []);
//   return null;
// };

// Mock PDB data - using ubiquitin (1UBQ) as an example
const MOCK_STRUCTURE = `
ATOM      1  N   MET     1      27.340  24.430   2.614  1.00  0.00
ATOM      2  CA  MET     1      26.266  25.413   2.842  1.00  0.00
ATOM      3  C   MET     1      26.913  26.639   3.531  1.00  0.00
ATOM      4  O   MET     1      27.886  26.504   4.263  1.00  0.00
ATOM      5  CB  MET     1      25.112  24.880   3.649  1.00  0.00
ATOM      6  CG  MET     1      25.353  24.860   5.134  1.00  0.00
ATOM      7  SD  MET     1      23.930  23.959   5.904  1.00  0.00
ATOM      8  CE  MET     1      24.447  23.984   7.620  1.00  0.00
ATOM      9  N   GLN     2      26.335  27.770   3.258  1.00  0.00
ATOM     10  CA  GLN     2      26.850  29.021   3.898  1.00  0.00
`;

const Protein3DViewer = ({ proteinId = "P238510" }) => {
  // const viewerRef = useRef<any>(null);
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  // Initialize NGL Viewer and load structure
  useEffect(() => {
    const initViewer = async () => {
      // try {
      if (!containerRef.current) return;

      // Clear previous viewer if it exists
      // if (viewerRef.current && viewerRef.current.dispose) {
      //   viewerRef.current.dispose();
      // }

      // Create new viewer
      const stage = new NGL.Stage(containerRef.current, {
        backgroundColor: "white",
        quality: "medium",
      });
      // viewerRef.current = stage;

      // Load structure from string
      // const blob = new Blob([MOCK_STRUCTURE], { type: "text/plain" });
      stage.loadFile("rcsb://1crn", { defaultRepresentation: true });
      // const structure = await stage.loadFile(blob, { ext: "pdb" });

      // if (!structure) return;

      // // Add representations
      // structure.addRepresentation("cartoon", {
      //   colorScheme: "chainindex",
      //   smoothSheet: true,
      // });
      // structure.addRepresentation("ball+stick", {
      //   sele: "hetero and not water",
      //   colorScheme: "element",
      // });

      // Auto zoom to structure
      // stage.autoView();
      setLoading(false);
      // } catch (err) {
      //   console.error("Viewer error:", err);
      //   setError("Failed to load protein structure");
      //   setLoading(false);
      // }
    };

    initViewer();

    // Cleanup
    return () => {
      // if (viewerRef.current) {
      //   viewerRef.current.dispose();
      // }
    };
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      // if (viewerRef.current) {
      //   viewerRef.current.handleResize();
      // }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Protein Structure Viewer (Mock Data)
          {loading && <Loader2 className="h-5 w-5 animate-spin" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-gray-500 mb-4">
          Note: Using mock structure data (ubiquitin) for demonstration. In a
          real application, we would fetch the actual structure for {proteinId}{" "}
          from PDB.
        </div>
        {error ? (
          <div className="h-96 flex items-center justify-center text-red-500">
            {error}
          </div>
        ) : (
          <div
            ref={containerRef}
            className="w-full h-96 bg-white rounded-lg"
            style={{ opacity: loading ? 0.5 : 1 }}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default Protein3DViewer;
