/** Uniform stride downsampling for responsive canvas charts (many points → ≤ maxPts). */

export const DEFAULT_DOWNSAMPLE_MAX_POINTS = 6000

export function downsampleSeries(
  x: Float64Array,
  y: Float64Array,
  maxPts = DEFAULT_DOWNSAMPLE_MAX_POINTS,
): { x: Float64Array; y: (number | null)[] } {
  const n = x.length
  if (n !== y.length) {
    throw new Error('Series length mismatch')
  }
  if (n <= maxPts || maxPts < 2) {
    return {
      x: x.slice(),
      y: Array.from(y, (v) => (Number.isFinite(v) ? v : null)),
    }
  }
  const step = (n - 1) / (maxPts - 1)
  const xd = new Float64Array(maxPts)
  const yd: (number | null)[] = new Array(maxPts)
  for (let i = 0; i < maxPts; i++) {
    const idx = Math.round(i * step)
    xd[i] = x[idx]!
    const v = y[idx]!
    yd[i] = Number.isFinite(v) ? v : null
  }
  return { x: xd, y: yd }
}

/** Same X stride for every series — required for uPlot `AlignedData`. */
export function downsampleMultiSeries(
  x: Float64Array,
  ys: Float64Array[],
  maxPts = DEFAULT_DOWNSAMPLE_MAX_POINTS,
): { x: Float64Array; ys: (number | null)[][] } {
  const n = x.length
  for (let s = 0; s < ys.length; s++) {
    if (ys[s]!.length !== n) {
      throw new Error('Series length mismatch')
    }
  }
  if (n <= maxPts || maxPts < 2) {
    return {
      x: x.slice(),
      ys: ys.map((y) => Array.from(y, (v) => (Number.isFinite(v) ? v : null))),
    }
  }
  const step = (n - 1) / (maxPts - 1)
  const xd = new Float64Array(maxPts)
  const ysd: (number | null)[][] = ys.map(() => new Array(maxPts))
  for (let i = 0; i < maxPts; i++) {
    const idx = Math.round(i * step)
    xd[i] = x[idx]!
    for (let s = 0; s < ys.length; s++) {
      const v = ys[s]![idx]!
      ysd[s]![i] = Number.isFinite(v) ? v : null
    }
  }
  return { x: xd, ys: ysd }
}
