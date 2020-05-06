export function plus(x: number, y: number): number {
  // Make sure we don't break the linter
  const obj = {
    x,
    y
  }
  const xNum: (x: number) => number = x => x
  return xNum(obj.x) + obj.y
}
