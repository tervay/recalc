export function decimate(data, precision) {
  return data.filter((_, i) => i % precision === 0);
}
