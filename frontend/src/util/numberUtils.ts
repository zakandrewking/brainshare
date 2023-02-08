export function roundUp100(x: number) {
  return Math.ceil(x / 100) * 100;
}

export function round2Decimals(x: number) {
  return Math.round(x * 100) / 100;
}
