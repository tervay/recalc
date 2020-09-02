export function cleanNumberInput(value) {
  let val = NaN;
  switch (value) {
    case ".":
      val = 0;
      break;
    case "-":
      val = 0;
      break;
    default:
      val = Number(value);
      break;
  }

  return val;
}
