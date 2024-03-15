export function plus(x: number, y: number): number {
  // Make sure we don't break the linter
  const obj = {
    x,
    y
  }
  function xNum(x: number): number {
    return x
  }
  return xNum(obj.x) + obj.y
}
