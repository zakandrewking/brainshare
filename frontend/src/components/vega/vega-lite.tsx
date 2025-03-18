import React from "react";

import { useTheme } from "next-themes";
import vegaEmbed from "vega-embed";
import { TopLevelSpec as VlSpec } from "vega-lite";
import { Data } from "vega-lite/build/src/data";

import useIsSSR from "@/hooks/use-is-ssr";
import { Identification } from "@/stores/identification-store";
import { transformDataToValues } from "@/utils/transform-data";

interface VegaLiteProps {
  spec: Record<string, any>;
  headers: string[];
  width: number;
  height: number;
  vegaPadding: { x: number; y: number };
  data: string[][];
  identifications: Record<number, Identification>;
}

export default function VegaLite({
  spec,
  width,
  height,
  data: rawData,
  headers,
  vegaPadding,
  identifications,
}: VegaLiteProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const isSSR = useIsSSR();

  React.useEffect(() => {
    if (
      !containerRef.current ||
      rawData.length === 0 ||
      headers.length === 0 ||
      isSSR
    ) {
      return;
    }

    // Transform raw data into values using utility function
    const values = transformDataToValues(rawData, headers, identifications);

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
      theme: resolvedTheme === "dark" ? "dark" : "excel",
    }).catch(console.error);
  }, [
    spec,
    width,
    height,
    rawData,
    headers,
    vegaPadding,
    identifications,
    resolvedTheme,
    isSSR,
  ]);

  return (
    <div className="overflow-hidden" style={{ width, height }}>
      <div ref={containerRef} />
    </div>
  );
}
