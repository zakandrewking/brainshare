interface VegaLiteProps {
  spec: Record<string, any>;
  width: number;
  height: number;
  data: string[][];
}

export default function VegaLite({ spec, width, height, data }: VegaLiteProps) {
  return <div style={{ width, height }}>{JSON.stringify(spec)}</div>;
}
