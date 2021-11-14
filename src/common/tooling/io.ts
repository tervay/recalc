export function SafelyParse(s: string): number {
  let val = NaN;
  switch (s) {
    case ".":
      val = 0;
      break;
    case "-":
      val = 0;
      break;
    default:
      val = Number(s);
      break;
  }

  return val;
}

export function cleanFloatingPointErrors(n: number): number {
  return Number(n.toFixed(12));
}
