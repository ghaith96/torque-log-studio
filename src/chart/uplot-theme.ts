import type uPlot from 'uplot'

/** uPlot marks focused series internally (not public API — see setFocus in uPlot source). */
type SeriesFocus = { _focus?: boolean | null }

function soleFocusedYSeriesIdx(u: uPlot): number | null {
  let found: number | null = null
  let count = 0
  for (let i = 1; i < u.series.length; i++) {
    if ((u.series[i] as SeriesFocus)._focus === true) {
      count++
      found = i
    }
  }
  return count === 1 ? found : null
}

/** DESIGN.md — ink-subtle axis, hairline grid, primary accent */
const AXIS = '#8a8f98'
const GRID = 'rgba(35, 37, 42, 0.85)'
const ACCENT = '#5e6ad2'

export const CHART_HEIGHT_PX = 200
/** Single overlay chart height (uPlot height = plot + axes, excludes title/legend). */
export const CHART_COMBINED_HEIGHT_PX = 340
export const CHART_MIN_WIDTH_PX = 320
export const CHART_RESIZE_MIN_WIDTH_PX = 280

/**
 * Overlaid series strokes — strongly separated hues for trace identification on a dark canvas.
 * First slot stays the brand accent; remaining entries alternate warm/cool so neighbors differ.
 */
export const SERIES_PALETTE = [
  ACCENT,
  '#38bdf8',
  '#34d399',
  '#fbbf24',
  '#f472b6',
  '#fb923c',
  '#2dd4bf',
  '#f87171',
] as const

export function formatLegendScalar(v: number): string {
  if (!Number.isFinite(v)) return '—'
  const a = Math.abs(v)
  if (a >= 10_000) return v.toFixed(0)
  if (a >= 1000) return v.toFixed(1)
  if (a >= 100) return v.toFixed(2)
  if (a >= 10) return v.toFixed(2)
  return v.toFixed(3)
}

const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`)

/** `HH:MM:SS` for whole-second tick labels. */
export function formatHms(totalSec: number): string {
  if (!Number.isFinite(totalSec)) return ''
  const sign = totalSec < 0 ? '-' : ''
  const abs = Math.abs(totalSec)
  const h = Math.floor(abs / 3600)
  const m = Math.floor((abs % 3600) / 60)
  const s = Math.floor(abs % 60)
  return `${sign}${pad2(h)}:${pad2(m)}:${pad2(s)}`
}

/** `HH:MM:SS.cc` for cursor legend (sub-second precision when data is fast). */
export function formatHmsPrecise(totalSec: number): string {
  if (!Number.isFinite(totalSec)) return ''
  const sign = totalSec < 0 ? '-' : ''
  const abs = Math.abs(totalSec)
  const h = Math.floor(abs / 3600)
  const m = Math.floor((abs % 3600) / 60)
  const s = abs % 60
  const sWhole = Math.floor(s)
  const cs = Math.round((s - sWhole) * 100)
  const csClamped = cs === 100 ? 99 : cs
  return `${sign}${pad2(h)}:${pad2(m)}:${pad2(sWhole)}.${pad2(csClamped)}`
}

/** Clock-aligned tick increments (seconds) — uPlot picks the largest that fits its min spacing. */
const TIME_INCRS = [
  0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5,
  1, 2, 5, 10, 15, 20, 30,
  60, 2 * 60, 5 * 60, 10 * 60, 15 * 60, 20 * 60, 30 * 60,
  3600, 2 * 3600, 3 * 3600, 6 * 3600, 12 * 3600, 24 * 3600,
]

function channelLegendLabel(name: string, unit: string | null): string {
  return unit ? `${name} (${unit})` : name
}

/** Forwards `pointermove` on the plot overlay as `mousemove` so touch drags update the cursor. */
function legendSeriesLabel(u: uPlot, seriesIdx: number): string {
  const lab = u.series[seriesIdx]?.label
  return typeof lab === 'string' ? lab : `Series ${seriesIdx}`
}

function syncLegendChrome(u: uPlot, table: HTMLElement, resetBtn: HTMLButtonElement | null): void {
  const sole = soleFocusedYSeriesIdx(u)
  const rows = table.querySelectorAll('tr.u-series')
  rows.forEach((row, i) => {
    const tr = row as HTMLTableRowElement
    const seriesIdx = i + 1
    const label = legendSeriesLabel(u, seriesIdx)
    const isPinned = sole !== null && sole === seriesIdx
    tr.classList.toggle('u-legend-row--focus', isPinned)
    tr.setAttribute('aria-pressed', isPinned ? 'true' : 'false')
    tr.setAttribute(
      'aria-label',
      `${label}. Activate to spotlight this trace in the chart; activate again when it is the only spotlighted trace to show all.`,
    )
    tr.tabIndex = 0
    tr.setAttribute('role', 'button')
  })
  if (resetBtn) resetBtn.hidden = sole === null
}

/**
 * Legend: spotlight one Y-series (dim others). Activate again on the sole spotlighted
 * series (including focus from cursor proximity) clears focus. Capture-phase listener
 * overrides uPlot’s default legend click (toggle visibility). Adds row affordances,
 * a Clear control, and keyboard activation (Enter / Space).
 */
export function createLegendFocusPinPlugin(): uPlot.Plugin {
  let table: HTMLElement | null = null
  let legendRoot: HTMLElement | null = null
  let resetBtn: HTMLButtonElement | null = null
  let onClick: ((e: MouseEvent) => void) | null = null
  let onKeyDown: ((e: KeyboardEvent) => void) | null = null

  const performRowActivate = (u: uPlot, tr: HTMLTableRowElement) => {
    if (!table) return
    const rows = [...table.querySelectorAll('tr.u-series')] as HTMLTableRowElement[]
    const seriesIdx = rows.indexOf(tr) + 1
    if (seriesIdx < 1 || seriesIdx >= u.series.length) return

    const sole = soleFocusedYSeriesIdx(u)
    if (sole === seriesIdx) {
      u.setSeries(null, { focus: true })
    } else {
      u.setSeries(seriesIdx, { focus: true })
    }
  }

  return {
    hooks: {
      init(u) {
        legendRoot = u.root.querySelector('.u-legend')
        table = legendRoot?.querySelector('table') ?? null
        if (!table || !legendRoot) return

        resetBtn = document.createElement('button')
        resetBtn.type = 'button'
        resetBtn.className = 'u-legend-reset'
        resetBtn.textContent = 'Clear spotlight'
        resetBtn.hidden = true
        resetBtn.setAttribute('aria-label', 'Clear trace spotlight and show all series at equal emphasis')
        resetBtn.addEventListener('click', () => {
          u.setSeries(null, { focus: true })
        })
        legendRoot.appendChild(resetBtn)

        onClick = (e: MouseEvent) => {
          if (e.button !== 0) return
          const tr = (e.target as HTMLElement).closest('tr.u-series')
          if (!tr || !table!.contains(tr)) return

          e.preventDefault()
          e.stopImmediatePropagation()

          performRowActivate(u, tr as HTMLTableRowElement)
        }

        onKeyDown = (e: KeyboardEvent) => {
          const tr = (e.target as HTMLElement).closest('tr.u-series')
          if (!tr || !legendRoot!.contains(tr)) return
          if (e.key !== 'Enter' && e.key !== ' ') return
          e.preventDefault()
          performRowActivate(u, tr as HTMLTableRowElement)
        }

        table.addEventListener('click', onClick, true)
        legendRoot.addEventListener('keydown', onKeyDown)

        queueMicrotask(() => syncLegendChrome(u, table!, resetBtn))
      },
      setSeries(u, _seriesIdx, _opts) {
        if (!table) return
        queueMicrotask(() => syncLegendChrome(u, table!, resetBtn))
      },
      destroy(_u) {
        if (table && onClick) table.removeEventListener('click', onClick, true)
        if (legendRoot && onKeyDown) legendRoot.removeEventListener('keydown', onKeyDown)
        resetBtn?.remove()
        table = null
        legendRoot = null
        resetBtn = null
        onClick = null
        onKeyDown = null
      },
    },
  }
}

export function createPointerBridgePlugin(): uPlot.Plugin {
  let over: HTMLElement | null = null
  let onPtrMove: ((e: PointerEvent) => void) | null = null
  return {
    hooks: {
      init(u) {
        over = u.over
        if (!over) return
        onPtrMove = (e: PointerEvent) => {
          over!.dispatchEvent(
            new MouseEvent('mousemove', {
              bubbles: true,
              cancelable: true,
              clientX: e.clientX,
              clientY: e.clientY,
              buttons: e.buttons,
              view: window,
            }),
          )
        }
        over.addEventListener('pointermove', onPtrMove, { passive: true })
      },
      destroy() {
        if (over && onPtrMove) {
          over.removeEventListener('pointermove', onPtrMove)
        }
        over = null
        onPtrMove = null
      },
    },
  }
}

export function buildSeriesPlotOptions(
  name: string,
  unit: string | null,
  width: number,
  height: number,
): uPlot.Options {
  return {
    width,
    height,
    title: unit ? `${name} (${unit})` : name,
    scales: {
      x: { time: false },
      y: { auto: true },
    },
    series: [
      {},
      {
        stroke: ACCENT,
        width: 2,
        fill: 'rgba(94, 106, 210, 0.09)',
      },
    ],
    axes: [
      {
        stroke: AXIS,
        grid: { stroke: GRID, width: 1 },
        ticks: { stroke: AXIS },
      },
      {
        stroke: AXIS,
        grid: { stroke: GRID, width: 1 },
        ticks: { stroke: AXIS },
      },
    ],
    legend: { show: false },
  }
}

export type CombinedChannelMeta = { name: string; unit: string | null }

export function buildCombinedPlotOptions(
  channels: CombinedChannelMeta[],
  width: number,
  height: number,
): uPlot.Options {
  const series: uPlot.Series[] = [
    {
      label: 'Time',
      value: (_u, raw, _si, idx) => {
        if (idx == null || !Number.isFinite(raw as number)) return '—'
        return formatHmsPrecise(raw as number)
      },
    },
  ]
  for (let i = 0; i < channels.length; i++) {
    const ch = channels[i]!
    const stroke = SERIES_PALETTE[i % SERIES_PALETTE.length]!
    series.push({
      label: channelLegendLabel(ch.name, ch.unit),
      stroke,
      width: 2,
      fill: 'rgba(0,0,0,0)',
      value: (_u, raw, _seriesIdx, idx) => {
        if (idx == null) return '—'
        return formatLegendScalar(raw as number)
      },
    })
  }

  return {
    width,
    height,
    title: 'Selected signals (shared time axis)',
    class: 'uplot-combined',
    scales: {
      x: { time: false },
      y: { auto: true },
    },
    series,
    axes: [
      {
        label: 'time (hh:mm:ss from trip start)',
        stroke: AXIS,
        grid: { stroke: GRID, width: 1 },
        ticks: { stroke: AXIS },
        space: 80,
        incrs: TIME_INCRS,
        values: (_u, splits) => splits.map((v) => formatHms(v)),
      },
      {
        label: 'value',
        stroke: AXIS,
        grid: { stroke: GRID, width: 1 },
        ticks: { stroke: AXIS },
      },
    ],
    legend: {
      show: true,
      live: true,
      isolate: false,
    },
    cursor: {
      show: true,
      x: true,
      y: true,
      points: {
        show: true,
        size: 9,
        width: 2,
      },
      focus: {
        prox: 28,
        dist: (self, seriesIdx, dataIdx, valPos, curPos) => Math.abs(valPos - curPos),
      },
      drag: { x: true, y: false, setScale: true },
    },
    focus: {
      alpha: 0.22,
    },
    plugins: [createPointerBridgePlugin(), createLegendFocusPinPlugin()],
  }
}
