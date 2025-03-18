"use client";

import { useEffect, useRef } from "react";

import { Identification } from "@/stores/identification-store";
import { transformDataToValues } from "@/utils/transform-data";

interface SandboxProps {
  code?: string;
  data?: string[][];
  width?: string;
  height?: string;
  headers?: string[];
  identifications?: Record<number, Identification>;
}

const testingHeaders = ["pos_a", "unip_id_a", "unip_id_b"];
const testingIdentifications = {
  1: {
    unip_id: "A",
    name: "Uniprot ID A",
    type: "uniprot",
    description: "Uniprot ID A",
    is_custom: false,
  },
  2: {
    unip_id: "B",
    name: "Uniprot ID B",
    type: "uniprot",
    description: "Uniprot ID B",
    is_custom: false,
  },
};

const testingData = [
  ["1", "A", "B"],
  ["2", "A", "B"],
  ["3", "A", "B"],
  ["4", "A", "B"],
  ["5", "A", "B"],
];

const testingCode =
  `
const plot = ` +
  "Plot.plot({\n  marks: [\n    // Only 291 points, so a dot per point is acceptable\n    Plot.dot(data, {\n      x: 'pos_a',\n      y: (d, i) => i,\n      r: 3,\n      fill: 'steelblue',\n      stroke: 'black',\n      title: d => `unip_id_a: ${d.unip_id_a}\\nunip_id_b: ${d.unip_id_b}\\npos_a: ${d.pos_a}`\n    })\n  ],\n  x: {\n    label: 'Position A',\n    tickCount: 10\n  },\n  y: {\n    label: 'Data Point Index',\n    // Hide y-axis ticks for clarity\n    ticks: []\n  }\n})" +
  `
  const div = document.querySelector("#root");
  div.append(plot);
`;

export default function Sandbox({
  code = testingCode,
  data = testingData,
  headers = testingHeaders,
  identifications = testingIdentifications,
  width = "100%",
  height = "400px",
}: SandboxProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!iframeRef.current) return;

    // Transform the raw data into values
    const values = transformDataToValues(data, headers, identifications);

    // Create a basic HTML structure with necessary security settings
    // TODO consider restricting the script-src to only the observablehq cdn
    // (annoying because observable loads a bunch of dependencies; so maybe we
    // bundle them)
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta http-equiv="Content-Security-Policy" content="
            default-src https://www.brainshare.io;
            script-src 'unsafe-eval' 'unsafe-inline' https://www.brainshare.io https://cdn.jsdelivr.net/npm/;
            connect-src https://cdn.jsdelivr.net/npm/;
            worker-src https://www.brainshare.io blob:;
            style-src 'unsafe-inline' https://www.brainshare.io https://fonts.googleapis.com;
            img-src blob: data: https://www.brainshare.io;
            font-src data: https://www.brainshare.io;
            object-src 'none';
            base-uri https://www.brainshare.io;
            form-action https://www.brainshare.io;
            upgrade-insecure-requests;
            block-all-mixed-content;
          ">
          <style>
            body { margin: 0; padding: 0; }
            #root { width: 100%; height: 100%; }
          </style>
        </head>
        <body>
          <div id="root"></div>
          <script type="module">
            import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";
            window.Plot = Plot;

            // Create a secure environment by limiting JavaScript capabilities
            // Prevent access to sensitive APIs
            window.alert = () => { throw new Error("alert is disabled"); };
            window.confirm = () => { throw new Error("confirm is disabled"); };
            window.prompt = () => { throw new Error("prompt is disabled"); };
            window.open = () => { throw new Error("open is disabled"); };

            // Restrict access to storage
            delete window.localStorage;
            delete window.sessionStorage;

            // Prevent network requests except to cdn.jsdelivr.net
            window.fetch = (url, options) => {
              throw new Error('fetch is disabled');
            };

            window.XMLHttpRequest = function() {
              throw new Error('XMLHttpRequest is disabled');
            };

            // disable import()
            window.import = () => {
              throw new Error('import is disabled');
            };

            // Run the untrusted code in a try-catch block
            try {
              // Inject the data as a JavaScript variable
              const data = ${JSON.stringify(values)};
              ${code}
            } catch (error) {
              console.error('Error in sandbox:', error);

              // Display error in the sandbox
              const rootEl = document.getElementById('root');
              rootEl.innerHTML = '<div style="color: red; padding: 10px; border: 1px solid red; margin: 10px; font-family: monospace;">' +
                                 '<strong>Error:</strong> ' + error.message + '</div>';
            }
          </script>
        </body>
      </html>
    `;

    // Create a blob URL with the HTML content
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    // Set the iframe source to the blob URL
    iframeRef.current.src = url;

    // Clean up when component unmounts
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [code, data, headers, identifications]);

  return (
    <iframe
      ref={iframeRef}
      style={{
        width,
        height,
        border: "none",
        backgroundColor: "white",
      }}
      sandbox="allow-scripts allow-modals"
      title="Code Sandbox"
    />
  );
}
