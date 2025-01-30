import React from "react";

import vegaEmbed from "vega-embed";
import { TopLevelSpec as VlSpec } from "vega-lite";
import { Data } from "vega-lite/build/src/data";

interface VegaLiteProps {
  spec: Record<string, any>;
  headers: string[];
  width: number;
  height: number;
  vegaPadding: { x: number; y: number };
  data: string[][];
}

export default function VegaLite({
  spec,
  width,
  height,
  data: rawData,
  headers,
  vegaPadding,
}: VegaLiteProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!containerRef.current || rawData.length === 0 || headers.length === 0) {
      return;
    }

    // Transform string[][] into array of objects using headers
    const values: Record<string, string>[] = rawData.map((row) =>
      Object.fromEntries(
        row
          .map((value, i) => (headers[i] ? [headers[i], value] : null))
          .filter((pair) => pair !== null)
      )
    );

    const data: Data = { name: "data", values };

    const partialSpec: Partial<VlSpec> = {
      $schema: "https://vega.github.io/schema/vega-lite/v5.json",
      width: width - vegaPadding.x,
      height: height - vegaPadding.y,
      data,
    };

    const fullSpec = {
      ...spec,
      ...partialSpec,
    } as VlSpec;

    vegaEmbed(containerRef.current, fullSpec, {
      actions: true,
      renderer: "svg",
    }).catch(console.error);
  }, [spec, width, height, rawData, headers, vegaPadding]);

  return (
    <div className="overflow-hidden" style={{ width, height }}>
      <div ref={containerRef} />
    </div>
  );
}
