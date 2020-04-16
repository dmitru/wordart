export function archimedeanSpiral(width: number, height: number) {
  const e = width / height

  return function (t: number) {
    return { x: e * (t * 0.1) * Math.cos(t), y: t * 0.1 * Math.sin(t) }
  }
}

export function rectangularSpiral(width: number, height: number) {
  const dy = 4
  const dx = (dy * width) / height

  let x = 0
  let y = 0

  return function (t: number) {
    const sign = t < 0 ? -1 : 1
    // See triangular numbers: T_n = n * (n + 1) / 2.
    switch ((Math.sqrt(1 + 4 * sign * t) - sign) & 3) {
      case 0:
        x += dx
        break
      case 1:
        y += dy
        break
      case 2:
        x -= dx
        break
      default:
        y -= dy
        break
    }
    return { x, y }
  }
}
